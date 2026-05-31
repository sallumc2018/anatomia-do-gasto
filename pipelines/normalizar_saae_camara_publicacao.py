"""
Normaliza recortes SAAE e Camara coletados em 2026-05-29 para QA/publicacao.

Entrada:
  data/extracted/sorocaba/saae/tdaportal/20260529_091316/pessoal/
  data/extracted/sorocaba/camara/{ldo,lrf,metas,ppa,prestacao}/

Saida:
  data/validated/sorocaba/autarquias/saae/pessoal/saida/
  data/validated/sorocaba/camara/documentos_orcamentarios/saida/

Este script nao publica. A copia para data/public deve ser explicita apos QA.
"""

from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / "data" / "extracted" / "sorocaba"
VALIDATED = ROOT / "data" / "validated" / "sorocaba"

SAAE_SOURCE = EXTRACTED / "saae" / "tdaportal" / "20260529_091316" / "pessoal"
SAAE_OUT = VALIDATED / "autarquias" / "saae" / "pessoal" / "saida"
CAMARA_SOURCE = EXTRACTED / "camara"
CAMARA_OUT = VALIDATED / "camara" / "documentos_orcamentarios" / "saida"

PUBLICADO_EM = "2026-05-29"
SAAE_ORGAO = "Servico Autonomo de Agua e Esgoto de Sorocaba"
CAMARA_ORGAO = "Camara Municipal de Sorocaba"


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def write_rows(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def normalize_int_br(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    return value.replace(".", "")


def normalize_money_br(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    return value.replace(".", "").replace(",", ".")


def normalizar_saae_cargos() -> Path:
    source = SAAE_SOURCE / "tabela_32.csv"
    rows_out: list[dict[str, str]] = []
    for row in read_rows(source):
        cargo = (row.get("coluna_1") or "").strip()
        if not cargo or cargo == "Cargo":
            continue

        if cargo == "TOTAL":
            secretaria = SAAE_ORGAO
            quantidade = normalize_int_br(row.get("coluna_2") or "")
            salario = ""
            observacao = "total informado pelo portal"
        else:
            secretaria = (row.get("coluna_2") or "").strip()
            quantidade = normalize_int_br(row.get("coluna_3") or "")
            salario = normalize_money_br(row.get("coluna_4") or "")
            observacao = "agregado por cargo; sem nome ou matricula"

        rows_out.append(
            {
                "ano_referencia": "2026",
                "mes_referencia": "05",
                "municipio": "sorocaba",
                "orgao": SAAE_ORGAO,
                "secretaria_portal": secretaria,
                "cargo": cargo,
                "quantidade_funcionarios": quantidade,
                "salario_base_brl": salario,
                "fonte_categoria": "pessoal",
                "fonte_arquivo": source.as_posix(),
                "fonte_tabela": "tabela_32.csv",
                "publicado_em": PUBLICADO_EM,
                "cobertura": "amostra_portal_100_de_139",
                "observacao": observacao,
            }
        )

    path = SAAE_OUT / "saae_pessoal_cargos_amostra_sorocaba_2026.csv"
    write_rows(
        path,
        [
            "ano_referencia",
            "mes_referencia",
            "municipio",
            "orgao",
            "secretaria_portal",
            "cargo",
            "quantidade_funcionarios",
            "salario_base_brl",
            "fonte_categoria",
            "fonte_arquivo",
            "fonte_tabela",
            "publicado_em",
            "cobertura",
            "observacao",
        ],
        rows_out,
    )
    return path


def normalizar_saae_folha() -> Path:
    source = SAAE_SOURCE / "tabela_45.csv"
    rows_out: list[dict[str, str]] = []
    for row in read_rows(source):
        tipo_folha = (row.get("coluna_1") or "").strip()
        if not tipo_folha or tipo_folha in {"Matricula", "Matrícula"}:
            continue
        rows_out.append(
            {
                "ano_referencia": "2026",
                "mes_referencia": "05",
                "municipio": "sorocaba",
                "orgao": SAAE_ORGAO,
                "tipo_folha": tipo_folha,
                "salario_bruto_total_brl": normalize_money_br(row.get("coluna_2") or ""),
                "salario_liquido_total_brl": normalize_money_br(row.get("coluna_3") or ""),
                "fonte_categoria": "pessoal",
                "fonte_arquivo": source.as_posix(),
                "fonte_tabela": "tabela_45.csv",
                "publicado_em": PUBLICADO_EM,
                "observacao": "total agregado por tipo de folha; sem nome ou matricula",
            }
        )

    path = SAAE_OUT / "saae_folha_totais_sorocaba_2026.csv"
    write_rows(
        path,
        [
            "ano_referencia",
            "mes_referencia",
            "municipio",
            "orgao",
            "tipo_folha",
            "salario_bruto_total_brl",
            "salario_liquido_total_brl",
            "fonte_categoria",
            "fonte_arquivo",
            "fonte_tabela",
            "publicado_em",
            "observacao",
        ],
        rows_out,
    )
    return path


def status_extracao(chars: int) -> str:
    if chars <= 10:
        return "sem_texto_extraivel"
    if chars < 1000:
        return "texto_curto_revisar"
    return "texto_extraido"


def normalizar_camara_documentos() -> Path:
    rows_out: list[dict[str, str]] = []
    for categoria in ["ldo", "lrf", "metas", "ppa", "prestacao"]:
        source = CAMARA_SOURCE / categoria / f"camara_{categoria}_sorocaba.csv"
        for row in read_rows(source):
            chars = int(row.get("chars") or 0)
            status = status_extracao(chars)
            rows_out.append(
                {
                    "ano": (row.get("ano") or "").strip(),
                    "municipio": "sorocaba",
                    "orgao": CAMARA_ORGAO,
                    "categoria": categoria,
                    "arquivo": (row.get("arquivo") or "").strip(),
                    "paginas": (row.get("paginas") or "").strip(),
                    "chars": str(chars),
                    "status_extracao": status,
                    "texto_bruto": (row.get("texto_bruto") or "").strip() if status != "sem_texto_extraivel" else "",
                    "fonte_url": "https://www.camarasorocaba.sp.gov.br/arquivos_publicos.html",
                    "fonte_arquivo": source.as_posix(),
                    "publicado_em": PUBLICADO_EM,
                    "observacao": "inventario/texto de PDF oficial; qualidade indicada por status_extracao",
                }
            )

    rows_out.sort(key=lambda r: (r["categoria"], r["ano"], r["arquivo"]))
    path = CAMARA_OUT / "camara_documentos_orcamentarios_sorocaba_2017_2027.csv"
    write_rows(
        path,
        [
            "ano",
            "municipio",
            "orgao",
            "categoria",
            "arquivo",
            "paginas",
            "chars",
            "status_extracao",
            "texto_bruto",
            "fonte_url",
            "fonte_arquivo",
            "publicado_em",
            "observacao",
        ],
        rows_out,
    )
    return path


def main() -> None:
    outputs = [
        normalizar_saae_cargos(),
        normalizar_saae_folha(),
        normalizar_camara_documentos(),
    ]
    print("Arquivos normalizados para QA:")
    for path in outputs:
        print(f"  {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
