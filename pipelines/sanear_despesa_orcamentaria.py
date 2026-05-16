"""
Saneia divergencias entre despesa orcamentaria e conta corrente de fornecedor.

Entrada: CSV extraido mecanicamente em data/extracted.
Saida: CSV validado localmente em data/validated.

O script so corrige identificadores quando ha correspondencia unica no livro de
fornecedores. Nenhum dado e publicado por este script.
"""
import argparse
import csv
from collections import defaultdict
from pathlib import Path

from paths import EXECUCAO_EXTRACTED_DIR, EXECUCAO_VALIDATED_DIR


def apenas_digitos(valor: str) -> str:
    return "".join(ch for ch in (valor or "") if ch.isdigit())


def normalizar_doc(valor: str) -> str:
    digitos = apenas_digitos(valor)
    if not digitos:
        return ""
    return digitos[-5:].zfill(5)


def carregar_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def candidatos_unicos(candidatos: list[dict[str, str]]) -> dict[str, str] | None:
    pares = {(row["fornecedor_codigo"], row["fornecedor_nome"]) for row in candidatos}
    if len(pares) != 1:
        return None
    codigo, nome = next(iter(pares))
    return {"fornecedor_codigo": codigo, "fornecedor_nome": nome}


def sanear(ano: int) -> tuple[list[dict[str, str]], dict[str, int]]:
    despesa_path = (
        EXECUCAO_EXTRACTED_DIR / "saida" / f"despesa_orcamentaria_sorocaba_{ano}.csv"
    )
    fornecedor_path = (
        EXECUCAO_EXTRACTED_DIR / "saida" / f"conta_corrente_fornecedor_sorocaba_{ano}.csv"
    )
    despesa = carregar_csv(despesa_path)
    fornecedor = carregar_csv(fornecedor_path)

    fornecedor_keys = {(row["fornecedor_codigo"], row["nota_empenho"]) for row in fornecedor}
    by_note: dict[str, list[dict[str, str]]] = defaultdict(list)
    by_note_doc: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)

    for row in fornecedor:
        nota = apenas_digitos(row["nota_empenho"])
        doc = normalizar_doc(row["processo_doc_despesa"])
        by_note[nota].append(row)
        if doc:
            by_note_doc[(nota, doc)].append(row)

    stats = {
        "registros": len(despesa),
        "ja_validos": 0,
        "corrigidos_por_nota_documento": 0,
        "corrigidos_por_nota": 0,
        "nao_saneados": 0,
    }

    saneados = []
    for row in despesa:
        row = dict(row)
        original = {
            "nota_empenho_original": row.get("nota_empenho", ""),
            "fornecedor_codigo_original": row.get("fornecedor_codigo", ""),
            "fornecedor_nome_original": row.get("fornecedor_nome", ""),
        }
        row["nota_empenho"] = apenas_digitos(row.get("nota_empenho", ""))
        row["documento_despesa"] = apenas_digitos(row.get("documento_despesa", ""))
        row["fornecedor_codigo"] = apenas_digitos(row.get("fornecedor_codigo", ""))

        metodo = ""
        if (row["fornecedor_codigo"], row["nota_empenho"]) in fornecedor_keys:
            stats["ja_validos"] += 1
        else:
            candidato = candidatos_unicos(
                by_note_doc.get((row["nota_empenho"], normalizar_doc(row["documento_despesa"])), [])
            )
            if candidato:
                row.update(candidato)
                metodo = "fornecedor_unico_por_nota_documento"
                stats["corrigidos_por_nota_documento"] += 1
            else:
                candidato = candidatos_unicos(by_note.get(row["nota_empenho"], []))
                if candidato:
                    row.update(candidato)
                    metodo = "fornecedor_unico_por_nota"
                    stats["corrigidos_por_nota"] += 1
                else:
                    stats["nao_saneados"] += 1

        row["saneamento_metodo"] = metodo
        row.update(original)
        saneados.append(row)

    return saneados, stats


def escrever_csv(rows: list[dict[str, str]], destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    campos = list(rows[0].keys()) if rows else []
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Saneia despesa orcamentaria extraida")
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--saida")
    args = parser.parse_args()

    rows, stats = sanear(args.ano)
    destino = Path(args.saida) if args.saida else (
        EXECUCAO_VALIDATED_DIR / "saida" / f"despesa_orcamentaria_sorocaba_{args.ano}.csv"
    )
    escrever_csv(rows, destino)

    for chave, valor in stats.items():
        print(f"{chave}: {valor}")
    print(f"Saida: {destino}")


if __name__ == "__main__":
    main()
