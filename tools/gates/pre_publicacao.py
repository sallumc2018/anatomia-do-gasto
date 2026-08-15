#!/usr/bin/env python3
"""
Gate de publicação: valida arquivos antes de promover data/extracted → data/public.

Uso:
    python3 tools/gates/pre_publicacao.py                  # valida todo data/public
    python3 tools/gates/pre_publicacao.py paulinia/despesa # valida subdiretório
    python3 tools/gates/pre_publicacao.py --strict          # modo bloqueante
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_PUBLIC = ROOT / "data" / "public"
MANIFESTS   = ROOT / "data" / "manifests"

# Filenames that signal test/mock/temp data — must never be in data/public
FORBIDDEN_PREFIXES = ("test_", "mock_", "dummy_", "tmp_", "temp_", "debug_")
FORBIDDEN_SUFFIXES = ("_test.csv", "_mock.csv", "_tmp.csv", "_old.csv", "_bak.csv")

# Minimum row count for any published CSV (single-row = likely a placeholder)
MIN_ROWS = 2

# Schema contracts: {filename_pattern: [conjunto_alternativo_1, conjunto_2, ...]}
#
# POR QUE SAO ALTERNATIVAS, e nao uma lista unica.
# O mesmo nome de arquivo e produzido por dois pipelines com esquemas
# diferentes, e ambos estao corretos:
#
#   Sprint 1 / curado (Sorocaba, Paulinia): normaliza para nomes proprios do
#     projeto — municipio, orgao_remetente, valor_bruto.
#   Sprint 2 / nacional: preserva os nomes da API do Portal da Transparencia —
#     municipio_ibge, municipio_nome, valor_transferido, fonte_api.
#
# O contrato tinha so o primeiro. Medido em 15/08/2026: 3.494 arquivos de
# data/public reprovavam por "colunas obrigatorias ausentes", todos do Sprint 2,
# todos com dado integro. Era o gate que nao conhecia o esquema nacional — e o
# esquema nacional inclusive carrega MAIS proveniencia (fonte_api e o codigo
# IBGE, que provam a origem linha a linha).
#
# Basta satisfazer UM dos conjuntos. Assim o gate continua barrando arquivo
# sem identificacao de municipio ou sem valor, que e o que ele existe para
# barrar, sem exigir que os dois pipelines convirjam de nome.
SCHEMA_CONTRACTS: dict[str, list[list[str]]] = {
    r"empenhos_fornecedores_.*\.csv":   [["ano", "nr_empenho", "nm_fornecedor", "vl_despesa"]],
    r"transferencias_federais_.*\.csv": [
        ["ano", "municipio", "orgao_remetente", "valor_bruto"],
        ["ano", "municipio_ibge", "valor_transferido"],
    ],
    r"transferencias_para_.*\.csv":     [["ano", "municipio", "fonte", "valor_bruto"]],
    # SICONFI (receita e despesa por funcao): o esquema real NAO tem coluna de
    # ano nem de municipio, no Sprint 2 e no curado — sao identicos, conferidos
    # lado a lado em 15/08/2026 (Zortea x Sorocaba, 2024). O contrato antigo
    # pedia ["ano", "municipio"] e nunca correspondeu ao que a fonte devolve.
    #
    # O que identifica o municipio e o ano nestes arquivos e a Fonte_URL, que
    # carrega id_ente=<IBGE> e o exercicio. E o mesmo criterio que
    # pipelines/sprint2_contracts.py ja adota (_SICONFI_MUNICIPIO = ("fonte_url",)):
    # o dado prova a si mesmo pela URL de origem. Exigir Fonte_URL e mais forte
    # do que exigir uma coluna de nome, porque a URL e verificavel contra a API.
    r"receitas_.*\.csv":                [["Categoria", "Fonte_URL"], ["ano", "municipio"]],
    r"despesas_executivo_.*\.csv":      [["Funcao", "Fonte_URL"], ["ano", "municipio"]],
    r"camara_empenhos_.*\.csv":         [["ano", "nr_empenho"]],
    r"camara_pagamentos_.*\.csv":       [["ano", "nr_empenho"]],
}


def check_file(path: Path, strict: bool) -> list[str]:
    issues: list[str] = []
    rel = path.relative_to(DATA_PUBLIC)

    # 1. Forbidden name patterns (test/mock data)
    name = path.name.lower()
    if any(name.startswith(p) for p in FORBIDDEN_PREFIXES):
        issues.append(f"ERRO  [{rel}] nome sugere dado de teste/mock (prefixo proibido)")
    if any(name.endswith(s) for s in FORBIDDEN_SUFFIXES):
        issues.append(f"ERRO  [{rel}] nome sugere dado de teste/mock (sufixo proibido)")

    # 2. Non-CSV non-JSON in saida/ should not exist
    if "saida" in path.parts and path.suffix not in (".csv", ".json", ".txt"):
        issues.append(f"AVISO [{rel}] extensão inesperada em saida/: {path.suffix}")

    if path.suffix != ".csv":
        return issues

    # 3. Read and validate CSV
    try:
        # utf-8-sig, nao utf-8: os CSVs do SICONFI vem com BOM (conferido em
        # 15/08/2026 — os primeiros bytes sao EF BB BF). Com "utf-8" o BOM entra
        # no NOME da primeira coluna, que vira '﻿Funcao' em vez de 'Funcao',
        # e qualquer contrato que exija a primeira coluna reprova o arquivo
        # inteiro. Foram 9.638 erros falsos ate isto ser corrigido.
        # utf-8-sig le corretamente arquivo com e sem BOM, entao nao ha perda.
        with open(path, encoding="utf-8-sig", errors="replace") as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            rows = list(reader)
    except Exception as e:
        issues.append(f"ERRO  [{rel}] falha ao ler CSV: {e}")
        return issues

    # 4. Minimum row count
    if len(rows) < MIN_ROWS:
        issues.append(f"AVISO [{rel}] apenas {len(rows)} linha(s) — possível placeholder")

    # 5. Schema contracts
    for pattern, alternativas in SCHEMA_CONTRACTS.items():
        if re.search(pattern, path.name):
            faltantes_por_alt = [
                [c for c in conjunto if c not in headers] for conjunto in alternativas
            ]
            # Passa se QUALQUER conjunto alternativo estiver completo.
            if not any(not faltantes for faltantes in faltantes_por_alt):
                # Reporta o conjunto que chegou mais perto: e o mais provavel de
                # ser o esquema pretendido, e a mensagem fica acionavel em vez de
                # despejar todas as alternativas.
                melhor = min(faltantes_por_alt, key=len)
                issues.append(f"ERRO  [{rel}] colunas obrigatórias ausentes: {melhor}")
            break

    # 6. No column named 'mock', 'ficticio', 'dummy'
    bad_cols = [h for h in headers if any(w in h.lower() for w in ("mock", "ficticio", "dummy", "fake"))]
    if bad_cols:
        issues.append(f"ERRO  [{rel}] colunas suspeitas de dado fictício: {bad_cols}")

    # 7. Warn if 'municipio' column exists but has unexpected values
    if "municipio" in headers and rows:
        muns = {r.get("municipio", "").strip().lower() for r in rows[:20]}
        unknown = muns - {"sorocaba", "paulinia", "paulínia", ""}
        if unknown:
            issues.append(f"AVISO [{rel}] município(s) desconhecido(s): {unknown}")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Gate de publicação de dados")
    parser.add_argument("subdir", nargs="?", default="", help="Subdiretório dentro de data/public/")
    parser.add_argument("--strict", action="store_true", help="Sair com código 1 em qualquer aviso")
    args = parser.parse_args()

    scan_root = DATA_PUBLIC / args.subdir if args.subdir else DATA_PUBLIC
    if not scan_root.exists():
        print(f"❌  Diretório não encontrado: {scan_root}")
        return 1

    all_issues: list[str] = []
    files_checked = 0

    for path in sorted(scan_root.rglob("*.csv")):
        issues = check_file(path, args.strict)
        all_issues.extend(issues)
        files_checked += 1

    errors   = [i for i in all_issues if i.startswith("ERRO")]
    warnings = [i for i in all_issues if i.startswith("AVISO")]

    print(f"\n── Gate de Publicação {'(strict)' if args.strict else ''} ──────────────────────────────")
    print(f"   Arquivos verificados : {files_checked}")
    print(f"   Erros                : {len(errors)}")
    print(f"   Avisos               : {len(warnings)}")

    if all_issues:
        print()
        for issue in all_issues:
            print(f"   {issue}")

    print()
    if errors:
        print("❌  Gate BLOQUEADO — corrija os erros antes de publicar.")
        return 1
    elif warnings and args.strict:
        print("❌  Gate BLOQUEADO (modo strict) — corrija os avisos antes de publicar.")
        return 1
    elif warnings:
        print("⚠️   Gate passou com avisos — revise antes do próximo deploy.")
        return 0
    else:
        print("✅  Gate passou — dados prontos para publicação.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
