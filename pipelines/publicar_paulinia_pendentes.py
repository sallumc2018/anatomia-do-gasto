"""
Publica os dados pendentes de Paulínia: SMARAPD fornecedores, Câmara empenhos/pagamentos/receita
e catálogo LOA/PPA/LDO.

Uso:
    .venv/bin/python3 pipelines/publicar_paulinia_pendentes.py
    .venv/bin/python3 pipelines/publicar_paulinia_pendentes.py --grupos fornecedores camara
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / "data" / "extracted" / "paulinia"
RAW = ROOT / "data" / "raw" / "paulinia"
PUBLIC = ROOT / "data" / "public" / "paulinia"

# ─── Grupo 1: SMARAPD fornecedores ───────────────────────────────────────────

FORNECEDORES_SRC = EXTRACTED / "smarapd" / "smarapd_fornecedores_paulinia.csv"
FORNECEDORES_DST = PUBLIC / "despesa" / "saida"
FORNECEDORES_RENAME = {
    "NomeFornecedor": "nome_fornecedor",
    "CPFCNPJ": "cpf_cnpj",
    "NumeroDocumento": "numero_documento",
    "NroEmpAno": "nro_empenho_ano",
    "NroLiquidacaoAno": "nro_liquidacao_ano",
    "ValorBruto": "valor_bruto",
    "ValorDescontos": "valor_descontos",
    "ValorLiquido": "valor_liquido",
    "PrevisaoPagamento": "previsao_pagamento",
    "DataPagamento": "data_pagamento",
    "Exercicio": "ano",
    "Municipio": "municipio",
}


def publicar_fornecedores() -> None:
    if not FORNECEDORES_SRC.exists():
        print(f"ERRO: {FORNECEDORES_SRC} não encontrado", file=sys.stderr)
        return
    FORNECEDORES_DST.mkdir(parents=True, exist_ok=True)

    print("\n=== Grupo 1: SMARAPD fornecedores ===")
    buckets: dict[str, list[dict]] = {}
    with FORNECEDORES_SRC.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            ano = row["Exercicio"]
            normalized = {FORNECEDORES_RENAME.get(k, k.lower()): v for k, v in row.items()}
            normalized["fonte"] = "SMARAPD Prefeitura de Paulínia"
            buckets.setdefault(ano, []).append(normalized)

    campos = list(FORNECEDORES_RENAME.values()) + ["fonte"]
    for ano, rows in sorted(buckets.items()):
        dest = FORNECEDORES_DST / f"empenhos_fornecedores_paulinia_{ano}.csv"
        with dest.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)
        print(f"  {ano}: {len(rows):>7} linhas → {dest.name}")


# ─── Grupo 2: Câmara ─────────────────────────────────────────────────────────

CAMARA_SRC = EXTRACTED / "camara"
CAMARA_DST = PUBLIC / "camara" / "saida"

_CAMARA_FILES = [
    (
        "camara_empenhos_paulinia.csv",
        "camara_empenhos_paulinia_{ano}.csv",
        {
            "DataMovEmp": "data_empenho",
            "NroEmpenho": "nro_empenho",
            "TipEmpenho": "tipo_empenho",
            "CNPJ": "cnpj",
            "NomeFornecedor": "nome_fornecedor",
            "ValorEmpenhado": "valor_empenhado",
            "Exercicio": "ano",
            "Municipio": "municipio",
            "Entidade": "entidade",
        },
    ),
    (
        "camara_empenhos_pagos_paulinia.csv",
        "camara_pagamentos_paulinia_{ano}.csv",
        {
            "DataMovEmp": "data_pagamento",
            "NroEmpenho": "nro_empenho",
            "TipEmpenho": "tipo_empenho",
            "NomeFornecedor": "nome_fornecedor",
            "CNPJ": "cnpj",
            "ValorPago": "valor_pago",
            "Exercicio": "ano",
            "Municipio": "municipio",
            "Entidade": "entidade",
        },
    ),
    (
        "camara_receita_analitica_paulinia.csv",
        "camara_receita_paulinia_{ano}.csv",
        {
            "UnidadeGestora": "unidade_gestora",
            "NaturezaReceita": "natureza_receita",
            "ContaContabil": "conta_contabil",
            "DescricaoReceita": "descricao_receita",
            "DataMovto": "data_movimentacao",
            "Operacao": "operacao",
            "Valor": "valor",
            "NomeBanco": "nome_banco",
            "ID": "id",
            "Exercicio": "ano",
            "Municipio": "municipio",
            "Entidade": "entidade",
        },
    ),
]


def publicar_camara() -> None:
    CAMARA_DST.mkdir(parents=True, exist_ok=True)
    print("\n=== Grupo 2: Câmara Municipal de Paulínia ===")

    for src_name, dst_pattern, rename in _CAMARA_FILES:
        src = CAMARA_SRC / src_name
        if not src.exists():
            print(f"  AVISO: {src_name} não encontrado", file=sys.stderr)
            continue

        buckets: dict[str, list[dict]] = {}
        with src.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                ano = row["Exercicio"]
                normalized = {rename.get(k, k.lower()): v for k, v in row.items()}
                normalized["fonte"] = "SMARAPD Câmara de Paulínia"
                buckets.setdefault(ano, []).append(normalized)

        campos = list(rename.values()) + ["fonte"]
        for ano, rows in sorted(buckets.items()):
            dest = CAMARA_DST / dst_pattern.format(ano=ano)
            with dest.open("w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
                w.writeheader()
                w.writerows(rows)
            print(f"  {src_name.split('_')[1]} {ano}: {len(rows):>5} linhas → {dest.name}")


# ─── Grupo 3: Catálogo LOA/PPA/LDO ───────────────────────────────────────────

CATALOGO_SRC = RAW / "smarapd" / "catalogo_pecas_planejamento.csv"
CATALOGO_DST = PUBLIC / "orcamento" / "pecas_planejamento" / "saida"


def publicar_catalogo() -> None:
    if not CATALOGO_SRC.exists():
        print(f"ERRO: {CATALOGO_SRC} não encontrado", file=sys.stderr)
        return
    CATALOGO_DST.mkdir(parents=True, exist_ok=True)

    print("\n=== Grupo 3: Catálogo LOA/PPA/LDO ===")
    rows: list[dict] = []
    with CATALOGO_SRC.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if not row.get("municipio"):
                row["municipio"] = "paulinia"
            # normalize keys to lowercase
            rows.append({k.lower(): v for k, v in row.items()})

    if not rows:
        print("  AVISO: nenhum registro no catálogo")
        return

    dest = CATALOGO_DST / "catalogo_pecas_planejamento_paulinia.csv"
    campos = list(rows[0].keys())
    with dest.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  {len(rows)} itens → {dest.name}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--grupos",
        nargs="+",
        choices=["fornecedores", "camara", "catalogo"],
        default=["fornecedores", "camara", "catalogo"],
    )
    args = parser.parse_args()

    if "fornecedores" in args.grupos:
        publicar_fornecedores()
    if "camara" in args.grupos:
        publicar_camara()
    if "catalogo" in args.grupos:
        publicar_catalogo()

    print("\nConcluído.")


if __name__ == "__main__":
    main()
