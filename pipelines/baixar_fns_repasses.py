"""
Coleta repasses FAF com populacao do FNS/SUS para Sorocaba.

Fonte oficial:
  https://portalfns.saude.gov.br/downloads/

Saidas:
  raw externo/cache: {ANATOMIA_RAW_ROOT ou data/raw}/sorocaba/fns/repasses_faf_com_populacao/{ano}/...
  extracted: data/extracted/sorocaba/fns/repasses_faf_com_populacao/...

Uso:
  python pipelines/baixar_fns_repasses.py --listar
  python pipelines/baixar_fns_repasses.py --ano 2020
  python pipelines/baixar_fns_repasses.py --ano 2020 --ano 2021 --forcar
"""
import argparse
import csv
import html
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree as ET

from paths import CFG, MUNICIPIO, EXTRACTED_DIR, RAW_DIR

FONTE_DOWNLOADS = "https://portalfns.saude.gov.br/downloads/"
IBGE_SOROCABA = CFG["ibge"]
MUNICIPIO_SOROCABA = CFG["nome"].upper()
UF_SOROCABA = CFG["uf"].upper()
ANOS_PADRAO = range(2020, 2027)

FNS_RAW_DIR = RAW_DIR / "fns" / "repasses_faf_com_populacao"
FNS_EXTRACTED_DIR = EXTRACTED_DIR / "fns" / "repasses_faf_com_populacao"

INVENTARIO_CAMPOS = [
    "ano",
    "titulo",
    "url_pagina",
    "url_arquivo",
    "nome_arquivo",
    "content_type",
    "content_length",
    "status",
]

METADADOS_CAMPOS = [
    "ano_coleta",
    "fonte_url_pagina",
    "fonte_url_arquivo",
    "arquivo_origem",
]


class ColetorLinksFNS(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._em_link = False
        self._href = ""
        self._texto = []
        self.links: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "a":
            self._em_link = True
            self._href = dict(attrs).get("href") or ""
            self._texto = []

    def handle_data(self, data: str) -> None:
        if self._em_link:
            self._texto.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or not self._em_link:
            return
        texto = " ".join("".join(self._texto).split())
        if "REPASSE FAF COM POPULA" in _sem_acentos(texto).upper():
            url = urllib.parse.urljoin(FONTE_DOWNLOADS, html.unescape(self._href))
            self.links.append((html.unescape(texto), url))
        self._em_link = False
        self._href = ""
        self._texto = []


def _sem_acentos(valor: str) -> str:
    normalizado = unicodedata.normalize("NFKD", valor or "")
    return "".join(ch for ch in normalizado if not unicodedata.combining(ch))


def _normalizar_chave(valor: str) -> str:
    valor = _sem_acentos(valor).upper().strip()
    return re.sub(r"[^A-Z0-9]+", "_", valor).strip("_")


def _request(url: str) -> urllib.request.Request:
    return urllib.request.Request(
        url,
        headers={
            "Accept": "*/*",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        },
    )


def _abrir_url(url: str, timeout: int = 60):
    return urllib.request.urlopen(_request(url), timeout=timeout)


def descobrir_links() -> dict[int, dict]:
    with _abrir_url(FONTE_DOWNLOADS, timeout=30) as resp:
        pagina = resp.read().decode("utf-8", errors="replace")

    parser = ColetorLinksFNS()
    parser.feed(pagina)
    encontrados: dict[int, dict] = {}
    for titulo, url in parser.links:
        match = re.search(r"(20\d{2})", titulo)
        if not match:
            continue
        ano = int(match.group(1))
        encontrados[ano] = {
            "ano": ano,
            "titulo": titulo,
            "url_pagina": url,
            "url_arquivo": "",
            "nome_arquivo": "",
            "content_type": "",
            "content_length": "",
            "status": "inventariado",
        }
    return encontrados


def resolver_arquivo(item: dict) -> dict:
    if item.get("url_arquivo"):
        return item
    try:
        with _abrir_url(item["url_pagina"], timeout=60) as resp:
            item["url_arquivo"] = resp.geturl()
            item["content_type"] = resp.headers.get("content-type", "")
            item["content_length"] = resp.headers.get("content-length", "")
    except urllib.error.URLError as exc:
        item["status"] = f"erro_resolucao: {exc}"
        item["url_arquivo"] = item["url_pagina"]

    caminho = urllib.parse.urlparse(item["url_arquivo"]).path
    item["nome_arquivo"] = urllib.parse.unquote(Path(caminho).name) or f"fns_{item['ano']}"
    return item


def salvar_inventario(itens: list[dict]) -> Path:
    destino = FNS_EXTRACTED_DIR / f"inventario_fns_repasses_faf_{MUNICIPIO}.csv"
    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=INVENTARIO_CAMPOS)
        writer.writeheader()
        writer.writerows({campo: item.get(campo, "") for campo in INVENTARIO_CAMPOS} for item in itens)
    return destino


def baixar_arquivo(item: dict, forcar: bool, limite_mb: int) -> Path | None:
    item = resolver_arquivo(item)
    tamanho = int(item["content_length"] or 0)
    if tamanho and limite_mb and tamanho > limite_mb * 1024 * 1024:
        item["status"] = f"registrado_sem_download_maior_que_{limite_mb}mb"
        return None

    destino = FNS_RAW_DIR / str(item["ano"]) / item["nome_arquivo"]
    if destino.exists() and not forcar:
        item["status"] = "cache"
        return destino

    destino.parent.mkdir(parents=True, exist_ok=True)
    tmp = destino.with_suffix(destino.suffix + ".tmp")
    with _abrir_url(item["url_pagina"], timeout=120) as resp:
        conteudo = resp.read()
        item["url_arquivo"] = resp.geturl()
        item["content_type"] = resp.headers.get("content-type", item.get("content_type", ""))
        item["content_length"] = str(len(conteudo))
    tmp.write_bytes(conteudo)
    tmp.replace(destino)
    item["status"] = "baixado"
    time.sleep(0.5)
    return destino


def _ler_csv(caminho: Path) -> tuple[list[str], list[dict[str, str]]]:
    conteudo = caminho.read_bytes()
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            texto = conteudo.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        texto = conteudo.decode("utf-8", errors="replace")

    amostra = texto[:4096]
    try:
        dialect = csv.Sniffer().sniff(amostra, delimiters=";,")
    except csv.Error:
        dialect = csv.excel
        dialect.delimiter = ";"

    reader = csv.DictReader(texto.splitlines(), dialect=dialect)
    campos = list(reader.fieldnames or [])
    return campos, [dict(row) for row in reader]


def _coluna_xlsx(ref: str) -> int:
    letras = re.sub(r"[^A-Z]", "", ref.upper())
    total = 0
    for letra in letras:
        total = total * 26 + (ord(letra) - ord("A") + 1)
    return max(total - 1, 0)


def _shared_strings(zf: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    strings: list[str] = []
    for si in root.findall("x:si", ns):
        textos = [node.text or "" for node in si.findall(".//x:t", ns)]
        strings.append("".join(textos))
    return strings


def _primeira_planilha(zf: zipfile.ZipFile) -> str:
    candidatos = sorted(
        nome for nome in zf.namelist()
        if nome.startswith("xl/worksheets/sheet") and nome.endswith(".xml")
    )
    if not candidatos:
        raise ValueError("XLSX sem planilhas em xl/worksheets")
    return candidatos[0]


def _valor_celula(celula: ET.Element, compartilhadas: list[str], ns: dict[str, str]) -> str:
    tipo = celula.attrib.get("t", "")
    if tipo == "inlineStr":
        return "".join(t.text or "" for t in celula.findall(".//x:t", ns)).strip()
    valor = celula.find("x:v", ns)
    if valor is None or valor.text is None:
        return ""
    if tipo == "s":
        idx = int(valor.text)
        return compartilhadas[idx] if idx < len(compartilhadas) else ""
    return valor.text.strip()


def _ler_xlsx(caminho: Path) -> tuple[list[str], list[dict[str, str]]]:
    ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(caminho) as zf:
        compartilhadas = _shared_strings(zf)
        planilha = _primeira_planilha(zf)
        root = ET.fromstring(zf.read(planilha))

    linhas: list[list[str]] = []
    for row in root.findall(".//x:sheetData/x:row", ns):
        valores: list[str] = []
        for celula in row.findall("x:c", ns):
            idx = _coluna_xlsx(celula.attrib.get("r", "A1"))
            while len(valores) <= idx:
                valores.append("")
            valores[idx] = _valor_celula(celula, compartilhadas, ns)
        if any(valor.strip() for valor in valores):
            linhas.append(valores)

    if not linhas:
        return [], []

    campos = [campo.strip() for campo in linhas[0]]
    registros: list[dict[str, str]] = []
    for linha in linhas[1:]:
        row = {campo: (linha[i].strip() if i < len(linha) else "") for i, campo in enumerate(campos)}
        registros.append(row)
    return campos, registros


def ler_tabela(caminho: Path) -> tuple[list[str], list[dict[str, str]]]:
    sufixo = caminho.suffix.lower()
    if sufixo == ".csv":
        return _ler_csv(caminho)
    if sufixo == ".xlsx":
        return _ler_xlsx(caminho)
    raise ValueError(f"Formato nao suportado: {caminho.name}")


def _indice_campos(campos: list[str]) -> dict[str, str]:
    return {_normalizar_chave(campo): campo for campo in campos}


def _valor(row: dict[str, str], indice: dict[str, str], nomes: list[str]) -> str:
    for nome in nomes:
        campo = indice.get(nome)
        if campo and str(row.get(campo, "")).strip():
            return str(row.get(campo, "")).strip()
    return ""


def eh_sorocaba(row: dict[str, str], indice: dict[str, str]) -> bool:
    ibge = re.sub(r"\D", "", _valor(row, indice, ["CO_MUNICIPIO_IBGE", "COD_IBGE", "IBGE"]))
    if ibge == IBGE_SOROCABA:
        return True

    municipio = _sem_acentos(_valor(row, indice, ["MUNICIPIO", "NO_MUNICIPIO", "NOME_MUNICIPIO"])).upper()
    uf = _valor(row, indice, ["UF", "SG_UF"]).upper()
    return municipio == MUNICIPIO_SOROCABA and uf == UF_SOROCABA


def filtrar_sorocaba(campos: list[str], rows: list[dict[str, str]]) -> list[dict[str, str]]:
    indice = _indice_campos(campos)
    return [row for row in rows if eh_sorocaba(row, indice)]


def salvar_extraido(item: dict, caminho: Path, campos: list[str], rows: list[dict[str, str]]) -> Path:
    destino = FNS_EXTRACTED_DIR / f"fns_repasses_faf_com_populacao_{MUNICIPIO}_{item['ano']}.csv"
    destino.parent.mkdir(parents=True, exist_ok=True)
    campos_saida = METADADOS_CAMPOS + campos
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos_saida, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            saida = {
                "ano_coleta": item["ano"],
                "fonte_url_pagina": item["url_pagina"],
                "fonte_url_arquivo": item.get("url_arquivo", ""),
                "arquivo_origem": str(caminho),
            }
            saida.update(row)
            writer.writerow(saida)
    return destino


def processar_ano(item: dict, forcar: bool, limite_mb: int) -> tuple[Path | None, int, int, int]:
    caminho = baixar_arquivo(item, forcar=forcar, limite_mb=limite_mb)
    if caminho is None:
        return None, 0, 0, 0
    campos, rows = ler_tabela(caminho)
    filtrados = filtrar_sorocaba(campos, rows)
    destino = salvar_extraido(item, caminho, campos, filtrados)
    return destino, len(rows), len(filtrados), caminho.stat().st_size


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Inventaria, baixa e filtra repasses FAF com populacao do FNS para Sorocaba"
    )
    parser.add_argument("--listar", action="store_true",
                        help="Apenas inventaria URLs oficiais 2020-2026")
    parser.add_argument("--ano", type=int, action="append",
                        help="Ano a baixar/filtrar (pode repetir)")
    parser.add_argument("--forcar", action="store_true",
                        help="Rebaixa arquivo ja existente no cache raw")
    parser.add_argument("--limite-mb", type=int, default=120,
                        help="Tamanho maximo por arquivo para download; 0 desativa o limite")
    args = parser.parse_args()

    anos = sorted(set(args.ano or []))
    if not args.listar and not anos:
        parser.error("use --listar ou informe ao menos um --ano")

    inventario = descobrir_links()
    itens = [resolver_arquivo(inventario[ano]) for ano in ANOS_PADRAO if ano in inventario]
    inventario_path = salvar_inventario(itens)

    print(f"Inventario: {len(itens)} arquivos 2020-2026")
    print(f"CSV inventario: {inventario_path}")
    for item in itens:
        tamanho = int(item["content_length"] or 0)
        tamanho_mb = tamanho / 1024 / 1024 if tamanho else 0
        print(f"  {item['ano']}: {item['nome_arquivo']} ({tamanho_mb:.1f} MB)")

    if args.listar and not anos:
        return

    for ano in anos:
        if ano not in inventario:
            print(f"{ano}: nao encontrado na pagina oficial")
            continue
        print(f"\n=== {ano} ===")
        destino, total, filtrados, tamanho = processar_ano(
            inventario[ano],
            forcar=args.forcar,
            limite_mb=args.limite_mb,
        )
        if destino is None:
            print(f"Registrado sem download: {inventario[ano]['url_pagina']}")
            continue
        print(f"Arquivo bruto: {tamanho / 1024 / 1024:.1f} MB")
        print(f"Linhas fonte: {total}")
        print(f"Linhas Sorocaba: {filtrados}")
        print(f"CSV extraido: {destino}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("Interrompido pelo usuario.")
