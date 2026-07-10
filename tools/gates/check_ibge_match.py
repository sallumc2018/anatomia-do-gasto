"""
Gate: confere se o IBGE embutido no CONTEUDO de cada CSV publicado bate com
o IBGE esperado para o slug do diretorio em data/public/<slug>/.

Motivacao: pipelines/paths.py:40 tinha o IBGE de Sertaozinho (3551702)
registrado sob a chave "sao_vicente" — o pipeline nunca detectou porque
nao existia verificacao de conteudo, so de caminho. Este gate fecha essa
lacuna: publicar_dados.py valida PADRAO de nome de arquivo, nao o dado
em si.

Fontes de IBGE esperado, por prioridade:
  1. pipelines/paths.py MUNICIPIOS (config canonica dos municipios
     registrados manualmente — Sprint 1 + originais).
  2. data/manifests/ibge_municipios_completo.csv, usando a chave canonica
     slug_uf (pipelines/sprint2_keys.py) para os 5571 municipios do sprint2.

Areas verificadas (tem IBGE identificavel no conteudo do CSV):
  - executivo, fiscal, receita, seguranca, transporte (SICONFI): coluna
    Fonte_URL contem "id_ente=<7 digitos>".
  - fns: coluna CO_MUNICIPIO_IBGE (6 digitos).

Uso:
  .venv/bin/python3 tools/gates/check_ibge_match.py
  .venv/bin/python3 tools/gates/check_ibge_match.py --municipio sao_vicente
  .venv/bin/python3 tools/gates/check_ibge_match.py --strict   # exit 1 se achar mismatch
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipelines"))

from paths import MUNICIPIOS  # noqa: E402
from sprint2_keys import duplicate_keys, municipio_storage_key  # noqa: E402

PUBLIC_DIR = ROOT / "data" / "public"
IBGE_CSV = ROOT / "data" / "manifests" / "ibge_municipios_completo.csv"

ID_ENTE_RE = re.compile(r"id_ente=(\d{7})")

AREAS_SICONFI = {"executivo", "fiscal", "receita", "seguranca", "transporte"}
AREAS_FNS = {"fns"}


# "sao_bernardo" (curado, /sao-bernardo) e alias intencional de
# "sao_bernardo_do_campo" (coleta bruta) — ver CLAUDE.md. Sem este alias,
# o slug "sao_bernardo" cairia no lookup do manifesto IBGE nacional e
# bateria com o município real "São Bernardo/MA" (2110609), gerando falso
# positivo neste gate.
ALIASES = {"sao_bernardo": "sao_bernardo_do_campo"}


def carregar_ibge_esperado() -> dict[str, str]:
    """slug -> ibge (7 digitos), combinando paths.py + manifesto sprint2 (chave canonica)."""
    esperado: dict[str, str] = {}
    for slug, cfg in MUNICIPIOS.items():
        esperado[slug] = cfg["ibge"]
    for alias, alvo in ALIASES.items():
        if alvo in esperado:
            esperado[alias] = esperado[alvo]

    if IBGE_CSV.exists():
        with IBGE_CSV.open(encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        dup = duplicate_keys(rows)
        for row in rows:
            slug = municipio_storage_key(row, dup)
            ibge = (row.get("ibge") or row.get("codigo_ibge") or "").strip()
            if slug and ibge and slug not in esperado:
                esperado[slug] = ibge
    return esperado


def extrair_ibge_siconfi(csv_path: Path) -> set[str]:
    achados: set[str] = set()
    with csv_path.open(encoding="utf-8", errors="replace") as f:
        for linha in f:
            m = ID_ENTE_RE.search(linha)
            if m:
                achados.add(m.group(1))
    return achados


def extrair_ibge_fns(csv_path: Path) -> set[str]:
    achados: set[str] = set()
    with csv_path.open(encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        col = None
        for row in reader:
            if col is None:
                for k in row:
                    if k and k.strip().upper() == "CO_MUNICIPIO_IBGE":
                        col = k
                        break
                if col is None:
                    return achados
            val = (row.get(col) or "").strip()
            if val:
                achados.add(val)
    return achados


def main() -> int:
    parser = argparse.ArgumentParser(description="Gate: IBGE no conteudo bate com o slug publicado.")
    parser.add_argument("--municipio", help="Limitar a um slug")
    parser.add_argument("--strict", action="store_true", help="Exit 1 se achar mismatch")
    args = parser.parse_args()

    esperado = carregar_ibge_esperado()
    problemas: list[str] = []
    verificados = 0

    slugs = [args.municipio] if args.municipio else sorted(
        d.name for d in PUBLIC_DIR.iterdir() if d.is_dir()
    )

    for slug in slugs:
        ibge_esperado = esperado.get(slug)
        if not ibge_esperado:
            continue  # sem baseline conhecido — nao da pra validar, nao e erro
        ibge_esperado6 = ibge_esperado[:6]

        municipio_dir = PUBLIC_DIR / slug
        if not municipio_dir.is_dir():
            continue

        for area_dir in municipio_dir.iterdir():
            if not area_dir.is_dir():
                continue
            area = area_dir.name
            saida = area_dir / "saida"
            if not saida.is_dir():
                continue

            if area in AREAS_SICONFI:
                for csv_path in saida.glob("*.csv"):
                    verificados += 1
                    achados = extrair_ibge_siconfi(csv_path)
                    ruins = {a for a in achados if a[:6] != ibge_esperado6}
                    if ruins:
                        problemas.append(
                            f"{slug}/{area}/{csv_path.name}: esperado IBGE {ibge_esperado} "
                            f"({slug}), achado {sorted(ruins)} no conteudo"
                        )
            elif area in AREAS_FNS:
                for csv_path in saida.glob("*.csv"):
                    verificados += 1
                    achados = extrair_ibge_fns(csv_path)
                    ruins = {a for a in achados if a[:6] != ibge_esperado6}
                    if ruins:
                        problemas.append(
                            f"{slug}/{area}/{csv_path.name}: esperado IBGE {ibge_esperado6} "
                            f"({slug}), achado {sorted(ruins)} no conteudo"
                        )

    print(f"Verificados: {verificados} arquivo(s), {len(slugs)} municipio(s) candidatos")
    if problemas:
        print(f"\n{len(problemas)} MISMATCH(ES) DE IBGE:")
        for p in problemas:
            print(f"  x {p}")
        if args.strict:
            return 1
    else:
        print("OK — nenhum mismatch de IBGE encontrado nas areas verificaveis.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
