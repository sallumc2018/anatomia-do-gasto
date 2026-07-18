#!/usr/bin/env python3
"""Gate de privacidade: bloqueia CPF/RG reais em dados publicados.

Detecta:
  1. CPF — formatado (xxx.xxx.xxx-xx) ou 11 dígitos soltos, validado por
     dígito verificador (evita falso positivo em códigos IBGE, valores etc).
  2. RG — formatos comuns (xx.xxx.xxx-x), por padrão de agrupamento (RG não
     tem dígito verificador padronizado nacionalmente, então é heurístico).

Para CSV/TSV, cada CÉLULA é avaliada inteira (fullmatch) — não uma busca de
substring na linha bruta. Isso evita falso-positivo em campos compostos como
"processo_administrativo" (ex: "2014-0.218.057-4", que contém um trecho no
formato de RG mas não é um RG isolado). Para JSON, mesma lógica em cada valor
string folha. Para .txt/.md (prosa livre, sem estrutura de coluna), usa busca
por token isolado por espaço/pontuação de frase.

Nunca imprime o valor completo do documento encontrado (mascarado no report).

Uso:
    python3 tools/gates/check_pii_leak.py                # varre data/public inteiro
    python3 tools/gates/check_pii_leak.py --staged        # so arquivos staged no git
    python3 tools/gates/check_pii_leak.py --paths a b c   # raizes customizadas
    python3 tools/gates/check_pii_leak.py --json          # saida em json

Exit code 1 se qualquer PII real for encontrada (bloqueia por padrao —
diferente de outros gates do repo, este nao tem modo "so aviso").
"""
from __future__ import annotations

import argparse
import csv
import json as json_lib
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ROOTS = (ROOT / "data" / "public",)
SCAN_EXTENSIONS = {".csv", ".json", ".txt", ".md", ".tsv"}

CPF_FORMATTED_FULL_RE = re.compile(r"\d{3}\.\d{3}\.\d{3}-\d{2}")
CPF_BARE_FULL_RE = re.compile(r"\d{11}")
RG_FORMATTED_FULL_RE = re.compile(r"\d{1,2}\.\d{3}\.\d{3}-[0-9Xx]")


def is_valid_cpf(digits: str) -> bool:
    if len(digits) != 11 or len(set(digits)) == 1:
        return False

    def check_digit(base: str, weight_start: int) -> int:
        total = sum(int(d) * w for d, w in zip(base, range(weight_start, 1, -1)))
        rest = (total * 10) % 11
        return 0 if rest == 10 else rest

    d1 = check_digit(digits[:9], 10)
    d2 = check_digit(digits[:9] + str(d1), 11)
    return digits[-2:] == f"{d1}{d2}"


def mask(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) <= 4:
        return "*" * len(digits)
    return digits[:3] + "*" * (len(digits) - 5) + digits[-2:]


@dataclass
class Finding:
    file: str
    line: int
    kind: str
    column: str
    masked: str


def classify_cell(value: str) -> tuple[str, str] | None:
    """Retorna (kind, matched_text) se o valor da célula INTEIRA (apos strip)
    for um CPF/RG real. None caso contrario. Fullmatch — nao substring."""
    v = value.strip()
    if not v:
        return None
    if CPF_FORMATTED_FULL_RE.fullmatch(v):
        digits = re.sub(r"\D", "", v)
        return ("cpf_formatado", v) if is_valid_cpf(digits) else None
    if CPF_BARE_FULL_RE.fullmatch(v):
        return ("cpf_bruto", v) if is_valid_cpf(v) else None
    if RG_FORMATTED_FULL_RE.fullmatch(v):
        return ("rg_formatado", v)
    return None


def scan_csv_file(path: Path, rel: Path) -> list[Finding]:
    findings: list[Finding] = []
    delimiter = "\t" if path.suffix.lower() == ".tsv" else ","
    try:
        with path.open(newline="", encoding="utf-8", errors="ignore") as fh:
            reader = csv.reader(fh, delimiter=delimiter)
            header = next(reader, [])
            for lineno, row in enumerate(reader, start=2):
                for col_idx, cell in enumerate(row):
                    hit = classify_cell(cell)
                    if hit:
                        kind, matched = hit
                        colname = header[col_idx] if col_idx < len(header) else f"col{col_idx}"
                        findings.append(Finding(str(rel), lineno, kind, colname, mask(matched)))
    except (OSError, csv.Error):
        return []
    return findings


def scan_json_file(path: Path, rel: Path) -> list[Finding]:
    findings: list[Finding] = []
    try:
        data = json_lib.loads(path.read_text(encoding="utf-8", errors="ignore"))
    except (OSError, json_lib.JSONDecodeError):
        return []

    def walk(node, key=""):
        if isinstance(node, dict):
            for k, v in node.items():
                walk(v, k)
        elif isinstance(node, list):
            for v in node:
                walk(v, key)
        elif isinstance(node, str):
            hit = classify_cell(node)
            if hit:
                kind, matched = hit
                findings.append(Finding(str(rel), 0, kind, key, mask(matched)))

    walk(data)
    return findings


TOKEN_RE = re.compile(r"[^\s,;|]+")


def scan_prose_file(text: str, rel: Path) -> list[Finding]:
    findings: list[Finding] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        for tok in TOKEN_RE.finditer(line):
            hit = classify_cell(tok.group(0).strip(".,;:()\"'"))
            if hit:
                kind, matched = hit
                findings.append(Finding(str(rel), lineno, kind, "", mask(matched)))
    return findings


def scan_file(path: Path, rel: Path) -> list[Finding]:
    suffix = path.suffix.lower()
    if suffix in {".csv", ".tsv"}:
        return scan_csv_file(path, rel)
    if suffix == ".json":
        return scan_json_file(path, rel)
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return []
    return scan_prose_file(text, rel)


def staged_files() -> list[Path]:
    r = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
        capture_output=True, text=True, cwd=ROOT,
    )
    out = []
    for line in r.stdout.splitlines():
        p = ROOT / line
        if p.suffix.lower() in SCAN_EXTENSIONS and p.exists():
            out.append(p)
    return out


def files_under(roots: tuple[Path, ...]) -> list[Path]:
    out = []
    for root in roots:
        if not root.exists():
            continue
        for p in root.rglob("*"):
            if p.is_file() and p.suffix.lower() in SCAN_EXTENSIONS:
                out.append(p)
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--staged", action="store_true", help="varre apenas arquivos staged no git (uso em pre-commit/worker)")
    parser.add_argument("--paths", nargs="*", help="raizes customizadas para varrer (default: data/public)")
    parser.add_argument("--json", action="store_true", help="saida em json")
    args = parser.parse_args()

    if args.staged:
        targets = staged_files()
    elif args.paths:
        targets = files_under(tuple(Path(p) for p in args.paths))
    else:
        targets = files_under(DEFAULT_ROOTS)

    all_findings: list[Finding] = []
    for path in targets:
        rel = path.relative_to(ROOT) if path.is_relative_to(ROOT) else path
        all_findings.extend(scan_file(path, rel))

    if args.json:
        print(json_lib.dumps([asdict(f) for f in all_findings], ensure_ascii=False, indent=2))
    else:
        print("\n── Gate de Privacidade (PII: CPF/RG) ───────────────────────────────")
        print(f"  Arquivos verificados: {len(targets)}")
        if not all_findings:
            print("  ✅  Nenhum CPF/RG real encontrado.")
        else:
            print(f"  ❌  {len(all_findings)} possível(is) PII encontrada(s):")
            for f in all_findings:
                col = f" col={f.column!r}" if f.column else ""
                print(f"      {f.file}:{f.line}{col}  [{f.kind}]  {f.masked}")
            print("\n  Corrija ou redija os arquivos acima antes de publicar/commitar.")

    return 1 if all_findings else 0


if __name__ == "__main__":
    sys.exit(main())
