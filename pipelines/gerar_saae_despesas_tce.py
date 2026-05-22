"""
Baixa e publica despesas do SAAE Sorocaba via API do TCE-SP.

A API do TCE-SP (transparencia.tce.sp.gov.br) disponibiliza despesas mensais
para todos os órgãos municipais, incluindo autarquias como o SAAE.

Entrada:  API https://transparencia.tce.sp.gov.br/api/json/despesas/sorocaba/{ano}/{mes}
Saída:    data/public/sorocaba/autarquias/saida/saae_despesas_tce_{ano}.csv
          data/public/sorocaba/autarquias/saida/saae_despesas_tce_2020_2025.csv

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

BASE_URL = "https://transparencia.tce.sp.gov.br/api/json/despesas/sorocaba"
ORGAO_SAAE = "SERVIÇO AUTÔNOMO DE ÁGUA E ESGOTO DE SOROCABA"
ANOS = list(range(2020, 2026))
MESES = list(range(1, 13))
DELAY = 0.3

CAMPOS = [
    "ano", "mes", "orgao", "evento", "nr_empenho",
    "id_fornecedor", "nm_fornecedor", "dt_emissao_despesa", "vl_despesa",
]


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
    filtrados = [
        {
            "ano": str(ano),
            "mes": str(mes).zfill(2),
            "orgao": r.get("orgao", ""),
            "evento": r.get("evento", ""),
            "nr_empenho": r.get("nr_empenho", ""),
            "id_fornecedor": r.get("id_fornecedor", ""),
            "nm_fornecedor": r.get("nm_fornecedor", ""),
            "dt_emissao_despesa": r.get("dt_emissao_despesa", ""),
            "vl_despesa": r.get("vl_despesa", ""),
        }
        for r in dados
        if r.get("orgao", "").upper() == ORGAO_SAAE.upper()
    ]
    return filtrados


def main() -> None:
    todos: list[dict] = []
    for ano in ANOS:
        ano_registros: list[dict] = []
        for mes in MESES:
            registros = buscar_mes(ano, mes)
            ano_registros.extend(registros)
            time.sleep(DELAY)

        def br2f(v: str) -> float:
            return float(v.replace(".", "").replace(",", ".")) if v else 0.0
        total_ano = sum(br2f(r["vl_despesa"]) for r in ano_registros)
        print(f"  {ano}: {len(ano_registros)} registros, R$ {total_ano:,.0f}")

        out_ano = PUBLIC / f"saae_despesas_tce_{ano}.csv"
        with out_ano.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=CAMPOS)
            w.writeheader()
            w.writerows(ano_registros)
        todos.extend(ano_registros)

    out = PUBLIC / "saae_despesas_tce_2020_2025.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(todos)

    def br2f(v: str) -> float:
        return float(v.replace(".", "").replace(",", ".")) if v else 0.0
    total_geral = sum(br2f(r["vl_despesa"]) for r in todos)
    print(f"Publicado: {len(todos)} registros -> {out}")
    print(f"Total geral SAAE 2020-2025: R$ {total_geral:,.0f}")


if __name__ == "__main__":
    main()
