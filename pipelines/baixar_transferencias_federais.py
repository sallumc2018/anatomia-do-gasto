"""
Coleta transferencias da Uniao para Sorocaba via API do Portal da Transparencia Federal.

Requer a variavel de ambiente PORTAL_TRANSPARENCIA_KEY (chave de API registrada em
https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email).

Saida:
  data/raw/sorocaba/transferencias_federais/paginas/{ano}/pagina_{n:04d}.json
  data/extracted/sorocaba/transferencias_federais/saida/transferencias_federais_sorocaba_{ano}.csv

Uso:
  python baixar_transferencias_federais.py --ano 2024
  python baixar_transferencias_federais.py --ano 2020 --ano 2021 --ano 2022 --ano 2023 --ano 2024 --ano 2025
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from paths import CFG, TRANSFERENCIAS_EXTRACTED_DIR, TRANSFERENCIAS_RAW_DIR

IBGE_SOROCABA = CFG["ibge"]
BASE_URL = "https://api.portaldatransparencia.gov.br/api-de-dados"
QUANTIDADE_POR_PAGINA = 500
DELAY_ENTRE_PAGINAS = 0.5

CAMPOS_CSV = [
    "ano",
    "competencia",
    "tipo_transferencia",
    "modalidade_transferencia",
    "orgao_superior_codigo",
    "orgao_superior_nome",
    "unidade_gestora_codigo",
    "unidade_gestora_nome",
    "funcao_id",
    "funcao_descricao",
    "acao_id",
    "acao_descricao",
    "valor_transferido",
    "municipio_ibge",
    "municipio_nome",
    "fonte_api",
]


def _chave_api() -> str:
    chave = os.environ.get("PORTAL_TRANSPARENCIA_KEY") or (
        # Tambem tenta a variavel de ambiente de nivel User no Windows
        __import__("subprocess").run(
            ["powershell", "-Command",
             '[System.Environment]::GetEnvironmentVariable("PORTAL_TRANSPARENCIA_KEY","User")'],
            capture_output=True, text=True
        ).stdout.strip()
        if sys.platform == "win32" else ""
    )
    if not chave:
        sys.exit(
            "PORTAL_TRANSPARENCIA_KEY nao encontrada.\n"
            "Configure com:\n"
            '  [System.Environment]::SetEnvironmentVariable("PORTAL_TRANSPARENCIA_KEY","sua-chave","User")'
        )
    return chave


def _fetch_pagina(endpoint: str, params: dict, chave: str, timeout: int = 30) -> list:
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{BASE_URL}/{endpoint}?{query}"
    req = urllib.request.Request(
        url,
        headers={
            "chave-api-dados": chave,
            "Accept": "application/json",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        corpo = ""
        try:
            corpo = e.read().decode("utf-8", errors="replace")[:400]
        except Exception:
            pass
        if e.code == 403:
            sys.exit(
                f"403 Proibido. A chave pode estar valida e o endpoint inexistente:\n"
                f"a api-de-dados responde 403 (nao 404) para rotas que nao existem.\n"
                f"Confirme o caminho na spec oficial (/v3/api-docs). Endpoints de\n"
                f"transferencias por municipio nesta API: /despesas/recursos-recebidos\n"
                f"(mesAnoInicio, mesAnoFim, codigoIBGE) ou /coronavirus/transferencias.\n"
                f"Se a chave fosse o problema, o retorno seria 401.\nURL: {url}\n{corpo}"
            )
        if e.code == 404:
            return []
        if e.code == 405:
            sys.exit(
                f"405 Method Not Allowed — endpoint ou parametros incompativeis.\n"
                f"URL: {url}\n{corpo}"
            )
        raise urllib.error.HTTPError(url, e.code, e.reason, e.headers, None)
    except urllib.error.URLError as e:
        print(f"  Erro de rede: {e}  (URL: {url})")
        return []


def _linha_para_csv(item: dict, ano: int) -> dict:
    municipio = item.get("municipio") or {}
    tipo = item.get("tipoTransferencia") or item.get("tipo") or {}
    modalidade = item.get("modalidadeTransferencia") or {}
    orgao = item.get("orgaoSuperior") or item.get("unidadeGestoraResponsavel") or {}
    unidade = item.get("unidadeGestora") or {}
    funcao = item.get("funcao") or {}
    acao = item.get("acao") or {}

    competencia = (
        item.get("competenciaTransferencia")
        or item.get("competencia")
        or str(ano)
    )

    return {
        "ano": ano,
        "competencia": competencia,
        "tipo_transferencia": (
            tipo.get("descricao") if isinstance(tipo, dict) else str(tipo)
        ),
        "modalidade_transferencia": (
            modalidade.get("descricao") if isinstance(modalidade, dict) else str(modalidade)
        ),
        "orgao_superior_codigo": orgao.get("codigoSIAFI") or orgao.get("codigo") or "",
        "orgao_superior_nome": orgao.get("nome") or "",
        "unidade_gestora_codigo": unidade.get("codigoSIAFI") or unidade.get("codigo") or "",
        "unidade_gestora_nome": unidade.get("nome") or "",
        "funcao_id": funcao.get("id") or funcao.get("codigo") or "",
        "funcao_descricao": funcao.get("descricao") or "",
        "acao_id": acao.get("id") or acao.get("codigo") or "",
        "acao_descricao": acao.get("descricao") or "",
        "valor_transferido": item.get("valorTransferido") or item.get("valor") or 0,
        "municipio_ibge": municipio.get("codigoIBGE") or IBGE_SOROCABA,
        "municipio_nome": municipio.get("nomeIBGE") or "SOROCABA",
        "fonte_api": f"{BASE_URL}/transferencias-municipios",
    }


def _salvar_pagina_raw(pagina_dir: Path, numero: int, dados: list) -> None:
    pagina_dir.mkdir(parents=True, exist_ok=True)
    destino = pagina_dir / f"pagina_{numero:04d}.json"
    destino.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")


def coletar_ano(ano: int, chave: str, forcar: bool) -> list[dict]:
    paginas_dir = TRANSFERENCIAS_RAW_DIR / "paginas" / str(ano)
    registros: list[dict] = []
    pagina = 1

    print(f"\n=== {ano} ===")

    while True:
        destino_raw = paginas_dir / f"pagina_{pagina:04d}.json"
        if destino_raw.exists() and not forcar:
            dados = json.loads(destino_raw.read_text(encoding="utf-8"))
            print(f"  p{pagina}: {len(dados)} registros (cache)")
        else:
            params = {
                "codigoIbge": IBGE_SOROCABA,
                "ano": ano,
                "pagina": pagina,
                "quantidade": QUANTIDADE_POR_PAGINA,
            }
            dados = _fetch_pagina("transferencias-municipios", params, chave)
            print(f"  p{pagina}: {len(dados)} registros")
            _salvar_pagina_raw(paginas_dir, pagina, dados)
            if pagina > 1:
                time.sleep(DELAY_ENTRE_PAGINAS)

        if not dados:
            break

        registros.extend(_linha_para_csv(item, ano) for item in dados)

        if len(dados) < QUANTIDADE_POR_PAGINA:
            break
        pagina += 1

    return registros


def salvar_csv(registros: list[dict], ano: int) -> Path:
    destino = TRANSFERENCIAS_EXTRACTED_DIR / "saida" / f"transferencias_federais_sorocaba_{ano}.csv"
    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS_CSV)
        writer.writeheader()
        writer.writerows(registros)
    return destino


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Coleta transferencias federais para Sorocaba via Portal da Transparencia"
    )
    parser.add_argument("--ano", type=int, action="append", required=True,
                        help="Ano a coletar (pode repetir para multiplos anos)")
    parser.add_argument("--forcar", action="store_true",
                        help="Rebaixa paginas ja salvas em cache")
    args = parser.parse_args()

    chave = _chave_api()

    for ano in sorted(set(args.ano)):
        registros = coletar_ano(ano, chave, args.forcar)
        if not registros:
            print(f"  Nenhum registro encontrado para {ano}.")
            continue
        destino = salvar_csv(registros, ano)
        total = sum(float(r["valor_transferido"]) for r in registros if r["valor_transferido"])
        print(f"  Total: {len(registros)} transferencias, R$ {total:,.2f}")
        print(f"  CSV: {destino}")

    print("\nConcluido.")


if __name__ == "__main__":
    main()
