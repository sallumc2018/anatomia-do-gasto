from __future__ import annotations

import csv
import html
import re
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "extracted" / "sorocaba" / "tce" / "contas_municipais"
URL = "https://fazenda.sorocaba.sp.gov.br/transparencia/"


def fetch_text(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "anatomia-do-gasto/1.0 (+inventario-pareceres-sorocaba)"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
    for encoding in ("utf-8", "windows-1252", "iso-8859-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            pass
    return raw.decode("utf-8", errors="replace")


def links(html_text: str) -> list[dict[str, str]]:
    pattern = re.compile(r"<a\b[^>]*href=[\"']([^\"']+)[\"'][^>]*>(.*?)</a>", re.I | re.S)
    out: list[dict[str, str]] = []
    for href, label_html in pattern.findall(html_text):
        label = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(label_html))).strip()
        url = urllib.parse.urljoin(URL, html.unescape(href))
        out.append({"rotulo": label, "url": url})
    return out


def inventariar() -> list[dict[str, str]]:
    text = fetch_text(URL)
    rows: list[dict[str, str]] = []
    for item in links(text):
        rotulo = item["rotulo"]
        if "Parecer" not in rotulo and "Decisão Camara Municipal" not in rotulo:
            continue
        if "contas" not in rotulo.lower() and "camara municipal" not in rotulo.lower():
            continue
        year = re.search(r"(20\d{2}|19\d{2})", rotulo)
        if not year or ".pdf" not in item["url"].lower():
            continue
        tipo = "parecer_previo_prefeitura" if "Parecer" in rotulo else "decisao_camara"
        rows.append(
            {
                "municipio": "sorocaba",
                "orgao": "Prefeitura Municipal de Sorocaba" if tipo == "parecer_previo_prefeitura" else "Camara Municipal de Sorocaba",
                "tipo": tipo,
                "ano_exercicio": year.group(1) if year else "",
                "rotulo": rotulo,
                "url": item["url"],
                "fonte_pagina": URL,
                "status": "inventariado",
                "observacao": "link oficial do portal da transparencia municipal; documento TCE-SP/contas municipais",
            }
        )
    rows.sort(key=lambda row: (row["tipo"], row["ano_exercicio"], row["rotulo"]))
    return rows


def main() -> int:
    rows = inventariar()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "pareceres_tce_sorocaba.csv"
    fields = ["municipio", "orgao", "tipo", "ano_exercicio", "rotulo", "url", "fonte_pagina", "status", "observacao"]
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    print(f"{path.relative_to(ROOT).as_posix()}: {len(rows)} linhas")
    return 0 if rows else 1


if __name__ == "__main__":
    raise SystemExit(main())
