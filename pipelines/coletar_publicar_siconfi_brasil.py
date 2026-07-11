"""
Orquestrador bulk nacional — coleta SICONFI (RREO/RGF/DCA) via modo dinâmico
de paths.py e publica em data/public com gate de conteúdo (sem bypass de
padrão de nome).

Contexto: pipelines/coletar_municipios_brasil.py já roda extratores SICONFI
em modo dinâmico, mas so grava em data/extracted — não publica. Este script
fecha o ciclo: coleta + publica, usando o mesmo gate de conteúdo criado em
tools/gates/check_ibge_match.py (regex id_ente=<7 dígitos> em Fonte_URL) pra
nunca copiar pra data/public um arquivo cujo conteúdo não bate com o IBGE
esperado do município-alvo. Decisão de arquitetura (ver
docs/orquestracao/COORDENACAO_ESTADOS.md): publicação nacional não pode
usar --skip-qa-gate nem depender de data/manifests/datasets.csv — foi
exatamente esse bypass que deixou o bug de São Vicente/Sertãozinho chegar
em produção sem detecção.

Áreas cobertas: receita, executivo, rcl, natureza_despesa, receita_capital,
rgf_pessoal (fiscal), rgf_divida (fiscal), divida_detalhada (fiscal),
seguranca (rreo_seguranca), transporte (rreo_transporte).
SIOPS/SIOPE ainda não estão aqui (extratores não confirmados em modo
dinâmico) — próxima extensão.

Uso:
  # Listar municípios de uma região sem coletar
  .venv/bin/python3 pipelines/coletar_publicar_siconfi_brasil.py --regiao Sul --listar

  # Coletar + publicar (com gate) uma UF
  .venv/bin/python3 pipelines/coletar_publicar_siconfi_brasil.py --uf RO

  # Lote de teste (poucos municípios, por IBGE)
  .venv/bin/python3 pipelines/coletar_publicar_siconfi_brasil.py --ibge 1100015 --ibge 1100023

  # Região inteira
  .venv/bin/python3 pipelines/coletar_publicar_siconfi_brasil.py --regiao Norte

  # Só publicar o que já está em data/extracted (sem recoletar)
  .venv/bin/python3 pipelines/coletar_publicar_siconfi_brasil.py --uf RO --so-publicar
"""
import argparse
import csv
import os
import re
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

try:
    from .sprint2_keys import duplicate_keys, municipio_storage_key
except ImportError:
    from sprint2_keys import duplicate_keys, municipio_storage_key

ROOT = Path(__file__).resolve().parents[1]
PYTHON = str(ROOT / ".venv" / "bin" / "python3")
LOG_DIR = ROOT / "_logs" / "coleta_siconfi_brasil"
LOG_DIR.mkdir(parents=True, exist_ok=True)

IBGE_CSV = ROOT / "data" / "manifests" / "ibge_municipios_completo.csv"

REGIOES = {
    "Norte": {"AC", "AP", "AM", "PA", "RO", "RR", "TO"},
    "Nordeste": {"AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"},
    "Centro-Oeste": {"DF", "GO", "MT", "MS"},
    "Sudeste": {"ES", "MG", "RJ", "SP"},
    "Sul": {"PR", "RS", "SC"},
}

# 2026 fora do range padrão: SICONFI ainda não publica o ano corrente
# (mesmo padrão fantasma encontrado no fix de São Vicente/Sertãozinho).
_ANOS_SICONFI = sum([["--ano", str(a)] for a in range(2015, 2026)], [])

# (script extrator, label, area de publicação)
FONTES_SICONFI = [
    ("extrator_receita.py", "SICONFI Receita", "receita"),
    ("extrator_executivo.py", "SICONFI Executivo", "executivo"),
    ("extrator_rcl.py", "SICONFI RCL", "fiscal"),
    ("extrator_natureza_despesa.py", "SICONFI Natureza Despesa", "fiscal"),
    ("extrator_receita_capital.py", "SICONFI Receita Capital", "fiscal"),
    ("extrator_rgf_pessoal.py", "SICONFI RGF Pessoal", "fiscal"),
    ("extrator_rgf_divida.py", "SICONFI RGF Dívida", "fiscal"),
    ("extrator_divida_detalhada.py", "SICONFI Dívida Detalhada", "fiscal"),
    ("extrator_rreo_seguranca.py", "SICONFI RREO Segurança", "seguranca"),
    ("extrator_rreo_transporte.py", "SICONFI RREO Transporte", "transporte"),
]

ID_ENTE_RE = re.compile(r"id_ente=(\d{7})")

LOG_FILE: Path
_LOG_LOCK = threading.Lock()


def log(msg: str) -> None:
    line = f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}"
    with _LOG_LOCK:
        print(line)
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")


def carregar_municipios() -> list[dict]:
    with IBGE_CSV.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def filtrar(municipios: list[dict], ufs: set[str], ibges: list[str]) -> list[dict]:
    if ibges:
        return [m for m in municipios if m["ibge"] in set(ibges)]
    if ufs:
        return [m for m in municipios if m["uf"] in ufs]
    return municipios


def extrair_ibge_conteudo(csv_path: Path) -> set[str]:
    achados: set[str] = set()
    with csv_path.open(encoding="utf-8", errors="replace") as f:
        for linha in f:
            m = ID_ENTE_RE.search(linha)
            if m:
                achados.add(m.group(1))
    return achados


def coletar(key: str, ibge: str, nome: str, uf: str) -> None:
    env = {
        **os.environ,
        "MUNICIPIO": key,
        "MUNICIPIO_IBGE": ibge,
        "MUNICIPIO_NOME": nome,
        "MUNICIPIO_UF": uf,
    }
    for script, label, _area in FONTES_SICONFI:
        cmd = [PYTHON, f"pipelines/{script}"] + _ANOS_SICONFI
        t0 = time.time()
        try:
            r = subprocess.run(cmd, env=env, cwd=str(ROOT), capture_output=True, text=True, timeout=7200)
            elapsed = time.time() - t0
            if r.returncode == 0:
                log(f"    ✓ {key}/{label} ({elapsed:.0f}s)")
            else:
                stderr_tail = (r.stderr or "")[-300:]
                log(f"    ✗ {key}/{label} ({elapsed:.0f}s) exit={r.returncode} {stderr_tail}")
        except subprocess.TimeoutExpired:
            log(f"    ✗ {key}/{label} TIMEOUT (>7200s)")


def publicar_com_gate(key: str, ibge: str) -> tuple[int, int]:
    """Copia data/extracted/<key>/<area>/saida -> data/public/<key>/<area>/saida
    apenas para arquivos cujo IBGE embutido no conteudo bate com o esperado."""
    ibge6 = ibge[:6]
    ok = skip = 0
    areas = sorted({area for _s, _l, area in FONTES_SICONFI})
    for area in areas:
        origem = ROOT / "data" / "extracted" / key / area / "saida"
        if not origem.is_dir():
            continue
        destino = ROOT / "data" / "public" / key / area / "saida"
        destino.mkdir(parents=True, exist_ok=True)
        for csv_path in origem.glob("*.csv"):
            achados = extrair_ibge_conteudo(csv_path)
            if not achados:
                log(f"    ⚠ {key}/{area}/{csv_path.name}: sem id_ente no conteúdo, SKIP publicação")
                skip += 1
                continue
            ruins = {a for a in achados if a[:6] != ibge6}
            if ruins:
                log(f"    ✗ {key}/{area}/{csv_path.name}: esperado IBGE {ibge}, achado {sorted(ruins)} — NÃO publicado")
                skip += 1
                continue
            alvo = destino / csv_path.name
            tmp = destino / (csv_path.name + ".tmp")
            tmp.write_bytes(csv_path.read_bytes())
            tmp.replace(alvo)
            ok += 1
    return ok, skip


def processar_municipio(m: dict, duplicated_keys: set[str], so_publicar: bool) -> None:
    key = municipio_storage_key(m, duplicated_keys)
    nome, ibge, uf = m["nome"], m["ibge"], m["uf"]

    log(f"\n{'='*55}")
    log(f"{'PUBLICANDO' if so_publicar else 'COLETANDO+PUBLICANDO'}: {nome} — {uf} (IBGE {ibge}, key={key})")
    log(f"{'='*55}")

    if not so_publicar:
        coletar(key, ibge, nome, uf)

    ok, skip = publicar_com_gate(key, ibge)
    log(f"  {key.upper()} — publicados={ok} bloqueados_pelo_gate={skip}")


def main() -> None:
    global LOG_FILE

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    LOG_FILE = LOG_DIR / f"siconfi_brasil_{timestamp}.log"

    parser = argparse.ArgumentParser(description="Coleta+publica SICONFI nacional com gate de conteúdo.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--regiao", choices=sorted(REGIOES), help="Norte|Nordeste|Centro-Oeste|Sudeste|Sul")
    group.add_argument("--uf", action="append", metavar="UF", dest="ufs")
    group.add_argument("--ibge", action="append", metavar="IBGE", dest="ibges")
    parser.add_argument("--listar", action="store_true")
    parser.add_argument("--so-publicar", action="store_true",
                        help="Não recoleta, só reaplica o gate e publica o que já está em data/extracted")
    parser.add_argument("--paralelas", type=int, default=1,
                        help="Municípios simultâneos (padrão: 1). Gargalo é I/O de rede (API "
                             "SICONFI), não CPU — mas em máquina com poucos cores e outros "
                             "processos rodando junto (sprints existentes, rclone), manter baixo "
                             "(2-3) para não competir por banda/memória.")
    args = parser.parse_args()

    if not IBGE_CSV.exists():
        print(f"ERRO: {IBGE_CSV} não encontrado.")
        sys.exit(1)

    todos = carregar_municipios()
    duplicated_keys = duplicate_keys(todos)

    ufs = REGIOES[args.regiao] if args.regiao else set(args.ufs or [])
    ibges = args.ibges or []
    alvos = filtrar(todos, ufs, ibges)

    log(f"Selecionados: {len(alvos)} municípios")
    if args.listar:
        print(f"\n{'IBGE':<10} {'UF':<4} {'Nome'}")
        print("-" * 50)
        for m in alvos:
            key = municipio_storage_key(m, duplicated_keys)
            print(f"{m['ibge']:<10} {m['uf']:<4} {m['nome']} ({key})")
        print(f"\nTotal: {len(alvos)}")
        return

    log(f"Log: {LOG_FILE}")
    log(f"Início: {datetime.now(timezone.utc).isoformat()}")

    if args.paralelas <= 1:
        for i, m in enumerate(alvos):
            processar_municipio(m, duplicated_keys, args.so_publicar)
            if i < len(alvos) - 1 and not args.so_publicar:
                time.sleep(2)
    else:
        log(f"Rodando com {args.paralelas} municípios simultâneos")
        with ThreadPoolExecutor(max_workers=args.paralelas) as pool:
            futuros = {
                pool.submit(processar_municipio, m, duplicated_keys, args.so_publicar): m
                for m in alvos
            }
            for fut in as_completed(futuros):
                m = futuros[fut]
                try:
                    fut.result()
                except Exception as exc:
                    log(f"  ✗ {m['nome']}/{m['uf']}: EXCEÇÃO {exc!r}")

    log(f"\nFim: {datetime.now(timezone.utc).isoformat()}")
    log(f"Log: {LOG_FILE}")


if __name__ == "__main__":
    main()
