#!/usr/bin/env python3
"""Gera um relatório de cobertura das três áreas federais do Sprint 2."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
IBGE_CSV = ROOT / "data" / "manifests" / "ibge_municipios_completo.csv"
EXTRACTED_DIR = ROOT / "data" / "extracted"
LOG_DIR = ROOT / "_logs"

AREAS_SPRINT2 = ("transferencias_federais", "emendas_federais", "fns")
IBGE_FIELDS = (
    "ibge",
    "codigo_ibge",
    "cod_ibge",
    "co_municipio_ibge",
    "municipio_ibge",
)
UF_FIELDS = ("uf", "sg_uf", "sigla_uf")
NAME_FIELDS = ("municipio", "nome_municipio", "nm_municipio", "nome")


@dataclass(frozen=True)
class Municipio:
    ibge: str
    nome: str
    uf: str
    key: str


@dataclass(frozen=True)
class CoberturaMunicipio:
    municipio: Municipio
    areas: tuple[str, ...]


@dataclass(frozen=True)
class DiretorioNaoResolvido:
    key: str
    areas: tuple[str, ...]
    candidatos: tuple[str, ...]


def normalizar_slug(value: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "_", ascii_text.lower()).strip("_")


def normalizar_campo(value: str) -> str:
    return normalizar_slug(value).replace("_", "")


def carregar_municipios(path: Path) -> list[Municipio]:
    if not path.is_file():
        raise FileNotFoundError(
            f"Manifesto IBGE não encontrado: {path}. "
            "A cobertura não pode ser calculada sem a lista canônica de municípios."
        )

    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"ibge", "nome", "uf"}
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Manifesto IBGE sem colunas obrigatórias: {', '.join(sorted(missing))}.")

        municipios = []
        for row_number, row in enumerate(reader, start=2):
            ibge = (row.get("ibge") or "").strip()
            nome = (row.get("nome") or "").strip()
            uf = (row.get("uf") or "").strip().upper()
            key = (row.get("key") or normalizar_slug(nome)).strip()
            if not ibge or not nome or not uf or not key:
                raise ValueError(f"Manifesto IBGE contém linha incompleta em {path}:{row_number}.")
            municipios.append(Municipio(ibge=ibge, nome=nome, uf=uf, key=key))

    if not municipios:
        raise ValueError(f"Manifesto IBGE vazio: {path}.")
    return municipios


def csvs_da_area(municipio_dir: Path, area: str) -> list[Path]:
    output_dir = municipio_dir / area / "saida"
    if not output_dir.is_dir():
        return []
    return sorted(path for path in output_dir.glob("*.csv") if path.is_file() and path.stat().st_size > 0)


def areas_com_dados(municipio_dir: Path) -> tuple[str, ...]:
    return tuple(area for area in AREAS_SPRINT2 if csvs_da_area(municipio_dir, area))


def _primeira_linha_csv(paths: Iterable[Path]) -> dict[str, str]:
    for path in paths:
        try:
            with path.open(encoding="utf-8-sig", newline="", errors="replace") as handle:
                row = next(csv.DictReader(handle), None)
        except (OSError, csv.Error):
            continue
        if row:
            return {normalizar_campo(key): (value or "").strip() for key, value in row.items() if key}
    return {}


def _codigo_compativel(csv_value: str, ibge: str) -> bool:
    digits = re.sub(r"\D", "", csv_value)
    return bool(digits) and (digits == ibge or digits == ibge[:6])


def _resolver_por_conteudo(
    candidatos: list[Municipio],
    municipio_dir: Path,
    areas: tuple[str, ...],
) -> Municipio | None:
    csv_paths = [path for area in areas for path in csvs_da_area(municipio_dir, area)]
    row = _primeira_linha_csv(csv_paths)
    if not row:
        return None

    ibge_values = [row[field] for field in IBGE_FIELDS if field in row and row[field]]
    uf_values = {row[field].upper() for field in UF_FIELDS if field in row and row[field]}
    name_values = {normalizar_slug(row[field]) for field in NAME_FIELDS if field in row and row[field]}

    matches = []
    for municipio in candidatos:
        if ibge_values and not any(_codigo_compativel(value, municipio.ibge) for value in ibge_values):
            continue
        if uf_values and municipio.uf not in uf_values:
            continue
        if name_values and normalizar_slug(municipio.nome) not in name_values:
            continue
        matches.append(municipio)
    return matches[0] if len(matches) == 1 else None


def resolver_diretorio(
    municipio_dir: Path,
    areas: tuple[str, ...],
    by_ibge: dict[str, Municipio],
    by_key: dict[str, list[Municipio]],
) -> tuple[Municipio | None, tuple[Municipio, ...]]:
    directory_key = municipio_dir.name
    if directory_key in by_ibge:
        return by_ibge[directory_key], ()

    suffix_match = re.fullmatch(r"(.+)_([a-z]{2})", directory_key)
    if suffix_match:
        base_key, uf = suffix_match.groups()
        matches = [m for m in by_key.get(base_key, []) if m.uf == uf.upper()]
        if len(matches) == 1:
            return matches[0], ()

    candidatos = by_key.get(directory_key, [])
    if len(candidatos) == 1:
        return candidatos[0], ()
    if len(candidatos) > 1:
        resolved = _resolver_por_conteudo(candidatos, municipio_dir, areas)
        if resolved:
            return resolved, ()
    return None, tuple(candidatos)


def coletar_cobertura(
    municipios: list[Municipio],
    extracted_dir: Path,
) -> tuple[dict[str, CoberturaMunicipio], list[DiretorioNaoResolvido]]:
    by_ibge = {municipio.ibge: municipio for municipio in municipios}
    by_key: dict[str, list[Municipio]] = defaultdict(list)
    for municipio in municipios:
        by_key[municipio.key].append(municipio)

    cobertura: dict[str, CoberturaMunicipio] = {}
    nao_resolvidos: list[DiretorioNaoResolvido] = []
    if not extracted_dir.is_dir():
        return cobertura, nao_resolvidos

    for municipio_dir in sorted(path for path in extracted_dir.iterdir() if path.is_dir()):
        areas = areas_com_dados(municipio_dir)
        if not areas:
            continue
        municipio, candidatos = resolver_diretorio(municipio_dir, areas, by_ibge, by_key)
        if municipio is None:
            nao_resolvidos.append(
                DiretorioNaoResolvido(
                    key=municipio_dir.name,
                    areas=areas,
                    candidatos=tuple(f"{item.nome}/{item.uf}/{item.ibge}" for item in candidatos),
                )
            )
            continue

        previous = cobertura.get(municipio.ibge)
        merged = tuple(area for area in AREAS_SPRINT2 if area in set(areas) | set(previous.areas if previous else ()))
        cobertura[municipio.ibge] = CoberturaMunicipio(municipio=municipio, areas=merged)

    return cobertura, nao_resolvidos


def percentual(value: int, total: int) -> float:
    return round((value / total * 100) if total else 0.0, 1)


def montar_resultado(
    municipios: list[Municipio],
    cobertura: dict[str, CoberturaMunicipio],
    nao_resolvidos: list[DiretorioNaoResolvido],
    uf: str | None = None,
    report_date: date | None = None,
) -> dict:
    selected = [municipio for municipio in municipios if uf is None or municipio.uf == uf]
    selected_ids = {municipio.ibge for municipio in selected}
    covered = [item for ibge, item in cobertura.items() if ibge in selected_ids]
    covered_ids = {item.municipio.ibge for item in covered}

    area_counts = Counter(area for item in covered for area in item.areas)
    uf_totals = Counter(municipio.uf for municipio in selected)
    uf_covered = Counter(item.municipio.uf for item in covered)
    all_ufs = sorted(uf_totals)

    return {
        "titulo": "Cobertura Sprint 2 — Anatomia do Gasto",
        "data": (report_date or date.today()).isoformat(),
        "filtro_uf": uf,
        "total_municipios": len(selected),
        "municipios_com_dados": len(covered_ids),
        "percentual_com_dados": percentual(len(covered_ids), len(selected)),
        "municipios_com_todas_areas": sum(len(item.areas) == len(AREAS_SPRINT2) for item in covered),
        "percentual_com_todas_areas": percentual(
            sum(len(item.areas) == len(AREAS_SPRINT2) for item in covered),
            len(selected),
        ),
        "por_area": {area: area_counts[area] for area in AREAS_SPRINT2},
        "por_uf": {
            state: {
                "com_dados": uf_covered[state],
                "total": uf_totals[state],
                "percentual": percentual(uf_covered[state], uf_totals[state]),
            }
            for state in all_ufs
        },
        "ufs_completas": [state for state in all_ufs if uf_covered[state] == uf_totals[state]],
        "ufs_sem_dados": [state for state in all_ufs if uf_covered[state] == 0],
        "municipios": [
            {
                "ibge": item.municipio.ibge,
                "nome": item.municipio.nome,
                "uf": item.municipio.uf,
                "key": item.municipio.key,
                "areas": list(item.areas),
            }
            for item in sorted(covered, key=lambda item: (item.municipio.uf, item.municipio.nome))
        ],
        "diretorios_nao_resolvidos": [
            {
                "key": item.key,
                "areas": list(item.areas),
                "candidatos": list(item.candidatos),
            }
            for item in nao_resolvidos
        ],
    }


def formatar_texto(result: dict, listar: bool = False) -> str:
    def formatar_lista(values: list[str]) -> str:
        return f"[{', '.join(values)}]"

    total_label = "Total municípios Brasil" if result["filtro_uf"] is None else f"Total municípios {result['filtro_uf']}"
    lines = [
        result["titulo"],
        f"Data: {result['data']}",
        "",
        f"{total_label}: {result['total_municipios']}",
        (
            "Municípios com ao menos 1 área coletada: "
            f"{result['municipios_com_dados']} ({result['percentual_com_dados']:.1f}%)"
        ),
        (
            "Municípios com todas as 3 áreas: "
            f"{result['municipios_com_todas_areas']} ({result['percentual_com_todas_areas']:.1f}%)"
        ),
        "",
        "Por área:",
    ]
    width = max(len(area) for area in AREAS_SPRINT2)
    lines.extend(f"  {area:<{width}}: {result['por_area'][area]} municípios" for area in AREAS_SPRINT2)
    lines.extend(["", "Por UF (municípios com dados / total):"])
    lines.extend(
        f"  {uf}: {stats['com_dados']}/{stats['total']} ({stats['percentual']:.1f}%)"
        for uf, stats in result["por_uf"].items()
    )
    lines.extend(
        [
            "",
            (
                "UFs completas (todos os municípios com ao menos 1 área): "
                f"{formatar_lista(result['ufs_completas'])}"
            ),
            f"UFs sem nenhum dado: {formatar_lista(result['ufs_sem_dados'])}",
        ]
    )

    if result["diretorios_nao_resolvidos"]:
        lines.extend(["", "Diretórios com dados não atribuídos:"])
        for item in result["diretorios_nao_resolvidos"]:
            candidates = ", ".join(item["candidatos"]) or "nenhum município canônico"
            lines.append(f"  {item['key']}: {', '.join(item['areas'])} — candidatos: {candidates}")

    if listar:
        lines.extend(["", "Municípios com dados:"])
        for item in result["municipios"]:
            lines.append(f"  {item['nome']}, {item['uf']} ({item['ibge']}): {', '.join(item['areas'])}")

    return "\n".join(lines) + "\n"


def salvar_relatorio(content: str, output_dir: Path, report_date: str) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"cobertura_sprint2_{report_date.replace('-', '')}.txt"
    output_path.write_text(content, encoding="utf-8")
    return output_path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Gera dashboard de cobertura do Sprint 2.")
    parser.add_argument("--uf", help="Filtrar por UF, por exemplo: --uf SP")
    parser.add_argument("--formato", choices=("texto", "json"), default="texto")
    parser.add_argument("--listar", action="store_true", help="Listar municípios com dados e suas áreas.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    uf = args.uf.upper() if args.uf else None

    try:
        municipios = carregar_municipios(IBGE_CSV)
    except (FileNotFoundError, ValueError) as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        return 1

    valid_ufs = {municipio.uf for municipio in municipios}
    if uf and uf not in valid_ufs:
        print(f"ERRO: UF inválida: {uf}. Use uma sigla presente no manifesto IBGE.", file=sys.stderr)
        return 2

    cobertura, nao_resolvidos = coletar_cobertura(municipios, EXTRACTED_DIR)
    result = montar_resultado(municipios, cobertura, nao_resolvidos, uf=uf)
    content = (
        json.dumps(result, ensure_ascii=False, indent=2) + "\n"
        if args.formato == "json"
        else formatar_texto(result, listar=args.listar)
    )
    output_path = salvar_relatorio(content, LOG_DIR, result["data"])
    print(content, end="")
    print(f"Relatório salvo em: {output_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
