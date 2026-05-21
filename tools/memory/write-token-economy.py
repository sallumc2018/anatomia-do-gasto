from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

from common import ROOT, configure_utf8_stdio


LOG_DIR = ROOT / "memory" / "token-economy"
RESTRICTED_DATA = ("data/raw", "data/extracted", "data/validated")
SENSITIVE_PATTERNS = (
    ".env",
    "secret",
    "secrets",
    "credential",
    "credentials",
    "cookie",
    "private key",
    "recovery code",
    "id_rsa",
    "id_ed25519",
    "c:/omega/sensivel",
    "c:\\omega\\sensivel",
)


def join_items(items: list[str]) -> str:
    return "; ".join(item.strip() for item in items if item.strip())


def validate_public_text(label: str, value: str) -> list[str]:
    errors: list[str] = []
    lower = value.lower().replace("\\", "/")
    for restricted in RESTRICTED_DATA:
        if restricted in lower:
            errors.append(f"{label} mentions restricted data layer: {restricted}")
    for pattern in SENSITIVE_PATTERNS:
        if pattern in lower:
            errors.append(f"{label} mentions sensitive pattern: {pattern}")
    return errors


def render_entry(args: argparse.Namespace, today: date) -> str:
    title = args.title or args.scope
    consulted = join_items(args.consulted)
    avoided = join_items(args.avoided)
    commands = join_items(args.commands)
    privacy = args.privacy or "entrada sanitizada; nao inclui prompts privados, secrets, conversa completa ou dados nao publicados"
    return "\n".join(
        [
            "",
            f"## {today.isoformat()} - {args.agent} - {title}",
            "",
            f"- Escopo: {args.scope}",
            f"- Arquivos consultados: {consulted}",
            f"- Arquivos/trechos evitados: {avoided}",
            f"- Comandos consolidados: {commands}",
            f"- Estimativa: {args.estimate}",
            f"- Privacidade: {privacy}",
            "",
        ]
    )


def footer(args: argparse.Namespace) -> str:
    consulted = join_items(args.consulted)
    avoided = join_items(args.avoided)
    base = f"consultados: {consulted}; evitados: {avoided}"
    return "\n".join(
        [
            "Fim de trabalho substantivo: sim.",
            f"Handoff recomendado: {args.handoff_recommended} - {args.handoff_reason}.",
            f"Modelo: {args.model} - {args.model_reason}.",
            f"Economia de contexto: {args.economy_level}; base: {base}; estimativa: {args.estimate}.",
        ]
    )


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="Append a sanitized token economy log and print the standard footer.")
    parser.add_argument("--check", action="store_true", help="Validate writer only.")
    parser.add_argument("--agent", default="Codex")
    parser.add_argument("--title")
    parser.add_argument("--scope")
    parser.add_argument("--consulted", action="append", default=[])
    parser.add_argument("--avoided", action="append", default=[])
    parser.add_argument("--commands", action="append", default=[])
    parser.add_argument("--estimate")
    parser.add_argument("--privacy")
    parser.add_argument("--economy-level", choices=("baixa", "media", "alta"), default="media")
    parser.add_argument("--handoff-recommended", choices=("sim", "nao"), default="nao")
    parser.add_argument("--handoff-reason", default="continuidade registrada em docs e ferramentas")
    parser.add_argument("--model", default="adequado")
    parser.add_argument("--model-reason", default="tarefa mecanica e validavel localmente")
    parser.add_argument("--date")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.check:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        print("Token economy writer check: OK")
        return 0

    missing = [
        name
        for name, value in {
            "--scope": args.scope,
            "--consulted": args.consulted,
            "--avoided": args.avoided,
            "--commands": args.commands,
            "--estimate": args.estimate,
        }.items()
        if not value
    ]
    if missing:
        print(f"Missing required arguments: {', '.join(missing)}")
        return 1

    all_text = "\n".join(
        [
            args.agent,
            args.title or "",
            args.scope,
            join_items(args.consulted),
            join_items(args.avoided),
            join_items(args.commands),
            args.estimate,
            args.privacy or "",
        ]
    )
    errors = validate_public_text("entry", all_text)
    if errors:
        print("Token economy validation: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    today = date.fromisoformat(args.date) if args.date else date.today()
    target = LOG_DIR / f"{today.strftime('%Y-%m')}.md"
    entry = render_entry(args, today)
    if args.dry_run:
        print(entry.lstrip())
    else:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        with target.open("a", encoding="utf-8") as handle:
            handle.write(entry)
        print(f"Token economy entry written: {target.relative_to(ROOT)}")
    print(footer(args))
    return 0


if __name__ == "__main__":
    sys.exit(main())
