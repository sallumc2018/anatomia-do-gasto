"""
Baixa contratos/licitacoes (2020-2021) e obras publicas de Sorocaba.

Fontes descobertas em 2026-05-22:
  - Obras: https://apps.sorocaba.sp.gov.br/das/obras/geojson/ (352 obras, JSON, acesso direto)
  - Licitacoes: https://api.sorocaba.sp.gov.br/pub-consulta/api/publicacao
      Requer browser (SSL nao funciona via requests puro)
      7180 registros no total, sem filtro de ano no servidor.
      Filtrar localmente por anoPublicacao in [2020, 2021].
  - PDFs de licitacao: /api/publicacao/{id}/anexo/{anexo_id}

Destinos:
  - data/raw/sorocaba/contratos/obras/obras_sorocaba.json
  - data/raw/sorocaba/contratos/obras/obras_sorocaba_detalhes.json
  - data/raw/sorocaba/contratos/legados/2020-2021/indice_licitacoes.json
  - data/raw/sorocaba/contratos/legados/2020-2021/{codigo_processo}/{nome_arquivo}.pdf

Uso:
    py -3 pipelines\\baixar_contratos_legados_playwright.py --fonte obras
    py -3 pipelines\\baixar_contratos_legados_playwright.py --fonte licitacoes --apenas-listar
    py -3 pipelines\\baixar_contratos_legados_playwright.py --fonte licitacoes --baixar
    py -3 pipelines\\baixar_contratos_legados_playwright.py --fonte licitacoes --baixar --limite-mb 5
    py -3 pipelines\\baixar_contratos_legados_playwright.py --fonte obras --fonte licitacoes
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path

import requests
import urllib3

# Forçar UTF-8 no stdout (Windows pode usar cp1252 por padrão)
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

urllib3.disable_warnings()

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    import sys
    print("ERRO: playwright nao instalado. Execute: pip install playwright && playwright install chromium")
    sys.exit(1)

from paths import RAW_DIR

CONTRATOS_RAW_DIR = RAW_DIR / "contratos"
OBRAS_RAW_DIR = CONTRATOS_RAW_DIR / "obras"
LICIT_RAW_DIR = CONTRATOS_RAW_DIR / "legados" / "2020-2021"

OBRAS_GEOJSON_URL = "https://apps.sorocaba.sp.gov.br/das/obras/geojson/"
OBRAS_DETALHE_URL = "https://apps.sorocaba.sp.gov.br/das/obras/{obra_id}/"
PUB_API_BASE = "https://api.sorocaba.sp.gov.br/pub-consulta/api"
PUB_PORTAL_URL = "https://api.sorocaba.sp.gov.br/pub-consulta/#/publicacoes"

ANOS_ALVO = {2020, 2021}


# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------

def _slug(texto: str, maxlen: int = 60) -> str:
    s = re.sub(r"[^a-z0-9]+", "_", texto.lower().strip())
    return s[:maxlen].strip("_")


def _validar_pdf(caminho: Path) -> bool:
    with caminho.open("rb") as f:
        return f.read(4) == b"%PDF"


def _salvar_json(caminho: Path, data: object) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with caminho.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Salvo: {caminho} ({caminho.stat().st_size // 1024} KB)")


# ---------------------------------------------------------------------------
# OBRAS
# ---------------------------------------------------------------------------

def baixar_obras(apenas_listar: bool = False) -> dict:
    """Baixa o GeoJSON de obras e opcionalmente os detalhes de cada obra."""
    session = requests.Session()
    session.headers["User-Agent"] = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )

    print("\n" + "=" * 60)
    print("FONTE: Obras Municipais de Sorocaba")
    print(f"URL: {OBRAS_GEOJSON_URL}")

    # 1. GeoJSON principal
    resp = session.get(OBRAS_GEOJSON_URL, verify=False, timeout=30)
    resp.raise_for_status()
    geojson = resp.json()
    features = geojson.get("features", [])
    print(f"Total de obras: {len(features)}")

    # Deduplicar por obra_id (GeoJSON pode ter múltiplas geometrias por obra)
    vistas = set()
    obras_unicas = []
    for f in features:
        oid = f.get("properties", {}).get("obra_id")
        if oid not in vistas:
            vistas.add(oid)
            obras_unicas.append(f)
    print(f"Obras únicas (deduplicado por obra_id): {len(obras_unicas)}")

    if apenas_listar:
        print("\nListagem de obras (apenas-listar ativo):")
        for f in obras_unicas[:20]:
            p = f.get("properties", {})
            print(f"  [{p.get('obra_id')}] {p.get('contrato')} | cpl={p.get('cpl')} | {p.get('objeto','')[:60]}")
        if len(obras_unicas) > 20:
            print(f"  ... e mais {len(obras_unicas) - 20} obras")
        return {"total": len(obras_unicas), "baixados": 0}

    # 2. Salvar GeoJSON
    OBRAS_RAW_DIR.mkdir(parents=True, exist_ok=True)
    destino_geojson = OBRAS_RAW_DIR / "obras_sorocaba.geojson"
    with destino_geojson.open("w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    print(f"  GeoJSON salvo: {destino_geojson} ({destino_geojson.stat().st_size // 1024} KB)")

    # 3. Extrair dados estruturados de cada obra (via página HTML) para campos adicionais
    print(f"\nColetando detalhes de {len(obras_unicas)} obras via HTML...")
    detalhes = []

    for f in obras_unicas:
        props = f.get("properties", {})
        obra_id = props.get("obra_id")
        if not obra_id:
            continue

        url_detalhe = OBRAS_DETALHE_URL.format(obra_id=obra_id)
        try:
            r = session.get(url_detalhe, verify=False, timeout=20)
            if r.status_code == 200:
                r.encoding = "iso-8859-1"
                html = r.text
                detalhe = dict(props)

                # Campos adicionais presentes no HTML.
                # Cada pattern e ancorado no rotulo exato em <td class="fw-bold">.
                # O valor da obra esta no rotulo "Valor Total da Obra:" (nao ha "Valor do Contrato" na pagina).
                for campo, pattern in [
                    ("empresa_contratada", r'Empresa Contratada:</td>\s*<td[^>]*>(.*?)</td>'),
                    ("cnpj", r'CNPJ:</td>\s*<td[^>]*>(.*?)</td>'),
                    ("percentual_concluido", r'Percentual conclu[^:<]+:</td>\s*<td[^>]*>(.*?)</td>'),
                    ("financiadora", r'Financiadora:</td>\s*<td[^>]*>(.*?)</td>'),
                    ("valor_contrato", r'Valor Total da Obra:</td>\s*<td[^>]*>(.*?)</td>'),
                ]:
                    m = re.search(pattern, html, re.DOTALL)
                    if m:
                        detalhe[campo] = re.sub(r"<[^>]+>", "", m.group(1)).strip()

                detalhes.append(detalhe)
            else:
                detalhes.append(dict(props))
        except Exception as e:
            print(f"  AVISO: erro ao buscar obra {obra_id}: {e}")
            detalhes.append(dict(props))

        time.sleep(0.3)

    _salvar_json(OBRAS_RAW_DIR / "obras_sorocaba_detalhes.json", detalhes)
    print(f"  Total de detalhes coletados: {len(detalhes)}")
    return {"total": len(features), "baixados": len(detalhes)}


# ---------------------------------------------------------------------------
# LICITAÇÕES 2020-2021
# ---------------------------------------------------------------------------

def _fetch_via_js(page, url: str, retries: int = 3) -> dict | None:
    """
    Faz fetch via JavaScript no contexto do browser (mantém sessão TLS corretamente).
    Evita TLS disconnect que ocorre com page.request.get() em sequência.
    """
    for attempt in range(retries):
        try:
            result = page.evaluate(
                """async (url) => {
                    try {
                        const r = await fetch(url, {
                            method: 'GET',
                            headers: { 'Accept': 'application/json' }
                        });
                        if (!r.ok) return { __status: r.status, __error: r.statusText };
                        const bytes = await r.arrayBuffer();
                        const decoder = new TextDecoder('iso-8859-1');
                        return JSON.parse(decoder.decode(bytes));
                    } catch(e) {
                        return { __error: e.message };
                    }
                }""",
                url,
            )
            if isinstance(result, dict) and result.get("__error"):
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                return None
            return result
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
    return None


def _paginar_licitacoes(page, total_paginas: int, delay: float = 0.5) -> list[dict]:
    """Pagina pela API (via JS fetch) e retorna registros com anoPublicacao em ANOS_ALVO."""
    encontrados = []
    total_processados = 0

    for p_num in range(1, total_paginas + 1):
        url = f"{PUB_API_BASE}/publicacao?page={p_num}&itens_per_page=100"
        data = _fetch_via_js(page, url)

        if not data:
            print(f"  Pagina {p_num}: falha, continuando...")
            time.sleep(delay * 2)
            continue

        if isinstance(data, dict) and data.get("__status"):
            print(f"  Pagina {p_num}: status HTTP {data['__status']}, continuando...")
            time.sleep(delay * 2)
            continue

        items = data.get("itemList", []) if isinstance(data, dict) else []
        total_processados += len(items)

        for item in items:
            ano = item.get("anoPublicacao")
            if ano in ANOS_ALVO:
                encontrados.append(item)

        if p_num % 50 == 0 or p_num == total_paginas:
            print(f"  Pagina {p_num}/{total_paginas}: {total_processados} processados, {len(encontrados)} em 2020-2021")

        time.sleep(delay)

    return encontrados


def coletar_licitacoes(apenas_listar: bool = False, baixar_pdfs: bool = False,
                       limite_mb: float = 10.0) -> dict:
    """Coleta o índice de licitações 2020-2021 e opcionalmente baixa PDFs."""
    print("\n" + "=" * 60)
    print("FONTE: Publicações/Licitações (pub-consulta API)")
    print(f"URL: {PUB_PORTAL_URL}")
    print(f"Anos alvo: {sorted(ANOS_ALVO)}")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
            locale="pt-BR",
            ignore_https_errors=True,
        )
        page = ctx.new_page()

        # Carregar portal para estabelecer sessão TLS
        print("Estabelecendo sessão no portal...")
        page.goto(PUB_PORTAL_URL, wait_until="networkidle", timeout=45000)
        time.sleep(2)

        # Descobrir total de registros e pageCount real via JS fetch
        meta = _fetch_via_js(page, f"{PUB_API_BASE}/publicacao?page=1")
        total_items = meta.get("itemCount", 7180) if meta else 7180
        total_paginas = meta.get("pageCount", 718) if meta else 718
        items_por_pagina = meta.get("itemList", [None] * 10).__len__() if meta else 10
        print(f"Total na API: {total_items} registros, {total_paginas} paginas de {items_por_pagina}")

        if apenas_listar:
            # Paginar tudo mas só listar sem salvar
            print(f"Paginando {total_paginas} paginas para encontrar 2020-2021 (sem baixar PDFs)...")
            registros = _paginar_licitacoes(page, total_paginas, delay=0.3)
            print(f"\nTotal encontrado: {len(registros)} registros de 2020-2021")
            for item in registros[:15]:
                print(f"  {item.get('anoPublicacao')} | {item.get('codigoProcesso')} | {item.get('modalidade')} | {item.get('descricaoObjeto','')[:60]}")
            if len(registros) > 15:
                print(f"  ... e mais {len(registros) - 15} registros")
            browser.close()
            return {"total_api": total_items, "registros_2020_2021": len(registros)}

        # Paginação completa
        print(f"\nPaginando {total_paginas} paginas para encontrar 2020-2021...")
        registros = _paginar_licitacoes(page, total_paginas, delay=0.3)
        print(f"\nTotal encontrado: {len(registros)} registros de 2020-2021")

        # Salvar índice
        LICIT_RAW_DIR.mkdir(parents=True, exist_ok=True)
        indice_path = LICIT_RAW_DIR / "indice_licitacoes.json"
        _salvar_json(indice_path, {
            "data_coleta": "2026-05-22",
            "anos_cobertos": sorted(ANOS_ALVO),
            "total_registros": len(registros),
            "fonte": PUB_PORTAL_URL,
            "registros": registros,
        })

        if not baixar_pdfs:
            print("\n--baixar nao ativado. Use --baixar para baixar PDFs.")
            browser.close()
            return {"total_api": total_items, "licitacoes_2020_2021": len(registros), "pdfs_baixados": 0}

        # Baixar PDFs
        limite_bytes = int(limite_mb * 1024 * 1024)
        pdfs_baixados = 0
        pdfs_pulados = 0
        pdfs_erros = 0

        print(f"\nBaixando PDFs (limite {limite_mb} MB por arquivo)...")

        for reg in registros:
            pub_id = reg.get("id")
            codigo = re.sub(r"[^\w]", "_", str(reg.get("codigoProcesso", pub_id)))
            ano = reg.get("anoPublicacao", "")
            destino_dir = LICIT_RAW_DIR / str(ano) / codigo
            destino_dir.mkdir(parents=True, exist_ok=True)

            # Buscar lista de anexos
            try:
                anexos = _fetch_via_js(page, f"{PUB_API_BASE}/publicacao/{pub_id}/anexo")
                if not isinstance(anexos, list):
                    continue
            except Exception as e:
                print(f"  ERRO ao buscar anexos {pub_id}: {e}")
                continue

            for anexo in anexos:
                anexo_id = int(anexo.get("id", 0))
                nome_orig = anexo.get("nomeOriginalArquivo", f"anexo_{anexo_id}.pdf")
                tamanho = int(anexo.get("tamanhoArquivo", 0))
                mime = anexo.get("mimeTypeDocumento", "")

                if "pdf" not in mime.lower():
                    continue  # Só PDFs

                if tamanho > limite_bytes:
                    print(f"  PULADO (>{limite_mb}MB): {nome_orig} ({tamanho // (1024*1024)} MB)")
                    pdfs_pulados += 1
                    continue

                # Sanitizar nome do arquivo: strip diretorios + caracteres invalidos no Windows.
                # Mantem somente o "leaf" e remove \\/:*?"<>| (e quebras de linha) para fechar path traversal.
                nome_seguro = re.sub(r'[\\/:*?"<>|\r\n]', "_", Path(nome_orig).name).strip(". ")
                if not nome_seguro:
                    nome_seguro = f"anexo_{anexo_id}.pdf"
                destino = destino_dir / nome_seguro
                if destino.exists() and destino.stat().st_size > 500:
                    continue  # Já existe

                try:
                    url_pdf = f"{PUB_API_BASE}/publicacao/{pub_id}/anexo/{anexo_id}"
                    # PDF download via page.request (único request, sessão já estabelecida)
                    resp_pdf = page.request.get(url_pdf, timeout=90_000)
                    if resp_pdf.status == 200:
                        conteudo = resp_pdf.body()
                        parcial = destino.with_suffix(destino.suffix + ".part")
                        parcial.write_bytes(conteudo)
                        parcial.replace(destino)
                        if _validar_pdf(destino):
                            print(f"  OK: {destino.relative_to(LICIT_RAW_DIR)} ({len(conteudo)//1024} KB)")
                            pdfs_baixados += 1
                        else:
                            print(f"  AVISO: header PDF invalido: {nome_orig}")
                            pdfs_erros += 1
                    else:
                        print(f"  ERRO status {resp_pdf.status}: {url_pdf}")
                        pdfs_erros += 1
                except Exception as e:
                    print(f"  ERRO ao baixar {nome_orig}: {e}")
                    # Tentar via JS fetch para binário
                    pdfs_erros += 1

                time.sleep(0.5)

            time.sleep(0.3)

        browser.close()

    print(f"\nResultado: {pdfs_baixados} PDFs baixados | {pdfs_pulados} pulados | {pdfs_erros} erros")
    return {
        "total_api": total_items,
        "licitacoes_2020_2021": len(registros),
        "pdfs_baixados": pdfs_baixados,
        "pdfs_pulados": pdfs_pulados,
        "pdfs_erros": pdfs_erros,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Baixa contratos/obras de Sorocaba")
    parser.add_argument("--fonte", choices=["obras", "licitacoes"], action="append",
                        help="Fonte a baixar (padrao: obras)")
    parser.add_argument("--apenas-listar", action="store_true",
                        help="Listar sem baixar")
    parser.add_argument("--baixar", action="store_true",
                        help="Efetivamente baixar PDFs de licitacoes (pode ser grande)")
    parser.add_argument("--limite-mb", type=float, default=10.0,
                        help="Tamanho maximo por PDF em MB (padrao: 10)")
    args = parser.parse_args()

    fontes = args.fonte or ["obras"]
    resultados = {}

    if "obras" in fontes:
        resultados["obras"] = baixar_obras(apenas_listar=args.apenas_listar)

    if "licitacoes" in fontes:
        resultados["licitacoes"] = coletar_licitacoes(
            apenas_listar=args.apenas_listar,
            baixar_pdfs=args.baixar,
            limite_mb=args.limite_mb,
        )

    print("\n" + "=" * 60)
    print("RESUMO:")
    for k, v in resultados.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
