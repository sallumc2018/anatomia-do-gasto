#!/usr/bin/env python3
"""
Gate de deploy: checklist automatizado antes de `npx vercel deploy --prod --yes`.

Verifica:
  1. Manifests em sync (datasets_status.json gerado após última mudança em data/public)
  2. Score de cobertura (sem regressões críticas)
  3. Nenhum commit não-pushado (evitar deploy de código não salvo remotamente)
  4. Nenhuma mudança não-commitada em apps/web/
  5. outputFileTracingIncludes cobre todas as páginas SSR que leem data/public

Uso:
    python3 tools/gates/pre_deploy.py           # relatório completo
    python3 tools/gates/pre_deploy.py --block   # retorna exit 1 se qualquer check falhar
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_PUBLIC    = ROOT / "data" / "public"
MANIFESTS      = ROOT / "data" / "manifests"
DATASETS_JSON  = MANIFESTS / "datasets_status.json"
WEB_DATASETS   = ROOT / "apps" / "web" / "lib" / "datasets_status.json"
NEXT_CONFIG    = ROOT / "apps" / "web" / "next.config.ts"

CHECK_MARK = "✅"
WARN_MARK  = "⚠️ "
FAIL_MARK  = "❌"


def run(cmd: list[str], cwd: Path = ROOT) -> tuple[int, str]:
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    return r.returncode, (r.stdout + r.stderr).strip()


def check_manifests_in_sync() -> tuple[bool, str]:
    """datasets_status.json deve ser mais recente que o último CSV publicado."""
    if not DATASETS_JSON.exists():
        return False, "datasets_status.json não encontrado — rode: python3 pipelines/gerar_datasets_json.py"
    if not WEB_DATASETS.exists():
        return False, "apps/web/lib/datasets_status.json não encontrado"

    manifest_mtime = DATASETS_JSON.stat().st_mtime
    latest_csv_mtime = 0.0
    for p in DATA_PUBLIC.rglob("*.csv"):
        mtime = p.stat().st_mtime
        if mtime > latest_csv_mtime:
            latest_csv_mtime = mtime
            latest_csv = p

    if latest_csv_mtime > manifest_mtime:
        rel = Path(latest_csv).relative_to(ROOT)  # type: ignore[possibly-undefined]
        return False, f"CSV mais recente ({rel}) é mais novo que datasets_status.json → rode gerar_datasets_json.py"

    manifest_mtime_web = WEB_DATASETS.stat().st_mtime
    if abs(manifest_mtime - manifest_mtime_web) > 5:
        return False, "datasets_status.json e apps/web/lib/datasets_status.json estão dessincronizados → rode gerar_datasets_json.py"

    return True, "manifests em sync"


def check_unpushed_commits() -> tuple[bool, str]:
    code, out = run(["git", "log", "--oneline", "origin/main..HEAD"])
    if code != 0:
        return True, "não foi possível comparar com origin/main (ok em branch nova)"
    if out:
        count = len(out.splitlines())
        return False, f"{count} commit(s) não enviados para origin — faça git push antes de deploy"
    return True, "sem commits locais pendentes"


def check_web_clean() -> tuple[bool, str]:
    code, out = run(["git", "status", "--porcelain", "apps/web/"])
    if code != 0:
        return False, "erro ao verificar git status"
    if out:
        files = out.strip().splitlines()
        return False, f"{len(files)} arquivo(s) não commitado(s) em apps/web/ — commite antes de deploy"
    return True, "working tree limpo em apps/web/"


def check_coverage_scores() -> tuple[bool, str]:
    issues: list[str] = []
    for municipio in ("sorocaba", "paulinia"):
        cobertura = MANIFESTS / municipio / "mapa_cobertura.csv"
        if not cobertura.exists():
            issues.append(f"{municipio}: mapa_cobertura.csv não encontrado")
            continue
        import csv
        with open(cobertura, encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        total = len(rows)
        publicado = sum(1 for r in rows if r.get("status_auditavel", "").startswith("publicado"))
        pct = round(publicado / total * 100, 1) if total else 0
        if pct < 40:
            issues.append(f"{municipio}: score {pct}% abaixo de 40% — revisar antes de publicar")
    if issues:
        return False, "; ".join(issues)
    return True, "scores de cobertura OK"


def check_next_config_tracing() -> tuple[bool, str]:
    """Verifica se páginas SSR com process.cwd() têm entrada em outputFileTracingIncludes."""
    if not NEXT_CONFIG.exists():
        return False, "next.config.ts não encontrado"

    config_text = NEXT_CONFIG.read_text(encoding="utf-8")
    pages_dir = ROOT / "apps" / "web" / "app"

    missing: list[str] = []
    for page in pages_dir.rglob("page.tsx"):
        text = page.read_text(encoding="utf-8", errors="replace")
        if "process.cwd()" not in text:
            continue
        # Derive route from path: app/sorocaba/autarquias/page.tsx → /sorocaba/autarquias
        rel = page.relative_to(pages_dir).parent
        route = "/" + str(rel).replace(os.sep, "/")
        if route == "/.":
            route = "/"
        if f'"{route}"' not in config_text and f"'{route}'" not in config_text:
            missing.append(route)

    if missing:
        return False, f"páginas SSR sem outputFileTracingIncludes: {missing}"
    return True, "todas as páginas SSR têm entrada em outputFileTracingIncludes"


def main() -> int:
    parser = __import__("argparse").ArgumentParser()
    parser.add_argument("--block", action="store_true", help="Exit 1 se qualquer check falhar")
    args = parser.parse_args()

    checks = [
        ("Manifests em sync",              check_manifests_in_sync),
        ("Commits não-pushados",           check_unpushed_commits),
        ("Working tree apps/web limpo",    check_web_clean),
        ("Score de cobertura",             check_coverage_scores),
        ("outputFileTracingIncludes",      check_next_config_tracing),
    ]

    print("\n── Gate de Deploy ────────────────────────────────────────────────")
    passed = 0
    failed = 0

    for name, fn in checks:
        try:
            ok, msg = fn()
        except Exception as e:
            ok, msg = False, f"erro interno: {e}"

        if ok:
            print(f"  {CHECK_MARK}  {name}: {msg}")
            passed += 1
        else:
            print(f"  {FAIL_MARK}  {name}: {msg}")
            failed += 1

    print(f"\n  Passou: {passed}/{len(checks)}")
    print()

    if failed == 0:
        print("✅  Todos os checks passaram — pode executar:")
        print("    npx vercel deploy --prod --yes")
        return 0
    else:
        print(f"❌  {failed} check(s) falharam — corrija antes do deploy.")
        return 1 if args.block else 0


if __name__ == "__main__":
    sys.exit(main())
