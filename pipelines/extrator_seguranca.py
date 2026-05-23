"""
Extrai despesas de Segurança Pública de Sorocaba do SICONFI DCA-Anexo I-E.

Fonte: SICONFI/DCA Declaração de Contas Anuais, Anexo I-E
       (Demonstrativo das Despesas por Função e Subfunção — anual)
       Diferente de saúde/educação: NÃO usa PDFs do portal municipal.
       Frequência: anual (não quadrimestral). Sem mínimo constitucional.

Pipeline:
    data/raw/sorocaba/seguranca/entrada/{ano}_dca_siconfi.json  ← snapshot bruto
    data/extracted/sorocaba/seguranca/saida/despesas_seguranca_sorocaba_{ano}.csv

Colunas CSV (formato BR: separador de milhar ponto, decimal vírgula):
    Subfuncao, Empenhada, Liquidada, Paga,
    Restos_Nao_Processados, Restos_Processados, Fonte_URL

Uso:
    python extrator_seguranca.py           # 2020–2025
    python extrator_seguranca.py --ano 2024
    python extrator_seguranca.py --ano 2023 --ano 2024
"""
import argparse
import csv
import json
import locale
import os
import re
import sys
import urllib.request
from pathlib import Path
from paths import CFG, as_str, SEGURANCA_RAW_DIR, SEGURANCA_EXTRACTED_DIR

IBGE_SOROCABA = int(CFG["ibge"])
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca"
ANEXO = "DCA-Anexo I-E"

SUBFUNCOES_ORDEM = [
    "06 - Segurança Pública",
    "06.122 - Administração Geral",
    "06.181 - Policiamento",
    "06.182 - Defesa Civil",
    "06.183 - Informação e Inteligência",
]

COLUNAS_ALVO = {
    "despesas empenhadas":                              "empenhada",
    "despesas liquidadas":                              "liquidada",
    "despesas pagas":                                   "paga",
    "inscrição de restos a pagar não processados": "restos_nao_processados",
    "inscricao de restos a pagar nao processados":     "restos_nao_processados",
    "inscrição de restos a pagar processados": "restos_processados",
    "inscricao de restos a pagar processados":         "restos_processados",
}


def normalizar(s: str) -> str:
    return re.sub(r'\s+', ' ', s.strip()).lower()


def br_format(valor: float) -> str:
    """Formata número no padrão BR: separador de milhar ponto, decimal vírgula."""
    s = f"{valor:,.2f}"          # '1,234,567.89'
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")  # '1.234.567,89'
    return s


def fetch_dca(ano: int):
    url = f"{BASE_URL}?an_exercicio={ano}&id_ente={IBGE_SOROCABA}"
    print(f"  Baixando DCA {ano}...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw)
    print(f"  {len(data.get('items', []))} registros recebidos")
    return data, url


def salvar_raw(ano: int, data: dict) -> str:
    raw_dir = as_str(SEGURANCA_RAW_DIR / "entrada")
    os.makedirs(raw_dir, exist_ok=True)
    caminho = os.path.join(raw_dir, f"{ano}_dca_siconfi.json")
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return caminho


def extrair_seguranca(items: list, fonte_url: str) -> list:
    raw: dict[str, dict[str, float]] = {}

    for item in items:
        if item.get("anexo") != ANEXO:
            continue
        conta = item.get("conta", "").strip()
        coluna_norm = normalizar(item.get("coluna", ""))
        campo = COLUNAS_ALVO.get(coluna_norm)
        if campo is None:
            continue
        num = conta.split(" - ")[0].strip()
        if num != "06" and not num.startswith("06."):
            continue
        try:
            valor = float(str(item.get("valor") or 0).replace(",", "."))
        except (ValueError, TypeError):
            valor = 0.0
        raw.setdefault(conta, {})[campo] = valor

    resultado = []
    for subfuncao, valores in raw.items():
        resultado.append({
            "subfuncao":              subfuncao,
            "empenhada":              valores.get("empenhada", 0.0),
            "liquidada":              valores.get("liquidada", 0.0),
            "paga":                   valores.get("paga", 0.0),
            "restos_nao_processados": valores.get("restos_nao_processados", 0.0),
            "restos_processados":     valores.get("restos_processados", 0.0),
            "fonte_url":              fonte_url,
        })

    def sort_key(r):
        sf = r["subfuncao"]
        try:
            return SUBFUNCOES_ORDEM.index(sf)
        except ValueError:
            return len(SUBFUNCOES_ORDEM)

    return sorted(resultado, key=sort_key)


def salvar_csv(ano: int, linhas: list) -> str:
    saida_dir = as_str(SEGURANCA_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f"despesas_seguranca_sorocaba_{ano}.csv")
    campos = ["Subfuncao", "Empenhada", "Liquidada", "Paga",
              "Restos_Nao_Processados", "Restos_Processados", "Fonte_URL"]
    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        for r in linhas:
            writer.writerow({
                "Subfuncao":              r["subfuncao"],
                "Empenhada":              br_format(r["empenhada"]),
                "Liquidada":              br_format(r["liquidada"]),
                "Paga":                   br_format(r["paga"]),
                "Restos_Nao_Processados": br_format(r["restos_nao_processados"]),
                "Restos_Processados":     br_format(r["restos_processados"]),
                "Fonte_URL":              r["fonte_url"],
            })
    return caminho


def processar_ano(ano: int) -> bool:
    print(f"\nProcessando {ano}...")
    try:
        data, fonte_url = fetch_dca(ano)
    except Exception as e:
        print(f"  ERRO ao baixar dados: {e}")
        return False

    raw_path = salvar_raw(ano, data)
    print(f"  Snapshot JSON salvo: {raw_path}")

    linhas = extrair_seguranca(data.get("items", []), fonte_url)
    if not linhas:
        print(f"  ATENCAO: nenhum dado de seguranca encontrado para {ano}")
        return False

    caminho = salvar_csv(ano, linhas)
    total = next((r for r in linhas if r["subfuncao"].startswith("06 -")), None)
    if total:
        print(f"  Total pago: R$ {br_format(total['paga'])}")

    print(f"  {len(linhas)} subfuncoes -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Extrai despesas de Segurança Pública do SICONFI DCA")
    parser.add_argument("--ano", type=int, action="append",
                        help="Ano a processar (padrão: 2020–2025)")
    args = parser.parse_args()

    anos = args.ano if args.ano else list(range(2020, 2026))

    ok = err = 0
    for ano in anos:
        if processar_ano(ano):
            ok += 1
        else:
            err += 1

    print(f"\n{'='*40}")
    print(f"Concluido: {ok} OK, {err} com erro")
    sys.exit(1 if err else 0)


if __name__ == "__main__":
    main()
