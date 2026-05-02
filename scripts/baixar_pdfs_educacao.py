"""
Baixa os PDFs de Relatórios de Aplicação no Ensino do portal de Sorocaba.

Uso:
    python baixar_pdfs_educacao.py --ano 2024
    python baixar_pdfs_educacao.py --ano 2024 --ano 2025
    python baixar_pdfs_educacao.py --ano 2025 --forcar
"""
import argparse
import os
import sys
import time
import urllib.request
import urllib.error

ENTRADA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sorocaba', 'educacao', 'entrada'))

BASE_URL = (
    "https://sorocaba.sp.gov.br/anexos/SEF/Transparencia/"
    "01%20-%20Informacoes%20de%20Prestacoes%20de%20Contas%20-%20Lei%20de%20Responsabilidade%20Fiscal/"
    "Relatorios%20de%20Aplicacao%20em%20Ensino"
)

TRIMESTRE_ORD = {1: "1%C2%BA", 2: "2%C2%BA", 3: "3%C2%BA", 4: "4%C2%BA"}


def url_trimestre(ano, trimestre):
    ord_ = TRIMESTRE_ORD[trimestre]
    return (
        f"{BASE_URL}/{ano}/"
        f"{ano}-%20{ord_}%20trimestre%20-%20Relat%C3%B3rios%20de%20Aplica%C3%A7%C3%A3o%20no%20Ensino.pdf"
    )


def nome_local(ano, trimestre):
    return f"{ano}-{trimestre}-trimestre-relatorios-de-aplicacao-no-ensino.pdf"


def baixar_pdf(url, destino, forcar=False):
    if os.path.exists(destino) and not forcar:
        print(f"  Ja existe, pulando: {os.path.basename(destino)}")
        return False

    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            conteudo = resp.read()
    except urllib.error.URLError as e:
        print(f"  Erro ao baixar: {e}")
        return False

    if not conteudo.startswith(b'%PDF'):
        print(f"  Resposta nao e um PDF valido (conteudo: {conteudo[:20]})")
        return False

    if len(conteudo) < 5000:
        print(f"  PDF muito pequeno ({len(conteudo)} bytes) — provavelmente arquivo vazio do portal")
        return False

    with open(destino, 'wb') as f:
        f.write(conteudo)

    print(f"  Baixado: {os.path.basename(destino)} ({len(conteudo)//1024} KB)")
    return True


def processar_ano(ano, forcar):
    print(f"\n=== Ano {ano} ===")
    os.makedirs(ENTRADA_DIR, exist_ok=True)

    for t in range(1, 5):
        url    = url_trimestre(ano, t)
        nome   = nome_local(ano, t)
        destino = os.path.join(ENTRADA_DIR, nome)
        print(f"\n  {t}o trimestre")
        print(f"  URL: {url}")
        baixar_pdf(url, destino, forcar)
        time.sleep(1)


def main():
    parser = argparse.ArgumentParser(description='Baixa PDFs de educacao de Sorocaba')
    parser.add_argument('--ano', type=int, action='append', required=True)
    parser.add_argument('--forcar', action='store_true')
    args = parser.parse_args()

    for ano in sorted(set(args.ano)):
        processar_ano(ano, args.forcar)

    print("\nConcluido.")


if __name__ == '__main__':
    main()
