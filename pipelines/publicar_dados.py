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
import shutil
from pathlib import Path

from paths import PUBLIC_DIR, VALIDATED_DIR, EXTRACTED_DIR

AREAS_VALIDADAS = {"saude", "educacao"}
AREAS_EXTRACTED = {"seguranca", "transporte"}
AREAS_VALIDAS = AREAS_VALIDADAS | AREAS_EXTRACTED


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
    publicados = []

    for arquivo in sorted(origem.glob(padrao)):
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
