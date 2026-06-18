#!/usr/bin/env python3
"""Varredura de segredos para repositorio publico (Anatomia do Gasto).

Camada de conteudo que faltava: o .gitignore protege *arquivos* sensiveis
(.env, .pem, id_rsa), mas nao impede que um segredo seja colado *inline*
num arquivo legitimo versionado (.md, .py, .csv). Em 2026-06-03 um GitHub
PAT vazou exatamente assim, dentro de um handoff de seguranca; o GitHub
Push Protection barrou (server-side), mas o commit local ja tinha passado.

Este scanner roda:
  - como pre-commit (--staged): bloqueia o commit se houver segredo de alta
    confianca nas linhas adicionadas;
  - como auditoria (--all): varre todos os arquivos versionados;
  - como teste (--selftest): valida os padroes contra amostras embutidas.

Politica de severidade (para nao travar commits legitimos por engano):
  - BLOCK  -> formatos de credencial inequivocos (token GitHub/Slack/Google/
             OpenAI, AWS AKIA, chave privada PEM, basic-auth com senha em URL);
  - WARN   -> heuristicas genericas (atribuicao secret=/password=); imprime,
             mas nao bloqueia. Revisar manualmente.

Allowlist:
  - linha contendo o marcador `allowlist-secret` (use so com justificativa);
  - valores-placeholder evidentes (***，REVOGAR, EXEMPLO, example, your_,
    changeme, <...>, xxxx);
  - entradas de dicionario de DETECCAO (linha que e apenas um identificador
    entre aspas, ex.: `"aws_secret_access_key",`), que sao regras, nao segredos;
  - a URL publica anonima do painel TCE-SP (`userid=anony`).
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

# (nome, regex, severidade) — BLOCK bloqueia; WARN apenas alerta.
PADROES = [
    ("github_token", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b"), "BLOCK"),
    ("github_pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{40,}\b"), "BLOCK"),
    ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "BLOCK"),
    ("google_api_key", re.compile(r"\bAIza[0-9A-Za-z_\-]{35}\b"), "BLOCK"),
    ("slack_token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"), "BLOCK"),
    ("openai_key", re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9]{20,}\b"), "BLOCK"),
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----"), "BLOCK"),
    ("basic_auth_url", re.compile(r"://[A-Za-z0-9_.\-]+:[^@/:\s]{6,}@[A-Za-z0-9.\-]"), "BLOCK"),
    ("generic_secret", re.compile(
        r"(?i)\b(?:secret|token|passwd|password|senha|api[_-]?key|client[_-]?secret|access[_-]?token)\b"
        r"\s*[:=]\s*[\"']?[A-Za-z0-9/+_\-]{16,}"), "WARN"),
]

ALLOW_MARKERS = (
    "allowlist-secret",
    "userid=anony",          # URL publica anonima TCE-SP Pentaho
    "***", "REVOGAR", "EXEMPLO", "example", "placeholder",
    "your_", "changeme", "<token>", "<TOKEN>", "xxxx", "XXXX", "dummy",
)
# Linha que e somente um identificador entre aspas (regra de deteccao, nao segredo).
RE_DICT_ENTRY = re.compile(r"""^\s*[\"'][A-Za-z0-9_ ]+[\"']\s*[,:]?\s*(#.*)?$""")


def linha_allowlisted(linha: str) -> bool:
    if any(m in linha for m in ALLOW_MARKERS):
        return True
    if RE_DICT_ENTRY.match(linha):
        return True
    return False


def redigir(valor: str) -> str:
    """Nunca imprimir o segredo inteiro."""
    valor = valor.strip().strip("\"'")
    if len(valor) <= 8:
        return valor[:2] + "***"
    return valor[:4] + "***" + valor[-2:]


def varrer_linha(linha: str):
    """Retorna lista de (nome_padrao, severidade, valor_redigido)."""
    if linha_allowlisted(linha):
        return []
    achados = []
    for nome, regex, sev in PADROES:
        m = regex.search(linha)
        if m:
            achados.append((nome, sev, redigir(m.group(0))))
    return achados


def _git(args):
    return subprocess.run(
        ["git", *args], capture_output=True, text=True, encoding="utf-8", errors="replace"
    )


def arquivos_staged():
    r = _git(["diff", "--cached", "--name-only", "--diff-filter=ACM"])
    return [p for p in r.stdout.splitlines() if p.strip()]


def linhas_adicionadas_staged():
    """(arquivo, n_linha_aprox, texto) de cada linha + do diff staged."""
    r = _git(["diff", "--cached", "-U0", "--no-color", "--diff-filter=ACM"])
    arquivo = None
    nlinha = 0
    out = []
    for raw in r.stdout.splitlines():
        if raw.startswith("+++ b/"):
            arquivo = raw[6:]
            continue
        if raw.startswith("@@"):
            m = re.search(r"\+(\d+)", raw)
            nlinha = int(m.group(1)) if m else 0
            continue
        if raw.startswith("+") and not raw.startswith("+++"):
            out.append((arquivo, nlinha, raw[1:]))
            nlinha += 1
    return out


def arquivos_versionados():
    r = _git(["ls-files"])
    return [p for p in r.stdout.splitlines() if p.strip()]


PULAR_EXT = {".png", ".jpg", ".jpeg", ".gif", ".pdf", ".ico", ".woff", ".woff2",
             ".ttf", ".zip", ".gz", ".xlsx", ".exe", ".webp"}


def varrer_tree(root: Path):
    achados = []
    for rel in arquivos_versionados():
        p = root / rel
        if p.suffix.lower() in PULAR_EXT or not p.is_file():
            continue
        try:
            texto = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for i, linha in enumerate(texto.splitlines(), 1):
            for nome, sev, val in varrer_linha(linha):
                achados.append((rel, i, nome, sev, val))
    return achados


def varrer_staged():
    achados = []
    for arquivo, n, linha in linhas_adicionadas_staged():
        for nome, sev, val in varrer_linha(linha):
            achados.append((arquivo, n, nome, sev, val))
    return achados


def selftest() -> int:
    # As amostras positivas sao MONTADAS EM RUNTIME por concatenacao, de proposito:
    # assim NENHUM literal com formato de credencial existe no arquivo-fonte — nem
    # o scanner local nem o GitHub Push Protection disparam sobre as fixtures. A
    # deteccao segue sendo exercitada (o valor montado tem o formato real).
    _gh = "ghp_" + "A" * 36
    _aws = "AKIA" + "1234567890ABCDEF"
    _slack = "xoxb-" + "1234567890-abcdefghijkl"
    _pem = "-----BEGIN " + "OPENSSH PRIVATE KEY-----"
    _url = "https://user:" + "supersenha123" + "@host.com/db"
    positivos = [
        "Token atual: " + _gh,
        "aws = " + _aws,
        _pem,
        "url = " + _url,
        _slack,
    ]
    negativos = [
        '    "aws_secret_access_key",          # AWS',           # regra de deteccao
        '    "BEGIN PRIVATE KEY",',                               # regra de deteccao
        "...generatedContent?password=zero&userid=anony,html",   # URL publica TCE
        "Token atual: ghp_***REVOGAR-E-PURGAR-DO-HISTORICO***",   # placeholder
        "api_key = your_key_here  # allowlist-secret",
    ]
    falhas = []
    for s in positivos:
        if not [a for a in varrer_linha(s) if a[1] == "BLOCK"]:
            falhas.append(f"FALSO NEGATIVO (deveria BLOCK): {s!r}")
    for s in negativos:
        if [a for a in varrer_linha(s) if a[1] == "BLOCK"]:
            falhas.append(f"FALSO POSITIVO (nao deveria BLOCK): {s!r}")
    if falhas:
        print("SELFTEST FALHOU:")
        for f in falhas:
            print("  -", f)
        return 1
    print("SELFTEST OK: %d positivos / %d negativos." % (len(positivos), len(negativos)))
    return 0


def relatar(achados, modo: str) -> int:
    blocks = [a for a in achados if a[3] == "BLOCK"]
    warns = [a for a in achados if a[3] == "WARN"]
    for arq, n, nome, sev, val in achados:
        print(f"  [{sev}] {arq}:{n}  {nome}={val}")
    if blocks:
        print(f"\nSEGREDO detectado ({len(blocks)} BLOCK, {len(warns)} WARN) — commit/push BARRADO.")
        print("Remova o valor real do arquivo. Para segredos legitimos em doc/teste,")
        print("use placeholder ou adicione 'allowlist-secret' na linha com justificativa.")
        return 1
    if warns:
        print(f"\n{len(warns)} aviso(s) heuristico(s) — revise manualmente (nao bloqueia).")
    if not achados:
        print(f"check-secrets ({modo}): OK — nenhum segredo encontrado.")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Varredura de segredos (publico).")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--staged", action="store_true", help="varre linhas staged (pre-commit)")
    g.add_argument("--all", action="store_true", help="varre todos os arquivos versionados")
    g.add_argument("--selftest", action="store_true", help="valida os padroes")
    args = ap.parse_args(argv)

    if args.selftest:
        return selftest()
    if args.all:
        root = Path(_git(["rev-parse", "--show-toplevel"]).stdout.strip() or ".")
        return relatar(varrer_tree(root), "all")
    # default = staged
    return relatar(varrer_staged(), "staged")


if __name__ == "__main__":
    raise SystemExit(main())
