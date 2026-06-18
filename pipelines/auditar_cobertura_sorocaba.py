"""
Gera uma matriz local de cobertura dos dados de Sorocaba.

O objetivo e mapear tudo que existe nas camadas data/raw, data/extracted,
data/validated, data/public e data/manifests sem transformar dado em publicacao.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path

from paths import DATA_DIR, ROOT


CAMADAS = ("raw", "extracted", "validated", "public", "manifests")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def camada(path: Path) -> str:
    partes = path.relative_to(DATA_DIR).parts
    return partes[0] if partes else ""


def tema(path: Path) -> str:
    partes = path.relative_to(DATA_DIR).parts
    if len(partes) >= 3 and partes[1] == "sorocaba":
        return partes[2]
    if len(partes) >= 2 and partes[0] == "public":
        return partes[1]
    return ""


def ano_do_nome(path: Path) -> str:
    for pedaco in path.stem.replace("-", "_").split("_"):
        if pedaco.isdigit() and len(pedaco) == 4:
            return pedaco
    for pedaco in path.parts:
        if pedaco.isdigit() and len(pedaco) == 4:
            return pedaco
    return ""


def perfil_csv(path: Path) -> dict[str, str | int]:
    try:
        with path.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            colunas = reader.fieldnames or []
            linhas = 0
            vazios_por_coluna = {coluna: 0 for coluna in colunas}
            for row in reader:
                linhas += 1
                for coluna in colunas:
                    if not (row.get(coluna) or "").strip():
                        vazios_por_coluna[coluna] += 1
    except UnicodeDecodeError:
        with path.open(encoding="latin-1", newline="") as f:
            reader = csv.DictReader(f)
            colunas = reader.fieldnames or []
            linhas = 0
            vazios_por_coluna = {coluna: 0 for coluna in colunas}
            for row in reader:
                linhas += 1
                for coluna in colunas:
                    if not (row.get(coluna) or "").strip():
                        vazios_por_coluna[coluna] += 1

    colunas_com_vazios = [
        f"{coluna}={qtd}"
        for coluna, qtd in vazios_por_coluna.items()
        if qtd
    ]
    return {
        "linhas": linhas,
        "colunas": len(colunas),
        "nomes_colunas": "|".join(colunas),
        "colunas_com_vazios": ";".join(colunas_com_vazios[:40]),
    }


def perfil_json(path: Path) -> dict[str, str | int]:
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return {"linhas": len(data), "colunas": "", "nomes_colunas": "", "colunas_com_vazios": ""}
    if isinstance(data, dict):
        return {
            "linhas": 1,
            "colunas": len(data),
            "nomes_colunas": "|".join(data.keys()),
            "colunas_com_vazios": "",
        }
    return {"linhas": "", "colunas": "", "nomes_colunas": "", "colunas_com_vazios": ""}


def perfil_pdf(path: Path) -> dict[str, str | int]:
    import fitz

    with fitz.open(path) as doc:
        paginas = doc.page_count
        paginas_com_texto = 0
        palavras_amostra = 0
        for idx, page in enumerate(doc):
            words = page.get_text("words")
            if words:
                paginas_com_texto += 1
            if idx < 10:
                palavras_amostra += len(words)
    return {
        "linhas": "",
        "colunas": "",
        "nomes_colunas": "",
        "colunas_com_vazios": "",
        "paginas_pdf": paginas,
        "paginas_pdf_com_texto": paginas_com_texto,
        "palavras_amostra_10_paginas": palavras_amostra,
    }


def status_publicacao(path: Path) -> str:
    c = camada(path)
    if c == "public":
        return "publicado"
    if c == "validated":
        return "validado_local_nao_publicado"
    if c == "extracted":
        return "extraido_nao_publicado"
    if c == "raw":
        return "fonte_bruta_nao_publicada"
    return "controle"


def auditar(calcular_hash: bool, camadas: set[str]) -> list[dict[str, str | int]]:
    registros = []
    for nome_camada in CAMADAS:
        if nome_camada not in camadas:
            continue
        raiz_camada = DATA_DIR / nome_camada
        if not raiz_camada.exists():
            continue
        for path in sorted(raiz_camada.rglob("*")):
            if not path.is_file():
                continue
            rel = path.relative_to(ROOT).as_posix()
            ext = path.suffix.lower().lstrip(".")
            registro: dict[str, str | int] = {
                "arquivo": rel,
                "camada": camada(path),
                "tema": tema(path),
                "ano": ano_do_nome(path),
                "extensao": ext,
                "bytes": path.stat().st_size,
                "sha256": sha256(path) if calcular_hash else "",
                "status_publicacao": status_publicacao(path),
                "linhas": "",
                "colunas": "",
                "nomes_colunas": "",
                "colunas_com_vazios": "",
                "paginas_pdf": "",
                "paginas_pdf_com_texto": "",
                "palavras_amostra_10_paginas": "",
                "observacao": "",
            }
            try:
                if ext == "csv":
                    registro.update(perfil_csv(path))
                elif ext == "json":
                    registro.update(perfil_json(path))
                elif ext == "pdf":
                    registro.update(perfil_pdf(path))
            except Exception as exc:
                registro["observacao"] = f"erro_perfil: {type(exc).__name__}: {exc}"
            registros.append(registro)
    return registros


def normalizar_camadas(valores: list[str] | None) -> set[str]:
    if not valores:
        return set(CAMADAS)

    normalizadas: set[str] = set()
    for valor in valores:
        partes = [parte.strip() for parte in valor.split(",") if parte.strip()]
        for parte in partes:
            if parte not in CAMADAS:
                opcoes = ", ".join(CAMADAS)
                raise ValueError(f"Camada invalida: {parte}. Opcoes: {opcoes}")
            normalizadas.add(parte)
    return normalizadas


def main() -> None:
    parser = argparse.ArgumentParser(description="Audita cobertura local de Sorocaba")
    parser.add_argument(
        "--saida",
        default=str(DATA_DIR / "manifests" / "auditoria_cobertura_sorocaba.csv"),
    )
    parser.add_argument(
        "--camada",
        action="append",
        help="Camada a auditar. Pode repetir ou usar lista separada por virgula.",
    )
    parser.add_argument("--sem-hash", action="store_true")
    args = parser.parse_args()

    camadas = normalizar_camadas(args.camada)
    registros = auditar(calcular_hash=not args.sem_hash, camadas=camadas)
    destino = Path(args.saida)
    destino.parent.mkdir(parents=True, exist_ok=True)
    campos = [
        "arquivo",
        "camada",
        "tema",
        "ano",
        "extensao",
        "bytes",
        "sha256",
        "status_publicacao",
        "linhas",
        "colunas",
        "nomes_colunas",
        "colunas_com_vazios",
        "paginas_pdf",
        "paginas_pdf_com_texto",
        "palavras_amostra_10_paginas",
        "observacao",
    ]
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(registros)

    print(f"Arquivos auditados: {len(registros)}")
    print(f"Camadas auditadas: {', '.join(c for c in CAMADAS if c in camadas)}")
    print(f"Saida: {destino}")


if __name__ == "__main__":
    main()
