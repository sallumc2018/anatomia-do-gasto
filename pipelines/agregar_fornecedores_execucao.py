"""
Agrega o Livro Conta Corrente de Fornecedor por recebedor.

Entrada: data/extracted/sorocaba/execucao/saida/conta_corrente_fornecedor_sorocaba_{ano}.csv
Saida: data/validated/sorocaba/execucao/saida/fornecedores_agregado_sorocaba_{ano}.csv

Este arquivo validado ainda nao e publicacao. A copia para data/public exige
revisao explicita porque o livro mistura fornecedores privados, folha, fundos,
entidades publicas e movimentacoes internas.
"""
import argparse
import csv
from collections import defaultdict
from pathlib import Path

from paths import EXECUCAO_EXTRACTED_DIR, EXECUCAO_VALIDATED_DIR


def classificar_recebedor(nome: str) -> str:
    n = " ".join(nome.upper().split())

    if "FOLHA DE PAGAMENTO" in n:
        return "folha"
    if "PREFEITURA MUNICIPAL DE SOROCABA" in n:
        return "movimentacao_interna"
    if n.startswith("FUND.") or n.startswith("FUNDO ") or "FUNDO MUNICIPAL" in n:
        return "fundo_publico"
    if "FUND.SEG" in n or "FUNSERV" in n or "SEGURIDADE SOCIAL" in n:
        return "fundo_publico"
    if "CAMARA MUNICIPAL" in n or "ESTADO DE " in n or "SECRETARIA " in n:
        return "ente_publico"
    if "IRMANDADE" in n or "ASSOCIACAO" in n or "ASSOC." in n or "INSTITUTO" in n or "FUNDACAO" in n:
        return "entidade_sem_fins_lucrativos"
    if any(sufixo in n for sufixo in (" LTDA", " S/A", " S.A", " EIRELI", " ME", " EPP")):
        return "empresa_privada"
    return "a_classificar"


def carregar_float(row: dict[str, str], campo: str) -> float:
    valor = row.get(campo, "")
    return float(valor) if valor else 0.0


def agregar(ano: int, entrada: Path) -> list[dict[str, object]]:
    agregados: dict[tuple[str, str], dict[str, object]] = {}
    datas: defaultdict[tuple[str, str], list[str]] = defaultdict(list)

    with entrada.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            chave = (row["fornecedor_codigo"], row["fornecedor_nome"])
            if chave not in agregados:
                agregados[chave] = {
                    "ano": ano,
                    "fornecedor_codigo": row["fornecedor_codigo"],
                    "fornecedor_nome": row["fornecedor_nome"],
                    "classificacao_inicial": classificar_recebedor(row["fornecedor_nome"]),
                    "movimentos": 0,
                    "credito_num": 0.0,
                    "debito_num": 0.0,
                    "saldo_final_num": 0.0,
                    "fonte_arquivo": row["fonte_arquivo"],
                }

            item = agregados[chave]
            item["movimentos"] = int(item["movimentos"]) + 1
            item["credito_num"] = float(item["credito_num"]) + carregar_float(row, "credito_num")
            item["debito_num"] = float(item["debito_num"]) + carregar_float(row, "debito_num")
            item["saldo_final_num"] = carregar_float(row, "saldo_num")
            if row.get("data"):
                datas[chave].append(row["data"])

    saida = []
    for chave, item in agregados.items():
        item_datas = sorted(datas[chave])
        item["primeira_data"] = item_datas[0] if item_datas else ""
        item["ultima_data"] = item_datas[-1] if item_datas else ""
        saida.append(item)

    return sorted(saida, key=lambda r: float(r["debito_num"]), reverse=True)


def escrever_csv(registros: list[dict[str, object]], destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    campos = [
        "ano",
        "fornecedor_codigo",
        "fornecedor_nome",
        "classificacao_inicial",
        "movimentos",
        "credito_num",
        "debito_num",
        "saldo_final_num",
        "primeira_data",
        "ultima_data",
        "fonte_arquivo",
    ]
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        for row in registros:
            writer.writerow(row)


def main() -> None:
    parser = argparse.ArgumentParser(description="Agrega fornecedores da execucao financeira")
    parser.add_argument("--ano", type=int, action="append", required=True)
    args = parser.parse_args()

    for ano in sorted(set(args.ano)):
        entrada = EXECUCAO_EXTRACTED_DIR / "saida" / f"conta_corrente_fornecedor_sorocaba_{ano}.csv"
        destino = EXECUCAO_VALIDATED_DIR / "saida" / f"fornecedores_agregado_sorocaba_{ano}.csv"
        registros = agregar(ano, entrada)
        escrever_csv(registros, destino)
        print(f"{ano}: {len(registros)} recebedores agregados")
        print(f"Saida: {destino}")


if __name__ == "__main__":
    main()
