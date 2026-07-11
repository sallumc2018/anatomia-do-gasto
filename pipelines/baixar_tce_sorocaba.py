"""
Inventaria e coleta fontes oficiais TCE-SP/AUDESP para o municipio selecionado.

O municipio vem da env var MUNICIPIO (via pipelines/paths.py); default: sorocaba.

Regras do projeto:
  - brutos em ANATOMIA_RAW_ROOT/<municipio>/tce quando a variavel existir;
  - recortes mecanicos em data/extracted/<municipio>/tce;
  - nada e gravado em data/public.

Exemplos:
  python pipelines\\baixar_tce_sorocaba.py --apenas-inventario
  MUNICIPIO=paulinia python pipelines\\baixar_tce_sorocaba.py --amostra-transparencia --ano 2025 --mes 1
  MUNICIPIO=paulinia python pipelines\\baixar_tce_sorocaba.py
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import unicodedata

from paths import CFG, EXTRACTED_DIR, MUNICIPIO, RAW_DIR

TCE_SLUG = MUNICIPIO.replace("_", "-")


MUNICIPIO_NOME = CFG["nome"]


def _sem_acentos(texto: str) -> str:
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
TCE_HOST = "https://www.tce.sp.gov.br"
TRANSPARENCIA_HOST = "https://transparencia.tce.sp.gov.br"
MAPA_CAMARAS_URL = (
    "https://painel.tce.sp.gov.br/pentaho/api/repos/%3Apublic%3ACamara%3Acamara.wcdf/"
    "generatedContent?password=zero&userid=anony"
)
ALERTAS_ANALITICO_URL = (
    "https://transparencia.tce.sp.gov.br/sites/default/files/conjunto-dados/"
    "alertas/alertas_analitico.csv"
)
_COMUNICADOS_SDG_2025_TODOS = [
    {
        "comunicado": "SDG 41/2025",
        "bimestre": "2",
        "ano": "2025",
        "processo": "6710/989/24",
        "municipio": "Sorocaba",
        "responsavel": "RODRIGO MAGANHATO",
        "incisos": "I,V",
        "url": "https://www.tce.sp.gov.br/sites/default/files/legislacao/COMUNICADO%20SDG%2041-2025%20-%20Alertas%202Bim_disponibilizado%20no%20dia%2014%20de%20junho%20de%202025.pdf",
        "observacao": "recorte localizado em comunicado oficial; extracao textual integral do PDF pendente",
    },
    {
        "comunicado": "SDG 48/2025",
        "bimestre": "3",
        "ano": "2025",
        "processo": "6710/989/24",
        "municipio": "Sorocaba",
        "responsavel": "RODRIGO MAGANHATO",
        "incisos": "I,V",
        "url": "https://www.tce.sp.gov.br/sites/default/files/legislacao/COMUNICADO-SDG-48-2025-JUNHO_disponibilizado%20no%20dia%2013%20de%20agosto%20de%202025.pdf",
        "observacao": "recorte confirmado em achado anterior; extracao textual integral do PDF pendente",
    },
    {
        "comunicado": "SDG 57/2025",
        "bimestre": "4",
        "ano": "2025",
        "processo": "6710/989/24",
        "municipio": "Sorocaba",
        "responsavel": "RODRIGO MAGANHATO",
        "incisos": "I,V",
        "url": "https://www.tce.sp.gov.br/sites/default/files/legislacao/COMUNICADO-SDG-57-2025-OUTUBRO_disponibilizado%20no%20dia%2010%20de%20outubro%20de%202025.pdf",
        "observacao": "recorte localizado em comunicado oficial; extracao textual integral do PDF pendente",
    },
    {
        "comunicado": "SDG 75/2025",
        "bimestre": "5",
        "ano": "2025",
        "processo": "6710/989/24",
        "municipio": "Sorocaba",
        "responsavel": "RODRIGO MAGANHATO",
        "incisos": "I,V",
        "url": "https://www.tce.sp.gov.br/sites/default/files/legislacao/Comunicado%20SDG%2075-2025%20-%20Alertas%205-BIM%20CORRIGIDO.pdf",
        "observacao": "recorte localizado em comunicado oficial corrigido; extracao textual integral do PDF pendente",
    },
]

# Comunicados SDG sao especificos de cada municipio; para outros municipios a lista
# fica vazia ate que recortes oficiais proprios sejam inventariados.
COMUNICADOS_SDG_2025 = [
    item
    for item in _COMUNICADOS_SDG_2025_TODOS
    if _sem_acentos(item["municipio"]).casefold() == _sem_acentos(MUNICIPIO_NOME).casefold()
]
USER_AGENT = f"anatomia-do-gasto/1.0 (+coleta-tce-{MUNICIPIO})"


@dataclass(frozen=True)
class Fonte:
    categoria: str
    nome: str
    url: str
    formato: str
    objetivo: str


FONTES_BASE = [
    Fonte("audesp", "AUDESP", f"{TCE_HOST}/audesp", "html", "pagina institucional e links publicos AUDESP"),
    Fonte(
        "audesp",
        "AUDESP comunicados",
        f"{TCE_HOST}/comunicados?area=26",
        "html",
        "indice de comunicados da area AUDESP",
    ),
    Fonte("processos", "Pesquisa de Processos", f"{TCE_HOST}/processos", "html", "entrada oficial da busca processual"),
    Fonte(
        "processos",
        "Iframe pesquisa processual",
        "https://www10.tce.sp.gov.br/pesquisa-drupal.asp",
        "html",
        "formulario legado usado pela pagina de processos",
    ),
    Fonte(
        "contas_anuais",
        "Contas Anuais Municipais (Zip)",
        "https://transparencia.tce.sp.gov.br/sites/default/files/conjunto-dados/pareceres/pareceres.zip",
        "zip",
        "base de dados consolidada de pareceres prévios de contas municipais",
    ),
    Fonte(
        "transparencia",
        "Portal da Transparencia Municipal",
        f"{TRANSPARENCIA_HOST}/",
        "html",
        "entrada do portal municipal mantido pelo TCE-SP",
    ),
    Fonte(
        "transparencia",
        "APIs do Portal da Transparencia Municipal",
        f"{TRANSPARENCIA_HOST}/apis",
        "html",
        "documentacao de endpoints publicos JSON/XML",
    ),
    Fonte(
        "transparencia",
        "Conjunto de Dados",
        f"{TRANSPARENCIA_HOST}/conjunto-de-dados",
        "html",
        "arquivos abertos de despesas, receitas e alertas",
    ),
    Fonte(
        "transparencia",
        "Municipios API",
        f"{TRANSPARENCIA_HOST}/api/json/municipios",
        "json",
        "lista oficial de slugs de municipios",
    ),
    Fonte(
        "alertas",
        "Alertas analitico",
        ALERTAS_ANALITICO_URL,
        "csv",
        "base analitica de alertas por municipio, entidade e item",
    ),
    *[
        Fonte(
            "alertas_sdg",
            item["comunicado"],
            item["url"],
            "pdf",
            "comunicado oficial de alertas LRF SDG",
        )
        for item in COMUNICADOS_SDG_2025
    ],
    Fonte(
        "mapa_camaras",
        "Mapa das Camaras",
        MAPA_CAMARAS_URL,
        "html",
        "painel oficial de custos e julgamento de contas das camaras",
    ),
]


def agora_id() -> str:
    return datetime.now().strftime("%Y-%m-%d_%H%M%S")


def data_id() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def sha256_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def request_bytes(url: str, timeout: int, retries: int, pausa: float) -> tuple[int, bytes, str]:
    ultima: BaseException | None = None
    headers = {
        "Accept": "*/*",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "User-Agent": USER_AGENT,
    }
    for tentativa in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
                content_type = resp.headers.get("Content-Type", "")
                return int(resp.status), raw, content_type
        except urllib.error.HTTPError as exc:
            body = exc.read()
            return int(exc.code), body, exc.headers.get("Content-Type", "")
        except (TimeoutError, urllib.error.URLError) as exc:
            ultima = exc
            if tentativa >= retries:
                raise
            time.sleep(pausa * (tentativa + 1))
    raise RuntimeError(f"falha ao baixar {url}: {ultima}")


def salvar_bytes(path: Path, raw: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_bytes(raw)
    tmp.replace(path)


def salvar_json(path: Path, data: Any) -> None:
    raw = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8")
    salvar_bytes(path, raw + b"\n")


def escrever_csv(path: Path, campos: list[str], linhas: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        for linha in linhas:
            writer.writerow({campo: linha.get(campo, "") for campo in campos})


def nome_arquivo_fonte(fonte: Fonte) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", fonte.nome.lower()).strip("_")
    ext = {"html": "html", "json": "json", "csv": "csv", "pdf": "pdf", "zip": "zip"}.get(fonte.formato, "bin")
    return f"{slug}.{ext}"


def texto_html(raw: bytes) -> str:
    for encoding in ("utf-8", "iso-8859-1", "windows-1252"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            pass
    return raw.decode("utf-8", errors="replace")


def links_html(raw: bytes, base_url: str) -> list[dict[str, str]]:
    texto = texto_html(raw)
    padrao = re.compile(r"<a\b[^>]*href=[\"']([^\"']+)[\"'][^>]*>(.*?)</a>", re.I | re.S)
    links = []
    for href, label_html in padrao.findall(texto):
        label = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(label_html))).strip()
        url = urllib.parse.urljoin(base_url, html.unescape(href))
        links.append({"url": url, "rotulo": label})
    return links


def inventariar_fontes(raw_base: Path, timeout: int, retries: int, pausa: float) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    linhas: list[dict[str, Any]] = []
    links: list[dict[str, Any]] = []
    for fonte in FONTES_BASE:
        rel = Path("fontes") / fonte.categoria / nome_arquivo_fonte(fonte)
        destino = raw_base / rel
        try:
            status, raw, content_type = request_bytes(fonte.url, timeout, retries, pausa)
            salvar_bytes(destino, raw)
            ok = 200 <= status < 300
            linhas.append(
                {
                    "categoria": fonte.categoria,
                    "nome": fonte.nome,
                    "url": fonte.url,
                    "formato": fonte.formato,
                    "objetivo": fonte.objetivo,
                    "status_http": status,
                    "content_type": content_type,
                    "bytes": len(raw),
                    "sha256": sha256_bytes(raw),
                    "raw_path": str(destino),
                    "status_coleta": "ok" if ok else "bloqueio",
                    "observacao": "" if ok else "retorno HTTP nao 2xx",
                }
            )
            if fonte.formato == "html":
                for item in links_html(raw, fonte.url):
                    links.append(
                        {
                            "fonte_categoria": fonte.categoria,
                            "fonte_nome": fonte.nome,
                            "rotulo": item["rotulo"],
                            "url": item["url"],
                        }
                    )
        except Exception as exc:  # noqa: BLE001 - inventario deve registrar bloqueio operacional
            linhas.append(
                {
                    "categoria": fonte.categoria,
                    "nome": fonte.nome,
                    "url": fonte.url,
                    "formato": fonte.formato,
                    "objetivo": fonte.objetivo,
                    "status_http": "",
                    "content_type": "",
                    "bytes": "",
                    "sha256": "",
                    "raw_path": str(destino),
                    "status_coleta": "bloqueio",
                    "observacao": type(exc).__name__ + ": " + str(exc),
                }
            )
    return linhas, links


def filtrar_links_relevantes(links: list[dict[str, Any]]) -> list[dict[str, Any]]:
    termos = (
        MUNICIPIO,
        _sem_acentos(MUNICIPIO_NOME).lower(),
        "audesp",
        "comunicado",
        "processo",
        "contas",
        "parecer",
        "despesa",
        "receita",
        "alerta",
        "camara",
        "câmara",
        "api/",
        "csv",
        "zip",
        "pdf",
    )
    vistos = set()
    saida = []
    for link in links:
        alvo = f"{link.get('rotulo', '')} {link.get('url', '')}".lower()
        if not any(t in alvo for t in termos):
            continue
        chave = (link.get("fonte_nome"), link.get("url"))
        if chave in vistos:
            continue
        vistos.add(chave)
        saida.append(link)
    return saida


def coletar_alertas_municipio(raw_base: Path, extracted_base: Path, timeout: int, retries: int, pausa: float) -> dict[str, Any]:
    status, raw, content_type = request_bytes(ALERTAS_ANALITICO_URL, timeout, retries, pausa)
    raw_path = raw_base / "alertas" / "alertas_analitico.csv"
    salvar_bytes(raw_path, raw)
    texto = texto_html(raw)
    reader = csv.DictReader(texto.splitlines(), delimiter=";")
    linhas = []
    for row in reader:
        municipio = (row.get("Município") or row.get("Municipio") or "").strip()
        if _sem_acentos(municipio).casefold() == _sem_acentos(MUNICIPIO_NOME).casefold():
            linhas.append(row)
    campos = list(reader.fieldnames or [])
    out_csv = extracted_base / "alertas" / f"alertas_{MUNICIPIO}.csv"
    escrever_csv(out_csv, campos, linhas)
    resumo = {
        "url": ALERTAS_ANALITICO_URL,
        "status_http": status,
        "content_type": content_type,
        "raw_path": str(raw_path),
        "sha256": sha256_bytes(raw),
        "linhas_municipio": len(linhas),
        "por_exercicio": dict(Counter(row.get("Exercício", "") for row in linhas)),
        "por_mes": dict(Counter(row.get("Mês", "") for row in linhas)),
        "por_entidade": dict(Counter(row.get("Entidade", "") for row in linhas)),
        "por_item_prefixo": dict(Counter((row.get("Item de Análise", "")[:4]).strip() for row in linhas)),
        "saida_csv": str(out_csv),
    }
    salvar_json(extracted_base / "alertas" / f"alertas_{MUNICIPIO}.resumo.json", resumo)
    return resumo


def escrever_recorte_comunicados_sdg(extracted_base: Path) -> dict[str, Any]:
    out_csv = extracted_base / "alertas" / f"alertas_sdg_2025_{MUNICIPIO}.csv"
    campos = [
        "comunicado",
        "ano",
        "bimestre",
        "processo",
        "municipio",
        "responsavel",
        "incisos",
        "url",
        "observacao",
    ]
    escrever_csv(out_csv, campos, COMUNICADOS_SDG_2025)
    resumo = {
        "linhas": len(COMUNICADOS_SDG_2025),
        "processos": sorted({item["processo"] for item in COMUNICADOS_SDG_2025}),
        "anos": sorted({item["ano"] for item in COMUNICADOS_SDG_2025}),
        "bimestres": sorted({item["bimestre"] for item in COMUNICADOS_SDG_2025}),
        "incisos": dict(Counter(item["incisos"] for item in COMUNICADOS_SDG_2025)),
        "saida_csv": str(out_csv),
        "status": "recorte inventarial de comunicados oficiais; requer extracao textual/OCR para validacao completa",
    }
    salvar_json(extracted_base / "alertas" / f"alertas_sdg_2025_{MUNICIPIO}.resumo.json", resumo)
    return resumo


def inventariar_contas_anuais(raw_base: Path, extracted_base: Path) -> dict[str, Any]:
    import zipfile
    
    zip_path = raw_base / "fontes" / "contas_anuais" / "contas_anuais_municipais_zip.zip"
    if not zip_path.exists():
        # Fallback para tentar achar qualquer arquivo .zip ou .bin na pasta
        diretorio = raw_base / "fontes" / "contas_anuais"
        zips = list(diretorio.glob("*.zip")) + list(diretorio.glob("*.bin"))
        if zips:
            zip_path = zips[0]
        else:
            return {"bloqueio": f"Arquivo zip de contas anuais nao encontrado em {diretorio}"}
            
    pdfs = []
    try:
        with zipfile.ZipFile(zip_path) as z:
            # Encontra o arquivo CSV dentro do ZIP
            csv_name = [name for name in z.namelist() if name.endswith(".csv")]
            if not csv_name:
                return {"bloqueio": "Nenhum arquivo CSV encontrado dentro do ZIP de contas anuais"}
            
            raw_csv = z.read(csv_name[0])
            # Trata decodificação do CSV
            conteudo = ""
            for encoding in ("utf-8", "windows-1252", "iso-8859-1"):
                try:
                    conteudo = raw_csv.decode(encoding)
                    break
                except UnicodeDecodeError:
                    pass
            if not conteudo:
                conteudo = raw_csv.decode("utf-8", errors="replace")
                
            reader = csv.DictReader(conteudo.splitlines(), delimiter=";")
            ibge_alvo = CFG.get("ibge", "")
            
            for row in reader:
                # O CSV possui: codigo_ibge;municipio;exercicio;processo;parecer;voto_link;data_transito_julgado
                codigo_ibge = row.get("codigo_ibge", "").strip()
                if codigo_ibge != ibge_alvo:
                    continue
                
                url = row.get("voto_link", "").strip()
                if not url or ".pdf" not in url.lower():
                    continue
                    
                nome = Path(urllib.parse.urlparse(url).path).name
                ano = row.get("exercicio", "").strip()
                parecer = row.get("parecer", "").strip()
                processo = row.get("processo", "").strip()
                transito = row.get("data_transito_julgado", "").strip()
                
                pdfs.append(
                    {
                        "categoria": "contas_anuais",
                        "ano_referencia_publicacao": ano,
                        "rotulo": f"Parecer Previo - Exercicio {ano} - Processo {processo} ({parecer})",
                        "arquivo": nome,
                        "url": url,
                        "status": "inventariado",
                        "observacao": f"Parecer {parecer} oficial do TCE-SP. Transito em julgado: {transito}",
                    }
                )
    except Exception as e:
        return {"bloqueio": f"Erro ao processar o arquivo ZIP: {e}"}

    out = extracted_base / "contas_anuais" / "inventario_pdfs_contas_anuais.csv"
    campos = [
        "categoria",
        "ano_referencia_publicacao",
        "rotulo",
        "arquivo",
        "url",
        "status",
        "observacao",
    ]
    escrever_csv(out, campos, pdfs)
    resumo = {
        "pdfs_inventariados": len(pdfs),
        "anos_publicacao": sorted({p["ano_referencia_publicacao"] for p in pdfs if p["ano_referencia_publicacao"]}),
        "saida_csv": str(out),
    }
    salvar_json(extracted_base / "contas_anuais" / "inventario_pdfs_contas_anuais.resumo.json", resumo)
    return resumo


def coletar_amostra_transparencia(
    raw_base: Path,
    extracted_base: Path,
    anos: list[int],
    meses: list[int],
    timeout: int,
    retries: int,
    pausa: float,
) -> dict[str, Any]:
    linhas = []
    for dataset in ("despesas", "receitas"):
        for ano in anos:
            for mes in meses:
                url = f"{TRANSPARENCIA_HOST}/api/json/{dataset}/{TCE_SLUG}/{ano}/{mes}"
                rel = Path("transparencia") / dataset / f"ano={ano}" / f"mes={mes:02d}.json"
                raw_path = raw_base / rel
                try:
                    status, raw, content_type = request_bytes(url, timeout, retries, pausa)
                    salvar_bytes(raw_path, raw)
                    try:
                        data = json.loads(raw.decode("utf-8"))
                        registros = len(data) if isinstance(data, list) else 1
                        campos = sorted(data[0].keys()) if isinstance(data, list) and data and isinstance(data[0], dict) else []
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        registros = ""
                        campos = []
                    linhas.append(
                        {
                            "dataset": dataset,
                            "ano": ano,
                            "mes": mes,
                            "url": url,
                            "status_http": status,
                            "content_type": content_type,
                            "bytes": len(raw),
                            "sha256": sha256_bytes(raw),
                            "registros": registros,
                            "campos": "|".join(campos),
                            "raw_path": str(raw_path),
                            "status_coleta": "ok" if 200 <= status < 300 else "bloqueio",
                            "observacao": "",
                        }
                    )
                except Exception as exc:  # noqa: BLE001
                    linhas.append(
                        {
                            "dataset": dataset,
                            "ano": ano,
                            "mes": mes,
                            "url": url,
                            "status_http": "",
                            "content_type": "",
                            "bytes": "",
                            "sha256": "",
                            "registros": "",
                            "campos": "",
                            "raw_path": str(raw_path),
                            "status_coleta": "bloqueio",
                            "observacao": type(exc).__name__ + ": " + str(exc),
                        }
                    )
    out = extracted_base / "transparencia" / "amostras_api_transparencia.csv"
    campos = [
        "dataset",
        "ano",
        "mes",
        "url",
        "status_http",
        "content_type",
        "bytes",
        "sha256",
        "registros",
        "campos",
        "raw_path",
        "status_coleta",
        "observacao",
    ]
    escrever_csv(out, campos, linhas)
    resumo = {
        "consultas": len(linhas),
        "ok": sum(1 for linha in linhas if linha["status_coleta"] == "ok"),
        "bloqueios": sum(1 for linha in linhas if linha["status_coleta"] != "ok"),
        "registros_por_dataset": {
            dataset: sum(int(linha["registros"] or 0) for linha in linhas if linha["dataset"] == dataset)
            for dataset in sorted({linha["dataset"] for linha in linhas})
        },
        "saida_csv": str(out),
    }
    salvar_json(extracted_base / "transparencia" / "amostras_api_transparencia.resumo.json", resumo)
    return resumo


def escrever_relatorio_tmp(path: Path, resumo: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    linhas = [
        f"# TCE-SP/AUDESP - {MUNICIPIO_NOME}",
        "",
        f"Consulta/coleta: {datetime.now().isoformat(timespec='seconds')}",
        "",
        "## Fontes oficiais inventariadas",
    ]
    for item in resumo["fontes"]:
        linhas.append(
            f"- {item['categoria']} | {item['nome']} | HTTP {item['status_http']} | {item['url']}"
        )
    linhas.extend(["", "## Achados mecanicos"])
    alertas = resumo.get("alertas") or {}
    linhas.append(f"- Alertas {MUNICIPIO_NOME} no CSV analitico: {alertas.get('linhas_municipio', 0)} linhas.")
    if alertas.get("por_exercicio"):
        linhas.append(f"- Alertas por exercicio: {alertas['por_exercicio']}.")
    if resumo.get("alertas_sdg_2025"):
        sdg = resumo["alertas_sdg_2025"]
        linhas.append(
            f"- Comunicados SDG 2025: processo(s) {sdg.get('processos', [])}, bimestres {sdg.get('bimestres', [])}, "
            f"incisos {sdg.get('incisos', {})}."
        )
    if resumo.get("contas_anuais"):
        linhas.append(
            f"- Contas anuais: {resumo['contas_anuais'].get('pdfs_inventariados', 0)} PDFs inventariados na pagina oficial."
        )
    if resumo.get("transparencia_amostras"):
        amostras = resumo["transparencia_amostras"]
        linhas.append(
            f"- API Transparencia: {amostras.get('consultas', 0)} consultas, {amostras.get('ok', 0)} OK, "
            f"{amostras.get('bloqueios', 0)} bloqueios."
        )
    linhas.extend(["", "## Bloqueios"])
    bloqueios = [f for f in resumo["fontes"] if f.get("status_coleta") != "ok"]
    if not bloqueios:
        linhas.append("- Nenhum bloqueio HTTP nas fontes-base coletadas.")
    for item in bloqueios:
        linhas.append(f"- {item['nome']}: {item.get('observacao', '')}")
    linhas.append(
        "- Pesquisa processual legado retornou formulario HTML, mas a consulta POST direta exige fluxo/sessao do portal; "
        "ficou inventariada para automacao posterior por navegador ou sessao HTTP."
    )
    path.write_text("\n".join(linhas) + "\n", encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ano", action="append", type=int, help="ano para amostra da API de transparencia")
    parser.add_argument("--mes", action="append", type=int, help="mes para amostra da API de transparencia")
    parser.add_argument("--apenas-inventario", action="store_true", help="nao coleta alertas nem amostras")
    parser.add_argument(
        "--amostra-transparencia",
        action="store_true",
        help="coleta amostra despesas/receitas da API municipal",
    )
    parser.add_argument("--timeout", type=int, default=60)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--pausa", type=float, default=1.0)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    run_id = agora_id()
    raw_base = RAW_DIR / "tce" / data_id()
    extracted_base = EXTRACTED_DIR / "tce"
    extracted_base.mkdir(parents=True, exist_ok=True)

    fontes, links = inventariar_fontes(raw_base, args.timeout, args.retries, args.pausa)
    escrever_csv(
        extracted_base / f"inventario_fontes_tce_{MUNICIPIO}.csv",
        [
            "categoria",
            "nome",
            "url",
            "formato",
            "objetivo",
            "status_http",
            "content_type",
            "bytes",
            "sha256",
            "raw_path",
            "status_coleta",
            "observacao",
        ],
        fontes,
    )
    escrever_csv(
        extracted_base / f"links_relevantes_tce_{MUNICIPIO}.csv",
        ["fonte_categoria", "fonte_nome", "rotulo", "url"],
        filtrar_links_relevantes(links),
    )

    resumo: dict[str, Any] = {
        "run_id": run_id,
        "raw_base": str(raw_base),
        "extracted_base": str(extracted_base),
        "fontes": fontes,
        "links_relevantes": len(filtrar_links_relevantes(links)),
    }

    if not args.apenas_inventario:
        resumo["alertas"] = coletar_alertas_municipio(
            raw_base, extracted_base, args.timeout, args.retries, args.pausa
        )
        resumo["alertas_sdg_2025"] = escrever_recorte_comunicados_sdg(extracted_base)
        resumo["contas_anuais"] = inventariar_contas_anuais(raw_base, extracted_base)

    if args.amostra_transparencia and not args.apenas_inventario:
        anos = args.ano or [2025]
        meses = args.mes or [1]
        resumo["transparencia_amostras"] = coletar_amostra_transparencia(
            raw_base, extracted_base, anos, meses, args.timeout, args.retries, args.pausa
        )

    salvar_json(extracted_base / f"resumo_coleta_tce_{MUNICIPIO}.json", resumo)
    escrever_relatorio_tmp(Path(f"tmp/orquestrador-{MUNICIPIO}-100/tce.md"), resumo)

    print(json.dumps(resumo, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
