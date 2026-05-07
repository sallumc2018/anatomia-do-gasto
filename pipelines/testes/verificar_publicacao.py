"""
Verifica invariantes de publicacao do repositorio.

Regras:
- o site nao deve ter pasta apps/web/data;
- dados de educacao 2020-2025 devem estar em data/public;
- dados de educacao 2020-2023 devem permanecer em data/extracted como saida mecanica;
- manifesto deve registrar datasets publicados e pendentes.
"""
import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PUBLIC_EDUCACAO = ROOT / "data" / "public" / "sorocaba" / "educacao" / "saida"
EXTRACTED_EDUCACAO = ROOT / "data" / "extracted" / "sorocaba" / "educacao" / "saida"
WEB_DATA = ROOT / "apps" / "web" / "data"
MANIFEST = ROOT / "data" / "manifests" / "datasets.csv"


def fail(message: str) -> bool:
    print(f"FALHA: {message}")
    return False


def check_no_web_data() -> bool:
    if WEB_DATA.exists():
        return fail(f"pasta antiga encontrada: {WEB_DATA}")
    return True


def check_educacao_public() -> bool:
    esperados = [
        PUBLIC_EDUCACAO / f"despesas_educacao_sorocaba_{ano}.csv"
        for ano in range(2020, 2026)
    ] + [
        PUBLIC_EDUCACAO / f"receitas_base_educacao_sorocaba_{ano}.csv"
        for ano in range(2020, 2026)
    ]
    faltantes = [path.name for path in esperados if not path.exists()]
    if faltantes:
        return fail(f"educacao 2020-2025 faltando em data/public: {', '.join(faltantes)}")
    return True


def check_educacao_extracted() -> bool:
    esperados = [
        EXTRACTED_EDUCACAO / f"despesas_educacao_sorocaba_{ano}.csv"
        for ano in range(2020, 2024)
    ] + [
        EXTRACTED_EDUCACAO / f"receitas_base_educacao_sorocaba_{ano}.csv"
        for ano in range(2020, 2024)
    ]
    faltantes = [path.name for path in esperados if not path.exists()]
    if faltantes:
        return fail(f"educacao 2020-2023 faltando em data/extracted: {', '.join(faltantes)}")
    return True


def check_manifest() -> bool:
    if not MANIFEST.exists():
        return fail(f"manifesto nao encontrado: {MANIFEST}")

    with MANIFEST.open(newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    required_columns = {
        "municipio",
        "area",
        "anos",
        "status",
        "fonte_nome",
        "fonte_url",
        "fonte_arquivo",
        "script_extracao",
        "validado_por",
        "arquivo_publico",
        "observacao",
    }
    missing_columns = sorted(required_columns - set(rows[0].keys() if rows else []))
    if missing_columns:
        return fail(f"colunas obrigatorias ausentes no manifesto: {missing_columns}")

    required = {
        ("Sorocaba", "saude", "2020-2025", "public"),
        ("Sorocaba", "educacao", "2020-2025", "public"),
        ("Sorocaba", "auditoria", "2026", "public-mock"),
    }
    found = {(r["municipio"], r["area"], r["anos"], r["status"]) for r in rows}
    missing = sorted(required - found)
    if missing:
        return fail(f"entradas obrigatorias ausentes no manifesto: {missing}")
    return True


def main() -> int:
    checks = [
        check_no_web_data(),
        check_educacao_public(),
        check_educacao_extracted(),
        check_manifest(),
    ]

    if all(checks):
        print("Publicacao OK: invariantes preservadas.")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
