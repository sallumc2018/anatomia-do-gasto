"""
Gera catalogo Linked Data dos datasets publicados.

Saidas publicas:
  data/public/linked/catalog.jsonld
  data/public/linked/catalog.ttl

Objetivo: elevar a camada publica para 4 estrelas Tim Berners-Lee:
dados abertos estruturados em formatos nao proprietarios, com URIs estaveis
para municipio, dataset e distribuicao.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATASETS = ROOT / "data" / "manifests" / "datasets.csv"
PUBLIC_ROOT = ROOT / "data" / "public"
PUBLIC_SOROCABA = PUBLIC_ROOT / "sorocaba"
OUT_DIR = PUBLIC_ROOT / "linked"
BASE_URL = "https://www.anatomiadogasto.ong.br"
ID_BASE = f"{BASE_URL}/id"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = value.replace("/", "-")
    value = re.sub(r"[^a-z0-9_-]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "dataset"


def area_path(area: str) -> Path:
    return Path(*[part for part in area.split("/") if part])


def pattern_to_regex(pattern: str) -> re.Pattern[str]:
    escaped = re.escape(pattern).replace(r"\{ano\}", r"\d{4}")
    return re.compile(f"^{escaped}$")


def public_files(area: str, pattern: str, origem: str) -> list[Path]:
    if origem != "public":
        return []
    base = PUBLIC_SOROCABA / area_path(area) / "saida"
    if not base.exists():
        return []
    if "{ano}" in pattern:
        regex = pattern_to_regex(pattern)
        return sorted(p for p in base.glob("*.csv") if regex.match(p.name))
    path = base / pattern
    return [path] if path.exists() else []


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def api_download_url(path: Path) -> str:
    rel = path.relative_to(PUBLIC_ROOT).as_posix()
    return f"{BASE_URL}/api/dados/{rel}"


def read_datasets() -> list[dict[str, str]]:
    with DATASETS.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def build_jsonld() -> dict:
    dataset_nodes: list[dict] = []
    for row in read_datasets():
        municipio = row["municipio"].strip()
        if municipio != "sorocaba":
            continue
        area = row["Area"].strip()
        tipo = row["Tipo"].strip()
        pattern = row["Arquivo_Padrao"].strip()
        origem = row.get("Origem_Dir", "public").strip()
        files = public_files(area, pattern, origem)
        if not files:
            continue

        dataset_id = f"{ID_BASE}/dataset/{municipio}/{slugify(area)}/{slugify(tipo)}"
        distributions = []
        for path in files:
            dist_id = f"{ID_BASE}/distribution/{municipio}/{slugify(path.stem)}"
            distributions.append(
                {
                    "@id": dist_id,
                    "@type": "dcat:Distribution",
                    "dcterms:title": path.name,
                    "dcat:mediaType": "text/csv",
                    "dcat:downloadURL": api_download_url(path),
                    "schema:contentUrl": api_download_url(path),
                    "schema:encodingFormat": "text/csv",
                    "schema:sha256": sha256(path),
                }
            )

        dataset_nodes.append(
            {
                "@id": dataset_id,
                "@type": "dcat:Dataset",
                "dcterms:title": row["Descricao"].strip(),
                "dcterms:identifier": f"{municipio}:{slugify(area)}:{slugify(tipo)}",
                "dcterms:spatial": {"@id": f"{ID_BASE}/municipio/{municipio}"},
                "dcterms:publisher": {"@id": f"{ID_BASE}/organization/anatomia-do-gasto"},
                "dcterms:source": row["Fonte"].strip(),
                "dcterms:temporal": row["Anos"].strip(),
                "dcat:theme": area,
                "dcat:distribution": distributions,
            }
        )

    return {
        "@context": {
            "dcat": "http://www.w3.org/ns/dcat#",
            "dcterms": "http://purl.org/dc/terms/",
            "schema": "https://schema.org/",
            "xsd": "http://www.w3.org/2001/XMLSchema#",
        },
        "@id": f"{ID_BASE}/catalog/anatomia-do-gasto",
        "@type": "dcat:Catalog",
        "dcterms:title": "Catalogo publico Anatomia do Gasto",
        "dcterms:publisher": {"@id": f"{ID_BASE}/organization/anatomia-do-gasto"},
        "dcterms:modified": str(date.today()),
        "dcat:dataset": dataset_nodes,
        "@graph": [
            {
                "@id": f"{ID_BASE}/organization/anatomia-do-gasto",
                "@type": "schema:Organization",
                "schema:name": "Anatomia do Gasto",
                "schema:url": BASE_URL,
            },
            {
                "@id": f"{ID_BASE}/municipio/sorocaba",
                "@type": "schema:AdministrativeArea",
                "schema:name": "Sorocaba",
                "schema:identifier": "IBGE:3552205",
                "schema:sameAs": "https://www.wikidata.org/wiki/Q1018709",
            },
        ],
    }


def ttl_literal(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def build_ttl(payload: dict) -> str:
    lines = [
        "@prefix dcat: <http://www.w3.org/ns/dcat#> .",
        "@prefix dcterms: <http://purl.org/dc/terms/> .",
        "@prefix schema: <https://schema.org/> .",
        "",
        f"<{payload['@id']}> a dcat:Catalog ;",
        f"  dcterms:title {ttl_literal(payload['dcterms:title'])} ;",
        f"  dcterms:modified {ttl_literal(payload['dcterms:modified'])} ;",
    ]
    datasets = payload["dcat:dataset"]
    if datasets:
        lines.append("  dcat:dataset")
        for idx, dataset in enumerate(datasets):
            end = " ." if idx == len(datasets) - 1 else " ,"
            lines.append(f"    <{dataset['@id']}>{end}")
    else:
        lines[-1] = lines[-1].rstrip(" ;") + " ."
    lines.append("")

    for node in payload["@graph"]:
        lines.append(f"<{node['@id']}> a {node['@type']} ;")
        if node["@type"] == "schema:Organization":
            lines.append(f"  schema:name {ttl_literal(node['schema:name'])} ;")
            lines.append(f"  schema:url <{node['schema:url']}> .")
        else:
            lines.append(f"  schema:name {ttl_literal(node['schema:name'])} ;")
            lines.append(f"  schema:identifier {ttl_literal(node['schema:identifier'])} ;")
            lines.append(f"  schema:sameAs <{node['schema:sameAs']}> .")
        lines.append("")

    for dataset in datasets:
        lines.append(f"<{dataset['@id']}> a dcat:Dataset ;")
        lines.append(f"  dcterms:title {ttl_literal(dataset['dcterms:title'])} ;")
        lines.append(f"  dcterms:identifier {ttl_literal(dataset['dcterms:identifier'])} ;")
        lines.append(f"  dcterms:spatial <{dataset['dcterms:spatial']['@id']}> ;")
        lines.append(f"  dcterms:publisher <{dataset['dcterms:publisher']['@id']}> ;")
        lines.append(f"  dcterms:source {ttl_literal(dataset['dcterms:source'])} ;")
        lines.append(f"  dcterms:temporal {ttl_literal(dataset['dcterms:temporal'])} ;")
        lines.append(f"  dcat:theme {ttl_literal(dataset['dcat:theme'])} ;")
        lines.append("  dcat:distribution")
        distributions = dataset["dcat:distribution"]
        for idx, dist in enumerate(distributions):
            end = " ." if idx == len(distributions) - 1 else " ,"
            lines.append(f"    <{dist['@id']}>{end}")
        lines.append("")
        for dist in distributions:
            lines.append(f"<{dist['@id']}> a dcat:Distribution ;")
            lines.append(f"  dcterms:title {ttl_literal(dist['dcterms:title'])} ;")
            lines.append(f"  dcat:mediaType {ttl_literal(dist['dcat:mediaType'])} ;")
            lines.append(f"  dcat:downloadURL <{dist['dcat:downloadURL']}> ;")
            lines.append(f"  schema:sha256 {ttl_literal(dist['schema:sha256'])} .")
            lines.append("")
    return "\n".join(lines)


def main() -> None:
    payload = build_jsonld()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "catalog.jsonld").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (OUT_DIR / "catalog.ttl").write_text(build_ttl(payload), encoding="utf-8")
    print(f"Linked Data datasets: {len(payload['dcat:dataset'])}")
    print("Wrote data/public/linked/catalog.jsonld")
    print("Wrote data/public/linked/catalog.ttl")


if __name__ == "__main__":
    main()
