"""
Extrai despesas de Transporte (função 26) do SICONFI DCA Anexo I-E.

Fonte: SICONFI/DCA Demonstrativo das Contas Anuais, Anexo I-E
       (Total Geral da Despesa por Função)

Complementa o RREO Anexo 02 com a coluna Pago — que o RREO não fornece.
O DCA I-E não contém Dotação Inicial nem Atualizada (essas ficam no RREO).

Limitação — subfunção única:
    Sorocaba declara toda a função 26 em "FU26 - Demais Subfunções".
    Não é possível separar, a partir dos dados federais, o serviço de
    transporte público urbano de obras de infraestrutura viária.

Verificação de consistência com o RREO:
    DCA Empenhado deve coincidir com RREO EXCETO Empenhado.
    Divergência indica anomalia (ex: 2021 em segurança = EXCETO+INTRA).
    Este extrator imprime o delta para auditoria.

Pipeline:
    raw/transporte/entrada/{ano}_dca_ie_siconfi.json
    extracted/transporte/saida/dca_transporte_sorocaba_{ano}.csv

Publicação via publicar_dados.py (extracted -> public).

Colunas CSV (formato BR):
    Ano, Empenhado, Liquidado, Pago, RP_Nao_Processado, RP_Processado,
    Fonte_URL

Uso:
    python extrator_dca_transporte.py           # 2020-2025
    python extrator_dca_transporte.py --ano 2024
    python extrator_dca_transporte.py --use-raw
"""
import argparse
import csv
import json
import os
import sys
import urllib.request
from paths import CFG, MUNICIPIO, as_str, TRANSPORTE_RAW_DIR, TRANSPORTE_EXTRACTED_DIR

IBGE_SOROCABA = int(CFG["ibge"])
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca"
CONTA_TRANSPORTE = "26 - Transporte"

COLUNAS_ALVO = {
    "Despesas Empenhadas":                         "empenhado",
    "Despesas Liquidadas":                         "liquidado",
    "Despesas Pagas":                              "pago",
    "Inscrição de Restos a Pagar Não Processados": "rp_nao_processado",
    "Inscricao de Restos a Pagar Nao Processados": "rp_nao_processado",
    "Inscrição de Restos a Pagar Processados":     "rp_processado",
    "Inscricao de Restos a Pagar Processados":     "rp_processado",
}


def br_format(valor: float) -> str:
    s = f"{valor:,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return s


def _url_dca(ano: int) -> str:
    return (
        f"{BASE_URL}?an_exercicio={ano}"
        f"&no_anexo=DCA-Anexo%20I-E"
        f"&id_ente={IBGE_SOROCABA}"
    )


def fetch_dca(ano: int):
    url = _url_dca(ano)
    print(f"  Baixando DCA Anexo I-E de {ano}...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw)
    print(f"  {len(data.get('items', []))} registros recebidos")
    return data, url


def carregar_raw_local(ano: int):
    caminho = os.path.join(as_str(TRANSPORTE_RAW_DIR / "entrada"),
                           f"{ano}_dca_ie_siconfi.json")
    if not os.path.exists(caminho):
        raise FileNotFoundError(f"Snapshot nao encontrado: {caminho}")
    with open(caminho, encoding="utf-8") as f:
        data = json.load(f)
    print(f"  Usando snapshot local: {caminho}")
    return data, _url_dca(ano)


def salvar_raw(ano: int, data: dict) -> str:
    raw_dir = as_str(TRANSPORTE_RAW_DIR / "entrada")
    os.makedirs(raw_dir, exist_ok=True)
    caminho = os.path.join(raw_dir, f"{ano}_dca_ie_siconfi.json")
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return caminho


def parse_valor(item) -> float:
    try:
        return float(str(item.get("valor") or 0).replace(",", "."))
    except (ValueError, TypeError):
        return 0.0


def extrair_dca(items: list, fonte_url: str, ano: int) -> dict | None:
    resultado = {"ano": ano, "fonte_url": fonte_url}
    for item in items:
        conta = item.get("conta", "").strip()
        coluna = item.get("coluna", "").strip()
        # Normaliza inscrição (pode ter acento ou não)
        campo = COLUNAS_ALVO.get(coluna)
        if campo and conta == CONTA_TRANSPORTE:
            resultado[campo] = parse_valor(item)

    if "empenhado" not in resultado:
        print(f"  ATENCAO: '{CONTA_TRANSPORTE}' nao localizado no DCA {ano}")
        return None

    return resultado


def salvar_csv(resultado: dict) -> str:
    saida_dir = as_str(TRANSPORTE_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    ano = resultado["ano"]
    caminho = os.path.join(saida_dir, f"dca_transporte_{MUNICIPIO}_{ano}.csv")
    campos = [
        "Ano", "Empenhado", "Liquidado", "Pago",
        "RP_Nao_Processado", "RP_Processado", "Fonte_URL",
    ]
    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerow({
            "Ano":               resultado["ano"],
            "Empenhado":         br_format(resultado.get("empenhado", 0.0)),
            "Liquidado":         br_format(resultado.get("liquidado", 0.0)),
            "Pago":              br_format(resultado.get("pago", 0.0)),
            "RP_Nao_Processado": br_format(resultado.get("rp_nao_processado", 0.0)),
            "RP_Processado":     br_format(resultado.get("rp_processado", 0.0)),
            "Fonte_URL":         resultado["fonte_url"],
        })
    return caminho


def processar_ano(ano: int, rreo_empenhado: float | None = None,
                  use_raw: bool = False) -> bool:
    print(f"\nProcessando DCA {ano}...")
    try:
        if use_raw:
            data, fonte_url = carregar_raw_local(ano)
        else:
            data, fonte_url = fetch_dca(ano)
    except Exception as e:
        print(f"  ERRO ao carregar dados: {e}")
        return False

    if not use_raw:
        raw_path = salvar_raw(ano, data)
        print(f"  Snapshot JSON salvo: {raw_path}")

    resultado = extrair_dca(data.get("items", []), fonte_url, ano)
    if resultado is None:
        return False

    emp = resultado.get("empenhado", 0.0)
    liq = resultado.get("liquidado", 0.0)
    pago = resultado.get("pago", 0.0)

    print(f"  Empenhado:  R$ {br_format(emp)}")
    print(f"  Liquidado:  R$ {br_format(liq)}")
    print(f"  Pago:       R$ {br_format(pago)}")

    if rreo_empenhado is not None:
        delta = abs(emp - rreo_empenhado)
        pct_delta = (delta / rreo_empenhado * 100) if rreo_empenhado else 0
        flag = "  ⚠ DIVERGENCIA MATERIAL" if pct_delta > 1 else "  ✓ consistente com RREO"
        print(f"  Delta DCA-RREO: R$ {br_format(delta)} ({pct_delta:.2f}%){flag}")

    caminho = salvar_csv(resultado)
    print(f"  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Extrai despesas de Transporte do SICONFI DCA Anexo I-E"
    )
    parser.add_argument("--ano", type=int, action="append",
                        help="Ano a processar (padrao: 2020-2025)")
    parser.add_argument("--use-raw", action="store_true",
                        help="Usar snapshot JSON local em vez de baixar da API")
    args = parser.parse_args()

    anos = args.ano if args.ano else list(range(2020, 2026))

    ok = err = 0
    for ano in anos:
        if processar_ano(ano, use_raw=args.use_raw):
            ok += 1
        else:
            err += 1

    print(f"\n{'='*40}")
    print(f"Concluido: {ok} OK, {err} com erro")
    sys.exit(1 if err else 0)


if __name__ == "__main__":
    main()
