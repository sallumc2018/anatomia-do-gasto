"""
Inventaria arquivos grandes ja baixados em data/raw.

O script nao baixa nada. Ele calcula tamanho e SHA256 dos arquivos locais para
permitir retomada segura e verificacao de integridade.
"""
import argparse
import csv
import hashlib
from datetime import datetime, timezone
from pathlib import Path

from paths import DATA_DIR, EXECUCAO_RAW_DIR

MANIFESTO = DATA_DIR / "manifests" / "arquivos_grandes_execucao_sorocaba.csv"
SAIDA = DATA_DIR / "manifests" / "arquivos_grandes_execucao_sorocaba_local.csv"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def localizar_arquivo(ano: str, nome: str) -> Path:
    return EXECUCAO_RAW_DIR / "livros_contabeis" / ano / nome


def main() -> None:
    parser = argparse.ArgumentParser(description="Inventaria arquivos grandes locais")
    parser.add_argument("--calcular-hash", action="store_true", help="Calcula SHA256 dos arquivos encontrados")
    args = parser.parse_args()

    with MANIFESTO.open(encoding="utf-8", newline="") as f:
        linhas = list(csv.DictReader(f))

    campos = [
        "municipio",
        "ano",
        "documento",
        "arquivo_bruto_esperado",
        "existe_localmente",
        "path_local",
        "tamanho_bytes_local",
        "sha256",
        "inventariado_em",
    ]
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with SAIDA.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()

        for row in linhas:
            path = localizar_arquivo(row["ano"], row["arquivo_bruto_esperado"])
            existe = path.exists()
            writer.writerow({
                "municipio": row["municipio"],
                "ano": row["ano"],
                "documento": row["documento"],
                "arquivo_bruto_esperado": row["arquivo_bruto_esperado"],
                "existe_localmente": "sim" if existe else "nao",
                "path_local": str(path) if existe else "",
                "tamanho_bytes_local": path.stat().st_size if existe else "",
                "sha256": sha256(path) if existe and args.calcular_hash else "",
                "inventariado_em": datetime.now(timezone.utc).isoformat(),
            })

    print(f"Saida: {SAIDA}")


if __name__ == "__main__":
    main()
