"""
Scraper de votações nominais — Câmara Municipal de Paulínia.

Sistema: Siscam. Portal: https://paulinia.siscam.com.br
(domínio antigo www.paulinia.sp.leg.br não resolve mais — descoberto e
validado em 2026-07-10 via pipelines/baixar_camara_votacoes_sorocaba.py
e probing manual: o menu "Atividade Legislativa" do site institucional
www.camarapaulinia.sp.gov.br aponta para este domínio Siscam).

Ambas as páginas usadas (listagem e detalhe) são HTML renderizado no
servidor — não precisa de Playwright, requests+BeautifulSoup bastam.

Coleta:
  1. Enumera votações no período pedido via listagem paginada
     (GET /Votacoes/Pesquisa?Pagina=N&PeriodoInicial=...&PeriodoFinal=...),
     extraindo os IDs de /Votacoes/Votacao/{id} presentes nos links.
  2. Para cada ID, busca o detalhe (GET /Votacoes/Votacao/{id}) e extrai
     metadados da matéria + tabela nominal por vereador.

Uso:
    .venv/bin/python3 pipelines/baixar_camara_votacoes_paulinia.py
    .venv/bin/python3 pipelines/baixar_camara_votacoes_paulinia.py --anos 2025 2026
    .venv/bin/python3 pipelines/baixar_camara_votacoes_paulinia.py --anos 2026 --apenas-listar

Saída:
    data/public/paulinia/camara/saida/camara_votacoes_paulinia_{ano}.csv

Schema CSV:
    ano, data_sessao, numero_sessao, tipo_sessao,
    numero_pl, tipo_pl, ementa,
    resultado_geral, vereador, partido, voto
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

BASE_URL = "https://paulinia.siscam.com.br"
PESQUISA_URL = f"{BASE_URL}/Votacoes/Pesquisa"
VOTACAO_URL = f"{BASE_URL}/Votacoes/Votacao/{{id}}"

PUBLIC_DIR = ROOT / "data/public/paulinia/camara/saida"
RAW_DIR = ROOT / "data/raw/paulinia/camara/votacoes"

ANOS_PADRAO = [2025, 2026]

FIELDNAMES = [
    "ano", "data_sessao", "numero_sessao", "tipo_sessao",
    "numero_pl", "tipo_pl", "ementa",
    "resultado_geral", "vereador", "partido", "voto",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

VOTACAO_ID_RE = re.compile(r"/Votacoes/Votacao/(\d+)")


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def _get(session: requests.Session, url: str, params: dict | None = None, timeout: int = 25) -> requests.Response | None:
    try:
        resp = session.get(url, params=params, headers=HEADERS, timeout=timeout)
        resp.raise_for_status()
        return resp
    except requests.RequestException as exc:
        print(f"  ERRO GET {url}: {exc}", file=sys.stderr)
        return None


def enumerar_votacao_ids(session: requests.Session, ano: int, debug: bool) -> list[str]:
    """Percorre a listagem paginada e retorna os IDs de votação únicos do ano."""
    ids: list[str] = []
    seen: set[str] = set()
    periodo_inicial = f"01/01/{ano}"
    periodo_final = f"31/12/{ano}"

    pagina = 1
    while True:
        params = {
            "Pagina": pagina,
            "Materia": 0, "Sessao": 0,
            "PeriodoInicial": periodo_inicial, "PeriodoFinal": periodo_final,
            "Votacao": 0, "Fase": 0, "Resultado": 0, "VotanteId": 0,
            "Voto": "Nenhum", "TipoAutor": "Todos", "AutoriaId": 0, "Assunto": "",
        }
        resp = _get(session, PESQUISA_URL, params=params)
        if resp is None:
            break

        found = VOTACAO_ID_RE.findall(resp.text)
        novos = [vid for vid in found if vid not in seen]
        if not novos:
            break

        for vid in novos:
            seen.add(vid)
            ids.append(vid)

        if debug:
            print(f"    página {pagina}: +{len(novos)} votações (total {len(ids)})")

        pagina += 1
        time.sleep(0.5)

    return ids


def _extrair_metadados(soup: BeautifulSoup) -> dict:
    campos: dict[str, str] = {}
    for p in soup.select("#content .row p"):
        strong = p.find("strong")
        if not strong:
            continue
        label = _clean(strong.get_text()).rstrip(":")
        valor = _clean(p.get_text().replace(strong.get_text(), ""))
        # "Data" aparece duas vezes (data do processo, data da sessão) — mantém a última
        campos[label] = valor
    return campos


def parse_votacao(html: str) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")
    h3 = soup.find("h3", class_="page-header")
    if not h3:
        return None
    small = h3.find("small")
    numero_pl = _clean(small.get_text().lstrip("- ").strip()) if small else ""
    tipo_m = re.match(r"[A-Za-zÀ-ÿ]+", numero_pl)
    tipo_pl = tipo_m.group(0).upper() if tipo_m else ""

    campos = _extrair_metadados(soup)
    ementa = campos.get("Assunto", "")
    resultado_geral = campos.get("Resultado", campos.get("Situação", ""))

    sessao_p = soup.find("strong", string=re.compile(r"Sessão", re.I))
    numero_sessao, tipo_sessao, data_sessao = "", "", ""
    if sessao_p:
        sessao_texto = _clean(sessao_p.parent.get_text())
        sessao_texto = sessao_texto.replace("Sessão:", "").strip()
        m = re.match(r"(\d+)ª\s+Sessão\s+(\w+)", sessao_texto, re.I)
        if m:
            numero_sessao, tipo_sessao = m.group(1), m.group(2)
    # segunda ocorrência de "Data:" no bloco da sessão é a data da sessão
    data_labels = soup.select("#content .row p")
    datas = [
        _clean(p.get_text().replace(p.find("strong").get_text(), ""))
        for p in data_labels
        if p.find("strong") and _clean(p.find("strong").get_text()).rstrip(":") == "Data"
    ]
    if datas:
        data_sessao = datas[-1]

    votos = []
    tabela = soup.find("table", class_=re.compile("table"))
    if tabela:
        for tr in tabela.select("tbody tr"):
            tds = tr.find_all("td")
            if len(tds) < 3:
                continue
            vereador = _clean(tds[0].get_text())
            partido = _clean(tds[1].get_text())
            voto = _clean(tds[2].get_text())
            if vereador:
                votos.append({"vereador": vereador, "partido": partido, "voto": voto})

    return {
        "numero_pl": numero_pl,
        "tipo_pl": tipo_pl,
        "ementa": ementa,
        "resultado_geral": resultado_geral,
        "numero_sessao": numero_sessao,
        "tipo_sessao": tipo_sessao,
        "data_sessao": data_sessao,
        "votos": votos,
    }


def coletar_ano(session: requests.Session, ano: int, apenas_listar: bool, debug: bool) -> list[dict]:
    print(f"  Enumerando votações de {ano} …")
    ids = enumerar_votacao_ids(session, ano, debug)
    print(f"  {len(ids)} votação(ões) encontrada(s) em {ano}")

    if apenas_listar:
        for vid in ids:
            print(f"    /Votacoes/Votacao/{vid}")
        return []

    rows: list[dict] = []
    for i, vid in enumerate(ids, 1):
        resp = _get(session, VOTACAO_URL.format(id=vid))
        if resp is None:
            continue
        info = parse_votacao(resp.text)
        if not info:
            print(f"    AVISO: não foi possível parsear votação {vid}", file=sys.stderr)
            continue

        if not info["votos"]:
            rows.append({
                "ano": ano,
                "data_sessao": info["data_sessao"],
                "numero_sessao": info["numero_sessao"],
                "tipo_sessao": info["tipo_sessao"],
                "numero_pl": info["numero_pl"],
                "tipo_pl": info["tipo_pl"],
                "ementa": info["ementa"],
                "resultado_geral": info["resultado_geral"],
                "vereador": "", "partido": "", "voto": "",
            })
        else:
            for v in info["votos"]:
                rows.append({
                    "ano": ano,
                    "data_sessao": info["data_sessao"],
                    "numero_sessao": info["numero_sessao"],
                    "tipo_sessao": info["tipo_sessao"],
                    "numero_pl": info["numero_pl"],
                    "tipo_pl": info["tipo_pl"],
                    "ementa": info["ementa"],
                    "resultado_geral": info["resultado_geral"],
                    "vereador": v["vereador"],
                    "partido": v["partido"],
                    "voto": v["voto"],
                })

        if debug and i % 20 == 0:
            print(f"    {i}/{len(ids)} votações processadas")
        time.sleep(0.3)

    return rows


def salvar_csv(rows: list[dict], ano: int) -> Path:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    dest = PUBLIC_DIR / f"camara_votacoes_paulinia_{ano}.csv"
    with dest.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  Salvo: {dest.name} ({len(rows)} linhas)")
    return dest


def main() -> int:
    parser = argparse.ArgumentParser(description="Scraper votações Câmara Paulínia (Siscam)")
    parser.add_argument("--anos", nargs="+", type=int, default=ANOS_PADRAO)
    parser.add_argument("--apenas-listar", action="store_true")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    total = 0

    for ano in sorted(args.anos):
        print(f"\n── {ano} ──────────────────────────────")
        rows = coletar_ano(session, ano, args.apenas_listar, args.debug)
        if not args.apenas_listar:
            if rows:
                salvar_csv(rows, ano)
                total += len(rows)
            else:
                print(f"  AVISO: nenhuma votação coletada para {ano}")

    print(f"\nTotal: {total} registros coletados")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
