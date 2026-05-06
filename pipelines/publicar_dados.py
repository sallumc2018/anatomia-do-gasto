"""
Publica dados validados para consumo do site.

Este script nunca lê data/extracted diretamente. O fluxo esperado é:
raw -> extracted -> validated -> public.
"""
import argparse
import shutil
from pathlib import Path

from paths import PUBLIC_DIR, VALIDATED_DIR


def publicar_area(area: str, ano: int | None) -> list[Path]:
    origem = VALIDATED_DIR / area / "saida"
    destino = PUBLIC_DIR / area / "saida"
    if not origem.exists():
        raise FileNotFoundError(f"Pasta validada não encontrada: {origem}")

    destino.mkdir(parents=True, exist_ok=True)
    padrao = f"*_{ano}.csv" if ano else "*.csv"
    publicados = []

    for arquivo in sorted(origem.glob(padrao)):
        alvo = destino / arquivo.name
        shutil.copy2(arquivo, alvo)
        publicados.append(alvo)

    return publicados


def main():
    parser = argparse.ArgumentParser(description="Publica CSVs validados em data/public.")
    parser.add_argument("--area", choices=["saude", "educacao"], required=True)
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
