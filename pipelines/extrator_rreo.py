"""
Baixa o RREO Anexo 03 do SICONFI para Sorocaba e extrai o detalhamento
de receitas por componente (IPTU, ISS, ITBI, IRRF, FPM, ITR, ICMS-cota, etc.).

Salva em data/extracted/sorocaba/saude/saida/receitas_detalhamento_sorocaba_{ano}.csv
Colunas: Categoria, Conta, Valor

Categorias:
  proprios  — Impostos próprios do município (IPTU, ISS, ITBI, IRRF)
  federais  — Repasses da União (FPM, ITR)
  estaduais — Repasses do Estado (ICMS-cota, IPVA-cota, LC 61/1989)

Fonte: SICONFI/RREO Anexo 03, coluna "TOTAL (ÚLTIMOS 12 MESES)", período 6.

Uso:
    python extrator_rreo.py           # todos os anos (2023 2024 2025)
    python extrator_rreo.py --ano 2024
"""
import argparse
import csv
import json
import os
import sys
import urllib.request
from paths import CFG, MUNICIPIO, as_str, SAUDE_EXTRACTED_DIR

DIRETORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(DIRETORIO_SCRIPT, '..'))

IBGE_SOROCABA = int(CFG["ibge"])
BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"
COLUNA_TOTAL = "TOTAL (ÚLTIMOS 12 MESES)"

CONTAS_INTERESSE = {
    'IPTULiquidoExcetoTransferenciasEFUNDEB':   ('proprios',  'IPTU'),
    'ISSLiquidoExcetoTransferenciasEFUNDEB':    ('proprios',  'ISS'),
    'ITBILiquidoExcetoTransferenciasEFUNDEB':   ('proprios',  'ITBI'),
    'IRRFLiquidoExcetoTransferenciasEFUNDEB':   ('proprios',  'IRRF'),
    'RREO3CotaParteDoFPM':                      ('federais',  'Cota-Parte do FPM'),
    'RREO3CotaParteDoITR':                      ('federais',  'Cota-Parte do ITR'),
    'RREO3CotaParteDoICMS':                     ('estaduais', 'Cota-Parte do ICMS'),
    'RREO3CotaParteDoIPVA':                     ('estaduais', 'Cota-Parte do IPVA'),
    'RREO3TransferenciasDaLC611989':            ('estaduais', 'IPI - Exportações (LC 61/1989)'),
}


def fetch_rreo(ano):
    url = (
        f"{BASE_URL}?an_exercicio={ano}&nr_periodo=6"
        f"&co_tipo_demonstrativo=RREO&id_ente={IBGE_SOROCABA}"
        f"&no_anexo=RREO-Anexo%2003"
    )
    print(f"  Baixando RREO {ano} Anexo 03...")
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    items = data.get('items', [])
    print(f"  {len(items)} registros recebidos")
    return items


def extrair_detalhamento(items, fonte_url):
    resultado = []
    for item in items:
        cod    = item.get('cod_conta', '')
        coluna = item.get('coluna', '')
        if coluna != COLUNA_TOTAL:
            continue
        if cod not in CONTAS_INTERESSE:
            continue
        categoria, nome = CONTAS_INTERESSE[cod]
        valor = float(item.get('valor') or 0)
        resultado.append({'categoria': categoria, 'conta': nome, 'valor': valor, 'fonte_url': fonte_url})
    return resultado


def salvar_csv(ano, detalhamento):
    saida_dir = as_str(SAUDE_EXTRACTED_DIR / "saida")
    os.makedirs(saida_dir, exist_ok=True)
    caminho = os.path.join(saida_dir, f'receitas_detalhamento_{MUNICIPIO}_{ano}.csv')
    with open(caminho, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=['Categoria', 'Conta', 'Valor', 'Fonte_URL'])
        writer.writeheader()
        for row in detalhamento:
            writer.writerow({
                'Categoria': row['categoria'],
                'Conta':     row['conta'],
                'Valor':     f"{row['valor']:.2f}",
                'Fonte_URL': row['fonte_url'],
            })
    return caminho


def processar_ano(ano):
    print(f"\nProcessando {ano}...")
    fonte_url = (
        f"{BASE_URL}?an_exercicio={ano}&nr_periodo=6"
        f"&co_tipo_demonstrativo=RREO&id_ente={IBGE_SOROCABA}"
        f"&no_anexo=RREO-Anexo%2003"
    )
    try:
        items = fetch_rreo(ano)
    except Exception as e:
        print(f"  ERRO ao baixar dados: {e}")
        return False

    det = extrair_detalhamento(items, fonte_url)
    if not det:
        print(f"  ATENCAO: nenhum dado extraido para {ano}")
        return False

    encontrados = {r['conta'] for r in det}
    esperados   = {nome for _, nome in CONTAS_INTERESSE.values()}
    ausentes    = esperados - encontrados
    if ausentes:
        print(f"  ATENCAO: contas nao encontradas: {sorted(ausentes)}")

    caminho = salvar_csv(ano, det)
    print(f"  {len(det)} itens -> {caminho}")

    print(f"\n  Resumo {ano}:")
    for cat in ('proprios', 'federais', 'estaduais'):
        total = sum(r['valor'] for r in det if r['categoria'] == cat)
        print(f"    {cat:12s}: R$ {total:>20,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'))

    return True


def main():
    parser = argparse.ArgumentParser(description='Extrai detalhamento de receitas do SICONFI/RREO')
    parser.add_argument('--ano', type=int, action='append',
                        help='Ano a processar (padrao: 2023 2024 2025)')
    args = parser.parse_args()

    anos = args.ano if args.ano else [2023, 2024, 2025]

    ok_count  = 0
    err_count = 0
    for ano in anos:
        if processar_ano(ano):
            ok_count += 1
        else:
            err_count += 1

    print(f"\n{'='*40}")
    print(f"Concluido: {ok_count} OK, {err_count} com erro")
    sys.exit(1 if err_count else 0)


if __name__ == '__main__':
    main()
