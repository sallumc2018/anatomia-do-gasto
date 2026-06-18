"""
Coleta emendas parlamentares/impositivas de Sorocaba no CEPA oficial.

Fonte:
  https://servicos.sorocaba.sp.gov.br/cepa_publico/api/emendas
  https://servicos.sorocaba.sp.gov.br/cepa_publico/api/emendas/{id}

O script nao publica dados. Brutos ficam em RAW_DIR/cepa, respeitando
ANATOMIA_RAW_ROOT; normalizados ficam em data/extracted/sorocaba/cepa.

Uso:
  python pipelines\\baixar_cepa_emendas.py
  python pipelines\\baixar_cepa_emendas.py --ano 2024 --ano 2025
  python pipelines\\baixar_cepa_emendas.py --amostra 25
"""
import argparse
import csv
import hashlib
import json
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any

from paths import EXTRACTED_DIR, RAW_DIR

BASE_URL = "https://servicos.sorocaba.sp.gov.br/cepa_publico/api/emendas"
ANOS_PADRAO = tuple(range(2020, 2027))
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

CAMPOS_EMENDAS = [
    "id_emenda",
    "numero_emenda",
    "ano_exercicio",
    "descricao",
    "esfera",
    "id_situacao",
    "situacao",
    "id_secretaria",
    "secretaria",
    "secretaria_sigla",
    "secretaria_orgao_codigo",
    "id_parlamentar",
    "id_parlamentar_exercicio",
    "nome_parlamentar",
    "parlamentar_esfera",
    "parlamentar_data_inicio",
    "parlamentar_data_fim",
    "valor",
    "valor_fixado_final_lista",
    "valor_fixado_inicial_dotacoes",
    "valor_suplementado",
    "valor_anulado",
    "valor_fixado_final_dotacoes",
    "valor_reservado",
    "valor_empenhado",
    "valor_liquidado",
    "valor_pago",
    "qtd_dotacoes",
    "qtd_tramitacoes",
    "qtd_processos",
    "qtd_cpls",
    "ativo",
    "bloqueada",
    "fonte_api",
]

CAMPOS_DOTACOES = [
    "id_emenda",
    "numero_emenda",
    "ano_exercicio",
    "nome_parlamentar",
    "secretaria",
    "id_emenda_dotacao",
    "id_dotacao",
    "numero_dotacao",
    "ano_orcamento",
    "orgao_codigo",
    "orgao_descricao",
    "orgao_secretaria_codigo",
    "funcao_codigo",
    "funcao_descricao",
    "subfuncao_codigo",
    "subfuncao_descricao",
    "programa_codigo",
    "programa_descricao",
    "acao_codigo",
    "acao_descricao",
    "economica_codigo",
    "economica_descricao",
    "fonte_codigo",
    "fonte_descricao",
    "aplicacao_codigo",
    "aplicacao_descricao",
    "valor_fixado_inicial",
    "valor_suplementado",
    "valor_anulado",
    "valor_fixado_final",
    "valor_reservado",
    "valor_empenhado",
    "valor_liquidado",
    "valor_pago",
    "data_atualizacao",
    "fonte_api",
]

CAMPOS_EVENTOS = [
    "id_emenda",
    "numero_emenda",
    "ano_exercicio",
    "tipo_registro",
    "ordem",
    "id_registro",
    "campos_json",
    "fonte_api",
]


def agora_id() -> str:
    return datetime.now().strftime("%Y-%m-%d_%H%M%S")


def data_id() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def carregar_json_url(url: str, timeout: int = 60, tentativas: int = 3) -> tuple[Any, bytes, int]:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            "User-Agent": USER_AGENT,
        },
    )
    ultimo_erro: Exception | None = None
    for tentativa in range(1, tentativas + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
                return json.loads(raw.decode("utf-8")), raw, resp.status
        except urllib.error.HTTPError:
            raise
        except urllib.error.URLError as exc:
            ultimo_erro = exc
            if tentativa == tentativas:
                raise
            time.sleep(1.5 * tentativa)
    raise RuntimeError(f"falha inesperada ao carregar {url}: {ultimo_erro}")


def salvar_json(path: Path, dados: Any) -> bytes:
    raw = json.dumps(dados, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    ultimo_erro = None
    for tentativa in range(1, 4):
        try:
            path.write_bytes(raw)
            break
        except OSError as exc:
            ultimo_erro = exc
            if tentativa == 3:
                raise
            time.sleep(0.5 * tentativa)
    if ultimo_erro:
        print(f"  escrita recuperada apos retry: {path}")
    return raw


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def valor(item: dict[str, Any], chave: str) -> Any:
    return item.get(chave, "")


def dinheiro(item: dict[str, Any], chave: str) -> float:
    dado = item.get(chave)
    if dado in (None, ""):
        return 0.0
    return float(dado)


def lista(item: dict[str, Any], chave: str) -> list[dict[str, Any]]:
    dado = item.get(chave) or []
    return dado if isinstance(dado, list) else []


def nome_secretaria(emenda: dict[str, Any]) -> str:
    secretaria = emenda.get("secretaria") or {}
    return secretaria.get("nome", "") if isinstance(secretaria, dict) else ""


def nome_parlamentar(emenda: dict[str, Any]) -> str:
    parlamentar = (
        (emenda.get("parlamentarExercicio") or {})
        .get("parlamentar", {})
        .get("nome")
    )
    return parlamentar or emenda.get("nomeParlamentar", "")


def somar_dotacoes(emenda: dict[str, Any], campo: str) -> float:
    total = 0.0
    for vinculo in lista(emenda, "dotacoesEmenda"):
        dotacao = vinculo.get("dotacao") or {}
        if isinstance(dotacao, dict):
            total += dinheiro(dotacao, campo)
    return total


def normalizar_emenda(emenda: dict[str, Any]) -> dict[str, Any]:
    secretaria = emenda.get("secretaria") or {}
    situacao = emenda.get("emendaSituacao") or emenda.get("situacao") or {}
    parlamentar_exercicio = emenda.get("parlamentarExercicio") or {}
    parlamentar = parlamentar_exercicio.get("parlamentar") or {}
    esfera = emenda.get("esfera") or {}
    esfera_desc = esfera.get("descricao") if isinstance(esfera, dict) else esfera

    return {
        "id_emenda": valor(emenda, "id"),
        "numero_emenda": valor(emenda, "numeroEmenda"),
        "ano_exercicio": valor(emenda, "anoExercicio"),
        "descricao": valor(emenda, "descricao"),
        "esfera": esfera_desc or "",
        "id_situacao": situacao.get("id", "") if isinstance(situacao, dict) else "",
        "situacao": situacao.get("descricao", "") if isinstance(situacao, dict) else "",
        "id_secretaria": secretaria.get("id", "") if isinstance(secretaria, dict) else "",
        "secretaria": secretaria.get("nome", "") if isinstance(secretaria, dict) else "",
        "secretaria_sigla": secretaria.get("sigla", "") if isinstance(secretaria, dict) else "",
        "secretaria_orgao_codigo": secretaria.get("orgaoCodigo", "") if isinstance(secretaria, dict) else "",
        "id_parlamentar": parlamentar.get("id", "") if isinstance(parlamentar, dict) else "",
        "id_parlamentar_exercicio": valor(emenda, "idParlamentarExercicio")
        or parlamentar_exercicio.get("id", ""),
        "nome_parlamentar": nome_parlamentar(emenda),
        "parlamentar_esfera": (parlamentar_exercicio.get("parlamentarEsfera") or {}).get("descricao", ""),
        "parlamentar_data_inicio": parlamentar_exercicio.get("dataInicio", ""),
        "parlamentar_data_fim": parlamentar_exercicio.get("dataFim", ""),
        "valor": valor(emenda, "valor"),
        "valor_fixado_final_lista": valor(emenda, "valorFixadoFinal"),
        "valor_fixado_inicial_dotacoes": somar_dotacoes(emenda, "valorFixadoInicial"),
        "valor_suplementado": somar_dotacoes(emenda, "valorSuplementado"),
        "valor_anulado": somar_dotacoes(emenda, "valorAnulado"),
        "valor_fixado_final_dotacoes": somar_dotacoes(emenda, "valorFixadoFinal"),
        "valor_reservado": somar_dotacoes(emenda, "valorReservado"),
        "valor_empenhado": somar_dotacoes(emenda, "valorEmpenhado"),
        "valor_liquidado": somar_dotacoes(emenda, "valorLiquidado"),
        "valor_pago": somar_dotacoes(emenda, "valorPago"),
        "qtd_dotacoes": len(lista(emenda, "dotacoesEmenda")),
        "qtd_tramitacoes": len(lista(emenda, "tramitacoesEmenda")),
        "qtd_processos": len(lista(emenda, "processosEmenda")),
        "qtd_cpls": len(lista(emenda, "cplsEmenda")),
        "ativo": valor(emenda, "ativo"),
        "bloqueada": valor(emenda, "bloqueada"),
        "fonte_api": f"{BASE_URL}/{valor(emenda, 'id')}",
    }


def normalizar_dotacoes(emenda: dict[str, Any]) -> list[dict[str, Any]]:
    linhas = []
    for vinculo in lista(emenda, "dotacoesEmenda"):
        dotacao = vinculo.get("dotacao") or {}
        if not isinstance(dotacao, dict):
            continue
        linhas.append(
            {
                "id_emenda": valor(emenda, "id"),
                "numero_emenda": valor(emenda, "numeroEmenda"),
                "ano_exercicio": valor(emenda, "anoExercicio"),
                "nome_parlamentar": nome_parlamentar(emenda),
                "secretaria": nome_secretaria(emenda),
                "id_emenda_dotacao": vinculo.get("id", ""),
                "id_dotacao": vinculo.get("idDotacao", "") or dotacao.get("id", ""),
                "numero_dotacao": dotacao.get("numeroDotacao", ""),
                "ano_orcamento": dotacao.get("anoOrcamento", ""),
                "orgao_codigo": dotacao.get("orgaoCodigo", ""),
                "orgao_descricao": dotacao.get("orgaoDescricao", ""),
                "orgao_secretaria_codigo": dotacao.get("orgaoSecretariaCodigo", ""),
                "funcao_codigo": dotacao.get("funcaoCodigo", ""),
                "funcao_descricao": dotacao.get("funcaoDescricao", ""),
                "subfuncao_codigo": dotacao.get("subfuncaoCodigo", ""),
                "subfuncao_descricao": dotacao.get("subfuncaoDescricao", ""),
                "programa_codigo": dotacao.get("programaCodigo", ""),
                "programa_descricao": dotacao.get("programaDescricao", ""),
                "acao_codigo": dotacao.get("acaoCodigo", ""),
                "acao_descricao": dotacao.get("acaoDescricao", ""),
                "economica_codigo": dotacao.get("economicaCodigo", ""),
                "economica_descricao": str(dotacao.get("economicaDescricao", "")).strip(),
                "fonte_codigo": dotacao.get("fonteCodigo", ""),
                "fonte_descricao": dotacao.get("fonteDescricao", ""),
                "aplicacao_codigo": dotacao.get("aplicacaoCodigo", ""),
                "aplicacao_descricao": dotacao.get("aplicacaoDescricao", ""),
                "valor_fixado_inicial": dotacao.get("valorFixadoInicial", 0),
                "valor_suplementado": dotacao.get("valorSuplementado", 0),
                "valor_anulado": dotacao.get("valorAnulado", 0),
                "valor_fixado_final": dotacao.get("valorFixadoFinal", 0),
                "valor_reservado": dotacao.get("valorReservado", 0),
                "valor_empenhado": dotacao.get("valorEmpenhado", 0),
                "valor_liquidado": dotacao.get("valorLiquidado", 0),
                "valor_pago": dotacao.get("valorPago", 0),
                "data_atualizacao": dotacao.get("dataAtualizacao", ""),
                "fonte_api": f"{BASE_URL}/{valor(emenda, 'id')}",
            }
        )
    return linhas


def normalizar_eventos(emenda: dict[str, Any], chave: str, tipo: str) -> list[dict[str, Any]]:
    linhas = []
    for ordem, item in enumerate(lista(emenda, chave), start=1):
        linhas.append(
            {
                "id_emenda": valor(emenda, "id"),
                "numero_emenda": valor(emenda, "numeroEmenda"),
                "ano_exercicio": valor(emenda, "anoExercicio"),
                "tipo_registro": tipo,
                "ordem": ordem,
                "id_registro": item.get("id", "") if isinstance(item, dict) else "",
                "campos_json": json.dumps(item, ensure_ascii=False, sort_keys=True),
                "fonte_api": f"{BASE_URL}/{valor(emenda, 'id')}",
            }
        )
    return linhas


def escrever_csv(path: Path, campos: list[str], linhas: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(linhas)


def carregar_listagem(raw_dir: Path, forcar: bool) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    url = BASE_URL
    path = raw_dir / "emendas_listagem.json"
    if path.exists() and not forcar:
        dados = json.loads(path.read_text(encoding="utf-8"))
        raw = path.read_bytes()
        status = "cache"
    else:
        dados, raw, http_status = carregar_json_url(url)
        salvar_json(path, dados)
        status = http_status
    return dados, {
        "url": url,
        "path": str(path),
        "status": status,
        "sha256": sha256(raw),
        "bytes": len(raw),
    }


def carregar_detalhe(id_emenda: int, raw_dir: Path, forcar: bool) -> tuple[dict[str, Any], dict[str, Any]]:
    url = f"{BASE_URL}/{id_emenda}"
    path = raw_dir / "detalhes" / f"emenda_{id_emenda}.json"
    if path.exists() and not forcar:
        dados = json.loads(path.read_text(encoding="utf-8"))
        raw = path.read_bytes()
        status = "cache"
    else:
        dados, raw, http_status = carregar_json_url(url)
        salvar_json(path, dados)
        status = http_status
    return dados, {
        "url": url,
        "path": str(path),
        "status": status,
        "sha256": sha256(raw),
        "bytes": len(raw),
    }


def filtrar_emendas(listagem: list[dict[str, Any]], anos: set[int], amostra: int | None) -> list[dict[str, Any]]:
    filtradas = [e for e in listagem if int(e.get("anoExercicio") or 0) in anos]
    filtradas.sort(key=lambda e: (int(e.get("anoExercicio") or 0), int(e.get("id") or 0)))
    return filtradas[:amostra] if amostra else filtradas


def main() -> None:
    parser = argparse.ArgumentParser(description="Coleta emendas CEPA Sorocaba via API oficial")
    parser.add_argument("--ano", type=int, action="append", help="Ano a coletar; padrao: 2020-2026")
    parser.add_argument("--amostra", type=int, help="Coleta apenas N emendas apos filtro de ano")
    parser.add_argument("--forcar", action="store_true", help="Rebaixa arquivos raw ja existentes")
    parser.add_argument("--delay", type=float, default=0.05, help="Pausa entre detalhes, em segundos")
    args = parser.parse_args()

    anos = set(args.ano or ANOS_PADRAO)
    run_id = agora_id()
    raw_dir = RAW_DIR / "cepa" / data_id()
    out_dir = EXTRACTED_DIR / "cepa" / "saida"

    manifest: dict[str, Any] = {
        "run_id": run_id,
        "coletado_em": datetime.now().isoformat(timespec="seconds"),
        "fonte": BASE_URL,
        "anos_solicitados": sorted(anos),
        "amostra": args.amostra,
        "raw_dir": str(raw_dir),
        "extracted_dir": str(out_dir),
        "requests": [],
    }

    print(f"Raw: {raw_dir}")
    print(f"Extracted: {out_dir}")

    listagem, meta_listagem = carregar_listagem(raw_dir, args.forcar)
    manifest["requests"].append(meta_listagem)
    selecionadas = filtrar_emendas(listagem, anos, args.amostra)
    print(f"Listagem: {len(listagem)} emendas; selecionadas: {len(selecionadas)}")

    detalhes = []
    for idx, item in enumerate(selecionadas, start=1):
        id_emenda = int(item["id"])
        try:
            detalhe, meta = carregar_detalhe(id_emenda, raw_dir, args.forcar)
        except urllib.error.HTTPError as exc:
            meta = {
                "url": f"{BASE_URL}/{id_emenda}",
                "path": "",
                "status": exc.code,
                "erro": str(exc),
            }
            print(f"  {idx}/{len(selecionadas)} id={id_emenda}: HTTP {exc.code}")
            manifest["requests"].append(meta)
            continue
        except urllib.error.URLError as exc:
            meta = {
                "url": f"{BASE_URL}/{id_emenda}",
                "path": "",
                "status": "erro_rede",
                "erro": str(exc),
            }
            print(f"  {idx}/{len(selecionadas)} id={id_emenda}: erro de rede")
            manifest["requests"].append(meta)
            continue
        detalhes.append(detalhe)
        manifest["requests"].append(meta)
        if idx == 1 or idx % 100 == 0 or idx == len(selecionadas):
            print(f"  {idx}/{len(selecionadas)} detalhes")
        if args.delay and meta["status"] != "cache":
            time.sleep(args.delay)

    emendas = [normalizar_emenda(e) for e in detalhes]
    dotacoes = [linha for e in detalhes for linha in normalizar_dotacoes(e)]
    eventos = []
    for e in detalhes:
        eventos.extend(normalizar_eventos(e, "tramitacoesEmenda", "tramitacao"))
        eventos.extend(normalizar_eventos(e, "processosEmenda", "processo"))
        eventos.extend(normalizar_eventos(e, "cplsEmenda", "cpl"))

    escrever_csv(out_dir / "cepa_emendas_sorocaba_2020_2026.csv", CAMPOS_EMENDAS, emendas)
    escrever_csv(out_dir / "cepa_dotacoes_sorocaba_2020_2026.csv", CAMPOS_DOTACOES, dotacoes)
    escrever_csv(out_dir / "cepa_eventos_sorocaba_2020_2026.csv", CAMPOS_EVENTOS, eventos)

    normalizado = {
        "metadata": {
            "run_id": run_id,
            "fonte": BASE_URL,
            "anos": sorted(anos),
            "total_emendas": len(emendas),
            "total_dotacoes": len(dotacoes),
            "total_eventos": len(eventos),
        },
        "emendas": emendas,
        "dotacoes": dotacoes,
        "eventos": eventos,
    }
    salvar_json(out_dir / "cepa_emendas_sorocaba_2020_2026.normalizado.json", normalizado)

    anos_cobertos = Counter(int(e["ano_exercicio"]) for e in emendas if e["ano_exercicio"])
    manifest["totais"] = {
        "emendas": len(emendas),
        "dotacoes": len(dotacoes),
        "eventos": len(eventos),
        "anos_cobertos": dict(sorted(anos_cobertos.items())),
        "valor": sum(float(e["valor"] or 0) for e in emendas),
        "valor_fixado_final_dotacoes": sum(float(e["valor_fixado_final_dotacoes"] or 0) for e in emendas),
        "valor_empenhado": sum(float(e["valor_empenhado"] or 0) for e in emendas),
        "valor_liquidado": sum(float(e["valor_liquidado"] or 0) for e in emendas),
        "valor_pago": sum(float(e["valor_pago"] or 0) for e in emendas),
    }
    salvar_json(raw_dir / "manifest_coleta.json", manifest)
    salvar_json(out_dir / "cepa_manifest_coleta.json", manifest)

    print("\nConcluido.")
    print(f"Emendas: {len(emendas)}")
    print(f"Anos cobertos: {dict(sorted(anos_cobertos.items()))}")
    print(
        "Execucao financeira: "
        "valor_fixado_inicial_dotacoes, valor_suplementado, valor_anulado, "
        "valor_fixado_final_dotacoes, valor_reservado, valor_empenhado, "
        "valor_liquidado, valor_pago"
    )


if __name__ == "__main__":
    main()
