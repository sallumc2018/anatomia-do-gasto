#!/usr/bin/env python3
"""Worker 24/7 para coleta incremental do Sprint 2.

O worker percorre o manifesto IBGE de forma circular, coleta um municipio por
vez, publica as areas federais coletadas e grava estado operacional em _logs.
Commit/push automatico e opcional e sempre passa por gates antes de enviar.
"""

from __future__ import annotations

import argparse
import csv
import fcntl
import json
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PYTHON = ROOT / ".venv" / "bin" / "python3"
IBGE_CSV = ROOT / "data" / "manifests" / "ibge_municipios_completo.csv"
STATE_DIR = ROOT / "_logs" / "sprint2_24x7"
STATE_FILE = STATE_DIR / "state.json"
LOCK_FILE = STATE_DIR / "worker.lock"

_SECRETS_FILES = [
    Path.home() / ".config" / "omega" / "secrets.env",
    Path.home() / ".config" / "omega" / "secrets" / "by-project" / "portais.env",
]


def _load_secrets() -> None:
    """Carrega variáveis de ambiente dos arquivos de segredos do Omega."""
    for path in _SECRETS_FILES:
        if not path.exists():
            continue
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("export "):
                    line = line[len("export "):]
                if "=" in line:
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = value
PUBLIC_PATHS = (
    "data/public/",
    "data/manifests/sprint2/",
    "data/manifests/datasets_status.json",
    "apps/web/lib/datasets_status.json",
)


@dataclass(frozen=True)
class Municipio:
    ibge: str
    nome: str
    uf: str
    key: str


@dataclass(frozen=True)
class CommandResult:
    label: str
    returncode: int
    elapsed_seconds: float


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def event_log_path() -> Path:
    return STATE_DIR / f"events_{datetime.now(timezone.utc).strftime('%Y%m%d')}.jsonl"


def append_event(event: dict[str, Any]) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"time_utc": utc_now(), **event}
    with event_log_path().open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, ensure_ascii=False, sort_keys=True) + "\n")


def load_municipios(path: Path = IBGE_CSV, ufs: set[str] | None = None) -> list[Municipio]:
    if not path.exists():
        raise FileNotFoundError(f"Manifesto IBGE nao encontrado: {path}")
    municipios: list[Municipio] = []
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"ibge", "nome", "uf"}
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Manifesto IBGE sem colunas: {', '.join(sorted(missing))}")
        for row in reader:
            uf = (row.get("uf") or "").strip().upper()
            if ufs and uf not in ufs:
                continue
            municipios.append(
                Municipio(
                    ibge=(row.get("ibge") or "").strip(),
                    nome=(row.get("nome") or "").strip(),
                    uf=uf,
                    key=(row.get("key") or "").strip(),
                )
            )
    if not municipios:
        raise ValueError("Nenhum municipio selecionado para o worker 24/7.")
    return municipios


def load_state(path: Path = STATE_FILE) -> dict[str, Any]:
    if not path.exists():
        return {
            "schema_version": 1,
            "cursor": 0,
            "successes_since_commit": 0,
            "total_successes": 0,
            "total_failures": 0,
            "failures_by_ibge": {},
        }
    return json.loads(path.read_text(encoding="utf-8"))


def save_state(state: dict[str, Any], path: Path = STATE_FILE) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    tmp.replace(path)


def next_municipio(municipios: list[Municipio], state: dict[str, Any]) -> Municipio:
    cursor = int(state.get("cursor", 0)) % len(municipios)
    return municipios[cursor]


def advance_cursor(state: dict[str, Any], total: int) -> None:
    state["cursor"] = (int(state.get("cursor", 0)) + 1) % total


def run_command(label: str, command: list[str], log_path: Path, timeout: int) -> CommandResult:
    append_event({"event": "command_start", "label": label, "command": safe_command(command)})
    started = time.monotonic()
    with log_path.open("a", encoding="utf-8") as log:
        log.write(f"\n[{utc_now()}] >>> {label}: {' '.join(safe_command(command))}\n")
        try:
            result = subprocess.run(
                command,
                cwd=ROOT,
                stdout=log,
                stderr=subprocess.STDOUT,
                text=True,
                timeout=timeout,
                check=False,
            )
            returncode = result.returncode
        except subprocess.TimeoutExpired:
            returncode = 124
            log.write(f"[{utc_now()}] TIMEOUT apos {timeout}s\n")
    elapsed = round(time.monotonic() - started, 1)
    append_event({"event": "command_finish", "label": label, "returncode": returncode, "elapsed_seconds": elapsed})
    return CommandResult(label=label, returncode=returncode, elapsed_seconds=elapsed)


def safe_command(command: list[str]) -> list[str]:
    redacted: list[str] = []
    for item in command:
        if any(token in item.lower() for token in ("token", "secret", "password", "senha", "credential")):
            redacted.append("<redacted>")
        else:
            redacted.append(item)
    return redacted


def process_municipio(municipio: Municipio, timeout: int) -> bool:
    log_path = STATE_DIR / "runs" / f"{municipio.ibge}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    append_event(
        {
            "event": "municipio_start",
            "ibge": municipio.ibge,
            "nome": municipio.nome,
            "uf": municipio.uf,
            "key": municipio.key,
            "log": str(log_path.relative_to(ROOT)),
        }
    )

    commands = [
        (
            "coletar municipio",
            [str(PYTHON), "pipelines/coletar_municipios_brasil.py", "--ibge", municipio.ibge],
        ),
        (
            "publicar municipio",
            [str(PYTHON), "pipelines/publicar_municipios_brasil.py", "--ibge", municipio.ibge],
        ),
    ]
    ok = True
    for label, command in commands:
        result = run_command(label, command, log_path, timeout)
        if result.returncode != 0:
            ok = False
            break

    append_event(
        {
            "event": "municipio_finish",
            "ibge": municipio.ibge,
            "nome": municipio.nome,
            "uf": municipio.uf,
            "ok": ok,
        }
    )
    return ok


def run_catalog_and_coverage(timeout: int) -> bool:
    log_path = STATE_DIR / "runs" / f"catalog_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    commands = [
        ("gerar datasets", [str(PYTHON), "pipelines/gerar_datasets_json.py"]),
        ("gerar cobertura Sprint 2", [str(PYTHON), "pipelines/gerar_cobertura_sprint2.py"]),
    ]
    for label, command in commands:
        if run_command(label, command, log_path, timeout).returncode != 0:
            return False
    return True


def git_has_staged_changes() -> bool:
    result = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT, check=False)
    return result.returncode == 1


def stage_public_outputs() -> None:
    subprocess.run(["git", "add", "--", *PUBLIC_PATHS], cwd=ROOT, check=True)


def run_commit_gates(timeout: int) -> bool:
    log_path = STATE_DIR / "runs" / f"gates_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    commands = [
        ("check-secrets staged", [str(PYTHON), "tools/agents/check-secrets.py", "--staged"]),
        ("pre-deploy gate", [str(PYTHON), "tools/gates/pre_deploy.py"]),
        ("verificar publicacao", [str(PYTHON), "pipelines/testes/verificar_publicacao.py"]),
        ("slug collisions", [str(PYTHON), "tools/gates/check_sprint2_slug_collisions.py", "--max-findings", "20"]),
        ("turbopack tracing", [str(PYTHON), "tools/gates/check_turbopack_data_tracing.py"]),
    ]
    for label, command in commands:
        if run_command(label, command, log_path, timeout).returncode != 0:
            return False
    return True


def commit_and_push(timeout: int, dry_run: bool) -> bool:
    if not run_catalog_and_coverage(timeout):
        append_event({"event": "commit_skip", "reason": "catalog_or_coverage_failed"})
        return False
    stage_public_outputs()
    if not git_has_staged_changes():
        append_event({"event": "commit_skip", "reason": "no_staged_changes"})
        return True
    if not run_commit_gates(timeout):
        append_event({"event": "commit_blocked", "reason": "gate_failed"})
        return False
    if dry_run:
        append_event({"event": "commit_dry_run"})
        return True
    today = datetime.now(timezone.utc).date().isoformat()
    message = [
        "git",
        "commit",
        "-m",
        f"chore(coleta): sprint2 24x7 {today}",
        "-m",
        "Coleta incremental automatica via sallumc-server.",
        "-m",
        "[Claude Code > claude-sonnet-4-6 > Auto]",
    ]
    if run_command("git commit", message, STATE_DIR / "runs" / f"git_{today}.log", timeout).returncode != 0:
        return False
    return run_command("git push", ["git", "push", "origin", "main"], STATE_DIR / "runs" / f"git_{today}.log", timeout).returncode == 0


def acquire_lock() -> Any:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    handle = LOCK_FILE.open("w", encoding="utf-8")
    try:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise SystemExit("Outro worker 24/7 ja esta rodando.")
    handle.write(f"pid={os.getpid()} started={utc_now()}\n")
    handle.flush()
    return handle


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Worker 24/7 do Sprint 2.")
    parser.add_argument("--loop", action="store_true", help="roda continuamente")
    parser.add_argument("--max-municipios", type=int, default=1, help="limite por execucao sem --loop")
    parser.add_argument("--sleep", type=int, default=30, help="pausa entre municipios no modo loop")
    parser.add_argument("--timeout", type=int, default=7200, help="timeout por etapa")
    parser.add_argument("--uf", action="append", default=[], help="filtra UFs, pode repetir")
    parser.add_argument("--commit-push-every", type=int, default=0, help="commit/push a cada N sucessos; 0 desativa")
    parser.add_argument("--dry-run-commit", action="store_true", help="roda gates mas nao commita/pusha")
    args = parser.parse_args(argv)

    _load_secrets()

    if not PYTHON.exists():
        raise SystemExit(f"Python da venv nao encontrado: {PYTHON}")

    ufs = {uf.upper() for uf in args.uf}
    municipios = load_municipios(ufs=ufs or None)
    state = load_state()
    lock_handle = acquire_lock()

    processed = 0
    append_event({"event": "worker_start", "municipios": len(municipios), "loop": args.loop})
    while True:
        municipio = next_municipio(municipios, state)
        state["last_started_at"] = utc_now()
        state["last_ibge"] = municipio.ibge
        state["last_nome"] = municipio.nome
        save_state(state)

        ok = process_municipio(municipio, args.timeout)
        if ok:
            state["total_successes"] = int(state.get("total_successes", 0)) + 1
            state["successes_since_commit"] = int(state.get("successes_since_commit", 0)) + 1
        else:
            state["total_failures"] = int(state.get("total_failures", 0)) + 1
            failures = dict(state.get("failures_by_ibge", {}))
            failures[municipio.ibge] = int(failures.get(municipio.ibge, 0)) + 1
            state["failures_by_ibge"] = failures

        advance_cursor(state, len(municipios))
        state["last_finished_at"] = utc_now()
        save_state(state)

        if (
            args.commit_push_every > 0
            and int(state.get("successes_since_commit", 0)) >= args.commit_push_every
        ):
            if commit_and_push(args.timeout, args.dry_run_commit):
                state["successes_since_commit"] = 0
                state["last_commit_attempt_ok"] = True
            else:
                state["last_commit_attempt_ok"] = False
            save_state(state)

        processed += 1
        if not args.loop and processed >= args.max_municipios:
            break
        time.sleep(max(args.sleep if ok else args.sleep * 2, 1))

    append_event({"event": "worker_stop", "processed": processed})
    lock_handle.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
