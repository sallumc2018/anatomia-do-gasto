"""
Verifica a consistencia inicial do rastro de execucao financeira.

Esta verificacao nao transforma dados em publicacao. Ela apenas confirma se os
CSVs extraidos dos livros oficiais se conectam por fornecedor e nota de empenho.
"""
import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import EXECUCAO_EXTRACTED_DIR, EXECUCAO_RAW_DIR, EXECUCAO_VALIDATED_DIR  # noqa: E402


def carregar_csv(path: Path):
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def verificar_ano(ano: int):
    raw_dir = EXECUCAO_RAW_DIR / "livros_contabeis" / str(ano)
    caminhos = (
        raw_dir / f"livro_conta_corrente_fornecedor_{ano}.pdf",
        raw_dir / f"livro_registro_analitico_despesa_orcamentaria_{ano}.pdf",
        EXECUCAO_EXTRACTED_DIR / "saida" / f"conta_corrente_fornecedor_sorocaba_{ano}.csv",
        EXECUCAO_EXTRACTED_DIR / "saida" / f"despesa_orcamentaria_sorocaba_{ano}.csv",
    )
    for path in caminhos:
        if not path.exists():
            raise FileNotFoundError(path)

    fornecedor = carregar_csv(caminhos[2])

    # Prefere o CSV validado (pos-saneamento) quando disponivel
    despesa_validada = EXECUCAO_VALIDATED_DIR / "saida" / f"despesa_orcamentaria_sorocaba_{ano}.csv"
    despesa_path = despesa_validada if despesa_validada.exists() else caminhos[3]
    despesa = carregar_csv(despesa_path)

    if not fornecedor:
        raise AssertionError(f"{caminhos[2]} sem registros")
    if not despesa:
        raise AssertionError(f"{caminhos[3]} sem registros")

    fornecedor_keys = {(r["fornecedor_codigo"], r["nota_empenho"]) for r in fornecedor}
    faltantes = [
        (r["fornecedor_codigo"], r["nota_empenho"])
        for r in despesa
        if (r["fornecedor_codigo"], r["nota_empenho"]) not in fornecedor_keys
    ]

    # unidade_orcamentaria omitida: ausente em alguns anos por formato do PDF
    campos_obrigatorios = (
        "orgao",
        "natureza_despesa",
        "programa_trabalho",
        "data",
        "nota_empenho",
        "fornecedor_nome",
        "fornecedor_codigo",
    )
    vazios = []
    for idx, row in enumerate(despesa, start=2):
        for campo in campos_obrigatorios:
            if not row.get(campo):
                vazios.append((idx, campo))
                break

    if faltantes:
        raise AssertionError(f"{len(faltantes)} linhas de despesa sem par no livro de fornecedor")
    if vazios:
        linha, campo = vazios[0]
        raise AssertionError(f"Campo obrigatorio vazio em {caminhos[3]}:{linha} ({campo})")

    print(f"{ano}: OK")
    print(f"  fornecedor: {len(fornecedor)} registros")
    print(f"  despesa: {len(despesa)} registros")
    print(f"  cobertura fornecedor+nota: {len(despesa)}/{len(despesa)}")


def main():
    parser = argparse.ArgumentParser(description="Verifica rastro de execucao financeira")
    parser.add_argument("--ano", type=int, action="append", required=True)
    args = parser.parse_args()

    for ano in sorted(set(args.ano)):
        verificar_ano(ano)


if __name__ == "__main__":
    main()
