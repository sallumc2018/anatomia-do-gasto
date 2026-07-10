"""
Saneador LGPD — mascara CPF e RG de pessoas físicas em data/public (CSV e JSON).

Motivação: CPF completo de pessoa física não pode ser divulgado em transparência
ativa (LGPD Lei 13.709/2018; orientação CGU; STF Tema 1042 — nome de quem recebe
recurso público é divulgável, CPF deve ser protegido). RG segue a mesma lógica —
documento de identificação de pessoa física, sem base legal para publicação
integral em transparência ativa. Este saneador:

  1. Preserva o arquivo ORIGINAL (com CPF/RG completos) em data/private/lgpd_reservado/
     — diretório gitignored — para uso futuro quando a LGPD/LAI permitir.
  2. Mascara o CPF no arquivo público no padrão ***.XXX.XXX-** (mantém os 6 dígitos
     centrais, oculta os 3 primeiros e os 2 verificadores), preservando a utilidade
     de auditoria sem expor o documento completo.
  3. Mascara o RG (quando precedido da sigla "RG") por completo — RG não tem
     estrutura fixa de dígitos verificáveis entre estados, então não há um miolo
     seguro para preservar como no CPF.

NÃO afeta CNPJ (formato NN.NNN.NNN/NNNN-NN, padrão distinto).

Idempotente: o backup só é criado se ainda não existir; rodar de novo sobre um
arquivo já mascarado não faz nada (não há CPF/RG completo a mascarar).

Uso:
    .venv/bin/python3 pipelines/sanear_cpf_publicos.py            # aplica (CSV+JSON)
    .venv/bin/python3 pipelines/sanear_cpf_publicos.py --dry-run  # só relata
    .venv/bin/python3 pipelines/sanear_cpf_publicos.py --gate     # pre-commit gate
"""
from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT / "data" / "public"
RESERVA_DIR = ROOT / "data" / "private" / "lgpd_reservado"

# Extensões varridas em data/public (CSV de dados + JSON de schemas/amostras)
_EXTENSOES = ("*.csv", "*.json")

# CPF formatado: 000.000.000-00  (não casa CNPJ, que tem "/")
_RE_CPF = re.compile(r"\b(\d{3})\.(\d{3})\.(\d{3})-(\d{2})\b")

# CPF não-formatado (11 dígitos puros) anexado a um NOME — padrão do sistema de
# origem: "NOME COMPLETO DA PESSOA 00000000000". O lookbehind por letra+espaço
# evita casar CNPJ (tem "/"), códigos de fornecedor isolados (precedidos de vírgula)
# e valores. Mantém os 6 dígitos centrais no mesmo padrão ***.XXX.XXX-**.
_RE_CPF_PURO = re.compile(r"(?<=[A-Za-zÀ-ÿ] )(\d{3})(\d{3})(\d{3})(\d{2})\b")

# RG anexado à sigla "RG": "RG [protegido]", "RG [protegido]", "RG [protegido]".
# Cobre 1-2 dígitos iniciais, pontuação opcional, dígito verificador opcional
# (numérico ou X), e sufixo opcional de órgão emissor (ex. "SSP/SP").
_RE_RG = re.compile(
    r"\bRG[:\s]*(\d{1,2}\.?\d{3}\.?\d{3}-?[\dXx]?)(\s*SSP/[A-Z]{2})?"
)


def _mascarar(texto: str) -> tuple[str, int]:
    """Substitui CPF (formatado e puro anexado a nome) por ***.XXX.XXX-**,
    e RG (anexado à sigla) por RG [protegido]."""
    n = 0

    def repl_fmt(m: re.Match) -> str:
        nonlocal n
        n += 1
        return f"***.{m.group(2)}.{m.group(3)}-**"

    def repl_puro(m: re.Match) -> str:
        nonlocal n
        n += 1
        return f"***.{m.group(2)}.{m.group(3)}-**"

    def repl_rg(m: re.Match) -> str:
        nonlocal n
        n += 1
        return "RG [protegido]"

    texto = _RE_CPF.sub(repl_fmt, texto)
    texto = _RE_CPF_PURO.sub(repl_puro, texto)
    texto = _RE_RG.sub(repl_rg, texto)
    return texto, n


def _coletar_arquivos() -> list[Path]:
    arquivos: list[Path] = []
    for glob in _EXTENSOES:
        arquivos.extend(PUBLIC_DIR.rglob(glob))
    return sorted(set(arquivos))


def main() -> int:
    ap = argparse.ArgumentParser(description="Saneador LGPD — mascara CPF em data/public")
    ap.add_argument("--dry-run", action="store_true", help="apenas relata, não altera")
    ap.add_argument("--gate", action="store_true",
                    help="modo gate: não altera; sai com código 1 se houver QUALQUER CPF/RG "
                         "(para uso em pre-commit, bloqueia regressão)")
    args = ap.parse_args()
    if args.gate:
        args.dry_run = True

    total_arquivos = 0
    total_cpf = 0

    for arq_path in _coletar_arquivos():
        try:
            texto = arq_path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if not _RE_CPF.search(texto) and not _RE_CPF_PURO.search(texto) and not _RE_RG.search(texto):
            continue

        novo, n = _mascarar(texto)
        if n == 0:
            continue

        rel = arq_path.relative_to(PUBLIC_DIR)
        total_arquivos += 1
        total_cpf += n
        print(f"  {n:>4} CPF/RG  {rel}")

        if args.dry_run:
            continue

        # 1) Preserva o original (idempotente — só na primeira passagem)
        reserva = RESERVA_DIR / rel
        if not reserva.exists():
            reserva.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(arq_path, reserva)

        # 2) Mascara no público
        arq_path.write_text(novo, encoding="utf-8")

    modo = "[GATE] " if args.gate else "[DRY-RUN] " if args.dry_run else ""
    print(f"\n{modo}{total_cpf} CPF/RG em {total_arquivos} arquivo(s).")
    if not args.dry_run and total_arquivos:
        print(f"Originais preservados em: {RESERVA_DIR.relative_to(ROOT)}/ (gitignored)")
    if args.gate and total_cpf > 0:
        print("\n❌ GATE: CPF/RG detectado em data/public. Rode:")
        print("   .venv/bin/python3 pipelines/sanear_cpf_publicos.py")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
