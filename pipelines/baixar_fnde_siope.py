"""
Coleta dados de educação (repasses FNDE + indicador MDE) para Sorocaba e Paulínia.

Fontes (todas públicas — sem LAI):
  1. FNDE Transferências (PDDE, PNAE, PNATE, FUNDEB)
     SEM FONTE AUTOMATIZÁVEL no momento (verificado em 2026-07-09): o endpoint
     `/api-de-dados/transferencias/municipios` do Portal da Transparência NÃO
     existe no swagger v3 atual (confirmado via /v3/api-docs — só há
     `/despesas/tipo-transferencia` [agregado federal, não por município] e
     `/convenios` [acordos voluntários, não repasse constitucional/automático]).
     Sem endpoint público conhecido para repasses automáticos por município.
     dados.gov.br (portal FNDE redireciona pra lá) investigado em 2026-07-09:
     a API pública migrou para um novo backend que exige Bearer token
     (`www-authenticate: Bearer` em toda chamada, inclusive sem query) — não
     é mais CKAN anônimo. Emitir a chave requer login gov.br + cadastro no
     portal (ação humana única, fora do escopo de coleta automatizada).
     Pendência real: se o usuário cadastrar uma chave de API em dados.gov.br,
     dá pra reavaliar. Até lá, fica stub "sem_dados_sem_fonte".

  2. Indicador MDE (Manutenção e Desenvolvimento do Ensino) — via SICONFI
     RREO Anexo 14 (Demonstrativo Simplificado), NÃO mais via scraping do
     SIOPE/FNDE: o formulário https://www.fnde.gov.br/siope/*.do agora exige
     reCAPTCHA em toda consulta ("É necessário validar o captcha", verificado
     em 2026-07-09) — inviável de automatizar sem burlar proteção anti-bot.
     Fonte substituta (mesma API já usada pelos extratores de segurança/
     transporte/receita): https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo
     Conta: "Mínimo Anual de <18%/25%> das Receitas de Impostos na Manutenção
     e Desenvolvimento do Ensino" (cod_conta
     MinimoAnualDasReceitasDeImpostosNaManutencaoEDesenvolvimentoDoEnsinoDemonstrativoSimplificado)
     Colunas usadas: "Valor Apurado Até o Bimestre" (despesa aplicada em MDE),
     "% Mínimo a Aplicar no Exercício" (limite constitucional, 25% para
     municípios pós EC 108/2020), "% Aplicado Até o Bimestre".
     receita_vinculada_mde fica vazio (AUSENTE) — o RREO Anexo 14 não reporta
     a receita-base separadamente, só a despesa aplicada e o percentual; não
     inferir/calcular esse valor para não apresentar dado derivado como se
     fosse oficial.

IBGEs:
  Sorocaba: 3552205
  Paulínia:  3536505

Uso:
    .venv/bin/python3 pipelines/baixar_fnde_siope.py
    .venv/bin/python3 pipelines/baixar_fnde_siope.py --fonte fnde
    .venv/bin/python3 pipelines/baixar_fnde_siope.py --fonte siope --municipios sorocaba
    .venv/bin/python3 pipelines/baixar_fnde_siope.py --anos 2022 2023 2024

Saída:
    data/public/{municipio}/educacao/saida/fnde_repasses_{municipio}_{ano}.csv
    data/public/{municipio}/educacao/saida/siope_{municipio}_{ano}.csv

Schema FNDE CSV:
    ano, municipio, ibge7, programa, valor_repassado, data_ultimo_repasse, fonte

Schema SIOPE CSV:
    ano, municipio, ibge7, receita_vinculada_mde, despesa_mde,
    percentual_aplicado, limite_constitucional_pct, situacao
"""
from __future__ import annotations

import argparse
import csv
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    import requests
    HTTP_OK = True
except ImportError:
    HTTP_OK = False

MUNICIPIOS = {
    "sorocaba": {"ibge7": "3552205", "nome": "Sorocaba"},
    "paulinia":  {"ibge7": "3536505", "nome": "Paulinia"},
    "sao_paulo": {"ibge7": "3550308", "nome": "Sao Paulo"},
    "sao_bernardo": {"ibge7": "3548708", "nome": "Sao Bernardo do Campo"},
}

ANOS_PADRAO = list(range(2015, 2026))

# SICONFI — indicador MDE (RREO Anexo 14)
SICONFI_BASE = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt"
BIMESTRE_RREO = 6  # bimestre 6 = acumulado anual, o mais completo de cada exercício

FNDE_FIELDNAMES = [
    "ano", "municipio", "ibge7", "programa",
    "valor_repassado", "data_ultimo_repasse", "fonte",
]
SIOPE_FIELDNAMES = [
    "ano", "municipio", "ibge7",
    "receita_vinculada_mde", "despesa_mde",
    "percentual_aplicado", "limite_constitucional_pct", "situacao",
]


def _session(api_key: str | None = None) -> "requests.Session":
    s = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; AnatomiaDoGasto/1.0; +https://anatomiadogasto.ong.br)",
        "Accept": "application/json",
    }
    if api_key:
        headers["chave-api-dados"] = api_key
    s.headers.update(headers)
    return s


# ─────────────────────────────────────────────────────────────────────────────
# Indicador MDE via SICONFI (RREO Anexo 14 — Demonstrativo Simplificado)
# ─────────────────────────────────────────────────────────────────────────────

CONTA_MDE = "Mínimo Anual de <18% / 25%> das Receitas de Impostos na Manutenção e Desenvolvimento do Ensino"
COD_CONTA_MDE = "MinimoAnualDasReceitasDeImpostosNaManutencaoEDesenvolvimentoDoEnsinoDemonstrativoSimplificado"


def _url_rreo_anexo14(ibge7: str, ano: int) -> str:
    params = (
        f"an_exercicio={ano}"
        f"&nr_periodo={BIMESTRE_RREO}"
        f"&co_tipo_demonstrativo=RREO"
        f"&no_anexo=RREO-Anexo%2014"
        f"&id_ente={ibge7}"
    )
    return f"{SICONFI_BASE}/rreo?{params}"


def _fetch_siope(ibge7: str, ano: int, session: "requests.Session") -> dict | None:
    """
    Baixa o indicador constitucional de MDE via SICONFI RREO Anexo 14.
    Substitui a antiga raspagem do site FNDE/SIOPE (bloqueada por reCAPTCHA
    desde ao menos 2026-07-09 — ver docstring do módulo).
    """
    url = _url_rreo_anexo14(ibge7, ano)
    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        print(f"    ERRO SICONFI RREO Anexo 14 [{ibge7}/{ano}]: {exc}", file=sys.stderr)
        return None

    valores: dict[str, float] = {}
    for item in data.get("items", []):
        if item.get("cod_conta") != COD_CONTA_MDE:
            continue
        coluna = (item.get("coluna") or "").strip()
        try:
            valores[coluna] = float(item.get("valor"))
        except (TypeError, ValueError):
            continue

    if not valores:
        return None

    despesa = valores.get("Valor Apurado Até o Bimestre")
    pct_aplicado = valores.get("% Aplicado Até o Bimestre")
    pct_minimo = valores.get("% Mínimo a Aplicar no Exercício")

    return {
        "despesa_mde":              f"{despesa:.2f}" if despesa is not None else "",
        "percentual_aplicado":      f"{pct_aplicado:.2f}" if pct_aplicado is not None else "",
        "limite_constitucional_pct": f"{pct_minimo:.0f}" if pct_minimo is not None else "",
        "situacao": (
            "cumprido" if pct_aplicado is not None and pct_minimo is not None and pct_aplicado >= pct_minimo
            else "nao_cumprido" if pct_aplicado is not None
            else ""
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main collection
# ─────────────────────────────────────────────────────────────────────────────

def coletar_fnde(municipio: str, anos: list[int], forcar: bool, session: "requests.Session") -> int:
    """
    Repasses FNDE por programa (PDDE/PNAE/PNATE/FUNDEB): SEM FONTE PÚBLICA
    AUTOMATIZÁVEL confirmada (verificado 2026-07-09 — ver docstring do
    módulo). Escreve stub "sem_dados_sem_fonte" em vez de tentar um endpoint
    que não existe; não faz sentido gastar requisições HTTP contra uma rota
    inexistente todo dia. Pendência: achar fonte alternativa (dados.gov.br
    ou download manual) antes de reativar coleta real aqui.
    """
    cfg = MUNICIPIOS[municipio]
    pub_dir = ROOT / "data" / "public" / municipio / "educacao" / "saida"
    pub_dir.mkdir(parents=True, exist_ok=True)
    total = 0

    for ano in anos:
        dest = pub_dir / f"fnde_repasses_{municipio}_{ano}.csv"
        if dest.exists() and not forcar:
            print(f"  [{municipio}/FNDE/{ano}] stub já existe, pulando")
            continue

        rows = [{
            "ano": ano, "municipio": municipio, "ibge7": cfg["ibge7"],
            "programa": "sem_dados_sem_fonte", "valor_repassado": "",
            "data_ultimo_repasse": "",
            "fonte": "SEM FONTE PÚBLICA AUTOMATIZÁVEL — verificado 2026-07-09, "
                     "endpoint /transferencias/municipios não existe no PT-Gov v3",
        }]

        with dest.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=FNDE_FIELDNAMES)
            w.writeheader()
            w.writerows(rows)

        print(f"  [{municipio}/FNDE/{ano}] sem fonte automatizável — stub gravado [{dest.name}]")

    return total


def coletar_siope(municipio: str, anos: list[int], forcar: bool, session: "requests.Session") -> int:
    cfg = MUNICIPIOS[municipio]
    pub_dir = ROOT / "data" / "public" / municipio / "educacao" / "saida"
    pub_dir.mkdir(parents=True, exist_ok=True)
    total = 0

    for ano in anos:
        dest = pub_dir / f"siope_{municipio}_{ano}.csv"
        if dest.exists() and not forcar:
            if "nao_coletado" not in dest.read_text(encoding="utf-8"):
                print(f"  [{municipio}/SIOPE/{ano}] já existe, pulando")
                continue
            print(f"  [{municipio}/SIOPE/{ano}] stub nao_coletado detectado — refazendo")

        print(f"  [{municipio}/SIOPE/{ano}] SICONFI RREO Anexo 14 (MDE) …")
        dados = _fetch_siope(cfg["ibge7"], ano, session)

        row = {
            "ano": ano,
            "municipio": municipio,
            "ibge7": cfg["ibge7"],
            "receita_vinculada_mde": "",  # não reportado separadamente pelo Anexo 14 — ver docstring
            "despesa_mde":           (dados or {}).get("despesa_mde", ""),
            "percentual_aplicado":   (dados or {}).get("percentual_aplicado", ""),
            "limite_constitucional_pct": (dados or {}).get("limite_constitucional_pct", ""),
            "situacao": (dados or {}).get("situacao") or "nao_coletado",
        }

        with dest.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=SIOPE_FIELDNAMES)
            w.writeheader()
            w.writerow(row)

        status = row["situacao"] or "coletado"
        print(f"    → {status}  MDE={row['percentual_aplicado'] or '?'}%  [{dest.name}]")
        total += 1
        time.sleep(1.0)

    return total


def main() -> int:
    parser = argparse.ArgumentParser(description="Baixa FNDE repasses + SIOPE (educação)")
    parser.add_argument(
        "--fonte", choices=["fnde", "siope", "ambos"], default="ambos",
    )
    parser.add_argument(
        "--municipios", nargs="+",
        choices=list(MUNICIPIOS), default=list(MUNICIPIOS),
    )
    parser.add_argument("--anos", nargs="+", type=int, default=ANOS_PADRAO)
    parser.add_argument("--forcar", action="store_true")
    args = parser.parse_args()

    if not HTTP_OK:
        print("ERRO: instale requests:")
        print("  .venv/bin/pip install requests")
        return 1

    sess = _session()
    total_fnde = 0
    total_siope = 0

    for mun in args.municipios:
        print(f"\n── {mun.upper()} ──────────────────────────────")
        if args.fonte in ("fnde", "ambos"):
            total_fnde += coletar_fnde(mun, args.anos, args.forcar, sess)
        if args.fonte in ("siope", "ambos"):
            total_siope += coletar_siope(mun, args.anos, args.forcar, sess)

    print(f"\nFNDE: {total_fnde} registros | SIOPE (MDE): {total_siope} ano(s) coletados")

    if args.fonte in ("fnde", "ambos"):
        print("\nAVISO FNDE: sem fonte pública automatizável — stub gravado (ver docstring do módulo).")

    if total_siope == 0 and args.fonte in ("siope", "ambos"):
        print("\nAVISO SIOPE/MDE: sem dados coletados via SICONFI RREO Anexo 14 nesta rodada "
              "(ver stderr acima para erro específico por ano/município).")

    return 0


if __name__ == "__main__":
    sys.exit(main())
