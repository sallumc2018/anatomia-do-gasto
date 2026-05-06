"""
Baixa os PDFs do RREO (bimestres 2, 4 e 6) do portal de Sorocaba.
Bimestre 2 = quadrimestre 1 (Jan-Abr)
Bimestre 4 = quadrimestre 2 (Jan-Ago)
Bimestre 6 = quadrimestre 3 (Jan-Dez)

Uso:
    python baixar_rreo_sus.py --ano 2024
    python baixar_rreo_sus.py --ano 2023 --ano 2024 --ano 2025
    python baixar_rreo_sus.py --ano 2024 --forcar
"""
import argparse
import os
import sys
import time
import urllib.request
import urllib.error
from paths import as_str, SAUDE_RAW_DIR

DIRETORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))
RAIZ             = os.path.abspath(os.path.join(DIRETORIO_SCRIPT, '..'))
ENTRADA_DIR      = as_str(SAUDE_RAW_DIR / "rreo" / "entrada")

# Apenas os bimestres que coincidem com os quadrimestres LRF
BIMESTRES = [2, 4, 6]

BASE_URL = (
    "https://sorocaba.sp.gov.br/anexos/"
    "SEF%2FTransparencia%2F01%20-%20Informacoes%20de%20Prestacoes%20de%20Contas%20"
    "-%20Lei%20de%20Responsabilidade%20Fiscal%2F"
    "%2FRelatorio%20Resumido%20da%20Execucao%20Orcamentaria%2F"
)


def url_rreo(ano, bimestre):
    # O portal usa "%BAbimestre" na maioria dos casos, mas alguns arquivos
    # têm um espaço antes de "bimestre" ("%BA%20bimestre"). Tenta ambos.
    return [
        f"{BASE_URL}{ano}/{ano}_RREO_{bimestre}%BAbimestre.pdf",
        f"{BASE_URL}{ano}/{ano}_RREO_{bimestre}%BA%20bimestre.pdf",
    ]


def nome_local(ano, bimestre):
    return f"rreo_{ano}_{bimestre}bimestre.pdf"


def baixar(url, destino, forcar=False):
    if os.path.exists(destino) and not forcar:
        print(f"  Ja existe, pulando: {os.path.basename(destino)}")
        return False
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            conteudo = resp.read()
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {url}")
        return False
    except urllib.error.URLError as e:
        print(f"  Erro de rede: {e}")
        return False
    if not conteudo.startswith(b'%PDF'):
        print(f"  Resposta nao e PDF valido (possivel pagina de erro)")
        return False
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, 'wb') as f:
        f.write(conteudo)
    print(f"  Baixado: {os.path.basename(destino)} ({len(conteudo) // 1024} KB)")
    return True


def processar_ano(ano, forcar):
    print(f"\n=== Ano {ano} ===")
    baixados = 0
    for bim in BIMESTRES:
        urls    = url_rreo(ano, bim)
        nome    = nome_local(ano, bim)
        destino = os.path.join(ENTRADA_DIR, nome)
        print(f"\n  {bim}o bimestre (Q{BIMESTRES.index(bim) + 1})")
        if os.path.exists(destino) and not forcar:
            print(f"  Ja existe, pulando: {nome}")
            continue
        ok = False
        for url in urls:
            if baixar(url, destino, forcar):
                ok = True
                break
        if ok:
            baixados += 1
        time.sleep(1)
    return baixados


def main():
    parser = argparse.ArgumentParser(description='Baixa RREOs do portal de Sorocaba')
    parser.add_argument('--ano', type=int, action='append', required=True)
    parser.add_argument('--forcar', action='store_true')
    args = parser.parse_args()

    total = 0
    for ano in sorted(set(args.ano)):
        total += processar_ano(ano, args.forcar)
    print(f"\nConcluido: {total} PDFs baixados.")


if __name__ == '__main__':
    main()
