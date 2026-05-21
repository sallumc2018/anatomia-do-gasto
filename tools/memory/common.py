from __future__ import annotations

import csv
import hashlib
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "memory" / "registry.csv"
INDEX_DB = ROOT / ".local" / "rag" / "anatomia_public.sqlite"

TEXT_EXTENSIONS = {".md", ".txt", ".csv", ".json"}
ACTIVE_AUTHORITIES = {"canonical", "reference"}
ACTIVE_STATUSES = {"active"}

FORBIDDEN_PARTS = {
    ".git",
    ".vercel",
    ".local",
    "tmp",
    "node_modules",
    ".next",
    "__pycache__",
    ".venv",
    "venv",
}

FORBIDDEN_PREFIXES = {
    "data/raw",
    "data/extracted",
    "data/validated",
}

FORBIDDEN_PATTERNS = (
    ".env",
    "secret",
    "secrets",
    "credential",
    "credentials",
    "token",
    "cookie",
    "private",
    "recovery",
    "known_hosts",
    "authorized_keys",
    "id_rsa",
    "id_ed25519",
)


@dataclass(frozen=True)
class RegistryEntry:
    id: str
    path: str
    type: str
    visibility: str
    authority: str
    allowed_agents: set[str]
    tags: set[str]
    index: bool
    ttl_days: int | None
    status: str
    notes: str


def normalize_rel_path(value: str) -> str:
    return value.strip().replace("\\", "/").strip("/")


def split_set(value: str) -> set[str]:
    return {item.strip() for item in value.split(";") if item.strip()}


def read_registry(path: Path = REGISTRY) -> list[RegistryEntry]:
    if not path.exists():
        raise FileNotFoundError(f"Registry not found: {path}")
    entries: list[RegistryEntry] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {
            "id",
            "path",
            "type",
            "visibility",
            "authority",
            "allowed_agents",
            "tags",
            "index",
            "ttl_days",
            "status",
            "notes",
        }
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Registry missing columns: {', '.join(sorted(missing))}")
        for row in reader:
            ttl_raw = (row.get("ttl_days") or "").strip()
            entries.append(
                RegistryEntry(
                    id=(row.get("id") or "").strip(),
                    path=normalize_rel_path(row.get("path") or ""),
                    type=(row.get("type") or "").strip(),
                    visibility=(row.get("visibility") or "").strip(),
                    authority=(row.get("authority") or "").strip(),
                    allowed_agents=split_set(row.get("allowed_agents") or ""),
                    tags=split_set(row.get("tags") or ""),
                    index=(row.get("index") or "").strip().lower() in {"yes", "true", "1"},
                    ttl_days=int(ttl_raw) if ttl_raw else None,
                    status=(row.get("status") or "").strip(),
                    notes=(row.get("notes") or "").strip(),
                )
            )
    return entries


def is_forbidden_path(path_value: str) -> str | None:
    value = normalize_rel_path(path_value)
    lower = value.lower()
    if re.match(r"^[a-z]:/", lower) or lower.startswith("//"):
        return "absolute paths are not allowed"
    if lower.startswith("g:/"):
        return "G: drive is not allowed"
    parts = set(lower.split("/"))
    forbidden_part = parts.intersection(FORBIDDEN_PARTS)
    if forbidden_part:
        return f"forbidden path segment: {sorted(forbidden_part)[0]}"
    for prefix in FORBIDDEN_PREFIXES:
        if lower == prefix or lower.startswith(prefix + "/"):
            return f"forbidden data layer: {prefix}"
    filename = Path(lower).name
    for pattern in FORBIDDEN_PATTERNS:
        if pattern == "token" and (
            lower == "memory/token-economy" or lower.startswith("memory/token-economy/")
        ):
            continue
        if pattern in filename or pattern in lower:
            return f"forbidden sensitive pattern: {pattern}"
    return None


def resolve_registry_path(entry: RegistryEntry) -> Path:
    return (ROOT / entry.path).resolve()


def iter_entry_files(entry: RegistryEntry) -> list[Path]:
    target = resolve_registry_path(entry)
    if not str(target).startswith(str(ROOT.resolve())):
        raise ValueError(f"Path escapes repository root: {entry.path}")
    if not target.exists():
        raise FileNotFoundError(f"Registry path does not exist: {entry.path}")
    if target.is_file():
        return [target] if target.suffix.lower() in TEXT_EXTENSIONS else []
    files: list[Path] = []
    for child in target.rglob("*"):
        if child.is_file() and child.suffix.lower() in TEXT_EXTENSIONS:
            rel = child.relative_to(ROOT).as_posix()
            reason = is_forbidden_path(rel)
            if reason:
                continue
            files.append(child)
    return sorted(files)


def read_text(path: Path) -> str:
    data = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def ensure_local_dirs() -> None:
    (ROOT / ".local" / "rag").mkdir(parents=True, exist_ok=True)
    (ROOT / ".local" / "memory" / "handoffs").mkdir(parents=True, exist_ok=True)


def configure_utf8_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
