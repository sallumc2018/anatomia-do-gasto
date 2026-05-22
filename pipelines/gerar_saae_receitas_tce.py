"""
Baixa e publica receitas do SAAE Sorocaba via API do TCE-SP.

Entrada:  API https://transparencia.tce.sp.gov.br/api/json/receitas/sorocaba/{ano}/{mes}
Saída:    data/public/sorocaba/autarquias/saida/saae_receitas_tce_{ano}.csv
          data/public/sorocaba/autarquias/saida/saae_receitas_tce_2020_2025.csv

Fonte: Portal de Transparência TCE-SP — https://transparencia.tce.sp.gov.br
"""
import csv
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "autarquias" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

BASE_URL = "https://transparencia.tce.sp.gov.br/api/json/receitas/sorocaba"
ORGAO_SAAE = "SERVIÇO AUTÔNOMO DE ÁGUA E ESGOTO DE SOROCABA"
ANOS = list(range(2020, 2026))
MESES = list(range(1, 13))
DELAY = 0.3

CAMPOS = [
    "ano", "mes", "orgao", "ds_fonte_recurso", "ds_cd_aplicacao_fixo",
    "ds_alinea", "ds_subalinea", "vl_arrecadacao",
]


def br2f(v: str) -> float:
    return float(v.replace(".", "").replace(",", ".")) if v else 0.0


def buscar_mes(ano: int, mes: int) -> list[dict]:
    url = f"{BASE_URL}/{ano}/{mes}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            dados = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return []
        raise
    except Exception as e:
        print(f"  AVISO {ano}/{mes}: {e}")
        return []
    if not isinstance(dados, list):
        return []
    return [
        {
            "ano": str(ano),
            "mes": str(mes).zfill(2),
            "orgao": r.get("orgao", ""),
            "ds_fonte_recurso": r.get("ds_fonte_recurso", ""),
            "ds_cd_aplicacao_fixo": r.get("ds_cd_aplicacao_fixo", ""),
            "ds_alinea": r.get("ds_alinea", ""),
            "ds_subalinea": r.get("ds_subalinea", ""),
            "vl_arrecadacao": r.get("vl_arrecadacao", ""),
        }
        for r in dados
        if r.get("orgao", "").upper() == ORGAO_SAAE.upper()
    ]


def main() -> None:
    todos: list[dict] = []
    for ano in ANOS:
        ano_registros: list[dict] = []
        for mes in MESES:
            registros = buscar_mes(ano, mes)
            ano_registros.extend(registros)
            time.sleep(DELAY)

        total_ano = sum(br2f(r["vl_arrecadacao"]) for r in ano_registros)
        print(f"  {ano}: {len(ano_registros)} registros, R$ {total_ano:,.0f}")

        out_ano = PUBLIC / f"saae_receitas_tce_{ano}.csv"
        with out_ano.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=CAMPOS)
            w.writeheader()
            w.writerows(ano_registros)
        todos.extend(ano_registros)

    out = PUBLIC / "saae_receitas_tce_2020_2025.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(todos)

    total_geral = sum(br2f(r["vl_arrecadacao"]) for r in todos)
    print(f"Publicado: {len(todos)} registros -> {out}")
    print(f"Total receitas SAAE 2020-2025: R$ {total_geral:,.0f}")


if __name__ == "__main__":
    main()
