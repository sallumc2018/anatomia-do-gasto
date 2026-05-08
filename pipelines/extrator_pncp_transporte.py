"""
Extrai contratos de Transporte Público de Sorocaba do PNCP.

Fonte: Portal Nacional de Contratações Públicas (PNCP)
       API pública REST: https://pncp.gov.br/api/consulta/v1/contratos

Limitações declaradas — ler antes de usar:

  1. Cobertura temporal: o PNCP tornou-se obrigatório para municípios
     progressivamente a partir de 2021-2022 (Lei 14.133/2021). Contratos
     anteriores a 2022 provavelmente não estão indexados — séries históricas
     comparáveis são inviáveis.

  2. Filtro de categoria: o PNCP não tem campo "tipo de serviço = transporte
     público". O filtro disponível é por CNAE ou descrição textual do objeto.
     Este extrator usa busca por palavras-chave ("transporte", "ônibus",
     "urbano", "URBES") na descrição do objeto — resultado pode incluir
     contratos de combustível, frotas de outros órgãos, obras de pavimentação.
     A curadoria manual da lista gerada é necessária antes de publicar.

  3. Completude: não há garantia de que todos os contratos municipais de
     transporte estejam indexados no PNCP. Contratos firmados antes da
     obrigatoriedade ou via regimes especiais podem estar ausentes.

  4. Status da API: durante desenvolvimento (2026-05), a API PNCP retornou
     timeout em alguns endpoints. O extrator trata isso com fallback para
     snapshot local quando disponível.

Pipeline:
    raw/transporte/entrada/{ano}_pncp_contratos.json       (raw)
    extracted/transporte/saida/contratos_transporte_{ano}.csv  (extracted)
    validated/transporte/saida/contratos_transporte_{ano}.csv  (validated — REQUER curadoria manual)
    public/transporte/saida/contratos_transporte_{ano}.csv     (public — SÓ após validated)

ATENÇÃO: este dataset passa por validated antes de público.
         Não use publicar_dados.py --area transporte para contratos
         sem revisar manualmente o arquivo validated.

Colunas CSV:
    Numero, Objeto, Valor_Global, Data_Assinatura, Data_Vigencia_Inicio,
    Data_Vigencia_Fim, Fornecedor_CNPJ, Fornecedor_Nome, Modalidade,
    Situacao, URL_PNCP, Fonte_URL

Uso:
    python extrator_pncp_transporte.py --ano 2024
    python extrator_pncp_transporte.py --ano 2023 --ano 2024
    python extrator_pncp_transporte.py --use-raw   # usa snapshot local
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.request
import urllib.parse
from paths import as_str, TRANSPORTE_RAW_DIR, TRANSPORTE_EXTRACTED_DIR

IBGE_SOROCABA = "3552205"
PNCP_BASE = "https://pncp.gov.br/api/consulta/v1/contratos"

# Palavras-chave para filtrar contratos de transporte
# CURADORIA NECESSÁRIA — ver limitação 2 na docstring
PALAVRAS_CHAVE = ["transporte", "ônibus", "onibus", "urbano", "URBES", "passageiro"]

CAMPOS_CSV = [
    "Numero", "Objeto", "Valor_Global",
    "Data_Assinatura", "Data_Vigencia_Inicio", "Data_Vigencia_Fim",
    "Fornecedor_CNPJ", "Fornecedor_Nome", "Modalidade",
    "Situacao", "URL_PNCP", "Fonte_URL",
]


def br_format(valor) -> str:
    if valor is None:
        return ""
    try:
        s = f"{float(valor):,.2f}"
        return s.replace(",", "X").replace(".", ",").replace("X", ".")
    except (ValueError, TypeError):
        return str(valor)


def _url_pncp(ano: int, pagina: int = 1, tamanho: int = 50) -> str:
    data_ini = f"{ano}0101"
    data_fim = f"{ano}1231"
    params = urllib.parse.urlencode({
        "codigoMunicipio": IBGE_SOROCABA,
        "dataInicial": data_ini,
        "dataFinal": data_fim,
        "pagina": pagina,
        "tamanhoPagina": tamanho,
    })
    return f"{PNCP_BASE}?{params}"


def fetch_pagina(url: str, timeout: int = 20):
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "anatomia-do-gasto/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_todos(ano: int) -> tuple[list, str]:
    url_base = _url_pncp(ano, pagina=1, tamanho=50)
    print(f"  Buscando pagina 1...")
    try:
        data = fetch_pagina(url_base)
    except Exception as e:
        raise RuntimeError(f"Erro na pagina 1: {e}")

    itens = data.get("data", []) if isinstance(data, dict) else data
    total = data.get("totalRegistros", len(itens)) if isinstance(data, dict) else len(itens)
    paginas = (total + 49) // 50

    print(f"  Total registros: {total} ({paginas} paginas)")
    for pg in range(2, paginas + 1):
        url = _url_pncp(ano, pagina=pg)
        print(f"  Buscando pagina {pg}/{paginas}...")
        try:
            d = fetch_pagina(url)
            itens.extend(d.get("data", []) if isinstance(d, dict) else d)
            time.sleep(0.5)
        except Exception as e:
            print(f"  AVISO: pagina {pg} falhou: {e}")

    return itens, url_base


def carregar_raw_local(ano: int):
    caminho = os.path.join(as_str(TRANSPORTE_RAW_DIR / "entrada"),
                           f"{ano}_pncp_contratos.json")
    if not os.path.exists(caminho):
        raise FileNotFoundError(f"Snapshot nao encontrado: {caminho}")
    with open(caminho, encoding="utf-8") as f:
        data = json.load(f)
    itens = data if isinstance(data, list) else data.get("data", [])
    print(f"  Usando snapshot local: {caminho} ({len(itens)} registros)")
    return itens, _url_pncp(ano)


def salvar_raw(ano: int, itens: list) -> str:
    raw_dir = as_str(TRANSPORTE_RAW_DIR / "entrada")
    os.makedirs(raw_dir, exist_ok=True)
    caminho = os.path.join(raw_dir, f"{ano}_pncp_contratos.json")
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(itens, f, ensure_ascii=False, indent=2)
    return caminho


def filtrar_transporte(itens: list) -> list:
    """Filtra contratos cujo objeto contém palavras-chave de transporte.

    RESULTADO REQUER CURADORIA MANUAL — ver limitação 2 na docstring do módulo.
    """
    resultado = []
    for item in itens:
        objeto = str(item.get("objetoContrato", "") or item.get("objeto", "")).lower()
        if any(kw.lower() in objeto for kw in PALAVRAS_CHAVE):
            resultado.append(item)
    return resultado


def normalizar_item(item: dict, fonte_url: str) -> dict:
    numero = item.get("numeroContratoEmpenho", item.get("numero", ""))
    objeto = item.get("objetoContrato", item.get("objeto", ""))
    valor = item.get("valorGlobal", item.get("valor", None))
    data_ass = str(item.get("dataAssinatura", ""))[:10]
    data_ini = str(item.get("dataVigenciaInicio", ""))[:10]
    data_fim = str(item.get("dataVigenciaFim", ""))[:10]
    fornecedor = item.get("nomeRazaoSocialFornecedor", item.get("fornecedor", {}) or {})
    if isinstance(fornecedor, dict):
        forn_nome = fornecedor.get("razaoSocial", "")
        forn_cnpj = fornecedor.get("cnpj", "")
    else:
        forn_nome = str(fornecedor)
        forn_cnpj = item.get("cnpjFornecedor", "")
    modalidade = item.get("modalidadeNome", item.get("modalidade", ""))
    situacao = item.get("situacaoNome", item.get("situacao", ""))
    url_pncp = item.get("linkSistemaOrigem", item.get("urlPncp", ""))

    return {
        "Numero":               numero,
        "Objeto":               objeto,
        "Valor_Global":         br_format(valor),
        "Data_Assinatura":      data_ass,
        "Data_Vigencia_Inicio": data_ini,
        "Data_Vigencia_Fim":    data_fim,
        "Fornecedor_CNPJ":      forn_cnpj,
        "Fornecedor_Nome":      forn_nome,
        "Modalidade":           modalidade,
        "Situacao":             situacao,
        "URL_PNCP":             url_pncp,
        "Fonte_URL":            fonte_url,
    }


def salvar_csv(rows: list, ano: int) -> str:
    saida_dir = as_str(TRANSPORTE_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f"contratos_transporte_sorocaba_{ano}.csv")
    with open(caminho, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS_CSV)
        writer.writeheader()
        writer.writerows(rows)
    return caminho


def processar_ano(ano: int, use_raw: bool = False) -> bool:
    print(f"\nProcessando PNCP contratos {ano}...")
    print("  AVISO: resultado requer curadoria manual antes de publicar")

    try:
        if use_raw:
            itens, fonte_url = carregar_raw_local(ano)
        else:
            itens, fonte_url = fetch_todos(ano)
    except Exception as e:
        print(f"  ERRO ao buscar PNCP: {e}")
        print("  Sugestao: API pode estar indisponivel. Tente novamente ou use --use-raw")
        return False

    if not use_raw and itens:
        raw_path = salvar_raw(ano, itens)
        print(f"  Snapshot JSON salvo: {raw_path}")

    total_raw = len(itens)
    filtrados = filtrar_transporte(itens)
    print(f"  Contratos totais do municipio: {total_raw}")
    print(f"  Contratos filtrados (palavras-chave transporte): {len(filtrados)}")
    print(f"  ATENÇÃO: {total_raw - len(filtrados)} contratos excluídos pelo filtro"
          " — conferir se nenhum relevante foi omitido")

    if not filtrados:
        print("  AVISO: nenhum contrato de transporte encontrado.")
        # Salva CSV vazio com header para manter pipeline consistente
        salvar_csv([], ano)
        return True

    rows = [normalizar_item(i, fonte_url) for i in filtrados]
    caminho = salvar_csv(rows, ano)
    print(f"  -> {caminho} ({len(rows)} contratos — aguarda curadoria)")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Extrai contratos de transporte do PNCP para Sorocaba"
    )
    parser.add_argument("--ano", type=int, action="append",
                        help="Ano a processar (padrao: 2022-2025)")
    parser.add_argument("--use-raw", action="store_true",
                        help="Usar snapshot JSON local em vez de buscar da API")
    args = parser.parse_args()

    # PNCP só obrigatório a partir de ~2022
    anos = args.ano if args.ano else list(range(2022, 2026))

    ok = err = 0
    for ano in anos:
        if processar_ano(ano, use_raw=args.use_raw):
            ok += 1
        else:
            err += 1

    print(f"\n{'='*40}")
    print(f"Concluido: {ok} OK, {err} com erro")
    if ok > 0:
        print("PROXIMO PASSO: revisar CSV em extracted/transporte/saida/")
        print("  antes de copiar para validated/ e depois para public/.")
    sys.exit(1 if err else 0)


if __name__ == "__main__":
    main()
