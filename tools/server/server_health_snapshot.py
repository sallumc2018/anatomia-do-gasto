#!/usr/bin/env python3
"""Coleta um snapshot read-only do servidor de coleta.

O script foi desenhado para rodar no sallumc-server, dentro do clone do
Anatomia do Gasto. Ele nao acessa rede, nao le arquivos de segredo e grava
somente em _logs/server_health/ por padrao.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import socket
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_DIR = ROOT / "_logs" / "server_health"
DEFAULT_COLETA_LOG_DIR = ROOT / "_logs" / "coleta_noturna"
LOCK_PATH = Path("/tmp/coleta_noturna_anatomia.lock")
SENSITIVE_PATTERNS = (
    re.compile(r"(?i)(token|senha|password|secret|credential|cookie|authorization)=\S+"),
    re.compile(r"(?i)(X-Omega-Token|Authorization)\s*[:=]\s*(Bearer\s+)?\S+"),
    re.compile(r"(?i)Bearer\s+\S+"),
    re.compile(r"(?i)(api[_-]?key)\s*[:=]\s*\S+"),
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def read_text(path: Path, max_bytes: int = 1_000_000) -> str | None:
    try:
        data = path.read_bytes()[:max_bytes]
    except OSError:
        return None
    return data.decode("utf-8", errors="replace")


def parse_meminfo(text: str) -> dict[str, int]:
    values: dict[str, int] = {}
    for line in text.splitlines():
        if ":" not in line:
            continue
        key, rest = line.split(":", 1)
        parts = rest.strip().split()
        if parts and parts[0].isdigit():
            values[key] = int(parts[0])
    return values


def collect_memory() -> dict[str, Any]:
    meminfo = parse_meminfo(read_text(Path("/proc/meminfo")) or "")
    total = meminfo.get("MemTotal", 0)
    available = meminfo.get("MemAvailable", 0)
    swap_total = meminfo.get("SwapTotal", 0)
    swap_free = meminfo.get("SwapFree", 0)
    return {
        "mem_total_kib": total,
        "mem_available_kib": available,
        "mem_used_pct": percent(total - available, total),
        "swap_total_kib": swap_total,
        "swap_used_kib": max(swap_total - swap_free, 0),
        "swap_used_pct": percent(swap_total - swap_free, swap_total),
    }


def collect_load() -> dict[str, Any]:
    load_text = read_text(Path("/proc/loadavg")) or ""
    uptime_text = read_text(Path("/proc/uptime")) or ""
    load_parts = load_text.split()
    uptime_parts = uptime_text.split()
    uptime_seconds = float(uptime_parts[0]) if uptime_parts else 0.0
    return {
        "load_1m": float(load_parts[0]) if len(load_parts) >= 1 else None,
        "load_5m": float(load_parts[1]) if len(load_parts) >= 2 else None,
        "load_15m": float(load_parts[2]) if len(load_parts) >= 3 else None,
        "uptime_seconds": int(uptime_seconds),
    }


def collect_disk(path: Path) -> dict[str, Any]:
    usage = shutil.disk_usage(path)
    return {
        "path": str(path),
        "total_bytes": usage.total,
        "used_bytes": usage.used,
        "free_bytes": usage.free,
        "used_pct": percent(usage.used, usage.total),
    }


def percent(numerator: int | float, denominator: int | float) -> float | None:
    if not denominator:
        return None
    return round((float(numerator) / float(denominator)) * 100, 1)


def run_command(args: list[str], cwd: Path = ROOT, timeout: int = 5) -> dict[str, Any]:
    try:
        result = subprocess.run(
            args,
            cwd=cwd,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            timeout=timeout,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {"ok": False, "error": str(exc)}
    return {
        "ok": result.returncode == 0,
        "returncode": result.returncode,
        "stdout": sanitize_text(result.stdout.strip()),
        "stderr": sanitize_text(result.stderr.strip()),
    }


def sanitize_text(value: str) -> str:
    sanitized = value
    for pattern in SENSITIVE_PATTERNS:
        sanitized = pattern.sub("<redacted>", sanitized)
    return sanitized


def tail_lines(path: Path, limit: int = 40) -> list[str]:
    text = read_text(path, max_bytes=200_000) or ""
    return [sanitize_text(line) for line in text.splitlines()[-limit:]]


def analyze_latest_coleta_log(log_dir: Path = DEFAULT_COLETA_LOG_DIR) -> dict[str, Any]:
    logs = sorted(log_dir.glob("coleta_*.log"), key=lambda item: item.stat().st_mtime if item.exists() else 0)
    if not logs:
        return {"found": False, "log_dir": str(log_dir)}
    latest = logs[-1]
    lines = tail_lines(latest)
    joined = "\n".join(lines).lower()
    return {
        "found": True,
        "path": latest.relative_to(ROOT).as_posix() if latest.is_relative_to(ROOT) else str(latest),
        "mtime_utc": datetime.fromtimestamp(latest.stat().st_mtime, timezone.utc).isoformat(),
        "size_bytes": latest.stat().st_size,
        "tail_lines": lines,
        "failure_markers": sum(1 for line in lines if "✗" in line or "erro" in line.lower() or "error" in line.lower()),
        "warning_markers": sum(1 for line in lines if "atenção" in line.lower() or "warning" in line.lower()),
        "looks_finished": "coleta noturna concluida" in joined or "coleta noturna concluída" in joined,
    }


def collect_git_status() -> dict[str, Any]:
    result = run_command(["git", "status", "--porcelain=v1", "--branch"])
    stdout = result.get("stdout") or ""
    lines = stdout.splitlines()
    return {
        "ok": result.get("ok", False),
        "branch": lines[0] if lines else "",
        "dirty_entries_count": max(len(lines) - 1, 0),
        "sample": lines[1:31],
        "error": result.get("stderr") or result.get("error") or "",
    }


def collect_cron() -> dict[str, Any]:
    result = run_command(["crontab", "-l"])
    stdout = result.get("stdout") or ""
    active_lines = [
        line
        for line in stdout.splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    return {
        "ok": result.get("ok", False),
        "active_entries_count": len(active_lines),
        "mentions_coleta_wrapper": any("coleta_wrapper.sh" in line for line in active_lines),
        "mentions_coleta_noturna": any("coleta_noturna.sh" in line for line in active_lines),
        "error": result.get("stderr") or result.get("error") or "",
    }


def collect_top_processes(limit: int = 8) -> list[dict[str, Any]]:
    processes: list[dict[str, Any]] = []
    for proc_dir in Path("/proc").iterdir():
        if not proc_dir.name.isdigit():
            continue
        status = read_text(proc_dir / "status")
        stat = read_text(proc_dir / "stat")
        if not status or not stat:
            continue
        name = ""
        rss_kib = 0
        for line in status.splitlines():
            if line.startswith("Name:"):
                name = line.split(":", 1)[1].strip()
            elif line.startswith("VmRSS:"):
                parts = line.split()
                rss_kib = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
        processes.append({"pid": int(proc_dir.name), "name": name, "rss_kib": rss_kib})
    return sorted(processes, key=lambda item: item["rss_kib"], reverse=True)[:limit]


def collect_snapshot() -> dict[str, Any]:
    now = utc_now()
    root_disk = collect_disk(Path("/"))
    repo_disk = collect_disk(ROOT)
    lock_exists = LOCK_PATH.exists()
    return {
        "schema_version": 1,
        "generated_at_utc": now.isoformat(),
        "host": {
            "hostname": socket.gethostname(),
            "platform": sys.platform,
            "pid": os.getpid(),
        },
        "load": collect_load(),
        "memory": collect_memory(),
        "disk": {"root": root_disk, "repo": repo_disk},
        "processes_top_rss": collect_top_processes(),
        "git": collect_git_status(),
        "cron": collect_cron(),
        "coleta": {
            "lock_exists": lock_exists,
            "lock_path": str(LOCK_PATH),
            "latest_log": analyze_latest_coleta_log(),
        },
    }


def write_snapshot(snapshot: dict[str, Any], output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.fromisoformat(snapshot["generated_at_utc"]).strftime("%Y%m%d_%H%M%S")
    versioned = output_dir / f"server_health_{stamp}.json"
    latest = output_dir / "latest.json"
    payload = json.dumps(snapshot, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    versioned.write_text(payload, encoding="utf-8")
    latest.write_text(payload, encoding="utf-8")
    return versioned, latest


def print_summary(snapshot: dict[str, Any]) -> None:
    memory = snapshot["memory"]
    disk = snapshot["disk"]["root"]
    load = snapshot["load"]
    coleta = snapshot["coleta"]["latest_log"]
    git = snapshot["git"]
    print("Server health snapshot — Anatomia do Gasto")
    print(f"Host: {snapshot['host']['hostname']}")
    print(f"Data UTC: {snapshot['generated_at_utc']}")
    print(f"Load: {load['load_1m']} / {load['load_5m']} / {load['load_15m']}")
    print(f"Memória usada: {memory['mem_used_pct']}% | Swap usado: {memory['swap_used_pct']}%")
    print(f"Disco / usado: {disk['used_pct']}%")
    print(f"Git: {git['branch']} | alterações: {git['dirty_entries_count']}")
    if coleta.get("found"):
        print(
            "Coleta: "
            f"{coleta['path']} | falhas={coleta['failure_markers']} | "
            f"avisos={coleta['warning_markers']} | finalizada={coleta['looks_finished']}"
        )
    else:
        print("Coleta: nenhum log encontrado")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Gera snapshot read-only do servidor de coleta.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--stdout", action="store_true", help="imprime resumo humano no stdout")
    parser.add_argument("--json", action="store_true", help="imprime JSON completo no stdout")
    parser.add_argument("--no-write", action="store_true", help="nao grava arquivos em _logs")
    args = parser.parse_args(argv)

    snapshot = collect_snapshot()
    if not args.no_write:
        versioned, latest = write_snapshot(snapshot, args.output_dir)
        snapshot["written_files"] = [str(versioned), str(latest)]
    if args.stdout:
        print_summary(snapshot)
    if args.json:
        print(json.dumps(snapshot, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
