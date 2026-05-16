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
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "data" / "manifests" / "datasets.csv"
PUBLIC_ROOT = ROOT / "data" / "public"
PUBLIC_SOROCABA = PUBLIC_ROOT / "sorocaba"


def padrao_para_regex(padrao: str) -> re.Pattern[str]:
    escaped = re.escape(padrao).replace(r"\{ano\}", r"\d{4}")
    return re.compile(f"^{escaped}$")


def anos_do_manifesto(area: str, padrao: str, anos_str: str, erros: list[str]) -> range:
    try:
        inicio, fim = (int(x) for x in anos_str.split("-"))
        return range(inicio, fim + 1)
    except ValueError:
        erros.append(f"Anos invalidos em {area}/{padrao}: {anos_str}")
        return range(0)


def verificar() -> list[str]:
    erros: list[str] = []
    publicaveis: dict[str, list[re.Pattern[str]]] = {}
    nao_publicaveis: dict[str, list[tuple[re.Pattern[str], str]]] = {}

    if not MANIFEST.exists():
        erros.append(f"Manifesto nao encontrado: {MANIFEST}")
        return erros

    with open(MANIFEST, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            area = row["Area"].strip()
            padrao = row["Arquivo_Padrao"].strip()
            anos_str = row["Anos"].strip()  # e.g. "2020-2025"
            origem = (row.get("Origem_Dir") or "public").strip()
            if origem == "public_aux":
                caminho_aux = PUBLIC_ROOT / area / padrao
                if not caminho_aux.exists():
                    erros.append(f"AUXILIAR AUSENTE: {caminho_aux.relative_to(ROOT)}")
                elif not caminho_aux.read_text(encoding="utf-8-sig").strip():
                    erros.append(f"AUXILIAR VAZIO: {caminho_aux.relative_to(ROOT)}")
                continue
            if origem != "public":
                nao_publicaveis.setdefault(area, []).append((padrao_para_regex(padrao), origem))
                anos = anos_do_manifesto(area, padrao, anos_str, erros)
                for ano in anos:
                    nome = padrao.replace("{ano}", str(ano))
                    caminho = PUBLIC_SOROCABA / area / "saida" / nome
                    if caminho.exists():
                        erros.append(
                            f"NAO PUBLICAVEL EM data/public: {caminho.relative_to(ROOT)} "
                            f"(Origem_Dir={origem})"
                        )
                continue  # nao verificamos extracted/validated aqui

            publicaveis.setdefault(area, []).append(padrao_para_regex(padrao))
            anos = anos_do_manifesto(area, padrao, anos_str, erros)

            for ano in anos:
                nome = padrao.replace("{ano}", str(ano))
                caminho = PUBLIC_SOROCABA / area / "saida" / nome
                if not caminho.exists():
                    erros.append(f"AUSENTE: {caminho.relative_to(ROOT)}")
                    continue
                linhas = caminho.read_text(encoding="utf-8-sig").strip().splitlines()
                if len(linhas) < 2:
                    erros.append(f"VAZIO/INCOMPLETO: {caminho.relative_to(ROOT)} ({len(linhas)} linhas)")

    for caminho in sorted(PUBLIC_SOROCABA.rglob("*.csv")):
        partes = caminho.relative_to(PUBLIC_SOROCABA).parts
        if len(partes) < 3 or partes[1] != "saida":
            erros.append(f"PUBLICACAO FORA DO PADRAO: {caminho.relative_to(ROOT)}")
            continue

        area = partes[0]
        nome = caminho.name
        if any(regex.match(nome) for regex in publicaveis.get(area, [])):
            continue

        for regex, origem in nao_publicaveis.get(area, []):
            if regex.match(nome):
                erros.append(
                    f"NAO PUBLICAVEL EM data/public: {caminho.relative_to(ROOT)} "
                    f"(Origem_Dir={origem})"
                )
                break
        else:
            erros.append(f"SEM PADRAO NO MANIFESTO: {caminho.relative_to(ROOT)}")

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
