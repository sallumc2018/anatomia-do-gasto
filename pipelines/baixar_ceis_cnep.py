"""
Coleta CEIS + CNEP (empresas sancionadas) via Portal da Transparência Federal
e cruza contra os CNPJs de fornecedores já publicados em data/public/{municipio}.

Endpoints: GET /api-de-dados/ceis  (Cadastro Nacional de Empresas Inidôneas e Suspensas)
           GET /api-de-dados/cnep  (Cadastro Nacional de Empresas Punidas)
  Sem filtro de município — registro NACIONAL de sanções, paginado.

Base legal (docs/legislacao/MANUAL_LGPD_LAI_ANATOMIA_DO_GASTO.md §5): razão
social, CNPJ e sanção administrativa de pessoa jurídica são zona verde —
o próprio CEIS/CNEP já é um registro público federal. Este pipeline só
recorta, por interesse jornalístico/fiscalizatório concreto, os CNPJs que
também aparecem como fornecedores contratados pelos municípios cobertos —
não republica a base nacional inteira.

Saida:
  data/raw/_nacional/sancoes/{ceis,cnep}/paginas/pagina_NNNN.json   (cache compartilhado)
  data/extracted/{municipio}/sancoes/saida/fornecedores_sancionados_{municipio}.csv

Uso:
  MUNICIPIO=sao_paulo .venv/bin/python3 pipelines/baixar_ceis_cnep.py
  MUNICIPIO=sorocaba .venv/bin/python3 pipelines/baixar_ceis_cnep.py --forcar
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

try:
    from .paths import DATA_DIR, MUNICIPIO, PUBLIC_DIR
except ImportError:
    from paths import DATA_DIR, MUNICIPIO, PUBLIC_DIR


BASE_URL = "https://api.portaldatransparencia.gov.br/api-de-dados"
ENDPOINTS = ("ceis", "cnep")
DELAY_ENTRE_PAGINAS = 2.0  # Portal Transparência: 500 req/hora; 2s → ~360 req/hora

# Cache compartilhado entre municípios — sanção nacional não é filtrável por localidade.
NACIONAL_RAW_DIR = DATA_DIR / "raw" / "_nacional" / "sancoes"

SANCOES_EXTRACTED_DIR = DATA_DIR / "extracted" / MUNICIPIO / "sancoes"

_RE_CNPJ = re.compile(r"\b\d{14}\b")

CAMPOS_CSV = [
    "cnpj",
    "razao_social_sancionada",
    "fonte_sancao",
    "tipo_sancao",
    "orgao_sancionador",
    "data_inicio_sancao",
    "data_final_sancao",
    "fundamentacao",
    "publicado_em",
    "dataset_origem",
    "fonte_api",
]


class PortalBloqueadoError(RuntimeError):
    """Levantado quando o Portal Transparência bloqueia a chave por limite de requisições."""


def _detectar_bloqueio(corpo: str) -> bool:
    return "limite de acesso" in corpo.lower() or "usuário bloqueado" in corpo.lower()


def _is_transient_error(exc):
    if isinstance(exc, PortalBloqueadoError):
        return True
    if isinstance(exc, urllib.error.HTTPError):
        return exc.code in (429, 500, 502, 503, 504)
    return isinstance(exc, (urllib.error.URLError, TimeoutError))


_HTTP_RETRY = retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=2, min=5, max=300),
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


def _fetch_pagina(endpoint: str, pagina: int, chave: str, timeout: int = 30) -> list:
    url = f"{BASE_URL}/{endpoint}?pagina={pagina}"
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
        if e.code == 401:
            sys.exit(f"401 Não autorizado — chave inválida.\nURL: {url}\n{corpo}")
        if e.code == 403:
            sys.exit(
                f"403 Proibido — chave sem acesso ao endpoint /{endpoint}.\n"
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


def _buscar_paginas_nacionais(endpoint: str, chave: str, forcar: bool) -> list[dict]:
    """Baixa (ou lê do cache compartilhado) TODAS as páginas do endpoint.

    Cache não é por município — reaproveitado por todas as execuções.
    """
    paginas_dir = NACIONAL_RAW_DIR / endpoint / "paginas"
    todos: list[dict] = []
    pagina = 1

    print(f"  {endpoint.upper()} — busca nacional (sem filtro de município)")
    while True:
        destino_raw = paginas_dir / f"pagina_{pagina:04d}.json"
        if destino_raw.exists() and not forcar:
            dados = json.loads(destino_raw.read_text(encoding="utf-8"))
            print(f"    p{pagina}: {len(dados)} registros (cache compartilhado)")
        else:
            dados = _fetch_pagina(endpoint, pagina, chave)
            print(f"    p{pagina}: {len(dados)} registros")
            _salvar_pagina_raw(paginas_dir, pagina, dados)
            if pagina > 1:
                time.sleep(DELAY_ENTRE_PAGINAS)

        if not dados:
            break

        todos.extend(dados)
        pagina += 1

    print(f"    Total nacional {endpoint}: {len(todos)} registros")
    return todos


def _cnpj_do_item(item: dict) -> str:
    pessoa = item.get("pessoa") or {}
    cnpj = pessoa.get("cnpjFormatado") or pessoa.get("cnpj") or item.get("cnpjSancionado") or ""
    return re.sub(r"\D", "", cnpj)


def _linha_para_csv(endpoint: str, item: dict, dataset_origem: str) -> dict:
    """Normaliza item CEIS/CNEP — campos de sanção ficam no nível raiz do item
    (confirmado contra resposta real 2026-07-10), não aninhados em "sancao"
    como a primeira versão deste script assumia sem chave válida.
    """
    pessoa = item.get("pessoa") or {}
    sancionado = item.get("sancionado") or {}
    orgao = item.get("orgaoSancionador") or {}
    tipo_sancao = item.get("tipoSancao") or {}
    fundamentacao = item.get("fundamentacao") or []
    return {
        "cnpj": _cnpj_do_item(item),
        "razao_social_sancionada": pessoa.get("nome") or sancionado.get("nome") or "",
        "fonte_sancao": endpoint.upper(),
        "tipo_sancao": tipo_sancao.get("descricaoResumida") or tipo_sancao.get("descricaoPortal") or "",
        "orgao_sancionador": orgao.get("nome") or "",
        "data_inicio_sancao": item.get("dataInicioSancao") or "",
        "data_final_sancao": item.get("dataFimSancao") or "",
        "fundamentacao": fundamentacao[0].get("descricao", "") if fundamentacao else "",
        "publicado_em": item.get("dataPublicacaoSancao") or "",
        "dataset_origem": dataset_origem,
        "fonte_api": f"{BASE_URL}/{endpoint}",
    }


def _coletar_cnpjs_publicados(municipio_public_dir: Path) -> dict[str, str]:
    """Varre CSVs já publicados do município procurando colunas de CNPJ.

    Retorna {cnpj: nome_do_dataset_origem}. Genérico por design — qualquer
    dataset publicado com uma coluna cnpj/CNPJ entra automaticamente no
    cruzamento, sem precisar listar datasets manualmente aqui.
    """
    encontrados: dict[str, str] = {}
    if not municipio_public_dir.exists():
        return encontrados

    for csv_path in municipio_public_dir.rglob("*.csv"):
        try:
            with csv_path.open(encoding="utf-8", newline="") as f:
                reader = csv.DictReader(f)
                if not reader.fieldnames:
                    continue
                col_cnpj = next(
                    (c for c in reader.fieldnames if "cnpj" in c.lower() and "orgao" not in c.lower()),
                    None,
                )
                if not col_cnpj:
                    continue
                for row in reader:
                    bruto = row.get(col_cnpj) or ""
                    m = _RE_CNPJ.search(re.sub(r"\D", "", bruto))
                    if m:
                        encontrados.setdefault(m.group(0), str(csv_path.relative_to(municipio_public_dir)))
        except (UnicodeDecodeError, OSError, csv.Error):
            continue

    return encontrados


def salvar_csv(registros: list[dict]) -> Path:
    destino = SANCOES_EXTRACTED_DIR / "saida" / f"fornecedores_sancionados_{MUNICIPIO}.csv"
    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS_CSV)
        writer.writeheader()
        writer.writerows(registros)
    return destino


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Coleta CEIS+CNEP e cruza contra fornecedores publicados do município"
    )
    parser.add_argument("--forcar", action="store_true", help="rebaixa páginas nacionais já cacheadas")
    args = parser.parse_args()

    chave = _chave_api()

    print(f"Fornecedores publicados conhecidos ({MUNICIPIO})...")
    cnpjs_conhecidos = _coletar_cnpjs_publicados(PUBLIC_DIR)
    print(f"  {len(cnpjs_conhecidos)} CNPJ(s) distintos encontrados em datasets já publicados.")
    if not cnpjs_conhecidos:
        print("  Nenhum CNPJ publicado para cruzar — nada a fazer.")
        return 0

    sancionados: list[dict] = []
    for endpoint in ENDPOINTS:
        itens = _buscar_paginas_nacionais(endpoint, chave, args.forcar)
        for item in itens:
            cnpj = _cnpj_do_item(item)
            if cnpj in cnpjs_conhecidos:
                sancionados.append(_linha_para_csv(endpoint, item, cnpjs_conhecidos[cnpj]))

    print(f"\nCruzamento: {len(sancionados)} sanção(ões) batendo com fornecedores de {MUNICIPIO}.")
    if not sancionados:
        print("Nenhuma coincidência — nenhum arquivo gerado.")
        return 0

    destino = salvar_csv(sancionados)
    print(f"CSV: {destino}")
    print("\nConcluído.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
