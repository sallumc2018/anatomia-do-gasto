"""
Coleta PNCP Sorocaba em janelas pequenas com checkpoint.

Escopo:
  - compras: /api/consulta/v1/contratacoes/publicacao
  - atas: /api/consulta/v1/atas
  - contratos: /api/consulta/v1/contratos
  - contratos_atualizacao: /api/consulta/v1/contratos/atualizacao

Regras do projeto:
  - brutos em ANATOMIA_RAW_ROOT/sorocaba/pncp quando a variavel existir;
  - indices mecanicos em data/extracted/sorocaba/pncp;
  - nada e gravado em data/public.

Exemplos:
  python pipelines/baixar_pncp_sorocaba.py --ano 2025
  python pipelines/baixar_pncp_sorocaba.py --inicio 2024-01-01 --fim 2026-12-31
  python pipelines/baixar_pncp_sorocaba.py --dataset compras --ano 2025 --modalidade 6
  python pipelines/baixar_pncp_sorocaba.py --dataset atas --ano 2025 --granularidade periodo
  python pipelines/baixar_pncp_sorocaba.py --dataset contratos --ano 2025 --granularidade diaria
  python pipelines/baixar_pncp_sorocaba.py --dataset atas --ano 2025 --export-only
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from paths import CFG, EXTRACTED_DIR, RAW_DIR


CNPJ_SOROCABA = "46634044000174"
IBGE_SOROCABA = CFG["ibge"]
PNCP_HOST = "https://pncp.gov.br"
TAMANHO_PAGINA_PADRAO = 10
HTTP_TRANSITORIOS = {429, 500, 502, 503, 504}

# O PNCP rejeita algumas combinacoes endpoint/modalidade com 422. A coleta trata
# esse retorno como combinacao sem dados ou invalida para a janela consultada.
MODALIDADES_PADRAO = tuple(range(1, 15))


@dataclass(frozen=True)
class DatasetSpec:
    nome: str
    endpoint: str
    tipo_data: str
    precisa_modalidade: bool = False


DATASETS = {
    "atas": DatasetSpec(
        nome="atas",
        endpoint="/api/consulta/v1/atas",
        tipo_data="data_assinatura_ou_vigencia",
    ),
    "compras": DatasetSpec(
        nome="compras",
        endpoint="/api/consulta/v1/contratacoes/publicacao",
        tipo_data="data_publicacao",
        precisa_modalidade=True,
    ),
    "contratos": DatasetSpec(
        nome="contratos",
        endpoint="/api/consulta/v1/contratos",
        tipo_data="data_publicacao_ou_assinatura",
    ),
    "contratos_atualizacao": DatasetSpec(
        nome="contratos_atualizacao",
        endpoint="/api/consulta/v1/contratos/atualizacao",
        tipo_data="data_atualizacao",
    ),
}


class ColetaErro(RuntimeError):
    pass


def parse_iso_date(valor: str) -> date:
    try:
        return date.fromisoformat(valor)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"data invalida: {valor}") from exc


def yyyymmdd(valor: date) -> str:
    return valor.strftime("%Y%m%d")


def iter_meses(inicio: date, fim: date):
    atual = date(inicio.year, inicio.month, 1)
    limite = date(fim.year, fim.month, 1)
    while atual <= limite:
        if atual.month == 12:
            prox = date(atual.year + 1, 1, 1)
        else:
            prox = date(atual.year, atual.month + 1, 1)
        yield max(inicio, atual), min(fim, prox - timedelta(days=1))
        atual = prox


def iter_dias(inicio: date, fim: date):
    atual = inicio
    while atual <= fim:
        yield atual, atual
        atual += timedelta(days=1)


def pagina_path(
    raw_base: Path,
    dataset: str,
    inicio: date,
    fim: date,
    pagina: int,
    modalidade: int | None,
) -> Path:
    partes = [
        raw_base,
        dataset,
        f"ano={inicio.year:04d}",
        f"mes={inicio.month:02d}",
    ]
    if modalidade is not None:
        partes.append(f"modalidade={modalidade:02d}")
    nome = f"{yyyymmdd(inicio)}_{yyyymmdd(fim)}_pagina_{pagina:04d}.json"
    return Path(*partes) / nome


def status_path(raw_base: Path, dataset: str, inicio: date, fim: date, modalidade: int | None) -> Path:
    partes = [raw_base, dataset, f"ano={inicio.year:04d}", f"mes={inicio.month:02d}"]
    if modalidade is not None:
        partes.append(f"modalidade={modalidade:02d}")
    return Path(*partes) / f"{yyyymmdd(inicio)}_{yyyymmdd(fim)}_status.json"


def json_load(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ColetaErro(f"JSON bruto inesperado em {path}")
    return data


def json_dump(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    tmp.replace(path)


def montar_params(
    spec: DatasetSpec,
    inicio: date,
    fim: date,
    pagina: int,
    tamanho_pagina: int,
    modalidade: int | None,
) -> dict[str, str | int]:
    params: dict[str, str | int] = {
        "dataInicial": yyyymmdd(inicio),
        "dataFinal": yyyymmdd(fim),
        "pagina": pagina,
        "tamanhoPagina": tamanho_pagina,
    }
    if spec.nome == "compras":
        params.update(
            {
                "cnpj": CNPJ_SOROCABA,
                "codigoMunicipioIbge": IBGE_SOROCABA,
            }
        )
        if modalidade is None:
            raise ColetaErro("compras exige codigoModalidadeContratacao")
        params["codigoModalidadeContratacao"] = modalidade
    elif spec.nome == "atas":
        params["cnpj"] = CNPJ_SOROCABA
    else:
        params["cnpjOrgao"] = CNPJ_SOROCABA
    return params


def montar_url(spec: DatasetSpec, params: dict[str, str | int]) -> str:
    query = urllib.parse.urlencode(params)
    return f"{PNCP_HOST}{spec.endpoint}?{query}"


def request_json(url: str, timeout: int) -> tuple[int, dict[str, Any]]:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "anatomia-do-gasto/1.0 (+coleta-pncp-sorocaba)",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = resp.read().decode("utf-8")
            if not payload.strip():
                return int(resp.status), {"data": []}
            data = json.loads(payload)
            return int(resp.status), data if isinstance(data, dict) else {"data": data}
    except urllib.error.HTTPError as exc:
        body = exc.read(8000).decode("utf-8", errors="replace")
        if not body.strip():
            return int(exc.code), {"data": []}
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            data = {"erro": body}
        return int(exc.code), data if isinstance(data, dict) else {"erro": data}


def fetch_com_retry(url: str, timeout: int, retries: int, pausa: float) -> tuple[int, dict[str, Any]]:
    ultima: BaseException | None = None
    for tentativa in range(retries + 1):
        try:
            return request_json(url, timeout=timeout)
        except (TimeoutError, urllib.error.URLError, json.JSONDecodeError) as exc:
            ultima = exc
            if tentativa >= retries:
                break
            time.sleep(pausa * (2**tentativa))
    raise ColetaErro(f"falha apos {retries + 1} tentativas: {ultima}")


def itens_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
    data = payload.get("data", [])
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


def total_paginas(payload: dict[str, Any], itens: list[dict[str, Any]]) -> int:
    valor = payload.get("totalPaginas")
    if isinstance(valor, int):
        return max(1, valor)
    total = payload.get("totalRegistros")
    tamanho = payload.get("tamanhoPagina")
    if isinstance(total, int) and isinstance(tamanho, int) and tamanho > 0:
        return max(1, (total + tamanho - 1) // tamanho)
    return 1 if itens else 0


def controle_item(item: dict[str, Any]) -> str:
    for campo in (
        "numeroControlePNCP",
        "numeroControlePNCPAta",
        "numeroControlePNCPCompra",
        "numeroControlePNCPContrato",
        "id",
    ):
        valor = item.get(campo)
        if valor:
            return str(valor)
    bruto = json.dumps(item, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(bruto.encode("utf-8")).hexdigest()[:24]


def normalizar_linha(
    dataset: str,
    item: dict[str, Any],
    inicio: date,
    fim: date,
    modalidade: int | None,
    pagina: int,
    raw_path: Path,
) -> dict[str, str]:
    orgao = item.get("orgaoEntidade") if isinstance(item.get("orgaoEntidade"), dict) else {}
    unidade = item.get("unidadeOrgao") if isinstance(item.get("unidadeOrgao"), dict) else {}
    return {
        "dataset": dataset,
        "janela_inicio": inicio.isoformat(),
        "janela_fim": fim.isoformat(),
        "modalidade_codigo": "" if modalidade is None else str(modalidade),
        "pagina": str(pagina),
        "controle_pncp": controle_item(item),
        "numero": str(
            item.get("numeroCompra")
            or item.get("numeroContratoEmpenho")
            or item.get("numeroAtaRegistroPreco")
            or item.get("numero")
            or ""
        ),
        "ano": str(item.get("anoCompra") or item.get("anoContrato") or item.get("anoAta") or ""),
        "orgao_cnpj": str(item.get("cnpjOrgao") or orgao.get("cnpj") or ""),
        "orgao_nome": str(item.get("nomeOrgao") or orgao.get("razaoSocial") or orgao.get("nome") or ""),
        "unidade_codigo": str(item.get("codigoUnidadeOrgao") or unidade.get("codigoUnidade") or ""),
        "unidade_nome": str(item.get("nomeUnidadeOrgao") or unidade.get("nomeUnidade") or ""),
        "objeto": str(item.get("objetoCompra") or item.get("objetoContrato") or item.get("objetoContratacao") or ""),
        "valor": str(item.get("valorTotalEstimado") or item.get("valorGlobal") or ""),
        "situacao": str(item.get("situacaoCompraNome") or item.get("situacaoContratoNome") or item.get("situacaoNome") or ""),
        "data_publicacao": str(item.get("dataPublicacaoPncp") or item.get("dataPublicacaoPNCP") or ""),
        "data_assinatura": str(item.get("dataAssinatura") or ""),
        "vigencia_inicio": str(item.get("vigenciaInicio") or item.get("dataVigenciaInicio") or ""),
        "vigencia_fim": str(item.get("vigenciaFim") or item.get("dataVigenciaFim") or ""),
        "raw_path": str(raw_path),
    }


def coletar_janela(
    spec: DatasetSpec,
    inicio: date,
    fim: date,
    modalidade: int | None,
    raw_base: Path,
    tamanho_pagina: int,
    timeout: int,
    retries: int,
    pausa: float,
    force: bool,
    export_only: bool,
    max_paginas: int | None,
) -> tuple[list[dict[str, str]], dict[str, Any]]:
    linhas: list[dict[str, str]] = []
    paginas_vistas = 0
    total_registros = 0
    status = "ok"
    bloqueio = ""
    ultima_url = ""
    ultimos_params: dict[str, str | int] = {}

    pagina = 1
    total = 1
    while pagina <= total:
        params = montar_params(spec, inicio, fim, pagina, tamanho_pagina, modalidade)
        url = montar_url(spec, params)
        ultima_url = url
        ultimos_params = params
        raw_page = pagina_path(raw_base, spec.nome, inicio, fim, pagina, modalidade)
        pagina_foi_baixada = False

        usar_cache = raw_page.exists() and not force
        if usar_cache:
            envelope = json_load(raw_page)
            http_status = int(envelope.get("http_status", 200))
            payload = envelope.get("payload", {})
            if not isinstance(payload, dict):
                payload = {}
            if http_status in HTTP_TRANSITORIOS:
                if export_only:
                    status = "parcial_raw"
                    bloqueio = f"raw transitorio HTTP {http_status} para pagina {pagina}"
                    break
                usar_cache = False

        if not usar_cache and export_only:
            status = "parcial_raw"
            bloqueio = f"raw ausente para pagina {pagina}"
            break
        elif not usar_cache:
            try:
                http_status, payload = fetch_com_retry(url, timeout=timeout, retries=retries, pausa=pausa)
            except ColetaErro as exc:
                status = "erro"
                bloqueio = str(exc)
                break
            envelope = {
                "dataset": spec.nome,
                "endpoint": spec.endpoint,
                "url": url,
                "params": params,
                "http_status": http_status,
                "coletado_em": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "payload": payload,
            }
            if http_status not in HTTP_TRANSITORIOS:
                json_dump(raw_page, envelope)
                pagina_foi_baixada = True

        paginas_vistas += 1

        if http_status == 204:
            status = "sem_dados"
            bloqueio = "HTTP 204 sem conteudo"
            break
        if http_status == 422:
            status = "sem_dados_ou_invalido"
            bloqueio = "HTTP 422 tratado como combinacao sem dados/invalida"
            break
        if http_status >= 400:
            status = "erro_http"
            bloqueio = f"HTTP {http_status}"
            break

        itens = itens_payload(payload)
        total_registros += len(itens)
        total = total_paginas(payload, itens)
        for item in itens:
            linhas.append(normalizar_linha(spec.nome, item, inicio, fim, modalidade, pagina, raw_page))

        status_incremental = {
            "dataset": spec.nome,
            "janela_inicio": inicio.isoformat(),
            "janela_fim": fim.isoformat(),
            "modalidade": modalidade,
            "status": "em_andamento" if pagina < total else "ok",
            "bloqueio": "",
            "paginas": paginas_vistas,
            "registros": total_registros,
            "proxima_pagina": pagina + 1 if pagina < total else None,
            "total_paginas_estimado": total,
            "url": url,
            "params": params,
        }
        json_dump(status_path(raw_base, spec.nome, inicio, fim, modalidade), status_incremental)

        if max_paginas is not None and paginas_vistas >= max_paginas and pagina < total:
            status = "interrompido_por_limite"
            bloqueio = f"limite de paginas atingido ({max_paginas})"
            break

        pagina += 1
        if pagina <= total and pagina_foi_baixada and pausa > 0:
            time.sleep(pausa)

    resumo = {
        "dataset": spec.nome,
        "janela_inicio": inicio.isoformat(),
        "janela_fim": fim.isoformat(),
        "modalidade": modalidade,
        "status": status,
        "bloqueio": bloqueio,
        "paginas": paginas_vistas,
        "registros": total_registros,
        "total_paginas_estimado": total,
        "url": ultima_url,
        "params": ultimos_params,
    }
    json_dump(status_path(raw_base, spec.nome, inicio, fim, modalidade), resumo)
    return linhas, resumo


def salvar_csv(path: Path, linhas: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    campos = [
        "dataset",
        "janela_inicio",
        "janela_fim",
        "modalidade_codigo",
        "pagina",
        "controle_pncp",
        "numero",
        "ano",
        "orgao_cnpj",
        "orgao_nome",
        "unidade_codigo",
        "unidade_nome",
        "objeto",
        "valor",
        "situacao",
        "data_publicacao",
        "data_assinatura",
        "vigencia_inicio",
        "vigencia_fim",
        "raw_path",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(linhas)


def salvar_resumo(path: Path, resumos: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "gerado_em": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "cnpj": CNPJ_SOROCABA,
                "codigo_municipio_ibge": IBGE_SOROCABA,
                "resumos": resumos,
            },
            f,
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
        f.write("\n")


def periodo_from_args(args: argparse.Namespace) -> tuple[date, date]:
    if args.inicio or args.fim:
        if not args.inicio or not args.fim:
            raise SystemExit("--inicio e --fim devem ser usados juntos")
        if args.fim < args.inicio:
            raise SystemExit("--fim deve ser maior ou igual a --inicio")
        return args.inicio, args.fim
    anos = args.ano or [date.today().year]
    return date(min(anos), 1, 1), date(max(anos), 12, 31)


def escopo_saida(args: argparse.Namespace, datasets: list[str], modalidades: list[int]) -> str:
    partes: list[str] = []
    if args.dataset:
        partes.append("-".join(sorted(datasets)))
    if args.modalidade:
        partes.append("mod" + "-".join(f"{modalidade:02d}" for modalidade in sorted(modalidades)))
    if args.granularidade != "mensal":
        partes.append(args.granularidade)
    if args.max_janelas is not None:
        partes.append(f"maxj{args.max_janelas}")
    if args.max_paginas is not None:
        partes.append(f"maxp{args.max_paginas}")
    return "_".join(partes)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Baixa PNCP Sorocaba com checkpoint mensal.")
    parser.add_argument("--ano", type=int, action="append", help="Ano a coletar. Pode repetir.")
    parser.add_argument("--inicio", type=parse_iso_date, help="Data inicial YYYY-MM-DD.")
    parser.add_argument("--fim", type=parse_iso_date, help="Data final YYYY-MM-DD.")
    parser.add_argument(
        "--dataset",
        choices=sorted(DATASETS),
        action="append",
        help="Dataset a coletar. Padrao: todos.",
    )
    parser.add_argument(
        "--modalidade",
        type=int,
        action="append",
        help="Modalidade de contratacao para compras. Padrao: 1..14.",
    )
    parser.add_argument("--tamanho-pagina", type=int, default=TAMANHO_PAGINA_PADRAO)
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--pausa", type=float, default=0.5)
    parser.add_argument("--force", action="store_true", help="Refaz paginas ja existentes.")
    parser.add_argument(
        "--export-only",
        action="store_true",
        help="Nao chama a API; exporta somente paginas raw ja existentes.",
    )
    parser.add_argument(
        "--granularidade",
        choices=("mensal", "diaria", "periodo"),
        default="mensal",
        help="Padrao: mensal. Use diaria para endpoints instaveis ou periodo para janela completa paginada.",
    )
    parser.add_argument(
        "--max-paginas",
        type=int,
        help="Limite de paginas por janela/modalidade, util para validacao curta.",
    )
    parser.add_argument(
        "--max-janelas",
        type=int,
        help="Limite total de janelas/modalidades processadas na execucao.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    inicio_periodo, fim_periodo = periodo_from_args(args)
    datasets = args.dataset or sorted(DATASETS)
    modalidades = args.modalidade or list(MODALIDADES_PADRAO)

    raw_base = RAW_DIR / "pncp"
    extracted_base = EXTRACTED_DIR / "pncp"
    linhas_todas: list[dict[str, str]] = []
    resumos: list[dict[str, Any]] = []

    print(f"Raw PNCP: {raw_base}")
    print(f"Extracted PNCP: {extracted_base}")
    print(f"Periodo: {inicio_periodo.isoformat()} a {fim_periodo.isoformat()}")
    if args.export_only:
        print("Modo: export-only (sem chamadas de rede)")

    janelas_processadas = 0
    for spec_nome in datasets:
        spec = DATASETS[spec_nome]
        combos: list[int | None] = list(modalidades) if spec.precisa_modalidade else [None]
        if args.granularidade == "periodo":
            janelas = [(inicio_periodo, fim_periodo)]
        elif args.granularidade == "diaria":
            janelas = list(iter_dias(inicio_periodo, fim_periodo))
        else:
            janelas = list(iter_meses(inicio_periodo, fim_periodo))
        for inicio, fim in janelas:
            for modalidade in combos:
                if args.max_janelas is not None and janelas_processadas >= args.max_janelas:
                    print(f"Limite de janelas atingido ({args.max_janelas}); encerrando.")
                    break
                rotulo_mod = f" modalidade {modalidade}" if modalidade is not None else ""
                print(f"{spec.nome} {inicio:%Y-%m} {inicio:%d/%m/%Y}-{fim:%d/%m/%Y}{rotulo_mod}")
                linhas, resumo = coletar_janela(
                    spec=spec,
                    inicio=inicio,
                    fim=fim,
                    modalidade=modalidade,
                    raw_base=raw_base,
                    tamanho_pagina=args.tamanho_pagina,
                    timeout=args.timeout,
                    retries=args.retries,
                    pausa=args.pausa,
                    force=args.force,
                    export_only=args.export_only,
                    max_paginas=args.max_paginas,
                )
                linhas_todas.extend(linhas)
                resumos.append(resumo)
                janelas_processadas += 1
                print(
                    f"  {resumo['status']}: {resumo['registros']} registros, "
                    f"{resumo['paginas']} paginas"
                )
                if args.pausa > 0:
                    time.sleep(args.pausa)
            if args.max_janelas is not None and janelas_processadas >= args.max_janelas:
                break
        if args.max_janelas is not None and janelas_processadas >= args.max_janelas:
            break

    sufixo = f"{yyyymmdd(inicio_periodo)}_{yyyymmdd(fim_periodo)}"
    escopo = escopo_saida(args, datasets, modalidades)
    nome_base = f"pncp_sorocaba_{escopo}_{sufixo}" if escopo else f"pncp_sorocaba_{sufixo}"
    csv_path = extracted_base / "saida" / f"{nome_base}.csv"
    resumo_path = extracted_base / "diagnosticos" / f"{nome_base}_resumo.json"
    salvar_csv(csv_path, linhas_todas)
    salvar_resumo(resumo_path, resumos)

    por_dataset: dict[str, int] = {}
    bloqueios: list[dict[str, Any]] = []
    for resumo in resumos:
        por_dataset[resumo["dataset"]] = por_dataset.get(resumo["dataset"], 0) + int(resumo["registros"])
        if resumo["status"] not in {"ok", "sem_dados", "sem_dados_ou_invalido"}:
            bloqueios.append(resumo)

    print("\nTotais por dataset:")
    for dataset, total in sorted(por_dataset.items()):
        print(f"  {dataset}: {total}")
    print(f"CSV extraido: {csv_path}")
    print(f"Resumo: {resumo_path}")
    print("Publicacao: nenhuma escrita em data/public.")

    if bloqueios:
        print("\nBloqueios:")
        for item in bloqueios:
            print(
                f"  {item['dataset']} {item['janela_inicio']}..{item['janela_fim']} "
                f"mod={item['modalidade']}: {item['status']} {item['bloqueio']}"
            )
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
