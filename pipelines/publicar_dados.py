"""
Publica dados para consumo do site.

Fluxo por área:
    saude, educacao : raw -> extracted -> validated -> public  (fonte: prefeitura)
    seguranca       : raw -> extracted -> public               (fonte: API federal SICONFI)
    transporte      : raw -> extracted -> public               (fonte: API federal SICONFI)
                      EXCETO contratos PNCP: raw -> extracted -> validated -> public
                      (contratos requerem curadoria manual antes de publicar)

Para segurança e transporte, a ausência de validated é intencional para os dados
SICONFI: a garantia de integridade é da API federal (Tesouro Nacional).

Segurança — padrão RREO EXCETO INTRA:
    2020 e 2022–2025: DCA Empenhada = RREO EXCETO (padrão esperado).
    2021: DCA = RREO EXCETO + INTRA (comportamento atípico daquele exercício).

Transporte — subfunção única:
    Sorocaba declara toda a função 26 em "FU26 - Demais Subfunções".
    O total inclui transporte público urbano e obras viárias sem discriminação.
    Contratos PNCP (validated) seguem fluxo com curadoria manual — não publicar
    sem revisar o CSV em validated/transporte/saida/ primeiro.

Gate validated→public (contrato em docs/contrato-validacao-publicacao.md):
    Bloco A (fonte): fonte_url, fonte_arquivo, script_extracao
    Bloco B (QA):    status=validated, validado_por, validado_em, sha256_raw
    Bloco C (auth):  Origem_Dir=public em datasets.csv + autorizado_por em qa.csv

    Usar --skip-qa-gate apenas durante migração de arquivos legados já em public/.
    Remover o flag assim que qa.csv estiver retroativamente preenchido.
"""
import argparse
import csv
import os
import re
import shutil
from datetime import date
from pathlib import Path

from paths import DATA_DIR, PUBLIC_DIR, VALIDATED_DIR, EXTRACTED_DIR

AREAS_VALIDADAS = {"saude", "educacao"}
AREAS_EXTRACTED = {"seguranca", "transporte"}
AREAS_VALIDAS = AREAS_VALIDADAS | AREAS_EXTRACTED
MANIFEST = DATA_DIR / "manifests" / "datasets.csv"


def padrao_para_regex(padrao: str) -> re.Pattern[str]:
    escaped = re.escape(padrao).replace(r"\{ano\}", r"\d{4}")
    return re.compile(f"^{escaped}$")


def carregar_regras_publicacao(municipio: str) -> dict[str, list[tuple[re.Pattern[str], str]]]:
    if not MANIFEST.exists():
        raise FileNotFoundError(f"Manifesto nao encontrado: {MANIFEST}")

    regras: dict[str, list[tuple[re.Pattern[str], str]]] = {}
    with MANIFEST.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if (row.get("municipio") or "").strip() != municipio:
                continue
            area = (row.get("Area") or "").strip()
            padrao = (row.get("Arquivo_Padrao") or "").strip()
            origem = (row.get("Origem_Dir") or "public").strip()
            if not area or not padrao:
                continue
            regras.setdefault(area, []).append((padrao_para_regex(padrao), origem))
    return regras


def validar_arquivo_publicavel(area: str, arquivo: Path, regras: dict[str, list[tuple[re.Pattern[str], str]]]) -> None:
    for regex, origem in regras.get(area, []):
        if not regex.match(arquivo.name):
            continue
        if origem != "public":
            raise ValueError(
                f"{arquivo.name} esta registrado em {MANIFEST.relative_to(DATA_DIR.parent)} "
                f"com Origem_Dir={origem}; nao pode ser publicado por publicar_dados.py."
            )
        return

    raise ValueError(
        f"{arquivo.name} nao tem padrao publicavel registrado em {MANIFEST.relative_to(DATA_DIR.parent)}."
    )


def _erros_bloco_a(row: dict) -> list[str]:
    erros: list[str] = []
    fonte_url = (row.get("fonte_url") or "").strip()
    if not fonte_url or not fonte_url.startswith("http"):
        erros.append("fonte_url: vazio ou nao comeca com http")
    if not (row.get("fonte_arquivo") or "").strip():
        erros.append("fonte_arquivo: vazio")
    if not (row.get("script_extracao") or "").strip():
        erros.append("script_extracao: vazio")
    return erros


def _erros_bloco_b(row: dict) -> list[str]:
    erros: list[str] = []
    status = (row.get("status") or "").strip()
    if status not in ("validated", "public", "retroativo"):
        erros.append(f"status: '{status}' invalido (esperado: validated ou retroativo)")
    if not (row.get("validado_por") or "").strip():
        erros.append("validado_por: vazio")
    validado_em = (row.get("validado_em") or "").strip()
    if not validado_em:
        erros.append("validado_em: vazio")
    else:
        try:
            if date.fromisoformat(validado_em) > date.today():
                erros.append(f"validado_em: data futura ({validado_em})")
        except ValueError:
            erros.append(f"validado_em: formato invalido ({validado_em}); esperado YYYY-MM-DD")
    sha = (row.get("sha256_raw") or "").strip()
    if len(sha) != 64 or not all(c in "0123456789abcdefABCDEF" for c in sha):
        erros.append(f"sha256_raw: invalido (esperado hex 64 chars, recebido '{sha[:12]}...')")
    return erros


def _erros_bloco_c(row: dict) -> list[str]:
    if not (row.get("autorizado_por") or "").strip():
        return ["autorizado_por: vazio"]
    return []


def _localizar_row_qa(qa_path: Path, nome_arquivo: str) -> dict | None:
    with qa_path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if (row.get("arquivo") or "").strip() == nome_arquivo:
                return row
    return None


def verificar_gate_qa(municipio: str, arquivo: Path) -> None:
    qa_path = DATA_DIR / "manifests" / municipio / "qa.csv"
    if not qa_path.exists():
        raise FileNotFoundError(
            f"QA manifest ausente: {qa_path.relative_to(DATA_DIR.parent)}\n"
            f"Criar o arquivo com schema definido em docs/contrato-validacao-publicacao.md\n"
            f"ou usar --skip-qa-gate para arquivos legados ja em public/."
        )

    row = _localizar_row_qa(qa_path, arquivo.name)
    if row is None:
        raise ValueError(
            f"{arquivo.name} nao tem entrada no QA manifest "
            f"{qa_path.relative_to(DATA_DIR.parent)}.\n"
            f"Adicionar linha ao qa.csv antes de promover, ou usar --skip-qa-gate para legados."
        )

    erros = _erros_bloco_a(row) + _erros_bloco_b(row) + _erros_bloco_c(row)
    if erros:
        raise ValueError(
            f"Gate QA falhou para {arquivo.name}:\n"
            + "\n".join(f"  - {e}" for e in erros)
        )


def publicar_area(area: str, ano: int | None, municipio: str, skip_qa: bool = False) -> list[Path]:
    if area in AREAS_VALIDADAS:
        origem = VALIDATED_DIR / area / "saida"
    else:
        origem = EXTRACTED_DIR / area / "saida"

    destino = PUBLIC_DIR / area / "saida"

    if not origem.exists():
        raise FileNotFoundError(f"Pasta de origem não encontrada: {origem}")

    destino.mkdir(parents=True, exist_ok=True)
    padrao = f"*_{ano}.csv" if ano else "*.csv"
    regras = carregar_regras_publicacao(municipio)
    publicados = []

    for arquivo in sorted(origem.glob(padrao)):
        validar_arquivo_publicavel(area, arquivo, regras)
        if not skip_qa:
            verificar_gate_qa(municipio, arquivo)
        alvo = destino / arquivo.name
        shutil.copy2(arquivo, alvo)
        publicados.append(alvo)

    return publicados


def main():
    parser = argparse.ArgumentParser(description="Publica CSVs em data/public.")
    parser.add_argument("--area", choices=sorted(AREAS_VALIDAS), required=True)
    parser.add_argument("--ano", type=int, default=None)
    parser.add_argument(
        "--municipio",
        default=os.getenv("MUNICIPIO", "sorocaba"),
        help="Slug do municipio (default: env MUNICIPIO ou 'sorocaba')",
    )
    parser.add_argument(
        "--skip-qa-gate",
        action="store_true",
        help=(
            "Pula verificacao do QA manifest. Usar apenas para arquivos legados "
            "ja em public/ antes da adocao do contrato validated->public. "
            "Remover assim que qa.csv estiver retroativamente preenchido."
        ),
    )
    args = parser.parse_args()

    publicados = publicar_area(args.area, args.ano, args.municipio, skip_qa=args.skip_qa_gate)
    if not publicados:
        print("Nenhum arquivo publicado.")
        return

    if args.skip_qa_gate:
        print("AVISO: --skip-qa-gate ativo. Gate QA ignorado para esta execucao. Preencher qa.csv para remover flag.")
    print("Arquivos publicados:")
    for arquivo in publicados:
        print(f"  {arquivo}")


if __name__ == "__main__":
    main()
