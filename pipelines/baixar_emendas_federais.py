"""
Coleta emendas parlamentares federais via Portal da Transparência.

Endpoint: GET /api-de-dados/emendas
  Parâmetros REAIS suportados (confirmado via swagger oficial,
  api.portaldatransparencia.gov.br/v3/api-docs, 2026-07-09):
    codigoEmenda, numeroEmenda, nomeAutor, tipoEmenda, ano,
    codigoFuncao, codigoSubfuncao, pagina.
  NÃO existe filtro por município (nem `localidadeGasto`, `codigoMunicipio`
  ou `codigoIBGE`) neste endpoint — é um registro NACIONAL de emendas.
  O único sinal de localização por linha é o campo de resposta
  `localidadeDoGasto` (string), que precisa ser filtrado no cliente.

⚠️  BUG HISTÓRICO CORRIGIDO 2026-07-09 (ver STATUS.md / provenance):
    A versão anterior usava `localidadeGasto` e `anoExercicio` — nenhum dos
    dois é parâmetro válido da API. A API ignorava ambos silenciosamente e
    devolvia sempre a mesma página nacional não filtrada; o script então
    carimbava o IBGE/nome do município-alvo em cima dessas linhas, sem
    checar se elas de fato pertenciam a esse município. Confirmado:
    77 municípios publicados tinham as MESMAS 52 linhas (emenda, ano)
    idênticas, só relabeladas. Todo o dataset publicado em
    data/public/*/emendas_federais/ está incorreto e não deve ser usado
    até ser recoletado com este script corrigido.

⚠️  NÃO VERIFICADO COM CHAVE REAL — PORTAL_TRANSPARENCIA_KEY está inválida/
    bloqueada no momento desta correção (2026-07-09). A lógica de filtragem
    por `localidadeDoGasto` e o formato real desse campo (ex.: "SP" vs.
    "Sorocaba/SP" vs. "Sorocaba - SP") não puderam ser confirmados contra
    uma resposta real. Rodar `--anos 2024 2024` com um único município
    assim que a chave for desbloqueada e inspecionar
    `data/raw/_nacional/emendas_federais/paginas/2024/pagina_0001.json`
    antes de rodar a coleta completa.

    Também não é possível confirmar se, numa consulta corretamente filtrada,
    valorEmpenhado/valorLiquidado/valorPago deixam de ser zero — é possível
    que emendas do tipo "Transferência com Finalidade Definida" (fundo a
    fundo, ex. FNS) tenham execução tracked em outro sistema e apareçam
    zeradas mesmo corretamente filtradas (CGU reconhece publicamente que
    dados de emendas são incompletos). Validar com amostra real antes de
    reabrir o ranking.

Arquitetura: como o endpoint não filtra por município, a página de cada ano
é buscada UMA VEZ e compartilhada entre todos os municípios (cache em
data/raw/_nacional/, fora do diretório por-município) — evita repetir a
mesma consulta paginada 77+ vezes sob rate limit. Cada execução por
município apenas filtra o cache compartilhado por `localidadeDoGasto`.

Saídas:
  raw cache compartilhado: data/raw/_nacional/emendas_federais/paginas/{ano}/pagina_{n:04d}.json
  extracted (por município): data/extracted/{municipio}/emendas_federais/saida/emendas_federais_{municipio}_{ano}.csv

Uso:
  MUNICIPIO=sorocaba python3 pipelines/baixar_emendas_federais.py --anos 2024 2024
  python3 pipelines/baixar_emendas_federais.py --anos 2014 2026 --forcar
"""
import argparse
import csv
import decimal
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

try:
    from .paths import DATA_DIR, EMENDAS_EXTRACTED_DIR, MUNICIPIO
except ImportError:
    from paths import DATA_DIR, EMENDAS_EXTRACTED_DIR, MUNICIPIO


BASE_URL = "https://api.portaldatransparencia.gov.br/api-de-dados"
ENDPOINT = "emendas"
DELAY_ENTRE_PAGINAS = 2.0   # Portal Transparência: 500 req/hora; 2s → ~360 req/hora (72% do limite)
DELAY_APOS_ERRO = 10.0     # pausa extra após qualquer HTTPError não-fatal

# Cache compartilhado entre municípios — o endpoint não filtra por localização,
# então não faz sentido repetir a paginação nacional por município.
NACIONAL_RAW_DIR = DATA_DIR / "raw" / "_nacional" / "emendas_federais"

CAMPOS_CSV = [
    "ano",
    "municipio_ibge",
    "municipio_nome",
    "localidade_do_gasto_raw",
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


class PortalBloqueadoError(RuntimeError):
    """Levantado quando o Portal Transparência bloqueia a chave por limite de requisições."""


def _detectar_bloqueio(corpo: str) -> bool:
    return "limite de acesso" in corpo.lower() or "usuário bloqueado" in corpo.lower()


def _is_transient_error(exc):
    if isinstance(exc, PortalBloqueadoError):
        return True  # retentar após o backoff longo
    if isinstance(exc, urllib.error.HTTPError):
        return exc.code in (429, 500, 502, 503, 504)
    return isinstance(exc, (urllib.error.URLError, TimeoutError))


_HTTP_RETRY = retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=2, min=5, max=300),  # até 5 min de espera; 300s para bloqueio
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


def _normalizar(texto: str) -> str:
    """Minúsculas, sem acento, sem espaço extra — para comparação tolerante."""
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", sem_acento).strip().lower()


def _bate_com_municipio(localidade_do_gasto: str, nome_mun: str) -> bool:
    """Match tolerante entre o texto livre da API e o nome do município alvo.

    NÃO VERIFICADO: formato real de `localidadeDoGasto` desconhecido sem chave
    ativa (pode ser "Sorocaba/SP", "Sorocaba - SP", só a UF, ou vazio para
    emendas sem execução localizada). Match por substring é deliberadamente
    simples — não inventar parsing mais sofisticado sem uma resposta real
    para calibrar contra.
    """
    if not localidade_do_gasto:
        return False
    return _normalizar(nome_mun) in _normalizar(localidade_do_gasto)


def _fetch_pagina(pagina: int, ano: int, chave: str, timeout: int = 30) -> list:
    """Busca uma página do registro NACIONAL de emendas para um ano.

    Sem filtro de município — o endpoint não suporta. Ver docstring do módulo.
    """
    url = f"{BASE_URL}/{ENDPOINT}?ano={ano}&pagina={pagina}"
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
        if e.code == 401 and _detectar_bloqueio(corpo):
            print(
                f"  ⚠️  Portal Transparência: conta bloqueada por limite de requisições.\n"
                f"  Aguardando 300s antes de retentar. Verifique o email cadastrado.\n"
                f"  {corpo[:200]}"
            )
            time.sleep(300)
            raise PortalBloqueadoError("Conta bloqueada por limite de requisições Portal Transparência")
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
    """Normaliza item da API já confirmado (por `_bate_com_municipio`) como
    pertencente ao município alvo. Resposta real do endpoint: campos planos
    (strings), sem objetos aninhados.
    """
    return {
        "ano": ano,
        "municipio_ibge": ibge,
        "municipio_nome": nome_mun,
        "localidade_do_gasto_raw": item.get("localidadeDoGasto") or "",
        "numero_emenda": item.get("codigoEmenda") or item.get("numeroEmenda") or "",
        "autor": item.get("autor") or item.get("nomeAutor") or "",
        "partido": item.get("partido") or "",
        "uf_autor": item.get("uf") or "",
        "tipo_emenda": item.get("tipoEmenda") or "",
        "funcao": item.get("funcao") or "",
        "subfuncao": item.get("subfuncao") or "",
        "valor_empenhado": item.get("valorEmpenhado") or "0",
        "valor_liquidado": item.get("valorLiquidado") or "0",
        "valor_pago": item.get("valorPago") or "0",
        "fonte_api": f"{BASE_URL}/{ENDPOINT}",
    }


def _buscar_paginas_nacionais(ano: int, chave: str, forcar: bool) -> list[dict]:
    """Baixa (ou lê do cache compartilhado) TODAS as páginas nacionais de um
    ano. Cache não é por município — é reaproveitado por todas as execuções.
    """
    paginas_dir = NACIONAL_RAW_DIR / "paginas" / str(ano)
    todos: list[dict] = []
    pagina = 1

    print(f"  Emendas federais {ano} — busca nacional (sem filtro de município)")
    while True:
        destino_raw = paginas_dir / f"pagina_{pagina:04d}.json"
        if destino_raw.exists() and not forcar:
            dados = json.loads(destino_raw.read_text(encoding="utf-8"))
            print(f"    p{pagina}: {len(dados)} registros (cache compartilhado)")
        else:
            dados = _fetch_pagina(pagina, ano, chave)
            print(f"    p{pagina}: {len(dados)} registros")
            _salvar_pagina_raw(paginas_dir, pagina, dados)
            if pagina > 1:
                time.sleep(DELAY_ENTRE_PAGINAS)

        if not dados:
            break

        todos.extend(dados)
        pagina += 1

    print(f"    Total nacional {ano}: {len(todos)} registros")
    return todos


def coletar_ano(ibge: str, nome_mun: str, ano: int, chave: str, forcar: bool) -> list[dict]:
    nacionais = _buscar_paginas_nacionais(ano, chave, forcar)
    do_municipio = [item for item in nacionais if _bate_com_municipio(item.get("localidadeDoGasto", ""), nome_mun)]
    print(f"    Filtrados para {nome_mun}: {len(do_municipio)} de {len(nacionais)}")
    return [_linha_para_csv(item, ano, ibge, nome_mun) for item in do_municipio]


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
