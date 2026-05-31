from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from dataclasses import dataclass, asdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "data" / "extracted" / "sorocaba"
TARGET_AREAS = ("urbes", "fiscal", "funserv", "camara", "tce")


@dataclass
class FileQA:
    area: str
    path: str
    kind: str
    rows: int | None
    columns: int | None
    status: str
    issues: list[str]
    notes: list[str]


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def qa_csv(area: str, path: Path) -> FileQA:
    issues: list[str] = []
    notes: list[str] = []
    rows: list[dict[str, str]] = []
    try:
        with path.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or []
            rows = list(reader)
    except Exception as exc:
        return FileQA(area, rel(path), "csv", None, None, "fail", [f"csv_parse_error:{type(exc).__name__}:{exc}"], [])

    counter = Counter(fieldnames)
    duplicated = [name for name, count in counter.items() if count > 1]
    if not fieldnames:
        issues.append("missing_header")
    if duplicated:
        issues.append(f"duplicate_columns:{','.join(duplicated)}")
    if not rows:
        issues.append("no_data_rows")

    empty_columns = []
    for field in fieldnames:
        if rows and all(not (row.get(field) or "").strip() for row in rows):
            empty_columns.append(field)
    if empty_columns:
        notes.append(f"empty_columns:{','.join(empty_columns[:8])}")

    if area == "urbes" and path.name.startswith("contratos_") and path.name.endswith("_ocr.csv"):
        qa_urbes_ocr(path, rows, issues, notes)
    if area == "funserv":
        qa_funserv(path, rows, issues, notes)
    if area == "camara" and path.name.startswith("camara_"):
        qa_camara_docs(path, rows, issues, notes)

    status = "fail" if any(issue in {"missing_header", "no_data_rows"} or issue.startswith("csv_parse_error") for issue in issues) else "warn" if issues else "ok"
    return FileQA(area, rel(path), "csv", len(rows), len(fieldnames), status, issues, notes)


def qa_json(area: str, path: Path) -> FileQA:
    try:
        text = path.read_text(encoding="utf-8-sig")
        data = json.loads(text)
    except Exception as exc:
        return FileQA(area, rel(path), "json", None, None, "fail", [f"json_parse_error:{type(exc).__name__}:{exc}"], [])

    if isinstance(data, list):
        rows = len(data)
    elif isinstance(data, dict):
        rows = len(data)
    else:
        rows = 1
    return FileQA(area, rel(path), "json", rows, None, "ok", [], [f"json_type:{type(data).__name__}"])


def qa_other(area: str, path: Path) -> FileQA:
    status = "ok" if path.stat().st_size > 0 else "fail"
    issues = [] if status == "ok" else ["empty_file"]
    return FileQA(area, rel(path), path.suffix.lower().lstrip(".") or "file", None, None, status, issues, [])


def qa_urbes_ocr(path: Path, rows: list[dict[str, str]], issues: list[str], notes: list[str]) -> None:
    subpasta = path.name.removeprefix("contratos_").removesuffix("_ocr.csv")
    raw_dir = ROOT / "data" / "raw" / "sorocaba" / "transporte" / "urbes" / subpasta
    raw_count = len(list(raw_dir.glob("*.pdf"))) if raw_dir.exists() else None
    ok = sum(1 for row in rows if row.get("status_ocr") == "ok")
    errors = sum(1 for row in rows if (row.get("status_ocr") or "").startswith("erro"))
    short = sum(1 for row in rows if row.get("status_ocr") == "texto_curto")
    notes.append(f"ocr_ok:{ok}")
    notes.append(f"ocr_errors:{errors}")
    notes.append(f"ocr_texto_curto:{short}")
    if raw_count is not None:
        notes.append(f"raw_pdf_count:{raw_count}")
        if len(rows) < raw_count:
            issues.append(f"incomplete_ocr_rows:{len(rows)}/{raw_count}")
        elif len(rows) > raw_count:
            issues.append(f"more_rows_than_raw:{len(rows)}/{raw_count}")
    if rows:
        ok_pct = ok / len(rows)
        notes.append(f"ocr_ok_pct:{ok_pct:.3f}")
        if ok_pct < 0.70:
            issues.append("ocr_ok_below_70pct")
        for field in ("numero_contrato", "cnpj", "valor"):
            filled = sum(1 for row in rows if (row.get(field) or "").strip())
            notes.append(f"{field}_filled:{filled}/{len(rows)}")


def qa_camara_docs(path: Path, rows: list[dict[str, str]], issues: list[str], notes: list[str]) -> None:
    if not {"chars", "texto_bruto"}.issubset(rows[0].keys() if rows else set()):
        return
    chars = []
    for row in rows:
        try:
            chars.append(int(row.get("chars") or 0))
        except ValueError:
            issues.append("invalid_chars_value")
    if chars:
        notes.append(f"chars_sum:{sum(chars)}")
        notes.append(f"sem_texto:{sum(1 for value in chars if value <= 10)}")
        notes.append(f"texto_curto:{sum(1 for value in chars if 10 < value < 1000)}")
        if any(value <= 10 for value in chars):
            issues.append("contains_scanned_or_empty_pdf")


def qa_funserv(path: Path, rows: list[dict[str, str]], issues: list[str], notes: list[str]) -> None:
    if path.name == "inventario_funserv_documentos.csv" and "no_data_rows" in issues:
        issues.remove("no_data_rows")
        issues.append("stale_legacy_inventory_no_data_rows")
        notes.append("legado_2026-05-23; fora_do_pacote_extraido_2026-05-29")
        return

    if not path.name.startswith("funserv_"):
        return

    try:
        physical_lines = len(path.read_text(encoding="utf-8-sig").splitlines()) - 1
        notes.append(f"physical_data_lines:{max(physical_lines, 0)}")
    except UnicodeDecodeError:
        notes.append("physical_data_lines:unavailable")

    chars = []
    for row in rows:
        try:
            chars.append(int(row.get("chars") or 0))
        except ValueError:
            issues.append("invalid_chars_value")
    if chars:
        notes.append(f"chars_sum:{sum(chars)}")
        notes.append(f"chars_nonzero:{sum(1 for value in chars if value > 0)}/{len(rows)}")
    if path.name == "funserv_apr_sorocaba_2020_2026.csv":
        filled = sum(1 for row in rows if (row.get("valor_brl") or "").strip())
        notes.append(f"valor_brl_filled:{filled}/{len(rows)}")
        if filled == 0:
            issues.append("missing_apr_values")


def scan() -> list[FileQA]:
    results: list[FileQA] = []
    for area in TARGET_AREAS:
        root = BASE / area
        if not root.exists():
            results.append(FileQA(area, rel(root), "dir", None, None, "fail", ["missing_area_dir"], []))
            continue
        files = sorted(path for path in root.rglob("*") if path.is_file())
        if not files:
            results.append(FileQA(area, rel(root), "dir", 0, None, "fail", ["no_files"], []))
            continue
        for path in files:
            suffix = path.suffix.lower()
            if suffix == ".csv":
                results.append(qa_csv(area, path))
            elif suffix == ".json":
                results.append(qa_json(area, path))
            else:
                results.append(qa_other(area, path))
    return results


def summarize(results: list[FileQA]) -> dict:
    by_area: dict[str, Counter] = {}
    for result in results:
        by_area.setdefault(result.area, Counter())[result.status] += 1
    return {area: dict(counter) for area, counter in sorted(by_area.items())}


def write_markdown(results: list[FileQA], output: Path) -> None:
    summary = summarize(results)
    lines = [
        "# QA extracted Sorocaba - 2026-05-29",
        "",
        "Escopo: `data/extracted/sorocaba/{urbes,fiscal,funserv,camara,tce}`.",
        "",
        "Regra: este relatorio nao autoriza publicacao. Qualquer promocao para `data/public` exige QA especifico, manifestos e gate explicito.",
        "",
        "## Resumo",
        "",
        "| Area | OK | Warn | Fail |",
        "| --- | ---: | ---: | ---: |",
    ]
    for area in TARGET_AREAS:
        counter = summary.get(area, {})
        lines.append(f"| {area} | {counter.get('ok', 0)} | {counter.get('warn', 0)} | {counter.get('fail', 0)} |")
    lines.extend(["", "## Problemas e avisos", ""])
    flagged = [result for result in results if result.status != "ok"]
    if not flagged:
        lines.append("Nenhum problema estrutural detectado.")
    for result in flagged:
        lines.append(f"- `{result.path}`: **{result.status}**; issues={'; '.join(result.issues) or '-'}; notes={'; '.join(result.notes) or '-'}")
    lines.extend(["", "## Inventario resumido", ""])
    for result in results:
        lines.append(
            f"- `{result.path}`: {result.kind}, rows={result.rows}, columns={result.columns}, status={result.status}"
        )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="QA estrutural de extracted Sorocaba.")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--markdown", type=Path)
    args = parser.parse_args()

    results = scan()
    if args.markdown:
        write_markdown(results, args.markdown)
    payload = {"summary": summarize(results), "results": [asdict(result) for result in results]}
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print("QA extracted Sorocaba")
        for area, counts in payload["summary"].items():
            print(f"- {area}: {counts}")
        flagged = [result for result in results if result.status != "ok"]
        print(f"Flagged: {len(flagged)}")
        for result in flagged[:30]:
            print(f"  {result.status} {result.path}: {', '.join(result.issues)}")
    return 0 if all(result.status != "fail" for result in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
