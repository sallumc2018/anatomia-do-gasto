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
"""
import argparse
import csv
import re
import shutil
from pathlib import Path

from paths import DATA_DIR, PUBLIC_DIR, VALIDATED_DIR, EXTRACTED_DIR

AREAS_VALIDADAS = {"saude", "educacao"}
AREAS_EXTRACTED = {"seguranca", "transporte"}
AREAS_VALIDAS = AREAS_VALIDADAS | AREAS_EXTRACTED
MANIFEST = DATA_DIR / "manifests" / "datasets.csv"


def padrao_para_regex(padrao: str) -> re.Pattern[str]:
    escaped = re.escape(padrao).replace(r"\{ano\}", r"\d{4}")
    return re.compile(f"^{escaped}$")


def carregar_regras_publicacao() -> dict[str, list[tuple[re.Pattern[str], str]]]:
    if not MANIFEST.exists():
        raise FileNotFoundError(f"Manifesto nao encontrado: {MANIFEST}")

    regras: dict[str, list[tuple[re.Pattern[str], str]]] = {}
    with MANIFEST.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
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


def publicar_area(area: str, ano: int | None) -> list[Path]:
    if area in AREAS_VALIDADAS:
        origem = VALIDATED_DIR / area / "saida"
    else:
        origem = EXTRACTED_DIR / area / "saida"

    destino = PUBLIC_DIR / area / "saida"

    if not origem.exists():
        raise FileNotFoundError(f"Pasta de origem não encontrada: {origem}")

    destino.mkdir(parents=True, exist_ok=True)
    padrao = f"*_{ano}.csv" if ano else "*.csv"
    regras = carregar_regras_publicacao()
    publicados = []

    for arquivo in sorted(origem.glob(padrao)):
        validar_arquivo_publicavel(area, arquivo, regras)
        alvo = destino / arquivo.name
        shutil.copy2(arquivo, alvo)
        publicados.append(alvo)

    return publicados


def main():
    parser = argparse.ArgumentParser(description="Publica CSVs em data/public.")
    parser.add_argument("--area", choices=sorted(AREAS_VALIDAS), required=True)
    parser.add_argument("--ano", type=int, default=None)
    args = parser.parse_args()

    publicados = publicar_area(args.area, args.ano)
    if not publicados:
        print("Nenhum arquivo publicado.")
        return

    print("Arquivos publicados:")
    for arquivo in publicados:
        print(f"  {arquivo}")


if __name__ == "__main__":
    main()
