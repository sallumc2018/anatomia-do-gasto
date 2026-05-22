"""
Baixa e publica transferências federais para Sorocaba via API do TCE-SP.

A API do TCE-SP disponibiliza receitas mensais por alínea contábil. Este script
filtra alíneas de transferências da União (FPM, FNDE/FUNDEB, SUS, CIDE, etc.)
para os anos 2020-2025.

Entrada:  API https://transparencia.tce.sp.gov.br/api/json/receitas/sorocaba/{ano}/{mes}
Saída:    data/public/sorocaba/transferencias/saida/transferencias_federais_tce_sorocaba.csv

Fonte: Portal de Transparência TCE-SP — https://transparencia.tce.sp.gov.br
"""
import csv
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "transferencias" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

BASE_URL = "https://transparencia.tce.sp.gov.br/api/json/receitas/sorocaba"
ORGAO_PREF = "PREFEITURA MUNICIPAL DE SOROCABA"
ANOS = list(range(2020, 2026))
MESES = list(range(1, 13))
DELAY = 0.25

# Alíneas de transferências da União (PCASP):
#   171 = Transferências correntes da União → FPM, SUS federal, Salário-Educação
#   175 = Transferências de fundos nacionais → FNDE, FUNDEB complementação da União
#   241 = Transferências de capital da União
# NÃO incluir 172 (estados: ICMS, IPVA) nem 173/174 (municípios/outros)
PREFIXOS_FEDERAIS = ("171", "175", "241")

CAMPOS = [
    "ano", "mes", "orgao", "ds_alinea", "ds_subalinea",
    "ds_fonte_recurso", "ds_cd_aplicacao_fixo", "vl_arrecadacao",
]


def br2f(v: str) -> float:
    return float(v.replace(".", "").replace(",", ".")) if v else 0.0


def eh_federal(alinea: str) -> bool:
    codigo = alinea.split(" - ")[0].strip()
    return any(codigo.startswith(p) for p in PREFIXOS_FEDERAIS)


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
            "ds_alinea": r.get("ds_alinea", ""),
            "ds_subalinea": r.get("ds_subalinea", ""),
            "ds_fonte_recurso": r.get("ds_fonte_recurso", ""),
            "ds_cd_aplicacao_fixo": r.get("ds_cd_aplicacao_fixo", ""),
            "vl_arrecadacao": r.get("vl_arrecadacao", ""),
        }
        for r in dados
        if r.get("orgao", "").upper() == ORGAO_PREF.upper()
        and eh_federal(r.get("ds_alinea", ""))
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
        todos.extend(ano_registros)

    out = PUBLIC / "transferencias_federais_tce_sorocaba.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(todos)

    total_geral = sum(br2f(r["vl_arrecadacao"]) for r in todos)
    print(f"Publicado: {len(todos)} registros -> {out}")
    print(f"Total transferências federais 2020-2025: R$ {total_geral:,.0f}")

    # Mostrar principais categorias
    from collections import defaultdict
    por_tipo: dict[str, float] = defaultdict(float)
    for r in todos:
        alinea = r["ds_alinea"][:50]
        por_tipo[alinea] += br2f(r["vl_arrecadacao"])
    print("\nPrincipais transferências federais:")
    for alinea, total in sorted(por_tipo.items(), key=lambda x: -x[1])[:10]:
        print(f"  R$ {total:>15,.0f}  {alinea}")


if __name__ == "__main__":
    main()
