"""
Baixa os PDFs de Relatórios de Aplicação na Saúde do portal de Sorocaba.

Uso:
    python baixar_pdfs.py --ano 2024
    python baixar_pdfs.py --ano 2024 --ano 2025
    python baixar_pdfs.py --ano 2024 --forcar      # sobrescreve PDFs já existentes
"""
import argparse
import os
import re
import sys
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser

PORTAL_URL  = "https://fazenda.sorocaba.sp.gov.br/transparencia/"
ENTRADA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sorocaba', 'saude', 'entrada'))

QUADRIMESTRE_NOME = {1: 'primeiro', 2: 'segundo', 3: 'terceiro'}


class ColetorLinks(HTMLParser):
    """Coleta todos os href de <a> da página."""
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            href = dict(attrs).get('href', '')
            if href:
                self.links.append(href)


def buscar_links_portal():
    """Faz o download da página do portal e retorna todos os links encontrados."""
    req = urllib.request.Request(PORTAL_URL, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='replace')
    except urllib.error.URLError as e:
        print(f"Erro ao acessar o portal: {e}")
        sys.exit(1)

    parser = ColetorLinks()
    parser.feed(html)
    return parser.links


def filtrar_links_saude(links, ano):
    """
    Filtra links que apontem para PDFs de saúde do ano solicitado.
    Retorna lista de (quadrimestre_int, url).
    """
    encontrados = []
    for link in links:
        link_lower = link.lower()
        if str(ano) not in link:
            continue
        if 'saude' not in link_lower and 'sa%fade' not in link_lower and 'sa%c3%bade' not in link_lower:
            continue
        if not link_lower.endswith('.pdf'):
            continue
        if 'aplica' not in link_lower and 'aplica%' not in link_lower:
            continue

        for q, nome in QUADRIMESTRE_NOME.items():
            if f'{q}%ba' in link_lower or f'{q}%c2%ba' in link_lower or f'{q}º' in link_lower:
                url = link if link.startswith('http') else 'https://sorocaba.sp.gov.br' + link
                encontrados.append((q, url))
                break

    encontrados.sort(key=lambda x: x[0])
    return encontrados


def nome_local(ano, quadrimestre):
    """Retorna o nome padronizado do arquivo local."""
    return f"{ano}-{QUADRIMESTRE_NOME[quadrimestre]}-quadrimestre-relatorios-de-aplicacao-na-saude.pdf"


def baixar_pdf(url, destino, forcar=False):
    """Baixa um PDF e salva em destino. Retorna True se baixou, False se pulou."""
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
        print(f"  Resposta nao e um PDF valido (pode ser pagina de erro do portal)")
        return False

    with open(destino, 'wb') as f:
        f.write(conteudo)

    tamanho_kb = len(conteudo) // 1024
    print(f"  Baixado: {os.path.basename(destino)} ({tamanho_kb} KB)")
    return True


def processar_ano(ano, forcar):
    print(f"\n=== Ano {ano} ===")
    print(f"Buscando links no portal...")

    links = buscar_links_portal()
    pdfs = filtrar_links_saude(links, ano)

    if not pdfs:
        print(f"Nenhum PDF de saude encontrado para {ano} no portal.")
        print("O quadrimestre pode ainda nao ter sido publicado.")
        return

    print(f"Encontrados {len(pdfs)} PDFs:")
    os.makedirs(ENTRADA_DIR, exist_ok=True)

    for q, url in pdfs:
        nome = nome_local(ano, q)
        destino = os.path.join(ENTRADA_DIR, nome)
        print(f"\n  {q}o quadrimestre")
        print(f"  URL: {url}")
        baixar_pdf(url, destino, forcar)
        time.sleep(1)


def main():
    parser = argparse.ArgumentParser(description='Baixa PDFs de saude de Sorocaba')
    parser.add_argument('--ano', type=int, action='append', required=True,
                        help='Ano a baixar (pode repetir para multiplos anos)')
    parser.add_argument('--forcar', action='store_true',
                        help='Sobrescreve PDFs ja existentes')
    args = parser.parse_args()

    for ano in sorted(set(args.ano)):
        processar_ano(ano, args.forcar)

    print("\nConcluido.")


if __name__ == '__main__':
    main()
