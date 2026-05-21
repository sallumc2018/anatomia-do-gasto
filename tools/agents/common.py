from __future__ import annotations

import csv
import os
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
AGENT_REGISTRY = ROOT / "memory" / "agents" / "registry.csv"
COMMANDS_DIR = ROOT / ".claude" / "commands"
LOCAL_AGENT_DIR = ROOT / ".local" / "agents"
LOCAL_RUN_DIR = ROOT / ".local" / "memory" / "agent-runs"

AGENT_FIELDS = {
    "name",
    "type",
    "command_path",
    "read_paths",
    "write_paths",
    "validation_commands",
    "gates",
    "autonomy",
    "handoff_visibility",
    "risks",
}

FORBIDDEN_DECLARATIONS = (
    ".env",
    "secret",
    "secrets",
    "credential",
    "token",
    "cookie",
    "private key",
    "recovery",
    "known_hosts",
    "authorized_keys",
    "id_rsa",
    "id_ed25519",
    "git " + "push",
    "git " + "commit",
    "vercel " + "deploy",
    "registro.br",
    "delete without approval",
)

FORBIDDEN_WRITE_PATHS = (
    "data/public",
    ".git",
    ".vercel",
    ".local",
    "tmp",
    "g:",
    "github",
    "vercel",
    "registro.br",
)


@dataclass(frozen=True)
class AgentEntry:
    name: str
    type: str
    command_path: str
    read_paths: str
    write_paths: str
    validation_commands: str
    gates: str
    autonomy: str
    handoff_visibility: str
    risks: str


def read_agents(path: Path = AGENT_REGISTRY) -> list[AgentEntry]:
    if not path.exists():
        raise FileNotFoundError(f"Agent registry not found: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = AGENT_FIELDS.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Agent registry missing columns: {', '.join(sorted(missing))}")
        entries = []
        for row in reader:
            entries.append(
                AgentEntry(
                    name=(row.get("name") or "").strip(),
                    type=(row.get("type") or "").strip(),
                    command_path=(row.get("command_path") or "").strip().replace("\\", "/"),
                    read_paths=(row.get("read_paths") or "").strip(),
                    write_paths=(row.get("write_paths") or "").strip(),
                    validation_commands=(row.get("validation_commands") or "").strip(),
                    gates=(row.get("gates") or "").strip(),
                    autonomy=(row.get("autonomy") or "").strip(),
                    handoff_visibility=(row.get("handoff_visibility") or "").strip(),
                    risks=(row.get("risks") or "").strip(),
                )
            )
    return entries


def command_names() -> set[str]:
    return {path.stem for path in COMMANDS_DIR.glob("*.md")}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def command_exists(entry: AgentEntry) -> bool:
    return (ROOT / entry.command_path).exists()


def now_id(prefix: str) -> str:
    safe = re.sub(r"[^a-z0-9]+", "-", prefix.lower()).strip("-") or "run"
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{stamp}-{safe}"


def ensure_local_agent_dirs() -> None:
    (LOCAL_AGENT_DIR / "locks").mkdir(parents=True, exist_ok=True)
    LOCAL_RUN_DIR.mkdir(parents=True, exist_ok=True)


def configure_utf8_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


class LocalLock:
    def __init__(self, name: str) -> None:
        ensure_local_agent_dirs()
        self.path = LOCAL_AGENT_DIR / "locks" / f"{name}.lock"
        self.acquired = False

    def __enter__(self) -> "LocalLock":
        try:
            fd = os.open(str(self.path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                handle.write(f"pid={os.getpid()}\n")
                handle.write(f"created_at={datetime.now(timezone.utc).isoformat()}\n")
            self.acquired = True
            return self
        except FileExistsError as exc:
            raise RuntimeError(f"Lock already exists: {self.path}") from exc

    def __exit__(self, exc_type, exc, tb) -> None:
        if self.acquired:
            self.path.unlink(missing_ok=True)
