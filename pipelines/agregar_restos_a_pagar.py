"""
Extrai e agrega o Livro Conta Corrente de Restos a Pagar por fornecedor.

Formato suportado: v2021 (linha de texto — 2025 em diante).
Formato NAO suportado: v2022 (layout rotacionado — 2021-2024); registra aviso.

Saida: data/validated/sorocaba/execucao/saida/restos_agregado_sorocaba_{ano}.csv

Campos de saida:
  ano, ano_restos, fornecedor_codigo, fornecedor_nome,
  classificacao_inicial, movimentos, credito_num, debito_num,
  saldo_final_num, primeira_data, ultima_data, fonte_arquivo
"""
import argparse
import csv
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).parent))
from paths import EXECUCAO_RAW_DIR, EXECUCAO_EXTRACTED_DIR, EXECUCAO_VALIDATED_DIR

# Pattern to fix nome/codigo when extractor parses restos header as:
#   fornecedor_nome = "SOME NOME     53247                     RESTOS A PAGAR -"
#   fornecedor_codigo = "2023"  (which is actually ano_restos)
_RESTOS_NOME_RE = re.compile(r"^(.+?)\s+(\d{3,6})\s{2,}RESTOS\s+A\s+PAGAR\s*-?\s*$")


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
    if any(kw in n for kw in ("IRMANDADE", "ASSOCIACAO", "ASSOC.", "INSTITUTO", "FUNDACAO")):
        return "entidade_sem_fins_lucrativos"
    if any(suf in n for suf in (" LTDA", " S/A", " S.A", " EIRELI", " ME", " EPP")):
        return "empresa_privada"
    return "a_classificar"


def corrigir_linha(row: dict) -> dict | None:
    """
    Corrige o campo fornecedor_nome e fornecedor_codigo que o extrator
    generico captura errado no formato de restos a pagar.
    Retorna None se a linha deve ser descartada (ex: cabecalho parasita).
    """
    nome_raw = row.get("fornecedor_nome", "")
    codigo_raw = row.get("fornecedor_codigo", "")

    m = _RESTOS_NOME_RE.match(nome_raw.strip())
    if m:
        row = dict(row)
        row["fornecedor_nome"] = m.group(1).strip()
        row["fornecedor_codigo"] = m.group(2).strip()
        row["ano_restos"] = codigo_raw.strip()  # o codigo original era o ano dos restos
    else:
        # O extrator pode ter capturado corretamente (nome sem o sufixo)
        row = dict(row)
        row.setdefault("ano_restos", "")

    return row


def _float(val: str) -> float:
    return float(val) if val else 0.0


def agregar(ano: int, csv_path: Path) -> list[dict]:
    agregados: dict[tuple[str, str], dict] = {}
    datas: defaultdict[tuple[str, str], list[str]] = defaultdict(list)

    with csv_path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            row = corrigir_linha(row)
            if row is None:
                continue

            chave = (row["fornecedor_codigo"], row["fornecedor_nome"])
            if chave not in agregados:
                agregados[chave] = {
                    "ano": ano,
                    "ano_restos": row.get("ano_restos", ""),
                    "fornecedor_codigo": row["fornecedor_codigo"],
                    "fornecedor_nome": row["fornecedor_nome"],
                    "classificacao_inicial": classificar_recebedor(row["fornecedor_nome"]),
                    "movimentos": 0,
                    "credito_num": 0.0,
                    "debito_num": 0.0,
                    "saldo_final_num": 0.0,
                    "fonte_arquivo": row.get("fonte_arquivo", ""),
                }

            item = agregados[chave]
            item["movimentos"] = int(item["movimentos"]) + 1
            item["credito_num"] = float(item["credito_num"]) + _float(row.get("credito_num", ""))
            item["debito_num"] = float(item["debito_num"]) + _float(row.get("debito_num", ""))
            item["saldo_final_num"] = _float(row.get("saldo_num", ""))
            if row.get("data"):
                datas[chave].append(row["data"])

    resultado = []
    for chave, item in agregados.items():
        ds = sorted(datas[chave])
        item["primeira_data"] = ds[0] if ds else ""
        item["ultima_data"] = ds[-1] if ds else ""
        resultado.append(item)

    return sorted(resultado, key=lambda r: float(r["debito_num"]), reverse=True)


CAMPOS_SAIDA = [
    "ano", "ano_restos", "fornecedor_codigo", "fornecedor_nome",
    "classificacao_inicial", "movimentos", "credito_num", "debito_num",
    "saldo_final_num", "primeira_data", "ultima_data", "fonte_arquivo",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Agrega restos a pagar por fornecedor")
    parser.add_argument("--ano", type=int, required=True)
    parser.add_argument("--publicar", action="store_true", help="Copia para data/public")
    args = parser.parse_args()

    ano = args.ano

    pdf_path = EXECUCAO_RAW_DIR / "livros_contabeis" / str(ano) / f"livro_conta_corrente_fornecedor_restos_{ano}.pdf"
    if not pdf_path.exists():
        print(f"ERRO: PDF nao encontrado: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    # Extracao via extrator unificado (suporta v2021 e v2022_rot)
    extracted = EXECUCAO_EXTRACTED_DIR / "saida" / f"conta_corrente_restos_sorocaba_{ano}.csv"
    EXECUCAO_EXTRACTED_DIR.joinpath("saida").mkdir(parents=True, exist_ok=True)

    extrator = Path(__file__).parent / "extrator_restos_a_pagar.py"
    print(f"Extraindo {pdf_path.name} ...")
    result = subprocess.run(
        [sys.executable, str(extrator), "--ano", str(ano),
         "--entrada", str(pdf_path), "--saida", str(extracted)],
        capture_output=True, text=True,
    )
    print(result.stdout.strip())
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(1)

    # Agregacao
    print(f"Agregando {extracted.name} ...")
    rows = agregar(ano, extracted)
    print(f"Recebedores agregados: {len(rows)}")

    # Salva validado
    saida_validated = EXECUCAO_VALIDATED_DIR / "saida" / f"restos_agregado_sorocaba_{ano}.csv"
    EXECUCAO_VALIDATED_DIR.joinpath("saida").mkdir(parents=True, exist_ok=True)
    with saida_validated.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS_SAIDA)
        w.writeheader()
        w.writerows(rows)
    print(f"Validado: {saida_validated}")

    if args.publicar:
        public_dir = ROOT / "data" / "public" / "sorocaba" / "restos" / "saida"
        public_dir.mkdir(parents=True, exist_ok=True)
        dest = public_dir / f"restos_agregado_sorocaba_{ano}.csv"
        import shutil
        shutil.copy2(saida_validated, dest)
        print(f"Publicado: {dest}")


if __name__ == "__main__":
    main()
