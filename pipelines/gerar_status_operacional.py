"""
Gera apps/web/lib/status_operacional.json: snapshot de cobertura para o
painel interno (/admin). Lê data/manifests/<municipio>/mapa_cobertura.csv
(Sprint 1) e conta municípios coletados em data/public (Sprint 2 Brasil).

Uso:
    python pipelines/gerar_status_operacional.py
"""
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = ROOT / "data" / "manifests"
DATA_PUBLIC = ROOT / "data" / "public"
OUT = ROOT / "apps" / "web" / "lib" / "status_operacional.json"

SPRINT1_MUNICIPIOS = {
    "sorocaba": "Sorocaba",
    "paulinia": "Paulínia",
    "sao_paulo": "São Paulo",
    "sao_bernardo": "São Bernardo do Campo",
}

TOTAL_MUNICIPIOS_BRASIL = 5571


def cobertura_municipio(slug: str) -> dict | None:
    caminho = MANIFESTS / slug / "mapa_cobertura.csv"
    if not caminho.exists():
        return None
    with open(caminho, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    total = len(rows)
    publicado = sum(1 for r in rows if r.get("status_auditavel", "").startswith("publicado"))
    lacuna = sum(1 for r in rows if r.get("status_auditavel", "") == "lacuna")
    return {
        "total": total,
        "publicado": publicado,
        "lacuna": lacuna,
        "pct": round(publicado / total * 100, 1) if total else 0.0,
    }


def main():
    sprint1 = {}
    for slug, nome in SPRINT1_MUNICIPIOS.items():
        cob = cobertura_municipio(slug)
        if cob:
            sprint1[slug] = {"nome": nome, **cob}

    sprint2_coletados = sum(
        1
        for d in DATA_PUBLIC.iterdir()
        if d.is_dir() and not d.name.startswith("_") and d.name not in SPRINT1_MUNICIPIOS
    )

    dados = {
        "_gerado_em": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_nota": "Gerado por pipelines/gerar_status_operacional.py — não editar manualmente",
        "sprint1": sprint1,
        "sprint2": {
            "coletados": sprint2_coletados,
            "total_brasil": TOTAL_MUNICIPIOS_BRASIL,
            "pct": round(sprint2_coletados / TOTAL_MUNICIPIOS_BRASIL * 100, 2),
        },
    }

    OUT.write_text(json.dumps(dados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"-> {OUT} ({len(sprint1)} municípios Sprint1, {sprint2_coletados} Sprint2)")


if __name__ == "__main__":
    main()
