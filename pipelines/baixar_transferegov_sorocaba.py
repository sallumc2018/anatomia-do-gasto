"""
Coleta seletiva dos dados abertos Transferegov/SICONV para Sorocaba.

Fonte oficial:
  http://repositorio.dados.gov.br/seges/detru/
  https://www.gov.br/transferegov/pt-br/ferramentas-gestao/dados-abertos/download-dados

O script nao publica dados. Ele baixa ZIPs selecionados para o raw operacional
fora do repo quando possivel e grava apenas recortes filtrados em data/extracted.

Uso:
  python pipelines\\baixar_transferegov_sorocaba.py --inventario
  python pipelines\\baixar_transferegov_sorocaba.py --apenas-listar
  python pipelines\\baixar_transferegov_sorocaba.py --dataset convenio --max-mb 20
  python pipelines\\baixar_transferegov_sorocaba.py --essenciais --max-mb 25
"""
import argparse
import csv
import html
import re
import shutil
import time
import urllib.error
import urllib.request
import zipfile
from dataclasses import dataclass
from pathlib import Path

from paths import CFG, EXTRACTED_DIR, RAW_DIR

BASE_URL = "http://repositorio.dados.gov.br/seges/detru/"
DOC_URL = "https://www.gov.br/transferegov/pt-br/ferramentas-gestao/dados-abertos/download-dados"

CNPJ_SOROCABA = "46634044000174"
MUNICIPIO_SOROCABA = "SOROCABA"
UF_SOROCABA = "SP"
IBGE_SOROCABA = CFG["ibge"]

DATASETS_ESSENCIAIS = {
    "proponentes": "siconv_proponentes.csv.zip",
    "proposta": "siconv_proposta.csv.zip",
    "convenio": "siconv_convenio.csv.zip",
    "desembolso": "siconv_desembolso.csv.zip",
    "emenda": "siconv_emenda.csv.zip",
    "empenho": "siconv_empenho.csv.zip",
}

CHAVES_INSTRUMENTO = (
    "NR_CONVENIO",
    "ID_CONVENIO",
    "ID_PROPONENTE",
    "ID_PROPOSTA",
    "NR_PROPOSTA",
)

COLUNAS_CNPJ = (
    "CNPJ_PROPONENTE",
    "CNPJ_PROPONENTE_CONVENIO",
    "CNPJ_CONVENENTE",
    "IDENTIF_PROPONENTE",
    "CPF_CNPJ_PROPONENTE",
)
COLUNAS_MUNICIPIO = (
    "MUNICIPIO_PROPONENTE",
    "NM_MUNICIPIO_PROPONENTE",
    "MUNIC_PROPONENTE",
    "MUNICIPIO",
    "NOME_MUNICIPIO",
    "NM_MUNICIPIO",
)
COLUNAS_UF = (
    "UF_PROPONENTE",
    "UF",
    "SG_UF",
)
COLUNAS_IBGE = (
    "COD_MUNICIPIO_IBGE",
    "COD_IBGE",
    "IBGE",
    "CD_MUNICIPIO",
)


@dataclass
class ItemRepositorio:
    nome: str
    url: str
    data: str
    tamanho_texto: str
    tamanho_bytes: int | None


def raw_transferegov_dir() -> Path:
    return RAW_DIR / "transferegov"


RAW_TRANSFEREGOV_DIR = raw_transferegov_dir()
EXTRACTED_TRANSFEREGOV_DIR = EXTRACTED_DIR / "transferegov"


def abrir_url(url: str, method: str = "GET"):
    req = urllib.request.Request(
        url,
        method=method,
        headers={
            "User-Agent": "Mozilla/5.0 AnatomiaDoGasto/1.0",
            "Accept": "*/*",
        },
    )
    return urllib.request.urlopen(req, timeout=120)


def parse_tamanho(valor: str) -> int | None:
    texto = valor.strip().upper()
    match = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?)([KMG]?)", texto)
    if not match:
        return None
    numero = float(match.group(1))
    unidade = match.group(2)
    fator = {"": 1, "K": 1024, "M": 1024**2, "G": 1024**3}[unidade]
    return int(numero * fator)


def carregar_inventario() -> list[ItemRepositorio]:
    with abrir_url(BASE_URL) as resp:
        conteudo = resp.read().decode("utf-8", errors="replace")

    itens = []
    padrao = re.compile(
        r'<a href="([^"]+)">([^<]+)</a>\s+([0-9]{2}-[A-Za-z]{3}-[0-9]{4}\s+[0-9]{2}:[0-9]{2})\s+([0-9.]+[KMG]?)',
        flags=re.I,
    )
    for href, nome, data, tamanho in padrao.findall(conteudo):
        nome = html.unescape(nome).strip()
        if not nome.endswith(".zip"):
            continue
        itens.append(
            ItemRepositorio(
                nome=nome,
                url=BASE_URL + href,
                data=data,
                tamanho_texto=tamanho,
                tamanho_bytes=parse_tamanho(tamanho),
            )
        )
    return itens


def salvar_inventario(itens: list[ItemRepositorio]) -> Path:
    destino = EXTRACTED_TRANSFEREGOV_DIR / "inventario_repositorio_transferegov.csv"
    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["nome", "url", "data_repositorio", "tamanho_repositorio", "tamanho_bytes"],
        )
        writer.writeheader()
        for item in itens:
            writer.writerow(
                {
                    "nome": item.nome,
                    "url": item.url,
                    "data_repositorio": item.data,
                    "tamanho_repositorio": item.tamanho_texto,
                    "tamanho_bytes": item.tamanho_bytes or "",
                }
            )
    return destino


def baixar_zip(item: ItemRepositorio, destino: Path, forcar: bool) -> Path:
    if destino.exists() and not forcar:
        print(f"Ja existe, pulando download: {destino}")
        return destino

    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".part")
    with abrir_url(item.url) as resp, parcial.open("wb") as f:
        shutil.copyfileobj(resp, f, length=1024 * 1024)
    parcial.replace(destino)
    print(f"Baixado: {destino} ({destino.stat().st_size // 1024} KB)")
    return destino


def normalizar(valor: object) -> str:
    return str(valor or "").strip().upper()


def somente_digitos(valor: object) -> str:
    return re.sub(r"\D", "", str(valor or ""))


def linha_eh_sorocaba(row: dict[str, str]) -> bool:
    for coluna in COLUNAS_CNPJ:
        if coluna in row and somente_digitos(row[coluna]) == CNPJ_SOROCABA:
            return True
    for coluna in COLUNAS_IBGE:
        if coluna in row and somente_digitos(row[coluna]) == IBGE_SOROCABA:
            return True

    municipio_ok = any(
        coluna in row and normalizar(row[coluna]) == MUNICIPIO_SOROCABA
        for coluna in COLUNAS_MUNICIPIO
    )
    uf_ok = any(coluna in row and normalizar(row[coluna]) == UF_SOROCABA for coluna in COLUNAS_UF)
    return municipio_ok and uf_ok


def linha_tem_instrumento(row: dict[str, str], instrumentos: dict[str, set[str]]) -> bool:
    for coluna, valores in instrumentos.items():
        if coluna in row and normalizar(row[coluna]) in valores:
            return True
    return False


def atualizar_instrumentos(row: dict[str, str], instrumentos: dict[str, set[str]]) -> None:
    for coluna in CHAVES_INSTRUMENTO:
        valor = normalizar(row.get(coluna))
        if valor:
            instrumentos.setdefault(coluna, set()).add(valor)


def abrir_csv_do_zip(zip_path: Path):
    zf = zipfile.ZipFile(zip_path)
    nomes_csv = [nome for nome in zf.namelist() if nome.lower().endswith(".csv")]
    if not nomes_csv:
        zf.close()
        raise RuntimeError(f"Nenhum CSV encontrado em {zip_path}")
    stream = zf.open(nomes_csv[0])
    return zf, nomes_csv[0], stream


def detectar_dialeto_e_encoding(amostra: bytes) -> tuple[str, csv.Dialect]:
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            texto = amostra[:-4].decode(encoding)
        except UnicodeDecodeError:
            continue
        try:
            dialeto = csv.Sniffer().sniff(texto, delimiters=";,")
        except csv.Error:
            dialeto = csv.excel
            dialeto.delimiter = ";"
        return encoding, dialeto
    texto = amostra.decode("latin-1", errors="replace")
    try:
        return "latin-1", csv.Sniffer().sniff(texto, delimiters=";,")
    except csv.Error:
        dialeto = csv.excel
        dialeto.delimiter = ";"
        return "latin-1", dialeto


def filtrar_zip(zip_path: Path, dataset: str, instrumentos: dict[str, set[str]]) -> tuple[Path, int, int, list[str], str]:
    import io

    zf, nome_csv, stream = abrir_csv_do_zip(zip_path)
    try:
        amostra = stream.read(65536)
        encoding, dialeto = detectar_dialeto_e_encoding(amostra)
        stream.close()
        stream = zf.open(nome_csv)
        texto = io.TextIOWrapper(stream, encoding=encoding, errors="replace", newline="")
        reader = csv.DictReader(texto, dialect=dialeto)
        fieldnames = [nome.lstrip("\ufeff") for nome in list(reader.fieldnames or [])]
        reader.fieldnames = fieldnames
        nome_base = DATASETS_ESSENCIAIS.get(dataset, dataset)
        for sufixo in (".zip", ".csv"):
            if nome_base.endswith(sufixo):
                nome_base = nome_base[: -len(sufixo)]
        destino = EXTRACTED_TRANSFEREGOV_DIR / f"{nome_base}_sorocaba.csv"
        destino.parent.mkdir(parents=True, exist_ok=True)

        lidas = 0
        mantidas = 0
        with destino.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for row in reader:
                row = {str(k).lstrip("\ufeff"): v for k, v in row.items()}
                lidas += 1
                if linha_eh_sorocaba(row) or linha_tem_instrumento(row, instrumentos):
                    writer.writerow(row)
                    atualizar_instrumentos(row, instrumentos)
                    mantidas += 1
        return destino, lidas, mantidas, fieldnames, nome_csv
    finally:
        try:
            stream.close()
        finally:
            zf.close()


def resolver_datasets(args: argparse.Namespace) -> list[str]:
    if args.dataset:
        return args.dataset
    if args.essenciais:
        return list(DATASETS_ESSENCIAIS)
    return ["convenio"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Coleta seletiva Transferegov/SICONV para Sorocaba")
    parser.add_argument("--inventario", action="store_true", help="Salva inventario local da listagem oficial")
    parser.add_argument("--apenas-listar", action="store_true", help="Lista ZIPs essenciais sem baixar")
    parser.add_argument("--essenciais", action="store_true", help="Processa convenio, proponentes, desembolso, emenda e empenho")
    parser.add_argument("--dataset", choices=sorted(DATASETS_ESSENCIAIS), action="append")
    parser.add_argument("--forcar", action="store_true", help="Rebaixa ZIPs existentes")
    parser.add_argument("--max-mb", type=int, default=25, help="Limite de tamanho por ZIP; padrao: 25 MB")
    parser.add_argument("--delay", type=float, default=1.0, help="Pausa entre downloads")
    args = parser.parse_args()

    itens = carregar_inventario()
    por_nome = {item.nome: item for item in itens}

    if args.inventario:
        destino = salvar_inventario(itens)
        print(f"Inventario salvo: {destino}")
        print(f"Fonte: {BASE_URL}")
        print(f"Documentacao: {DOC_URL}")

    datasets = resolver_datasets(args)
    instrumentos: dict[str, set[str]] = {}
    resultados = []

    for dataset in datasets:
        nome_zip = DATASETS_ESSENCIAIS[dataset]
        item = por_nome.get(nome_zip)
        if not item:
            print(f"{dataset}: ZIP nao encontrado no repositorio: {nome_zip}")
            continue

        print(f"\n=== {dataset} ===")
        print(f"ZIP: {item.nome}")
        print(f"Fonte: {item.url}")
        print(f"Repositorio: {item.data}, {item.tamanho_texto}")

        if args.apenas_listar:
            continue

        if item.tamanho_bytes and item.tamanho_bytes > args.max_mb * 1024 * 1024:
            print(f"Pulando: maior que --max-mb {args.max_mb}.")
            continue

        zip_path = baixar_zip(item, RAW_TRANSFEREGOV_DIR / "zips" / item.nome, args.forcar)
        destino, lidas, mantidas, colunas, csv_interno = filtrar_zip(zip_path, dataset, instrumentos)
        resultados.append((dataset, destino, lidas, mantidas, len(colunas), csv_interno))
        print(f"CSV interno: {csv_interno}")
        print(f"Linhas lidas: {lidas}")
        print(f"Linhas Sorocaba/instrumentos: {mantidas}")
        print(f"Recorte: {destino}")
        time.sleep(args.delay)

    if resultados:
        print("\nResumo:")
        for dataset, destino, lidas, mantidas, total_colunas, _ in resultados:
            print(f"- {dataset}: {mantidas}/{lidas} linhas, {total_colunas} colunas -> {destino}")
        print(f"Raw ZIPs: {RAW_TRANSFEREGOV_DIR / 'zips'}")
        print("Nenhum arquivo foi salvo em data/public.")


if __name__ == "__main__":
    try:
        main()
    except (urllib.error.URLError, zipfile.BadZipFile, RuntimeError) as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        raise
