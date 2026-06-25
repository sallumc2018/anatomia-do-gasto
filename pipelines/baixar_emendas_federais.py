"""
Coleta emendas parlamentares federais para um município via Portal da Transparência.

Endpoint: GET /api-de-dados/emendas
  Parâmetro de município: localidadeGasto (código IBGE de 7 dígitos)
  Parâmetro de ano: anoExercicio

⚠️  ATENÇÃO: validar execução isolada antes do cron operacional.
    Checar que o endpoint e os nomes de campos batem com a resposta real da API.
    Executar: MUNICIPIO=sorocaba python3 pipelines/baixar_emendas_federais.py --anos 2024 2024

Saídas:
  raw cache:  data/raw/{municipio}/emendas_federais/paginas/{ano}/pagina_{n:04d}.json
  extracted:  data/extracted/{municipio}/emendas_federais/saida/emendas_federais_{municipio}_{ano}.csv

Uso:
  # Via orquestrador (MUNICIPIO + MUNICIPIO_IBGE setados pelo coletar_municipios_brasil.py)
  python3 pipelines/baixar_emendas_federais.py --anos 2014 2026

  # Standalone (município registrado em paths.py)
  MUNICIPIO=sorocaba python3 pipelines/baixar_emendas_federais.py --anos 2022 2024

  # Forçar rebaixar páginas em cache
  MUNICIPIO=sorocaba python3 pipelines/baixar_emendas_federais.py --anos 2024 2024 --forcar
"""
import argparse
import csv
import decimal
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

try:
    from .paths import EMENDAS_EXTRACTED_DIR, EMENDAS_RAW_DIR, MUNICIPIO
except ImportError:
    from paths import EMENDAS_EXTRACTED_DIR, EMENDAS_RAW_DIR, MUNICIPIO


BASE_URL = "https://api.portaldatransparencia.gov.br/api-de-dados"
ENDPOINT = "emendas"
DELAY_ENTRE_PAGINAS = 0.4

CAMPOS_CSV = [
    "ano",
    "municipio_ibge",
    "municipio_nome",
    "numero_emenda",
    "autor",
    "partido",
    "uf_autor",
    "tipo_emenda",
    "funcao",
    "subfuncao",
    "valor_empenhado",
    "valor_liquidado",
    "valor_pago",
    "fonte_api",
]


def _is_transient_error(exc):
    if isinstance(exc, urllib.error.HTTPError):
        return exc.code in (429, 500, 502, 503, 504)
    return isinstance(exc, (urllib.error.URLError, TimeoutError))


_HTTP_RETRY = retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    retry=retry_if_exception(_is_transient_error),
    reraise=True,
)


@_HTTP_RETRY
def _urlopen_com_retry(req, timeout=30):
    return urllib.request.urlopen(req, timeout=timeout)


def _chave_api() -> str:
    chave = os.environ.get("PORTAL_TRANSPARENCIA_KEY") or (
        __import__("subprocess").run(
            ["powershell", "-Command",
             '[System.Environment]::GetEnvironmentVariable("PORTAL_TRANSPARENCIA_KEY","User")'],
            capture_output=True, text=True
        ).stdout.strip()
        if sys.platform == "win32" else ""
    )
    if not chave:
        sys.exit(
            "PORTAL_TRANSPARENCIA_KEY não encontrada.\n"
            "Configure com:\n"
            '  export PORTAL_TRANSPARENCIA_KEY="sua-chave"'
        )
    return chave


def _ibge_municipio() -> str:
    """IBGE do município ativo: prefere MUNICIPIO_IBGE (setado pelo orquestrador)."""
    ibge = os.environ.get("MUNICIPIO_IBGE", "")
    if not ibge:
        try:
            try:
                from .paths import CFG
            except ImportError:
                from paths import CFG
            ibge = CFG.get("ibge", "")
        except Exception:
            pass
    if not ibge:
        sys.exit("MUNICIPIO_IBGE não setado e município não registrado em paths.py.")
    return ibge


def _nome_municipio() -> str:
    return os.environ.get("MUNICIPIO_NOME", MUNICIPIO)


def _fetch_pagina(pagina: int, ibge: str, ano: int, chave: str, timeout: int = 30) -> list:
    url = (
        f"{BASE_URL}/{ENDPOINT}"
        f"?localidadeGasto={ibge}&anoExercicio={ano}"
        f"&pagina={pagina}&quantidade=500"
    )
    req = urllib.request.Request(
        url,
        headers={
            "chave-api-dados": chave,
            "Accept": "application/json",
        },
    )
    try:
        with _urlopen_com_retry(req, timeout=timeout) as resp:
            dados = json.loads(resp.read().decode("utf-8"))
            if not isinstance(dados, list):
                raise ValueError(
                    f"Resposta inesperada da API: esperado list, recebido {type(dados).__name__}"
                )
            return dados
    except urllib.error.HTTPError as e:
        corpo = ""
        try:
            corpo = e.read().decode("utf-8", errors="replace")[:500]
        except Exception:
            pass
        if e.code == 403:
            sys.exit(
                f"403 Proibido — chave sem acesso ao endpoint /{ENDPOINT}.\n"
                f"Verifique nível em portaldatransparencia.gov.br/api-de-dados.\n"
                f"URL: {url}\n{corpo}"
            )
        if e.code == 404:
            return []
        raise urllib.error.HTTPError(url, e.code, e.reason, e.headers, None)
    except urllib.error.URLError as e:
        raise RuntimeError(f"Erro de rede ao consultar {url}: {e}") from e


def _salvar_pagina_raw(paginas_dir: Path, numero: int, dados: list) -> None:
    paginas_dir.mkdir(parents=True, exist_ok=True)
    destino = paginas_dir / f"pagina_{numero:04d}.json"
    destino.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")


def _linha_para_csv(item: dict, ano: int, ibge: str, nome_mun: str) -> dict:
    """Normaliza item da API para o schema do contrato emendas_federais.

    Resposta real do endpoint /emendas: todos os campos são strings planas.
    Não há objetos aninhados como localidade.municipio, autor{nome,partido} etc.
    """
    return {
        "ano": ano,
        "municipio_ibge": ibge,
        "municipio_nome": nome_mun,
        "numero_emenda": item.get("codigoEmenda") or item.get("numeroEmenda") or "",
        "autor": item.get("autor") or item.get("nomeAutor") or "",
        "partido": item.get("partido") or "",
        "uf_autor": item.get("uf") or "",
        "tipo_emenda": item.get("tipoEmenda") or "",
        "funcao": item.get("funcao") or "",
        "subfuncao": item.get("subfuncao") or "",
        "valor_empenhado": item.get("valorEmpenhado") or item.get("vl_empenhado") or "0",
        "valor_liquidado": item.get("valorLiquidado") or "0",
        "valor_pago": item.get("valorPago") or item.get("valor_pago") or "0",
        "fonte_api": f"{BASE_URL}/{ENDPOINT}",
    }


def coletar_ano(ibge: str, nome_mun: str, ano: int, chave: str, forcar: bool) -> list[dict]:
    paginas_dir = EMENDAS_RAW_DIR / "paginas" / str(ano)
    todos: list[dict] = []
    pagina = 1

    print(f"  Emendas federais {ano} — {nome_mun} (IBGE {ibge})")
    while True:
        destino_raw = paginas_dir / f"pagina_{pagina:04d}.json"
        if destino_raw.exists() and not forcar:
            dados = json.loads(destino_raw.read_text(encoding="utf-8"))
            print(f"    p{pagina}: {len(dados)} registros (cache)")
        else:
            dados = _fetch_pagina(pagina, ibge, ano, chave)
            print(f"    p{pagina}: {len(dados)} registros")
            _salvar_pagina_raw(paginas_dir, pagina, dados)
            if pagina > 1:
                time.sleep(DELAY_ENTRE_PAGINAS)

        if not dados:
            break

        todos.extend(dados)
        if len(dados) < 500:
            break
        pagina += 1

    print(f"    Total bruto {ano}: {len(todos)} registros")
    return [_linha_para_csv(item, ano, ibge, nome_mun) for item in todos]


def _valor_decimal(value: object) -> decimal.Decimal:
    if value in (None, ""):
        return decimal.Decimal(0)
    if isinstance(value, (int, float, decimal.Decimal)):
        return decimal.Decimal(str(value))
    text = str(value).strip().replace("R$", "").replace(" ", "")
    if "," in text:
        text = text.replace(".", "").replace(",", ".")
    return decimal.Decimal(text)


def salvar_csv(registros: list[dict], ano: int) -> Path:
    destino = EMENDAS_EXTRACTED_DIR / "saida" / f"emendas_federais_{MUNICIPIO}_{ano}.csv"
    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS_CSV)
        writer.writeheader()
        writer.writerows(registros)
    return destino


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Coleta emendas parlamentares federais via Portal da Transparência"
    )
    parser.add_argument(
        "--anos", nargs=2, type=int, metavar=("INICIO", "FIM"), required=True,
        help="Intervalo de anos (ex: --anos 2014 2026)"
    )
    parser.add_argument("--forcar", action="store_true",
                        help="Rebaixa páginas já salvas em cache")
    args = parser.parse_args()
    if args.anos[0] > args.anos[1]:
        parser.error("INICIO deve ser menor ou igual a FIM")

    chave = _chave_api()
    ibge = _ibge_municipio()
    nome_mun = _nome_municipio()

    anos = list(range(args.anos[0], args.anos[1] + 1))
    print(f"Município: {nome_mun} (IBGE {ibge}) — Anos: {anos[0]}–{anos[-1]}")

    for ano in anos:
        registros = coletar_ano(ibge, nome_mun, ano, chave, args.forcar)
        if not registros:
            print(f"  Nenhuma emenda em {ano}.")
            continue
        destino = salvar_csv(registros, ano)
        total_emp = sum(
            (_valor_decimal(r["valor_empenhado"]) for r in registros),
            decimal.Decimal(0),
        )
        print(f"  {ano}: {len(registros)} emendas, R$ {total_emp:,.2f} empenhados — {destino}")

    print("\nConcluído.")


if __name__ == "__main__":
    main()
