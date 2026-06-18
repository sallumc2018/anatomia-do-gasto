from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from dataclasses import asdict, dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
EXTRACTED = ROOT / "data" / "extracted" / "sorocaba"
PUBLIC = ROOT / "data" / "public" / "sorocaba"
RAW = ROOT / "data" / "raw" / "sorocaba"


@dataclass
class Check:
    frente: str
    item: str
    status: str
    evidence: str
    issues: list[str]
    metrics: dict[str, str | int | float]


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def is_decimal(value: str) -> bool:
    try:
        Decimal((value or "").replace(",", "."))
        return True
    except InvalidOperation:
        return False


def is_br_money(value: str) -> bool:
    return bool(re.fullmatch(r"-?\d{1,3}(\.\d{3})*,\d{2}|-?\d+,\d{2}", value or ""))


def is_br_date(value: str) -> bool:
    return bool(re.fullmatch(r"\d{2}/\d{2}/\d{4}", value or ""))


def is_cnpj_or_cpf(value: str) -> bool:
    return bool(re.fullmatch(r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}", value or ""))


def status_from_issues(issues: list[str], warn_only: set[str] | None = None) -> str:
    warn_only = warn_only or set()
    def is_warn(issue: str) -> bool:
        return any(issue == allowed or issue.startswith(allowed) for allowed in warn_only)

    if any(not is_warn(issue) for issue in issues):
        return "fail"
    if issues:
        return "warn"
    return "ok"


def qa_fiscal() -> list[Check]:
    out: list[Check] = []
    base = EXTRACTED / "fiscal" / "saida"
    files = sorted(base.glob("*.csv"))
    if not files:
        return [Check("fiscal", "saida", "fail", rel(base), ["missing_fiscal_files"], {})]

    combined_years: set[str] = set()
    for path in files:
        rows = read_csv(path)
        issues: list[str] = []
        if not rows:
            issues.append("no_rows")
        fields = set(rows[0].keys()) if rows else set()

        if "cod_ibge" in fields:
            bad = sum(1 for row in rows if row.get("cod_ibge") != "3552205")
            if bad:
                issues.append(f"wrong_cod_ibge:{bad}")
        if "uf" in fields:
            bad = sum(1 for row in rows if row.get("uf") != "SP")
            if bad:
                issues.append(f"wrong_uf:{bad}")
        if "instituicao" in fields:
            bad = sum(1 for row in rows if "sorocaba" not in (row.get("instituicao") or "").lower())
            if bad:
                issues.append(f"wrong_instituicao:{bad}")
        if "valor" in fields:
            bad = sum(1 for row in rows if not is_decimal(row.get("valor") or ""))
            if bad:
                issues.append(f"valor_not_numeric:{bad}")

        years = {row.get("ano") or row.get("exercicio") for row in rows}
        years = {year for year in years if year}
        if "2020_2025" in path.name:
            combined_years.update(years)
            expected = {str(year) for year in range(2020, 2026)}
            missing = sorted(expected - years)
            if missing:
                issues.append(f"missing_years:{','.join(missing)}")
        else:
            m = re.search(r"_(20\d{2})\.csv$", path.name)
            if m and years and m.group(1) not in years:
                issues.append(f"filename_year_not_in_rows:{m.group(1)}")

        out.append(
            Check(
                "fiscal",
                path.name,
                status_from_issues(issues),
                rel(path),
                issues,
                {"rows": len(rows), "years": ",".join(sorted(years))},
            )
        )

    aggregate_issues: list[str] = []
    expected_all = {str(year) for year in range(2020, 2026)}
    if combined_years and combined_years != expected_all:
        aggregate_issues.append(f"combined_years:{','.join(sorted(combined_years))}")
    out.append(
        Check(
            "fiscal",
            "pacote_siconfi_2020_2025",
            status_from_issues(aggregate_issues),
            rel(base),
            aggregate_issues,
            {"files": len(files), "combined_years": ",".join(sorted(combined_years))},
        )
    )
    return out


def qa_urbes() -> list[Check]:
    out: list[Check] = []
    base = EXTRACTED / "urbes"
    public_base = PUBLIC / "transporte" / "urbes" / "saida"
    raw_base = RAW / "transporte" / "urbes"
    for sub in ("contratos_outros", "contratos_receitas", "contratos_transporte"):
        ocr = base / f"contratos_{sub}_ocr.csv"
        reparsed = base / f"contratos_{sub}_reparsed.csv"
        public_index = public_base / f"urbes_{sub}_ocr_indice_sorocaba.csv"
        issues: list[str] = []
        metrics: dict[str, str | int | float] = {}
        if not ocr.exists() or not reparsed.exists():
            out.append(Check("urbes", sub, "fail", rel(base), ["missing_ocr_or_reparse"], {}))
            continue
        ocr_rows = read_csv(ocr)
        rep_rows = read_csv(reparsed)
        public_rows = read_csv(public_index) if public_index.exists() else []
        raw_count = len(list((raw_base / sub).glob("*.pdf"))) if (raw_base / sub).exists() else 0
        ok_ocr = sum(1 for row in ocr_rows if row.get("status_ocr") == "ok")
        institutional_cnpj = {"50.333.699/0001-80", "46.634.044/0001-74"}
        bad_cnpj = sum(1 for row in rep_rows if row.get("cnpj_contratada") in institutional_cnpj)
        if raw_count and len(ocr_rows) != raw_count:
            issues.append(f"ocr_rows_vs_raw:{len(ocr_rows)}/{raw_count}")
        if len(rep_rows) != len(ocr_rows):
            issues.append(f"reparse_rows_vs_ocr:{len(rep_rows)}/{len(ocr_rows)}")
        if public_index.exists() and len(public_rows) != len(ocr_rows):
            issues.append(f"public_index_rows_vs_ocr:{len(public_rows)}/{len(ocr_rows)}")
        if ok_ocr != len(ocr_rows):
            issues.append(f"ocr_not_ok:{len(ocr_rows)-ok_ocr}")
        if bad_cnpj:
            issues.append(f"institutional_cnpj_as_contratada:{bad_cnpj}")
        metrics.update(
            {
                "raw_pdfs": raw_count,
                "ocr_rows": len(ocr_rows),
                "reparse_rows": len(rep_rows),
                "public_index_rows": len(public_rows) if public_index.exists() else 0,
                "ocr_ok": ok_ocr,
                "numero_contrato": sum(1 for row in rep_rows if row.get("numero_contrato")),
                "fornecedor": sum(1 for row in rep_rows if row.get("fornecedor")),
                "cnpj_contratada": sum(1 for row in rep_rows if row.get("cnpj_contratada")),
                "valor_brl": sum(1 for row in rep_rows if row.get("valor_brl")),
            }
        )
        coverage_issues = {"low_fornecedor_coverage", "low_valor_coverage", "public_index_rows_vs_ocr"}
        if rep_rows and metrics["fornecedor"] < len(rep_rows) * 0.25:
            issues.append("low_fornecedor_coverage")
        if rep_rows and metrics["valor_brl"] < len(rep_rows) * 0.25:
            issues.append("low_valor_coverage")
        out.append(Check("urbes", sub, status_from_issues(issues, coverage_issues), rel(reparsed), issues, metrics))
    return out


def qa_tce() -> list[Check]:
    out: list[Check] = []
    municipal = EXTRACTED / "tce" / "contas_municipais" / "pareceres_tce_sorocaba.csv"
    if municipal.exists():
        rows = read_csv(municipal)
        prefeitura_years = {
            row.get("ano_exercicio")
            for row in rows
            if row.get("tipo") == "parecer_previo_prefeitura" and row.get("ano_exercicio")
        }
        issues = []
        missing_year = sum(1 for row in rows if not row.get("ano_exercicio"))
        non_pdf = sum(1 for row in rows if ".pdf" not in row.get("url", "").lower())
        wrong_municipio = sum(1 for row in rows if row.get("municipio") != "sorocaba")
        wrong_orgao = sum(
            1
            for row in rows
            if row.get("orgao") not in {"Prefeitura Municipal de Sorocaba", "Camara Municipal de Sorocaba"}
        )
        expected_recent = {str(year) for year in range(2020, 2024)}
        missing = sorted(expected_recent - prefeitura_years)
        if missing:
            issues.append(f"missing_prefeitura_years:{','.join(missing)}")
        if missing_year:
            issues.append(f"missing_year:{missing_year}")
        if non_pdf:
            issues.append(f"non_pdf_url:{non_pdf}")
        if wrong_municipio:
            issues.append(f"wrong_municipio:{wrong_municipio}")
        if wrong_orgao:
            issues.append(f"wrong_orgao:{wrong_orgao}")
        out.append(
            Check(
                "tce",
                "contas_municipais_pareceres_prefeitura",
                status_from_issues(issues),
                rel(municipal),
                issues,
                {
                    "rows": len(rows),
                    "prefeitura_years": ",".join(sorted(prefeitura_years)),
                    "missing_year": missing_year,
                    "non_pdf_url": non_pdf,
                    "wrong_municipio": wrong_municipio,
                    "wrong_orgao": wrong_orgao,
                },
            )
        )
    else:
        out.append(Check("tce", "contas_municipais_pareceres_prefeitura", "fail", rel(municipal), ["missing_municipal_inventory"], {}))

    contas = EXTRACTED / "tce" / "contas_anuais" / "inventario_pdfs_contas_anuais.csv"
    if contas.exists():
        rows = read_csv(contas)
        sorocaba_refs = sum(
            1
            for row in rows
            if "sorocaba" in " ".join([row.get("rotulo", ""), row.get("arquivo", ""), row.get("url", "")]).lower()
        )
        issues = []
        role = "municipal_accounts"
        if not rows:
            issues.append("no_rows")
        if rows and sorocaba_refs == 0:
            role = "auxiliary_crosscheck_not_municipal_accounts"
        out.append(
            Check(
                "tce",
                "contas_anuais_tce_generico",
                status_from_issues(issues),
                rel(contas),
                issues,
                {"rows": len(rows), "sorocaba_refs": sorocaba_refs, "role": role},
            )
        )
    else:
        out.append(Check("tce", "contas_anuais", "fail", rel(contas), ["missing_inventory"], {}))

    for path in sorted((EXTRACTED / "tce").glob("**/*.csv")):
        if path == contas:
            continue
        rows = read_csv(path)
        out.append(Check("tce", path.name, "ok" if rows else "fail", rel(path), [] if rows else ["no_rows"], {"rows": len(rows)}))
    return out


def qa_funserv() -> list[Check]:
    out: list[Check] = []
    base = EXTRACTED / "funserv"
    docs = base / "inventario_funserv_documentos.csv"
    if docs.exists():
        rows = read_csv(docs)
        status_counts = Counter(row.get("status_download", "") for row in rows)
        issues = []
        if not rows:
            issues.append("no_rows")
        out.append(Check("funserv", "inventario_documentos", status_from_issues(issues), rel(docs), issues, {"rows": len(rows), **dict(status_counts)}))
    else:
        out.append(Check("funserv", "inventario_documentos", "fail", rel(docs), ["missing_inventory"], {}))

    apr = base / "funserv_apr_sorocaba_2020_2026.csv"
    if apr.exists():
        rows = read_csv(apr)
        issues = []
        missing_value = sum(1 for row in rows if not row.get("valor_brl"))
        public_apr = PUBLIC / "autarquias" / "funserv" / "saida" / "funserv_apr_sorocaba_2020_2026.csv"
        public_rows = read_csv(public_apr) if public_apr.exists() else []
        public_forbidden_columns = set(public_rows[0]) & {"arquivo", "fundo_descricao", "cnpj_fundo", "chars", "texto_bruto"} if public_rows else set()
        if missing_value:
            issues.append(f"missing_valor_brl:{missing_value}")
        if public_apr.exists() and len(public_rows) != len(rows):
            issues.append(f"public_apr_rows_vs_extracted:{len(public_rows)}/{len(rows)}")
        if public_forbidden_columns:
            issues.append(f"public_forbidden_columns:{','.join(sorted(public_forbidden_columns))}")
        out.append(
            Check(
                "funserv",
                "apr",
                status_from_issues(issues, {"missing_valor_brl:", "public_apr_rows_vs_extracted"}),
                rel(apr),
                issues,
                {
                    "rows": len(rows),
                    "missing_value": missing_value,
                    "public_rows": len(public_rows) if public_apr.exists() else 0,
                    "public_forbidden_columns": ",".join(sorted(public_forbidden_columns)),
                },
            )
        )

    text_public_base = PUBLIC / "autarquias" / "funserv" / "saida"
    text_pairs = {
        "atuarial_texto": (
            base / "funserv_atuarial_sorocaba_2015_2025.csv",
            text_public_base / "funserv_atuarial_sorocaba_2015_2025.csv",
        ),
        "governanca_texto": (
            base / "funserv_governanca_sorocaba_2019_2026.csv",
            text_public_base / "funserv_governanca_sorocaba_2019_2026.csv",
        ),
        "balanco_previdenciario_texto": (
            base / "funserv_balanco_previdenciario_ate_2018.csv",
            text_public_base / "funserv_balanco_previdenciario_ate_2018.csv",
        ),
        "balanco_saude_texto": (
            base / "funserv_balanco_saude_ate_2018.csv",
            text_public_base / "funserv_balanco_saude_ate_2018.csv",
        ),
    }
    for item, (extracted_path, public_path) in text_pairs.items():
        if not extracted_path.exists() or not public_path.exists():
            continue
        extracted_rows = read_csv(extracted_path)
        public_rows = read_csv(public_path)
        issues = []
        forbidden_columns = set(public_rows[0]) & {"texto_bruto", "caminho_raw", "sha256"} if public_rows else set()
        if len(public_rows) != len(extracted_rows):
            issues.append(f"public_rows_vs_extracted:{len(public_rows)}/{len(extracted_rows)}")
        if forbidden_columns:
            issues.append(f"public_forbidden_columns:{','.join(sorted(forbidden_columns))}")
        out.append(
            Check(
                "funserv",
                item,
                status_from_issues(issues),
                rel(public_path),
                issues,
                {
                    "extracted_rows": len(extracted_rows),
                    "public_rows": len(public_rows),
                    "public_forbidden_columns": ",".join(sorted(forbidden_columns)),
                },
            )
        )
    return out


def qa_saae() -> list[Check]:
    out: list[Check] = []
    base = EXTRACTED / "saae"
    decision = ROOT / "docs" / "decisao-publicacao-saae-licitacoes-contratos-obras-sorocaba-2026-06-02.md"
    normalized = {
        "contratos": base / "normalizado" / "saae_contratos_sorocaba_2026_normalizado.csv",
        "licitacoes": base / "normalizado" / "saae_licitacoes_sorocaba_2026_normalizado.csv",
        "obras": base / "normalizado" / "saae_obras_sorocaba_2026_normalizado.csv",
    }
    for item, path in normalized.items():
        if not path.exists():
            out.append(Check("saae", item, "fail", rel(path), ["missing_normalized_file"], {}))
            continue
        rows = read_csv(path)
        issues = []
        if not rows:
            issues.append("no_rows")
        filter_like = sum(1 for row in rows if any("(Todos)" in value or "Filtrar" in value for value in row.values()))
        if filter_like:
            issues.append("filter_text_in_normalized_rows")
        metrics: dict[str, str | int | float] = {"rows": len(rows), "filter_like_rows": filter_like}

        if item == "contratos":
            bad_cnpj = sum(1 for row in rows if not is_cnpj_or_cpf(row.get("cnpj_cpf_fornecedor", "")))
            missing_dates = sum(1 for row in rows if not row.get("data_inicial") or not row.get("data_final"))
            bad_dates = sum(
                1
                for row in rows
                if (row.get("data_inicial") and not is_br_date(row.get("data_inicial", "")))
                or (row.get("data_final") and not is_br_date(row.get("data_final", "")))
            )
            money_fields = ["valor_contratado", "valor_empenhado", "valor_processado", "valor_pago"]
            bad_money = sum(1 for row in rows for field in money_fields if not is_br_money(row.get(field, "")))
            if bad_cnpj:
                issues.append(f"bad_cnpj_cpf:{bad_cnpj}")
            if missing_dates:
                issues.append(f"missing_dates:{missing_dates}")
            if bad_dates:
                issues.append(f"bad_dates:{bad_dates}")
            if bad_money:
                issues.append(f"bad_money:{bad_money}")
            metrics.update({"bad_cnpj_cpf": bad_cnpj, "missing_dates": missing_dates, "bad_dates": bad_dates, "bad_money": bad_money})

        if item == "licitacoes":
            missing_opening = sum(1 for row in rows if not row.get("data_abertura") or not row.get("hora_abertura"))
            bad_numbers = sum(1 for row in rows if not re.fullmatch(r"\d{5}/\d{4}", row.get("nro_processo_licitatorio", "")))
            if missing_opening:
                issues.append(f"missing_opening:{missing_opening}")
            if bad_numbers:
                issues.append(f"bad_process_number:{bad_numbers}")
            metrics.update({"missing_opening": missing_opening, "bad_process_number": bad_numbers})

        if item == "obras":
            missing_description = sum(1 for row in rows if not row.get("obra"))
            if missing_description:
                issues.append(f"missing_description:{missing_description}")
            metrics.update({"missing_description": missing_description})

        accepted_prefixes = {"missing_dates:", "missing_opening:", "missing_description:"}
        accepted_issues = [
            issue
            for issue in issues
            if decision.exists() and any(issue.startswith(prefix) for prefix in accepted_prefixes)
        ]
        blocking_issues = [issue for issue in issues if issue not in accepted_issues]
        if accepted_issues:
            metrics["accepted_by_decision"] = ";".join(accepted_issues)

        out.append(
            Check(
                "saae",
                item,
                status_from_issues(blocking_issues),
                rel(path),
                blocking_issues,
                metrics,
            )
        )

    latest_inventory = base / "tdaportal" / "inventario_tdaportal_saae.csv"
    if latest_inventory.exists():
        rows = read_csv(latest_inventory)
        scoped = [row for row in rows if row.get("categoria") in {"contratos", "licitacoes", "obras"} and row.get("run_id")]
        out.append(Check("saae", "tdaportal_inventario_contratos_licitacoes_obras", "ok" if scoped else "warn", rel(latest_inventory), [] if scoped else ["no_scoped_runs"], {"runs": len(scoped)}))
    return out


def qa_pncp() -> list[Check]:
    out: list[Check] = []
    base = EXTRACTED / "pncp" / "saida"
    expected_cnpj = "46634044000174"
    decision = ROOT / "docs" / "decisao-pncp-sorocaba-2026-06-02.md"
    public = ROOT / "data" / "public" / "sorocaba" / "contratos" / "saida" / "pncp_sorocaba_2022_2026.csv"
    public_wrong_cnpj = None
    if public.exists():
        public_rows = read_csv(public)
        public_wrong_cnpj = sum(1 for row in public_rows if row.get("orgao_cnpj") != expected_cnpj)
    expected = [
        "pncp_sorocaba_compras_2022.csv",
        "pncp_sorocaba_compras_2023.csv",
        "pncp_sorocaba_compras_2024.csv",
        "pncp_sorocaba_compras_2025.csv",
        "pncp_sorocaba_contratos_2022.csv",
        "pncp_sorocaba_contratos_2023.csv",
        "pncp_sorocaba_contratos_2024.csv",
        "pncp_sorocaba_contratos_2025.csv",
        "pncp_sorocaba_atas_2023.csv",
        "pncp_sorocaba_atas_2024.csv",
        "pncp_sorocaba_atas_2025.csv",
    ]
    for name in expected:
        path = base / name
        if not path.exists():
            out.append(Check("pncp", name, "fail", rel(path), ["missing_file"], {}))
            continue
        rows = read_csv(path)
        issues = []
        if not rows:
            issues.append("no_rows")
        wrong_cnpj = sum(1 for row in rows if row.get("orgao_cnpj") != expected_cnpj)
        missing_control = sum(1 for row in rows if not row.get("numero_controle_pncp"))
        missing_description = sum(1 for row in rows if not (row.get("description") or row.get("title") or "").strip())
        duplicate_control = len(rows) - len({row.get("numero_controle_pncp") for row in rows})
        if wrong_cnpj:
            issues.append(f"wrong_orgao_cnpj:{wrong_cnpj}")
        if missing_control:
            issues.append(f"missing_control:{missing_control}")
        if missing_description:
            issues.append(f"missing_description:{missing_description}")
        if duplicate_control:
            issues.append(f"duplicate_control:{duplicate_control}")
        accepted_issues = []
        if (
            name == "pncp_sorocaba_atas_2023.csv"
            and decision.exists()
            and public_wrong_cnpj == 0
            and issues == [f"wrong_orgao_cnpj:{wrong_cnpj}"]
        ):
            accepted_issues = issues
        blocking_issues = [issue for issue in issues if issue not in accepted_issues]
        metrics = {
            "rows": len(rows),
            "wrong_orgao_cnpj": wrong_cnpj,
            "missing_control": missing_control,
            "missing_description": missing_description,
            "duplicate_control": duplicate_control,
        }
        if accepted_issues:
            metrics["accepted_by_public_consolidator"] = ";".join(accepted_issues)
        out.append(
            Check(
                "pncp",
                name,
                status_from_issues(blocking_issues),
                rel(path),
                blocking_issues,
                metrics,
            )
        )

    if public.exists():
        rows = public_rows
        wrong_cnpj = public_wrong_cnpj or 0
        issues = [f"wrong_orgao_cnpj:{wrong_cnpj}"] if wrong_cnpj else []
        out.append(
            Check(
                "pncp",
                "public_pncp_sorocaba_2022_2026.csv",
                status_from_issues(issues, {"wrong_orgao_cnpj:"}),
                rel(public),
                issues,
                {"rows": len(rows), "wrong_orgao_cnpj": wrong_cnpj},
            )
        )
    return out


def qa_siops_proxy() -> list[Check]:
    out: list[Check] = []
    base = EXTRACTED / "saude" / "saida"
    files = sorted(base.glob("rreo_*_saude_sorocaba_20*.csv")) + sorted(base.glob("rreo_receitas_sus_sorocaba_20*.csv"))
    years = sorted({re.search(r"(20\d{2})", path.name).group(1) for path in files if re.search(r"(20\d{2})", path.name)})
    issues = []
    expected = [str(year) for year in range(2020, 2026)]
    if years != expected:
        issues.append(f"years:{','.join(years)}")
    empty = [path.name for path in files if not read_csv(path)]
    if empty:
        issues.append(f"empty_files:{len(empty)}")
    local_status = status_from_issues(issues)
    out.append(Check("siops_proxy", "rreo_sus_local", local_status, rel(base), issues, {"files": len(files), "years": ",".join(years)}))
    decision = ROOT / "docs" / "decisao-siops-sorocaba-2026-06-02.md"
    if local_status == "ok" and decision.exists():
        out.append(
            Check(
                "siops_proxy",
                "siops_federal",
                "ok",
                rel(decision),
                [],
                {"local_rreo_files": len(files), "decision": "deferred_not_mvp_blocker"},
            )
        )
    else:
        out.append(Check("siops_proxy", "siops_federal", "warn", "https://portalfns.saude.gov.br/siops/", ["siops_direct_not_collected"], {"local_rreo_files": len(files)}))
    return out


def run_all() -> list[Check]:
    return qa_fiscal() + qa_urbes() + qa_tce() + qa_funserv() + qa_saae() + qa_pncp() + qa_siops_proxy()


def write_markdown(checks: list[Check], output: Path, report_date: str) -> None:
    summary = Counter(check.status for check in checks)
    lines = [
        f"# QA lacunas Sorocaba - {report_date}",
        "",
        "Escopo: fiscal SICONFI, URBES, TCE, FUNSERV, SAAE, PNCP e proxy local SIOPS/RREO SUS.",
        "",
        "Regra: este relatorio nao autoriza publicacao. `data/extracted` continua nao publicado.",
        "",
        "## Resumo",
        "",
        f"- OK: {summary.get('ok', 0)}",
        f"- Warn: {summary.get('warn', 0)}",
        f"- Fail: {summary.get('fail', 0)}",
        "",
        "## Itens com aviso ou falha",
        "",
    ]
    flagged = [check for check in checks if check.status != "ok"]
    if not flagged:
        lines.append("- Nenhum item com aviso/falha.")
    for check in flagged:
        lines.append(
            f"- {check.frente}/{check.item}: **{check.status}**; issues={'; '.join(check.issues) or '-'}; evidence=`{check.evidence}`; metrics={check.metrics}"
        )
    lines.extend(["", "## Inventario completo", ""])
    for check in checks:
        lines.append(
            f"- {check.frente}/{check.item}: {check.status}; evidence=`{check.evidence}`; metrics={check.metrics}"
        )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="QA semantico conservador das lacunas Sorocaba.")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--markdown", type=Path)
    parser.add_argument("--date", default="2026-06-02")
    args = parser.parse_args()

    checks = run_all()
    if args.markdown:
        write_markdown(checks, args.markdown, args.date)
    payload = {"summary": dict(Counter(check.status for check in checks)), "checks": [asdict(check) for check in checks]}
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print("QA lacunas Sorocaba")
        for status, count in sorted(payload["summary"].items()):
            print(f"- {status}: {count}")
        for check in checks:
            if check.status != "ok":
                print(f"  {check.status} {check.frente}/{check.item}: {', '.join(check.issues)}")
    return 0 if not any(check.status == "fail" for check in checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
