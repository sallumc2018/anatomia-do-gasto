"""
Extrai orçamento de Segurança Pública de Sorocaba do SICONFI RREO-Anexo 02.

Fonte: SICONFI/RREO Relatório Resumido da Execução Orçamentária, Anexo 02
       Bimestre 6 (acumulado anual, o mais completo de cada exercício)
       Complementa o DCA: fornece Dotação Inicial, Dotação Atualizada e
       percentual sobre o orçamento municipal total.

Metodologia — discriminação EXCETO INTRA vs INTRA:
    O RREO Anexo 02 apresenta "Segurança Pública" em duas seções:
      (I)  DESPESAS (EXCETO INTRA-ORÇAMENTÁRIAS) — despesas regulares
      (II) DESPESAS (INTRA-ORÇAMENTÁRIAS) — transferências entre unidades
    O JSON da API alterna seção por coluna: para cada campo (DOTAÇÃO INICIAL,
    DOTAÇÃO ATUALIZADA, etc.) surgem primeiro os itens EXCETO INTRA, depois
    os INTRA. Usamos um marcador de seção para discriminar os dois grupos
    corretamente — sem heurístico de MAX que falha quando INTRA > EXCETO.

    O campo Empenhado deste CSV é o valor EXCETO INTRA.
    O campo Intra_Empenhado é o componente INTRA — dado de auditoria.

    Relação com o DCA Anexo I-E (fonte primária de despesa):
      2020, 2022–2025: DCA Empenhada = RREO EXCETO (padrão esperado)
      2021: DCA Empenhada = RREO EXCETO + INTRA (comportamento atípico —
            a prefeitura consolidou as duas seções na declaração daquele ano)
    A taxa de execução usa RREO EXCETO como numerador em todos os anos
    (internamente consistente com a dotação EXCETO).

Pipeline:
    data/raw/sorocaba/seguranca/entrada/{ano}_rreo_anexo02_b6_siconfi.json
    data/extracted/sorocaba/seguranca/saida/rreo_seguranca_sorocaba_{ano}.csv

Publicação via publicar_dados.py (extracted -> public).

Colunas CSV (formato BR: separador de milhar ponto, decimal vírgula):
    Ano, Dotacao_Inicial, Dotacao_Atualizada, Empenhado, Intra_Empenhado,
    Liquidado, Intra_Liquidado, Pct_Orcamento, Total_Municipal_Empenhado,
    Fonte_URL

Uso:
    python extrator_rreo_seguranca.py           # 2020-2025
    python extrator_rreo_seguranca.py --ano 2024
    python extrator_rreo_seguranca.py --ano 2023 --ano 2024
"""
import argparse
import csv
import json
import os
import re
import sys
import urllib.request
from paths import CFG, MUNICIPIO, as_str, SEGURANCA_RAW_DIR, SEGURANCA_EXTRACTED_DIR

IBGE_SOROCABA = int(CFG["ibge"])
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"
BIMESTRE = 6

CONTA_SEGURANCA = "Segurança Pública"
SECAO_EXCETO = "DESPESAS (EXCETO INTRA-ORÇAMENTÁRIAS) (I)"
SECAO_INTRA = "DESPESAS (INTRA-ORÇAMENTÁRIAS) (II)"

COLUNAS_ALVO = {
    "dotação inicial":                        "dotacao_inicial",
    "dotacao inicial":                        "dotacao_inicial",
    "dotação atualizada (a)":                 "dotacao_atualizada",
    "dotacao atualizada (a)":                 "dotacao_atualizada",
    "despesas empenhadas até o bimestre (b)": "empenhado",
    "despesas empenhadas ate o bimestre (b)": "empenhado",
    "despesas liquidadas até o bimestre (d)": "liquidado",
    "despesas liquidadas ate o bimestre (d)": "liquidado",
}


def normalizar(s: str) -> str:
    return re.sub(r'\s+', ' ', s.strip()).lower()


def br_format(valor: float) -> str:
    s = f"{valor:,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return s


def _url_rreo(ano: int) -> str:
    params = (
        f"an_exercicio={ano}"
        f"&nr_periodo={BIMESTRE}"
        f"&co_tipo_demonstrativo=RREO"
        f"&no_anexo=RREO-Anexo%2002"
        f"&id_ente={IBGE_SOROCABA}"
    )
    return f"{BASE_URL}?{params}"


def fetch_rreo(ano: int):
    url = _url_rreo(ano)
    print(f"  Baixando RREO Anexo 02 bimestre {BIMESTRE} de {ano}...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw)
    print(f"  {len(data.get('items', []))} registros recebidos")
    return data, url


def carregar_raw_local(ano: int):
    """Carrega JSON de snapshot local em vez de buscar da API."""
    caminho = os.path.join(as_str(SEGURANCA_RAW_DIR / "entrada"),
                           f"{ano}_rreo_anexo02_b6_siconfi.json")
    if not os.path.exists(caminho):
        raise FileNotFoundError(f"Snapshot nao encontrado: {caminho}")
    with open(caminho, encoding="utf-8") as f:
        data = json.load(f)
    print(f"  Usando snapshot local: {caminho}")
    print(f"  {len(data.get('items', []))} registros carregados")
    return data, _url_rreo(ano)


def salvar_raw(ano: int, data: dict) -> str:
    raw_dir = as_str(SEGURANCA_RAW_DIR / "entrada")
    os.makedirs(raw_dir, exist_ok=True)
    caminho = os.path.join(raw_dir, f"{ano}_rreo_anexo02_b6_siconfi.json")
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return caminho


def parse_valor(item) -> float:
    try:
        return float(str(item.get("valor") or 0).replace(",", "."))
    except (ValueError, TypeError):
        return 0.0


def extrair_rreo(items: list, fonte_url: str, ano: int) -> dict | None:
    """Retorna dict com campos orçamentários de Segurança Pública.

    Discriminação EXCETO INTRA vs INTRA por marcador de seção:
    A cada novo campo (coluna), o JSON apresenta o cabeçalho da seção
    EXCETO INTRA ou INTRA antes dos itens de função. Rastreamos esses
    cabeçalhos para saber a qual seção cada "Segurança Pública" pertence.
    Dentro de cada seção, usamos a primeira ocorrência de cada campo
    (a seção EXCETO reaparece por coluna — primeira ocorrência = correto).
    """
    secao = None            # "EXCETO" | "INTRA"
    exceto: dict = {}       # campo -> valor EXCETO INTRA Segurança Pública
    intra: dict = {}        # campo -> valor INTRA Segurança Pública
    total_exceto_emp = 0.0  # total municipal EXCETO INTRA empenhado

    for item in items:
        conta = item.get("conta", "").strip()
        coluna_norm = normalizar(item.get("coluna", ""))
        campo = COLUNAS_ALVO.get(coluna_norm)

        # Atualiza marcador de seção e captura total municipal
        if conta == SECAO_EXCETO:
            secao = "EXCETO"
            if campo == "empenhado":
                v = parse_valor(item)
                if v > total_exceto_emp:
                    total_exceto_emp = v
            continue

        if conta == SECAO_INTRA:
            secao = "INTRA"
            continue

        if campo is None or secao is None:
            continue

        if conta == CONTA_SEGURANCA:
            v = parse_valor(item)
            bucket = exceto if secao == "EXCETO" else intra
            # Primeira ocorrência por campo — evita duplicação quando a
            # seção EXCETO reaparece a cada coluna na primeira passagem
            if campo not in bucket:
                bucket[campo] = v

    if not exceto:
        print(f"  ATENCAO: '{CONTA_SEGURANCA}' EXCETO INTRA nao localizado no RREO {ano}")
        return None

    emp_exceto = exceto.get("empenhado", 0.0)
    emp_intra = intra.get("empenhado", 0.0)
    pct = (emp_exceto / total_exceto_emp * 100) if total_exceto_emp > 0 else 0.0

    return {
        "ano":                       ano,
        "dotacao_inicial":           exceto.get("dotacao_inicial", 0.0),
        "dotacao_atualizada":        exceto.get("dotacao_atualizada", 0.0),
        "empenhado":                 emp_exceto,
        "intra_empenhado":           emp_intra,
        "liquidado":                 exceto.get("liquidado", 0.0),
        "intra_liquidado":           intra.get("liquidado", 0.0),
        "pct_orcamento":             pct,
        "total_municipal_empenhado": total_exceto_emp,
        "fonte_url":                 fonte_url,
    }


def salvar_csv(resultado: dict) -> str:
    saida_dir = as_str(SEGURANCA_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    ano = resultado["ano"]
    caminho = os.path.join(saida_dir, f"rreo_seguranca_{MUNICIPIO}_{ano}.csv")
    campos = [
        "Ano", "Dotacao_Inicial", "Dotacao_Atualizada",
        "Empenhado", "Intra_Empenhado",
        "Liquidado", "Intra_Liquidado",
        "Pct_Orcamento", "Total_Municipal_Empenhado", "Fonte_URL",
    ]
    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerow({
            "Ano":                       resultado["ano"],
            "Dotacao_Inicial":           br_format(resultado["dotacao_inicial"]),
            "Dotacao_Atualizada":        br_format(resultado["dotacao_atualizada"]),
            "Empenhado":                 br_format(resultado["empenhado"]),
            "Intra_Empenhado":           br_format(resultado["intra_empenhado"]),
            "Liquidado":                 br_format(resultado["liquidado"]),
            "Intra_Liquidado":           br_format(resultado["intra_liquidado"]),
            "Pct_Orcamento":             f"{resultado['pct_orcamento']:.4f}".replace(".", ","),
            "Total_Municipal_Empenhado": br_format(resultado["total_municipal_empenhado"]),
            "Fonte_URL":                 resultado["fonte_url"],
        })
    return caminho


def processar_ano(ano: int, use_raw: bool = False) -> bool:
    print(f"\nProcessando {ano}...")
    try:
        if use_raw:
            data, fonte_url = carregar_raw_local(ano)
        else:
            data, fonte_url = fetch_rreo(ano)
    except Exception as e:
        print(f"  ERRO ao carregar dados: {e}")
        return False

    if not use_raw:
        raw_path = salvar_raw(ano, data)
        print(f"  Snapshot JSON salvo: {raw_path}")

    resultado = extrair_rreo(data.get("items", []), fonte_url, ano)
    if resultado is None:
        return False

    emp_exc = resultado["empenhado"]
    emp_int = resultado["intra_empenhado"]
    print(f"  Dotacao Atualizada:  R$ {br_format(resultado['dotacao_atualizada'])}")
    print(f"  Empenhado EXCETO:    R$ {br_format(emp_exc)}  (valor primario)")
    print(f"  Empenhado INTRA:     R$ {br_format(emp_int)}  (auditoria)")
    print(f"  EXCETO + INTRA:      R$ {br_format(emp_exc + emp_int)}"
          f"  (igual ao DCA em 2021; difere em 2020 e 2022-25)")
    print(f"  Liquidado EXCETO:    R$ {br_format(resultado['liquidado'])}")
    print(f"  % orcamento mun.:    {resultado['pct_orcamento']:.2f}%")

    caminho = salvar_csv(resultado)
    print(f"  -> {caminho}")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Extrai orcamento de Seguranca Publica do SICONFI RREO Anexo 02"
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
