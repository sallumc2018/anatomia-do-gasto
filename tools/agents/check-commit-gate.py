#!/usr/bin/env python3
"""Pipeline de commit-publicacao (fail-closed) — Anatomia do Gasto.

Orquestrador unico que roda os portoes certos em cada estagio. Substitui a
colcha de retalhos (verificadores soltos, um deles orfao) por um gate explicito.

Estagios:
  --staged : gate de PRE-COMMIT  (rapido; so arquivos staged)
  --full   : gate de PRE-PUSH / PUBLICACAO (arvore versionada inteira)

Camadas e severidade:
  1. SEGREDOS            -> BLOCK  (formatos de credencial; via check-secrets.py)
  2. CAMINHOS PROIBIDOS  -> BLOCK  (data/raw|extracted|validated, .env, .pem,
                                    chaves, .local/ etc.) — barra ate `git add -f`,
                                    que o .gitignore sozinho NAO impede.
  3. REMOCAO PUBLICA     -> BLOCK  (delecoes em data/public por padrao)
  4. MOCK / PII          -> WARN   (CPF repetido, 'ficticio', 'teste' em data/public)
                                    advisory: dado publico de licitacao tem muito
                                    'teste'/numeros repetidos legitimos; falso-bloqueio
                                    travaria commits. Revisao final e humana, no
                                    `validate-area --area publish`.

Filosofia: BLOCK so em alta confianca e baixo falso-positivo (segredo, caminho
operacional). O resto e WARN auditavel. Mesma logica do check-secrets.

Sai 1 se algum BLOCK; 0 caso contrario (WARN nao bloqueia).
"""
from __future__ import annotations

import argparse
import importlib.util
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Caminhos que NUNCA podem ser versionados (espelha o .gitignore, mas ENFORCA
# no commit/push mesmo se alguem usar `git add -f`).
FORBIDDEN_PATH_RE = [
    re.compile(r"^data/(raw|extracted|validated)(/|$)"),
    re.compile(r"(^|/)\.env($|\.)"),
    re.compile(r"\.(pem|key|pfx|p12)$"),
    re.compile(r"\.credential\.xml$"),
    re.compile(r"(^|/)id_(rsa|ed25519)"),
    re.compile(r"(^|/)\.local(/|$)"),
    re.compile(r"(^|/)omega-(security|tablet)-"),
    re.compile(r"_local\.csv$"),
    re.compile(r"(^|/)\.vercel(/|$)"),
]


def git(args):
    return subprocess.run(
        ["git", *args], capture_output=True, text=True, encoding="utf-8", errors="replace"
    )


def staged_files():
    r = git(["diff", "--cached", "--name-only", "--diff-filter=ACM"])
    return [l for l in r.stdout.splitlines() if l.strip()]


def staged_deleted_files():
    r = git(["diff", "--cached", "--name-only", "--diff-filter=D"])
    return [l for l in r.stdout.splitlines() if l.strip()]


def tracked_files():
    r = git(["ls-files"])
    return [l for l in r.stdout.splitlines() if l.strip()]


def run_py(script, *extra):
    return subprocess.run([sys.executable, script, *extra], cwd=ROOT).returncode


def load_integrity():
    """Importa o scan_file do check-data-integrity.py (nome com hifen)."""
    path = ROOT / "tools" / "security" / "check-data-integrity.py"
    spec = importlib.util.spec_from_file_location("cdi_mod", path)
    m = importlib.util.module_from_spec(spec)
    sys.modules["cdi_mod"] = m
    spec.loader.exec_module(m)
    return m


def check_forbidden(files):
    bad = []
    for f in files:
        if any(rx.search(f) for rx in FORBIDDEN_PATH_RE):
            bad.append(f)
    return bad


def check_public_deletions(files):
    return [
        f for f in files
        if f.startswith("data/public/") and not os.environ.get("ANATOMIA_ALLOW_PUBLIC_DELETE")
    ]


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Gate de commit-publicacao (fail-closed).")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--staged", action="store_true", help="gate de pre-commit (staged)")
    g.add_argument("--full", action="store_true", help="gate de pre-push/publicacao (arvore)")
    ap.add_argument(
        "--no-warn",
        action="store_true",
        help="pula as camadas WARN (mock/PII); mantem os BLOCK. Para pre-push rapido "
        "(o triador completo roda no estagio publish via validate-area).",
    )
    a = ap.parse_args(argv)
    estagio = "pre-commit" if a.staged else "pre-push/publicacao"
    blocks = []

    # --- Camada 1: SEGREDOS (BLOCK) ---
    if run_py("tools/agents/check-secrets.py", "--staged" if a.staged else "--all") != 0:
        blocks.append("segredos")

    # --- Camada 2: CAMINHOS PROIBIDOS (BLOCK) ---
    files = staged_files() if a.staged else tracked_files()
    bad = check_forbidden(files)
    if bad:
        print("[BLOCK] caminhos proibidos (camada operacional/segredo nunca versionavel):")
        for b in bad:
            print(f"  - {b}")
        blocks.append("caminhos-proibidos")

    # --- Camada 3: REMOCAO PUBLICA (BLOCK) ---
    if a.staged:
        public_deletions = check_public_deletions(staged_deleted_files())
        if public_deletions:
            print("[BLOCK] delecoes em data/public exigem decisao explicita:")
            for item in public_deletions:
                print(f"  - {item}")
            print("Para uma remocao deliberada, documente a decisao e rode com ANATOMIA_ALLOW_PUBLIC_DELETE=1.")
            blocks.append("data-public-delete")

    # --- Camada 4: MOCK / PII (WARN) ---
    # --no-warn pula esta camada (usado pelo pre-push, que so precisa dos BLOCK).
    # O triador completo roda no estagio publish via validate-area --area publish.
    if not a.no_warn:
        try:
            cdi = load_integrity()
            if a.staged:
                alvos = [
                    ROOT / f for f in files
                    if f.startswith("data/public/") or f.startswith("data/manifests/")
                ]
                viol = []
                for p in alvos:
                    if p.suffix.lower() in {".csv", ".json", ".txt", ".tsv"} and p.is_file():
                        viol += cdi.scan_file(p)
            else:
                viol = []
                for d in (ROOT / "data" / "public", ROOT / "data" / "manifests"):
                    for p in cdi.iter_data_files(d) or []:
                        viol += cdi.scan_file(p)
            if viol:
                print(f"[WARN] {len(viol)} possivel(is) mock/PII em data/public|manifests (revisar):")
                for v in viol[:15]:
                    print(f"  - {v['file']}:{v['line']} termo={v['term']!r}")
        except Exception as e:  # advisory: nunca derruba o gate por falha do triador
            print(f"[WARN] triagem mock/PII indisponivel: {e}")

    if blocks:
        print(f"\nGATE BLOQUEADO ({estagio}): {', '.join(blocks)}")
        return 1
    print(f"GATE OK ({estagio}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
