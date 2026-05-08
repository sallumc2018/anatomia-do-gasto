"""
Verifica integridade dos arquivos publicados em data/public.

Le data/manifests/datasets.csv e confirma que cada arquivo esperado
existe em data/public, tem pelo menos 2 linhas (header + dados) e
nao esta vazio.

Uso:
    python pipelines/testes/verificar_publicacao.py
    python pipelines/testes/verificar_publicacao.py --strict   # sai com 1 se houver erro
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "data" / "manifests" / "datasets.csv"
PUBLIC = ROOT / "data" / "public" / "sorocaba"


def verificar() -> list[str]:
    erros: list[str] = []

    if not MANIFEST.exists():
        erros.append(f"Manifesto nao encontrado: {MANIFEST}")
        return erros

    with open(MANIFEST, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            area = row["Area"]
            padrao = row["Arquivo_Padrao"]
            anos_str = row["Anos"]  # e.g. "2020-2025"
            origem = row.get("Origem_Dir", "public")
            if origem != "public":
                continue  # nao verificamos extracted/validated aqui

            try:
                inicio, fim = (int(x) for x in anos_str.split("-"))
                anos = range(inicio, fim + 1)
            except ValueError:
                erros.append(f"Anos invalidos em {area}/{padrao}: {anos_str}")
                continue

            for ano in anos:
                nome = padrao.replace("{ano}", str(ano))
                caminho = PUBLIC / area / "saida" / nome
                if not caminho.exists():
                    erros.append(f"AUSENTE: {caminho.relative_to(ROOT)}")
                    continue
                linhas = caminho.read_text(encoding="utf-8-sig").strip().splitlines()
                if len(linhas) < 2:
                    erros.append(f"VAZIO/INCOMPLETO: {caminho.relative_to(ROOT)} ({len(linhas)} linhas)")

    return erros


def main() -> None:
    parser = argparse.ArgumentParser(description="Verifica arquivos publicados em data/public.")
    parser.add_argument("--strict", action="store_true", help="Sai com 1 se houver erros")
    args = parser.parse_args()

    erros = verificar()

    if erros:
        print(f"\n{len(erros)} problema(s) encontrado(s):")
        for e in erros:
            print(f"  {e}")
        if args.strict:
            sys.exit(1)
    else:
        print("OK: todos os arquivos publicados estao presentes e nao vazios.")


if __name__ == "__main__":
    main()
