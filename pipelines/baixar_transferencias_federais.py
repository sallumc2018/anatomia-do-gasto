"""
Coleta convênios (transferências voluntárias federais) para Sorocaba
via API do Portal da Transparência Federal — endpoint /convenios.

O endpoint /transferencias-municipios exige nível de acesso acima do básico
(retorna 403 com chave de email cadastrado). O endpoint /convenios cobre
convênios, contratos de repasse e termos de fomento da União ao município.

Para transferências constitucionais (FPM, SUS, FNDE/FUNDEB) ver:
  gerar_transferencias_federais_tce.py — fonte TCE-SP

Saida:
  data/raw/sorocaba/transferencias_federais/paginas/pagina_{n:04d}.json
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
ENDPOINT = "convenios"
DELAY_ENTRE_PAGINAS = 0.3

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


def _fetch_pagina(pagina: int, chave: str, timeout: int = 30) -> list:
    url = f"{BASE_URL}/{ENDPOINT}?codigoIBGE={IBGE_SOROCABA}&pagina={pagina}&quantidade=500"
    req = urllib.request.Request(
        url,
        headers={
            "chave-api-dados": chave,
            "Accept": "application/json",
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
                f"403 Proibido. A chave nao tem acesso ao endpoint /{ENDPOINT}.\n"
                f"Verifique o nivel em portaldatransparencia.gov.br/api-de-dados.\n"
                f"URL: {url}\n{corpo}"
            )
        if e.code == 404:
            return []
        raise urllib.error.HTTPError(url, e.code, e.reason, e.headers, None)
    except urllib.error.URLError as e:
        print(f"  Erro de rede: {e}  (URL: {url})")
        return []


def _linha_para_csv(item: dict, ano: int) -> dict:
    municipio = item.get("municipioConvenente") or {}
    orgao = item.get("orgao") or {}
    orgao_maximo = orgao.get("orgaoMaximo") or {}
    unidade = item.get("unidadeGestora") or {}
    subfuncao = item.get("subfuncao") or {}
    funcao = subfuncao.get("funcao") or {}
    dim = item.get("dimConvenio") or {}
    tipo_instr = item.get("tipoInstrumento") or {}

    competencia = (item.get("dataInicioVigencia") or "")[:7]

    return {
        "ano": ano,
        "competencia": competencia,
        "tipo_transferencia": tipo_instr.get("descricao") or "Convênio",
        "modalidade_transferencia": item.get("situacao") or "",
        "orgao_superior_codigo": orgao_maximo.get("codigo") or orgao.get("codigoSIAFI") or "",
        "orgao_superior_nome": orgao_maximo.get("nome") or orgao.get("nome") or "",
        "unidade_gestora_codigo": unidade.get("codigo") or "",
        "unidade_gestora_nome": unidade.get("nome") or "",
        "funcao_id": funcao.get("codigoFuncao") or "",
        "funcao_descricao": funcao.get("descricaoFuncao") or "",
        "acao_id": dim.get("codigo") or dim.get("numero") or "",
        "acao_descricao": dim.get("objeto") or "",
        "valor_transferido": item.get("valorLiberado") or 0,
        "municipio_ibge": municipio.get("codigoIBGE") or IBGE_SOROCABA,
        "municipio_nome": municipio.get("nomeIBGE") or "SOROCABA",
        "fonte_api": f"{BASE_URL}/{ENDPOINT}",
    }


def _salvar_pagina_raw(paginas_dir: Path, numero: int, dados: list) -> None:
    paginas_dir.mkdir(parents=True, exist_ok=True)
    destino = paginas_dir / f"pagina_{numero:04d}.json"
    destino.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")


def coletar_todos(chave: str, forcar: bool) -> list[dict]:
    """Baixa todos os convênios de Sorocaba (API não suporta filtro por ano)."""
    paginas_dir = TRANSFERENCIAS_RAW_DIR / "paginas"
    todos: list[dict] = []
    pagina = 1

    print("Coletando convênios federais para Sorocaba...")
    while True:
        destino_raw = paginas_dir / f"pagina_{pagina:04d}.json"
        if destino_raw.exists() and not forcar:
            dados = json.loads(destino_raw.read_text(encoding="utf-8"))
            print(f"  p{pagina}: {len(dados)} registros (cache)")
        else:
            dados = _fetch_pagina(pagina, chave)
            print(f"  p{pagina}: {len(dados)} registros")
            _salvar_pagina_raw(paginas_dir, pagina, dados)
            if pagina > 1:
                time.sleep(DELAY_ENTRE_PAGINAS)

        if not dados:
            break

        todos.extend(dados)
        pagina += 1

    print(f"  Total bruto: {len(todos)} convênios")
    return todos


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
        description="Coleta convênios federais para Sorocaba via Portal da Transparência"
    )
    parser.add_argument("--ano", type=int, action="append", required=True,
                        help="Ano a filtrar (pode repetir para múltiplos anos)")
    parser.add_argument("--forcar", action="store_true",
                        help="Rebaixa páginas já salvas em cache")
    args = parser.parse_args()

    chave = _chave_api()

    todos = coletar_todos(chave, args.forcar)

    for ano in sorted(set(args.ano)):
        # Filtra por dataInicioVigencia (ano de assinatura do convênio)
        vistos: set[int] = set()
        do_ano: list[dict] = []
        for item in todos:
            if (item.get("dataInicioVigencia") or "")[:4] == str(ano) and item["id"] not in vistos:
                vistos.add(item["id"])
                do_ano.append(item)

        print(f"\n=== {ano} ===")
        if not do_ano:
            print(f"  Nenhum convênio encontrado para {ano}.")
            continue

        registros = [_linha_para_csv(item, ano) for item in do_ano]
        destino = salvar_csv(registros, ano)
        total = sum(float(r["valor_transferido"]) for r in registros if r["valor_transferido"])
        print(f"  Total: {len(registros)} convênios, R$ {total:,.2f}")
        print(f"  CSV: {destino}")

    print("\nConcluído.")


if __name__ == "__main__":
    main()
