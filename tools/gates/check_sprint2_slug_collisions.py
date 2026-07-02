#!/usr/bin/env python3
"""Audita diretorios Sprint 2 que usam slugs ambiguos de municipio.

Uso:
  python3 tools/gates/check_sprint2_slug_collisions.py
  python3 tools/gates/check_sprint2_slug_collisions.py --strict
  python3 tools/gates/check_sprint2_slug_collisions.py --json

Por padrao o script e informativo e retorna 0. Use --strict para bloquear
CI/pre-push quando houver diretorio legado ambiguo.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Mapping

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from pipelines.sprint2_keys import duplicate_keys, municipio_storage_key

DEFAULT_MANIFEST = ROOT / "data" / "manifests" / "ibge_municipios_completo.csv"
DEFAULT_ROOTS = (ROOT / "data" / "extracted", ROOT / "data" / "public")


@dataclass(frozen=True)
class CollisionFinding:
    data_root: str
    legacy_key: str
    municipalities: tuple[str, ...]
    canonical_keys: tuple[str, ...]


@dataclass(frozen=True)
class AuditResult:
    manifest: str
    scanned_roots: tuple[str, ...]
    duplicate_keys: tuple[str, ...]
    findings: tuple[CollisionFinding, ...]


def load_municipios(manifest: Path) -> list[dict[str, str]]:
    if not manifest.exists():
        raise FileNotFoundError(f"manifesto nao encontrado: {manifest}")
    with manifest.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required = {"ibge", "nome", "uf", "key"}
        missing = required.difference(reader.fieldnames or ())
        if missing:
            raise ValueError(f"manifesto sem colunas obrigatorias: {', '.join(sorted(missing))}")
        return [dict(row) for row in reader]


def existing_directory_names(data_root: Path) -> set[str]:
    if not data_root.exists():
        return set()
    return {path.name for path in data_root.iterdir() if path.is_dir()}


def audit(
    municipios: Iterable[Mapping[str, str]],
    data_roots: Iterable[Path],
    manifest: Path = DEFAULT_MANIFEST,
) -> AuditResult:
    municipios_list = list(municipios)
    duplicated = duplicate_keys(municipios_list)
    by_key: dict[str, list[Mapping[str, str]]] = {key: [] for key in duplicated}
    for municipio in municipios_list:
        key = (municipio.get("key") or "").strip()
        if key in by_key:
            by_key[key].append(municipio)

    findings: list[CollisionFinding] = []
    scanned_roots: list[str] = []
    for data_root in data_roots:
        scanned_roots.append(str(data_root))
        names = existing_directory_names(data_root)
        for key in sorted(duplicated):
            if key not in names:
                continue
            entries = sorted(by_key[key], key=lambda row: (row.get("uf") or "", row.get("ibge") or ""))
            municipalities = tuple(
                f"{row.get('nome', '').strip()}-{row.get('uf', '').strip()} ({row.get('ibge', '').strip()})"
                for row in entries
            )
            canonical_keys = tuple(municipio_storage_key(row, duplicated) for row in entries)
            findings.append(
                CollisionFinding(
                    data_root=str(data_root),
                    legacy_key=key,
                    municipalities=municipalities,
                    canonical_keys=canonical_keys,
                )
            )

    return AuditResult(
        manifest=str(manifest),
        scanned_roots=tuple(scanned_roots),
        duplicate_keys=tuple(sorted(duplicated)),
        findings=tuple(findings),
    )


def print_text(result: AuditResult, max_findings: int) -> None:
    print("Sprint 2 slug collision gate")
    print(f"Manifesto: {result.manifest}")
    print(f"Chaves duplicadas no manifesto: {len(result.duplicate_keys)}")
    print(f"Diretorios legados ambiguos: {len(result.findings)}")
    if not result.findings:
        print("OK: nenhum diretorio legado ambiguo encontrado nos roots escaneados.")
        return

    print("")
    print("Findings:")
    visible = result.findings if max_findings < 0 else result.findings[:max_findings]
    for finding in visible:
        print(f"- {finding.data_root}/{finding.legacy_key}")
        print(f"  Municipios possiveis: {', '.join(finding.municipalities)}")
        print(f"  Chaves canonicas: {', '.join(finding.canonical_keys)}")
    hidden = len(result.findings) - len(visible)
    if hidden > 0:
        print(f"... {hidden} finding(s) oculto(s). Use --max-findings -1 ou --json para ver tudo.")
    print("")
    print("Acao recomendada: novas coletas/publicacoes devem usar chave canonica key_uf.")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audita slugs ambiguos do Sprint 2.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument(
        "--root",
        action="append",
        type=Path,
        dest="roots",
        help="Root de dados a escanear. Pode ser repetido. Padrao: data/extracted e data/public.",
    )
    parser.add_argument("--strict", action="store_true", help="retorna exit 1 se houver finding")
    parser.add_argument("--json", action="store_true", help="imprime JSON em vez de texto")
    parser.add_argument(
        "--max-findings",
        type=int,
        default=20,
        help="limite de findings no texto; use -1 para listar todos. Padrao: 20.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        municipios = load_municipios(args.manifest)
        result = audit(municipios, args.roots or DEFAULT_ROOTS, args.manifest)
    except (FileNotFoundError, ValueError) as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(asdict(result), ensure_ascii=False, indent=2))
    else:
        print_text(result, args.max_findings)
    return 1 if args.strict and result.findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
