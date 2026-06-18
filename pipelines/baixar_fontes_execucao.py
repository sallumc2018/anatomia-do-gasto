"""
Baixa fontes oficiais de execucao financeira de Sorocaba.

Os links sao extraidos da pagina oficial da Secretaria da Fazenda, pelo texto
publicado no proprio portal. O script nao publica dados: grava apenas em
data/raw/sorocaba/execucao.

Uso:
    python pipelines\\baixar_fontes_execucao.py --ano 2024 --documento fornecedor
    python pipelines\\baixar_fontes_execucao.py --ano 2024 --documento fornecedor --apenas-listar
"""
import argparse
import html
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from paths import EXECUCAO_RAW_DIR, as_str

PORTAL_URL = "https://fazenda.sorocaba.sp.gov.br/transparencia/"
MAX_BYTES_PADRAO = 100 * 1024 * 1024

DOCUMENTOS = {
    "fornecedor": {
        "nomes": (
            "Livro Conta Corrente de Fornecedor {ano}",
            "Livro Conta Corrente Fornecedor {ano}",
            "Conta corrente fornecedor {ano}",
        ),
        "arquivo": "livro_conta_corrente_fornecedor_{ano}.pdf",
    },
    "fornecedor_restos": {
        "nomes": (
            "Livro Conta Corrente de Restos a Pagar Analitico por Fornecedor {ano}",
            "Livro Conta Corrente de Restos a Pagar Analitico por Fornecedor {ano}",
            "Conta corrente fornecedor restos a pagar {ano}",
        ),
        "arquivo": "livro_conta_corrente_fornecedor_restos_{ano}.pdf",
    },
    "empenho": {
        "nomes": (
            "Livro Registro de Empenho {ano}",
            "Livro Registro de Empenhos {ano}",
            "Registro de Empenho {ano}",
        ),
        "arquivo": "livro_registro_empenho_{ano}.pdf",
    },
    "despesa_orcamentaria": {
        "nomes": (
            "Livro Registro Analitico da Despesa Orçamentaria {ano}",
            "Livro Registro Analitico da Despesa Orçamentária {ano}",
            "Registro analítico de despesa orçamentária {ano}",
        ),
        "arquivo": "livro_registro_analitico_despesa_orcamentaria_{ano}.pdf",
    },
    "bancario": {
        "nomes": (
            "Livro Conta Corrente Bancário {ano}",
            "Livro Conta Corrente Bancario {ano}",
            "Conta corrente bancário {ano}",
        ),
        "arquivo": "livro_conta_corrente_bancario_{ano}.pdf",
    },
}


def normalizar(texto: str) -> str:
    texto = html.unescape(texto)
    texto = re.sub(r"<[^>]+>", " ", texto)
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip().lower()


def abrir_url(url: str, method: str = "GET"):
    req = urllib.request.Request(url, method=method, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=60)


def carregar_links():
    with abrir_url(PORTAL_URL) as resp:
        conteudo = resp.read().decode("utf-8", errors="replace")

    links = []
    for match in re.finditer(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', conteudo, flags=re.I | re.S):
        href = html.unescape(match.group(1))
        texto = normalizar(match.group(2))
        if href and texto:
            links.append({"href": href, "texto": texto})
    return links


def localizar_link(links, ano: int, documento: str):
    if documento not in DOCUMENTOS:
        raise ValueError(f"Documento desconhecido: {documento}")

    nomes = [normalizar(nome.format(ano=ano)) for nome in DOCUMENTOS[documento]["nomes"]]
    for nome in nomes:
        for link in links:
            if nome in link["texto"]:
                return link["href"], link["texto"]
    return None, None


def tamanho_remoto(url: str) -> int | None:
    try:
        with abrir_url(url, method="HEAD") as resp:
            length = resp.headers.get("Content-Length")
            return int(length) if length else None
    except urllib.error.URLError:
        return None


def baixar(url: str, destino: Path, forcar: bool):
    if destino.exists() and not forcar:
        print(f"Ja existe, pulando: {destino}")
        return

    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".part")
    with abrir_url(url) as resp:
        prefixo = resp.read(4)
        if prefixo != b"%PDF":
            raise RuntimeError(f"Resposta nao parece PDF: {url}")

        with parcial.open("wb") as f:
            f.write(prefixo)
            shutil.copyfileobj(resp, f, length=1024 * 1024)

    parcial.replace(destino)
    print(f"Baixado: {destino} ({destino.stat().st_size // 1024} KB)")


def main():
    parser = argparse.ArgumentParser(description="Baixa fontes oficiais de execucao financeira de Sorocaba")
    parser.add_argument("--ano", type=int, action="append", required=True)
    parser.add_argument("--documento", choices=sorted(DOCUMENTOS), action="append")
    parser.add_argument("--apenas-listar", action="store_true")
    parser.add_argument("--forcar", action="store_true")
    parser.add_argument("--permitir-grandes", action="store_true")
    parser.add_argument("--max-mb", type=int, help="Limite opcional de tamanho por arquivo")
    args = parser.parse_args()

    documentos = args.documento or ["fornecedor"]
    links = carregar_links()
    base = EXECUCAO_RAW_DIR / "livros_contabeis"

    for ano in sorted(set(args.ano)):
        print(f"\n=== {ano} ===")
        for documento in documentos:
            url, texto = localizar_link(links, ano, documento)
            if not url:
                print(f"{documento}: link nao encontrado")
                continue

            tamanho = tamanho_remoto(url)
            print(f"{documento}: {texto}")
            print(f"  URL: {url}")
            if tamanho is not None:
                print(f"  Tamanho: {tamanho // 1024} KB")

            if args.apenas_listar:
                continue

            if tamanho and tamanho > MAX_BYTES_PADRAO and not args.permitir_grandes:
                print("  Pulando: arquivo grande; use --permitir-grandes para baixar.")
                continue
            if tamanho and args.max_mb and tamanho > args.max_mb * 1024 * 1024:
                print(f"  Pulando: maior que --max-mb {args.max_mb}.")
                continue

            nome = DOCUMENTOS[documento]["arquivo"].format(ano=ano)
            baixar(url, base / str(ano) / nome, args.forcar)
            time.sleep(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        raise
