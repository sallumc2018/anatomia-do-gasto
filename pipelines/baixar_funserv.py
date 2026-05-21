"""
Coleta e inventaria fontes oficiais da FUNSERV Sorocaba.

O script preserva documentos brutos no acervo externo configurado por
ANATOMIA_RAW_ROOT e grava somente inventarios/recortes em data/extracted.
Nao publica dados em data/public.

Uso:
    python pipelines\\baixar_funserv.py --apenas-listar
    python pipelines\\baixar_funserv.py
    python pipelines\\baixar_funserv.py --categoria atuarial --forcar
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import re
import shutil
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from paths import EXTRACTED_DIR, RAW_DIR

BASE = "https://funservsorocaba.sp.gov.br"
FUNSERV_RAW_DIR = RAW_DIR / "funserv"
FUNSERV_EXTRACTED_DIR = EXTRACTED_DIR / "funserv"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

EXTS_DOCUMENTO = (".pdf", ".xls", ".xlsx", ".csv", ".zip")
MAX_PAGINAS_POR_CATEGORIA = 80


@dataclass(frozen=True)
class Categoria:
    nome: str
    subdir: str
    sementes: tuple[str, ...]
    termos_pagina: tuple[str, ...]
    termos_documento: tuple[str, ...]


CATEGORIAS = {
    "atuarial": Categoria(
        nome="atuarial",
        subdir="atuarial",
        sementes=(
            f"{BASE}/transparencia/compliance-relat%C3%B3rios/avaliacao-atuarial",
            f"{BASE}/transparencia/62-avaliacao-atuarial",
        ),
        termos_pagina=("avaliacao atuarial", "gestao atuarial"),
        termos_documento=("atuarial", "relatorio_gestao_atuarial", "base_dez"),
    ),
    "balanco_previdenciario": Categoria(
        nome="balanco_previdenciario",
        subdir="balancos/previdenciario",
        sementes=(
            f"{BASE}/transparencia/balancos/balanco-previdenciario/2026",
            f"{BASE}/transparencia/balancos/balanco-previdenciario/anos-anteriores",
            f"{BASE}/transparencia/balancos",
        ),
        termos_pagina=("balanco previdenciario", "previdenciario", "balancos"),
        termos_documento=("balanco_prev", "balanco previdenciario"),
    ),
    "balanco_saude": Categoria(
        nome="balanco_saude",
        subdir="balancos/saude",
        sementes=(
            f"{BASE}/transparencia/balancos/balanco-saude/2026",
            f"{BASE}/transparencia/balancos/balanco-saude/anos-anteriores",
            f"{BASE}/transparencia/balancos",
        ),
        termos_pagina=("balanco saude", "saude", "balancos"),
        termos_documento=("balanco_sau", "balanco_saude", "balanco saude"),
    ),
    "apr": Categoria(
        nome="apr",
        subdir="apr",
        sementes=(
            f"{BASE}/transparencia/investimentos/movimentacores-financeiras",
        ),
        termos_pagina=("movimentacoes financeiras", "movimentacores-financeiras", "apr"),
        termos_documento=("mov_fin", "apr", "movimentacoes financeiras", "movimentacores financeiras"),
    ),
    "rentabilidade_previdencia": Categoria(
        nome="rentabilidade_previdencia",
        subdir="rentabilidade/previdencia",
        sementes=(
            f"{BASE}/transparencia/investimentos/rentabilidade-aplicacoes-financeiras/previdencia",
            f"{BASE}/transparencia/investimentos/rentabilidade-aplicacoes-financeiras",
            f"{BASE}/transparencia/290-rentabilidade-aplicacoes-financeiras",
        ),
        termos_pagina=("rentabilidade", "aplicacoes financeiras", "previdencia"),
        termos_documento=(
            "rentabilidade_financeira/previdencia",
            "relatorioanaliticodosinvestimentosprevidencia",
            "rentabilidadeprevi",
            "parecer_cip_previdencia",
        ),
    ),
    "rentabilidade_saude": Categoria(
        nome="rentabilidade_saude",
        subdir="rentabilidade/saude",
        sementes=(
            f"{BASE}/transparencia/investimentos/rentabilidade-aplicacoes-financeiras/rentabilidade-saude",
            f"{BASE}/transparencia/investimentos/rentabilidade-aplicacoes-financeiras",
            f"{BASE}/transparencia/290-rentabilidade-aplicacoes-financeiras",
        ),
        termos_pagina=("rentabilidade", "aplicacoes financeiras", "saude"),
        termos_documento=(
            "rentabilidade_financeira/saude",
            "relatorioanaliticodosinvestimentossaude",
            "rentabilidadesaude",
            "parecer_cip_saude",
        ),
    ),
    "receitas_despesas": Categoria(
        nome="receitas_despesas",
        subdir="receitas_despesas",
        sementes=(
            f"{BASE}/transparencia/programacao-financeira",
            f"{BASE}/transparencia/44-programacao-financeira",
            f"{BASE}/transparencia/balancos",
        ),
        termos_pagina=("programacao financeira", "receita", "despesa", "balanco"),
        termos_documento=("rof_", "programacao_financeira", "relatorio orcamentario", "receita", "despesa"),
    ),
    "governanca": Categoria(
        nome="governanca",
        subdir="governanca",
        sementes=(
            f"{BASE}/transparencia/portal-da-transpar%C3%AAncia",
            f"{BASE}/transparencia/compliance-relat%C3%B3rios/relatorio-de-governanca-corporativa",
            f"{BASE}/transparencia/compliance-relat%C3%B3rios/controle-interno",
        ),
        termos_pagina=("governanca", "controle interno", "certidoes", "planejamento estrategico"),
        termos_documento=(
            "governanca",
            "controle_interno",
            "controle interno",
            "planejamento_estrategico",
            "certidoes",
            "crp-",
            "cnd_",
            "codigo_etica",
        ),
    ),
}

DOCUMENTOS_GLOBAIS_IGNORAR = (
    "cartilha_previdenciaria",
    "apresentando_funserv",
    "integra_2023",
    "1doc_documents",
    "como_realizar_acesso",
    "cadastrar_usuario",
)


def agora_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def sem_acentos(texto: str) -> str:
    texto = html.unescape(texto or "")
    texto = unicodedata.normalize("NFKD", texto)
    return "".join(ch for ch in texto if not unicodedata.combining(ch))


def normalizar_texto(texto: str) -> str:
    texto = re.sub(r"<[^>]+>", " ", texto or "")
    texto = sem_acentos(texto).lower()
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()


def slug(texto: str, maxlen: int = 90) -> str:
    texto = normalizar_texto(texto)
    texto = re.sub(r"[^a-z0-9]+", "_", texto).strip("_")
    return (texto[:maxlen].strip("_") or "documento")


def abrir_url(url: str, method: str = "GET"):
    url = urllib.parse.quote(url, safe=":/?&=%#")
    req = urllib.request.Request(url, method=method, headers={"User-Agent": USER_AGENT})
    return urllib.request.urlopen(req, timeout=60)


def url_absoluta(href: str, pagina: str) -> str:
    href = html.unescape(href or "").strip()
    return urllib.parse.urljoin(pagina, href)


def mesma_origem(url: str) -> bool:
    host = urllib.parse.urlparse(url).netloc.lower()
    return host in {"funservsorocaba.sp.gov.br", "www.funservsorocaba.sp.gov.br"}


def e_documento(url: str) -> bool:
    path = urllib.parse.urlparse(url).path.lower()
    return any(path.endswith(ext) for ext in EXTS_DOCUMENTO)


def documento_relevante(link: dict[str, str], categoria: Categoria) -> bool:
    alvo_original = urllib.parse.unquote(f"{link['texto']} {link['url']}").lower()
    alvo = normalizar_texto(alvo_original.replace("-", "_"))
    if categoria.nome != "governanca" and any(ignorar in alvo for ignorar in DOCUMENTOS_GLOBAIS_IGNORAR):
        return False
    return any(normalizar_texto(termo.replace("-", "_")) in alvo for termo in categoria.termos_documento)


def extrair_ano(texto: str) -> str:
    anos = re.findall(r"\b(20[0-2][0-9]|201[0-9])\b", texto)
    return anos[-1] if anos else ""


def extrair_mes(texto: str) -> str:
    meses = {
        "janeiro": "01",
        "fevereiro": "02",
        "marco": "03",
        "março": "03",
        "abril": "04",
        "maio": "05",
        "junho": "06",
        "julho": "07",
        "agosto": "08",
        "setembro": "09",
        "outubro": "10",
        "novembro": "11",
        "dezembro": "12",
    }
    texto_norm = normalizar_texto(texto)
    for nome, numero in meses.items():
        if normalizar_texto(nome) in texto_norm:
            return numero
    match = re.search(r"(?:^|[_\-/\s])(0?[1-9]|1[0-2])(?:[_\-/\s])", texto_norm)
    return f"{int(match.group(1)):02d}" if match else ""


def nome_destino(categoria: str, texto: str, url: str) -> str:
    path = urllib.parse.urlparse(url).path
    original = urllib.parse.unquote(Path(path).name)
    sufixo = Path(original).suffix.lower() or ".pdf"
    ano = extrair_ano(f"{texto} {url}")
    mes = extrair_mes(f"{texto} {url}")
    base_original = slug(Path(original).stem, 80)
    partes = [categoria]
    if ano:
        partes.append(ano)
    if mes:
        partes.append(mes)
    partes.append(base_original)
    return "_".join(partes) + sufixo


def carregar_pagina(url: str) -> str:
    with abrir_url(url) as resp:
        ctype = resp.headers.get("Content-Type", "")
        if "text/html" not in ctype and "application/xhtml" not in ctype:
            return ""
        return resp.read().decode("utf-8", errors="replace")


def extrair_links(conteudo: str, pagina: str) -> list[dict[str, str]]:
    links = []
    for match in re.finditer(
        r"<a\s+[^>]*href=[\"']([^\"']+)[\"'][^>]*>(.*?)</a>",
        conteudo,
        flags=re.I | re.S,
    ):
        href = url_absoluta(match.group(1), pagina)
        texto = normalizar_texto(match.group(2)) or slug(Path(urllib.parse.urlparse(href).path).stem)
        if not href or href.startswith("mailto:") or href.startswith("javascript:"):
            continue
        links.append({"url": href, "texto": texto})
    return links


def pagina_relevante(link: dict[str, str], categoria: Categoria) -> bool:
    if not mesma_origem(link["url"]):
        return False
    if e_documento(link["url"]):
        return False
    alvo = normalizar_texto(f"{link['texto']} {urllib.parse.unquote(link['url'])}")
    if "/transparencia" not in urllib.parse.urlparse(link["url"]).path:
        return False
    return any(termo in alvo for termo in categoria.termos_pagina)


def inventariar_categoria(categoria: Categoria) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    documentos: list[dict[str, str]] = []
    paginas_visitadas: list[dict[str, str]] = []
    fila = list(categoria.sementes)
    visitadas: set[str] = set()
    docs_vistos: set[str] = set()

    while fila and len(visitadas) < MAX_PAGINAS_POR_CATEGORIA:
        pagina = fila.pop(0)
        pagina = urllib.parse.urlsplit(pagina)._replace(fragment="").geturl()
        if pagina in visitadas:
            continue
        visitadas.add(pagina)

        try:
            conteudo = carregar_pagina(pagina)
            paginas_visitadas.append({"categoria": categoria.nome, "url": pagina, "status": "ok"})
        except urllib.error.HTTPError as exc:
            paginas_visitadas.append({"categoria": categoria.nome, "url": pagina, "status": f"http_{exc.code}"})
            continue
        except Exception as exc:
            paginas_visitadas.append({"categoria": categoria.nome, "url": pagina, "status": f"erro: {exc}"})
            continue

        for link in extrair_links(conteudo, pagina):
            if not mesma_origem(link["url"]):
                continue
            if e_documento(link["url"]):
                if not documento_relevante(link, categoria):
                    continue
                chave = urllib.parse.urlsplit(link["url"])._replace(fragment="").geturl()
                if chave in docs_vistos:
                    continue
                docs_vistos.add(chave)
                texto_composto = f"{link['texto']} {urllib.parse.unquote(link['url'])}"
                documentos.append(
                    {
                        "categoria": categoria.nome,
                        "texto": link["texto"],
                        "url": chave,
                        "pagina_origem": pagina,
                        "ano": extrair_ano(texto_composto),
                        "mes": extrair_mes(texto_composto),
                        "arquivo": nome_destino(categoria.nome, link["texto"], chave),
                    }
                )
            elif pagina_relevante(link, categoria) and link["url"] not in visitadas and link["url"] not in fila:
                fila.append(link["url"])

    return documentos, paginas_visitadas


def baixar_documento(item: dict[str, str], destino: Path, forcar: bool) -> dict[str, str]:
    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".part")

    if destino.exists() and not forcar and destino.stat().st_size > 500:
        item.update(
            {
                "status_download": "ja_existia",
                "caminho_raw": str(destino),
                "bytes": str(destino.stat().st_size),
                "sha256": sha256_arquivo(destino),
            }
        )
        return item

    with abrir_url(item["url"]) as resp:
        prefixo = resp.read(4)
        if destino.suffix.lower() == ".pdf" and prefixo != b"%PDF":
            raise RuntimeError(f"resposta nao parece PDF: {item['url']}")
        with parcial.open("wb") as f:
            f.write(prefixo)
            shutil.copyfileobj(resp, f, length=1024 * 1024)
    parcial.replace(destino)
    item.update(
        {
            "status_download": "baixado",
            "caminho_raw": str(destino),
            "bytes": str(destino.stat().st_size),
            "sha256": sha256_arquivo(destino),
        }
    )
    return item


def sha256_arquivo(caminho: Path) -> str:
    h = hashlib.sha256()
    with caminho.open("rb") as f:
        for bloco in iter(lambda: f.read(1024 * 1024), b""):
            h.update(bloco)
    return h.hexdigest()


def escrever_csv(caminho: Path, linhas: list[dict[str, str]], campos: list[str]) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with caminho.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(linhas)


def escrever_resumo(documentos: list[dict[str, str]], paginas: list[dict[str, str]], bloqueios: list[str]) -> None:
    resumo: dict[str, object] = {
        "gerado_em": agora_iso(),
        "publicado": False,
        "observacao": "Inventario em data/extracted; documentos brutos preservados fora de data/public.",
        "categorias": {},
        "bloqueios": bloqueios,
    }
    for categoria in sorted(CATEGORIAS):
        docs = [d for d in documentos if d["categoria"] == categoria]
        anos = sorted({d.get("ano", "") for d in docs if d.get("ano")})
        meses = sorted({d.get("mes", "") for d in docs if d.get("mes")})
        resumo["categorias"][categoria] = {
            "documentos": len(docs),
            "baixados": sum(1 for d in docs if d.get("status_download") == "baixado"),
            "ja_existiam": sum(1 for d in docs if d.get("status_download") == "ja_existia"),
            "erros": sum(1 for d in docs if d.get("status_download", "").startswith("erro")),
            "anos": anos,
            "meses": meses,
            "paginas_visitadas": sum(1 for p in paginas if p["categoria"] == categoria),
        }
    caminho = FUNSERV_EXTRACTED_DIR / "resumo_funserv.json"
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(resumo, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta e inventaria fontes oficiais da FUNSERV Sorocaba")
    parser.add_argument("--categoria", choices=sorted(CATEGORIAS), action="append")
    parser.add_argument("--apenas-listar", action="store_true")
    parser.add_argument("--forcar", action="store_true")
    parser.add_argument("--pausa", type=float, default=0.4, help="Pausa entre downloads, em segundos")
    args = parser.parse_args()

    categorias = [CATEGORIAS[nome] for nome in (args.categoria or sorted(CATEGORIAS))]
    documentos: list[dict[str, str]] = []
    paginas: list[dict[str, str]] = []
    bloqueios: list[str] = []

    print(f"RAW: {FUNSERV_RAW_DIR}")
    print(f"EXTRACTED: {FUNSERV_EXTRACTED_DIR}")

    for categoria in categorias:
        print(f"\n=== {categoria.nome} ===")
        docs_cat, paginas_cat = inventariar_categoria(categoria)
        documentos.extend(docs_cat)
        paginas.extend(paginas_cat)
        print(f"Paginas visitadas: {len(paginas_cat)}")
        print(f"Documentos encontrados: {len(docs_cat)}")
        for item in docs_cat:
            print(f"  {item.get('ano') or 's/ano'} {item.get('mes') or '--'} | {item['arquivo']}")

        if args.apenas_listar:
            continue

        for item in docs_cat:
            destino = FUNSERV_RAW_DIR / CATEGORIAS[item["categoria"]].subdir / item["arquivo"]
            try:
                baixar_documento(item, destino, args.forcar)
                print(f"  {item['status_download']}: {destino.name}")
            except Exception as exc:
                item.update({"status_download": f"erro: {exc}", "caminho_raw": str(destino)})
                bloqueios.append(f"{item['categoria']} | {item['url']} | {exc}")
                print(f"  ERRO: {item['url']} | {exc}")
            time.sleep(args.pausa)

    campos_documentos = [
        "categoria",
        "ano",
        "mes",
        "texto",
        "url",
        "pagina_origem",
        "arquivo",
        "status_download",
        "bytes",
        "sha256",
        "caminho_raw",
    ]
    campos_paginas = ["categoria", "url", "status"]
    escrever_csv(FUNSERV_EXTRACTED_DIR / "inventario_funserv_documentos.csv", documentos, campos_documentos)
    escrever_csv(FUNSERV_EXTRACTED_DIR / "inventario_funserv_paginas.csv", paginas, campos_paginas)
    escrever_resumo(documentos, paginas, bloqueios)

    print(f"\nInventario: {FUNSERV_EXTRACTED_DIR / 'inventario_funserv_documentos.csv'}")
    print(f"Paginas: {FUNSERV_EXTRACTED_DIR / 'inventario_funserv_paginas.csv'}")
    print(f"Resumo: {FUNSERV_EXTRACTED_DIR / 'resumo_funserv.json'}")
    if bloqueios:
        print(f"Bloqueios/erros: {len(bloqueios)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Interrompido.", file=sys.stderr)
        raise SystemExit(130)
