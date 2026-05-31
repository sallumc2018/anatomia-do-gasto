"""
Coleta repasses estaduais da Sefaz-SP para Sorocaba via RepasseConsulta.

Fonte oficial:
  https://www.fazenda.sp.gov.br/RepasseConsulta/Consulta/repasse.aspx

Saida:
  {ANATOMIA_RAW_ROOT ou data/raw}/sorocaba/transferencias_estaduais_sp/repasse/{ano}.html
  data/extracted/sorocaba/transferencias_estaduais/saida/transferencias_estaduais_sp_sorocaba_{ano}.csv
  data/extracted/sorocaba/transferencias_estaduais/saida/transferencias_estaduais_sp_sorocaba_2020_2026.csv

Uso:
  python pipelines/baixar_transferencias_estaduais_sp.py --ano 2024
  python pipelines/baixar_transferencias_estaduais_sp.py --inicio 2020 --fim 2026
"""
import argparse
import csv
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

from paths import CFG, MUNICIPIO, EXTRACTED_DIR, RAW_DIR as MUNICIPIO_RAW_DIR

if not CFG.get("sefaz_sp"):
    raise SystemExit(
        f"MUNICIPIO={MUNICIPIO!r} nao tem 'sefaz_sp' configurado em paths.py. "
        "Descubra o codigo Sefaz-SP no portal fazenda.sp.gov.br e adicione ao MUNICIPIOS."
    )

MUNICIPIO_CODIGO = CFG["sefaz_sp"]
MUNICIPIO_NOME = CFG["nome"]
FONTE_URL = "https://www.fazenda.sp.gov.br/RepasseConsulta/Consulta/repasse.aspx"
RAW_DIR = MUNICIPIO_RAW_DIR / "transferencias_estaduais_sp"
EXTRACTED_SAIDA_DIR = EXTRACTED_DIR / "transferencias_estaduais" / "saida"
DELAY_ENTRE_ANOS = 0.5

CAMPOS_CSV = [
    "ano",
    "municipio_codigo_sefaz_sp",
    "municipio_nome",
    "periodo_tipo",
    "mes",
    "mes_numero",
    "icms",
    "ipva",
    "fund_exp_ipi",
    "compensacoes",
    "total",
    "fonte_url",
    "data_coleta_utc",
]

MESES = {
    "janeiro": 1,
    "fevereiro": 2,
    "marco": 3,
    "março": 3,
    "abril": 4,
    "maio": 5,
    "junho": 6,
    "julho": 7,
    "agosto": 8,
    "setembro": 9,
    "outubro": 10,
    "novembro": 11,
    "dezembro": 12,
    "total": 99,
}


class FormParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.inputs: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "input":
            return
        dados = {k: v or "" for k, v in attrs}
        nome = dados.get("name")
        if nome:
            self.inputs[nome] = dados.get("value", "")


class RepasseTableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_target_table = False
        self.table_depth = 0
        self.in_cell = False
        self.current_cell: list[str] = []
        self.current_row: list[str] = []
        self.rows: list[list[str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        dados = {k: v or "" for k, v in attrs}
        if tag == "table" and dados.get("id") == "ConteudoPagina_gdvRepasse":
            self.in_target_table = True
            self.table_depth = 1
            return
        if not self.in_target_table:
            return
        if tag == "table":
            self.table_depth += 1
        if tag in {"td", "th"}:
            self.in_cell = True
            self.current_cell = []

    def handle_data(self, data: str) -> None:
        if self.in_target_table and self.in_cell:
            self.current_cell.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if not self.in_target_table:
            return
        if tag in {"td", "th"} and self.in_cell:
            texto = " ".join("".join(self.current_cell).split())
            self.current_row.append(html.unescape(texto))
            self.in_cell = False
        elif tag == "tr" and self.current_row:
            self.rows.append(self.current_row)
            self.current_row = []
        elif tag == "table":
            self.table_depth -= 1
            if self.table_depth <= 0:
                self.in_target_table = False


def _headers() -> dict[str, str]:
    return {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    }


def _abrir(req: urllib.request.Request, timeout: int = 45) -> str:
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            conteudo = resp.read()
            try:
                return conteudo.decode("utf-8")
            except UnicodeDecodeError:
                charset = resp.headers.get_content_charset() or "cp1252"
                return conteudo.decode(charset, errors="replace")
    except urllib.error.HTTPError as e:
        corpo = e.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"HTTP {e.code} ao consultar Sefaz-SP: {e.reason}\n{corpo}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Erro de rede ao consultar Sefaz-SP: {e}") from e


def _obter_formulario() -> dict[str, str]:
    req = urllib.request.Request(FONTE_URL, headers=_headers())
    pagina = _abrir(req)
    parser = FormParser()
    parser.feed(pagina)
    obrigatorios = {"__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION"}
    faltantes = sorted(obrigatorios - set(parser.inputs))
    if faltantes:
        raise RuntimeError(
            "Formulario ASP.NET sem campos obrigatorios: " + ", ".join(faltantes)
        )
    return parser.inputs


def _consultar_ano(ano: int) -> str:
    formulario = _obter_formulario()
    formulario.update(
        {
            "ctl00$ConteudoPagina$ddlMuni": MUNICIPIO_CODIGO,
            "ctl00$ConteudoPagina$ddlAno": str(ano),
            "ctl00$ConteudoPagina$rblTipo": "ANO",
            "ctl00$ConteudoPagina$btnConfirmar": "Confirmar",
        }
    )
    dados = urllib.parse.urlencode(formulario).encode("utf-8")
    headers = _headers()
    headers.update(
        {
            "Referer": FONTE_URL,
            "Origin": "https://www.fazenda.sp.gov.br",
            "Content-Type": "application/x-www-form-urlencoded",
        }
    )
    req = urllib.request.Request(FONTE_URL, data=dados, headers=headers, method="POST")
    return _abrir(req)


def _salvar_raw(ano: int, conteudo: str, forcar: bool) -> Path:
    destino = RAW_DIR / "repasse" / f"{ano}.html"
    if destino.exists() and not forcar:
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(conteudo, encoding="utf-8")
    metadado = {
        "fonte_url": FONTE_URL,
        "municipio_codigo_sefaz_sp": MUNICIPIO_CODIGO,
        "municipio_nome": MUNICIPIO_NOME,
        "ano": ano,
        "data_coleta_utc": datetime.now(timezone.utc).isoformat(),
        "arquivo": destino.name,
    }
    (destino.with_suffix(".json")).write_text(
        json.dumps(metadado, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return destino


def _numero_br(valor: str) -> str:
    valor = valor.strip()
    if not valor:
        return ""
    valor = re.sub(r"[^\d,.-]", "", valor)
    if not valor:
        return ""
    return valor.replace(".", "").replace(",", ".")


def _normalizar_cabecalho(campo: str) -> str:
    texto = campo.lower()
    if "icms" in texto:
        return "icms"
    if "ipva" in texto:
        return "ipva"
    if "ipi" in texto:
        return "fund_exp_ipi"
    if "comp" in texto:
        return "compensacoes"
    if "total" in texto:
        return "total"
    return "mes"


def extrair_linhas(conteudo: str, ano: int, data_coleta_utc: str) -> list[dict[str, str]]:
    parser = RepasseTableParser()
    parser.feed(conteudo)
    if not parser.rows:
        raise RuntimeError("Tabela ConteudoPagina_gdvRepasse nao encontrada no HTML retornado.")

    cabecalho = [_normalizar_cabecalho(c) for c in parser.rows[0]]
    registros: list[dict[str, str]] = []
    for row in parser.rows[1:]:
        if len(row) != len(cabecalho):
            continue
        dados = dict(zip(cabecalho, row))
        mes = dados.get("mes", "").strip()
        if not mes:
            continue
        mes_chave = mes.lower()
        registros.append(
            {
                "ano": str(ano),
                "municipio_codigo_sefaz_sp": MUNICIPIO_CODIGO,
                "municipio_nome": MUNICIPIO_NOME,
                "periodo_tipo": "total_anual" if mes_chave == "total" else "mensal",
                "mes": mes,
                "mes_numero": str(MESES.get(mes_chave, "")),
                "icms": _numero_br(dados.get("icms", "")),
                "ipva": _numero_br(dados.get("ipva", "")),
                "fund_exp_ipi": _numero_br(dados.get("fund_exp_ipi", "")),
                "compensacoes": _numero_br(dados.get("compensacoes", "")),
                "total": _numero_br(dados.get("total", "")),
                "fonte_url": FONTE_URL,
                "data_coleta_utc": data_coleta_utc,
            }
        )
    if not registros:
        raise RuntimeError("Tabela encontrada, mas nenhum registro extraido.")
    return registros


def salvar_csv(registros: list[dict[str, str]], destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS_CSV)
        writer.writeheader()
        writer.writerows(registros)


def coletar_ano(ano: int, forcar: bool) -> tuple[Path, Path, int]:
    destino_raw = RAW_DIR / "repasse" / f"{ano}.html"
    data_coleta_utc = datetime.now(timezone.utc).isoformat()

    if destino_raw.exists() and not forcar:
        conteudo = destino_raw.read_text(encoding="utf-8")
        origem = "cache"
    else:
        conteudo = _consultar_ano(ano)
        destino_raw = _salvar_raw(ano, conteudo, forcar=True)
        origem = "web"

    registros = extrair_linhas(conteudo, ano, data_coleta_utc)
    destino_csv = (
        EXTRACTED_SAIDA_DIR / f"transferencias_estaduais_sp_{MUNICIPIO}_{ano}.csv"
    )
    salvar_csv(registros, destino_csv)
    print(f"{ano}: {len(registros)} linhas ({origem}) -> {destino_csv}")
    return destino_raw, destino_csv, len(registros)


def _anos(args: argparse.Namespace) -> list[int]:
    if args.ano:
        return sorted(set(args.ano))
    return list(range(args.inicio, args.fim + 1))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Coleta repasses estaduais Sefaz-SP para Sorocaba."
    )
    parser.add_argument("--ano", type=int, action="append", help="Ano a coletar.")
    parser.add_argument("--inicio", type=int, default=2020, help="Ano inicial.")
    parser.add_argument("--fim", type=int, default=2026, help="Ano final.")
    parser.add_argument("--forcar", action="store_true", help="Rebaixar HTML bruto.")
    args = parser.parse_args()

    anos = _anos(args)
    todos_registros: list[dict[str, str]] = []
    total_por_ano: dict[int, int] = {}

    for pos, ano in enumerate(anos):
        _, _, total = coletar_ano(ano, args.forcar)
        registros_ano = list(
            csv.DictReader(
                (
                    EXTRACTED_SAIDA_DIR
                    / f"transferencias_estaduais_sp_{MUNICIPIO}_{ano}.csv"
                ).open(encoding="utf-8")
            )
        )
        todos_registros.extend(registros_ano)
        total_por_ano[ano] = total
        if pos < len(anos) - 1:
            time.sleep(DELAY_ENTRE_ANOS)

    if len(anos) > 1:
        destino_consolidado = (
            EXTRACTED_SAIDA_DIR
            / f"transferencias_estaduais_sp_{MUNICIPIO}_{anos[0]}_{anos[-1]}.csv"
        )
        salvar_csv(todos_registros, destino_consolidado)
        print(f"consolidado: {len(todos_registros)} linhas -> {destino_consolidado}")

    print("contagens:", ", ".join(f"{ano}={total}" for ano, total in total_por_ano.items()))


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        sys.exit(str(e))
