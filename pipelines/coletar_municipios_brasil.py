"""
Orquestrador bulk Sprint 2 — coleta fontes federais para qualquer conjunto
de municípios brasileiros sem precisar registrá-los em paths.py.

Fontes coletadas por município (via API federal, necessitam apenas IBGE+nome+UF):
  - Portal Transparência /convenios  (2004–2026)
  - Portal Transparência /emendas    (2014–2026, bulk+filtro)
  - FNS repasses fundo-a-fundo       (2015–2026)

Fontes NÃO coletadas aqui (requerem config local ou tier superior):
  - SICONFI RREO/RGF (requer paths.py; usar coletar_municipio_sp.py para registrados)
  - SIOPS/SIOPE (acesso específico)
  - Fazenda-SP (apenas municípios SP com sefaz_sp configurado)

Uso:
  # Todos os 5571 municípios do Brasil
  .venv/bin/python3 pipelines/coletar_municipios_brasil.py --todos

  # Filtrar por UF
  .venv/bin/python3 pipelines/coletar_municipios_brasil.py --uf SP
  .venv/bin/python3 pipelines/coletar_municipios_brasil.py --uf RJ --uf MG

  # Municípios específicos por IBGE
  .venv/bin/python3 pipelines/coletar_municipios_brasil.py --ibge 3518800 --ibge 3509502

  # Modo dry-run (listar sem coletar)
  .venv/bin/python3 pipelines/coletar_municipios_brasil.py --uf SP --listar

  # Limitar paralelas simultâneas (padrão: 3)
  .venv/bin/python3 pipelines/coletar_municipios_brasil.py --todos --paralelas 5

Diretórios:
  - Municípios com key única usam data/extracted/<key>/.
  - Keys ambíguas no manifesto IBGE usam data/extracted/<key>_<uf>/ para evitar
    sobrescrita entre municípios homônimos (ex.: palmas_to e palmas_pr).
"""
import argparse
import csv
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    from .sprint2_keys import duplicate_keys, municipio_storage_key
except ImportError:
    from sprint2_keys import duplicate_keys, municipio_storage_key

ROOT = Path(__file__).resolve().parents[1]
PYTHON = str(ROOT / ".venv" / "bin" / "python3")
LOG_DIR = ROOT / "_logs" / "coleta_brasil"
LOG_DIR.mkdir(parents=True, exist_ok=True)

IBGE_CSV = ROOT / "data" / "manifests" / "ibge_municipios_completo.csv"

_ANOS_CONVENIOS = sum([["--ano", str(a)] for a in range(2024, 2027)], [])
_ANOS_FNS      = sum([["--ano", str(a)] for a in range(2024, 2027)], [])

FONTES_FEDERAIS = [
    # (script, label, args_extras)
    # --ano aceita action="append": precisa de --ano 2024 --ano 2025 --ano 2026
    ("baixar_transferencias_federais.py", "Convênios Portal Transparência", _ANOS_CONVENIOS),
    ("baixar_emendas_federais.py", "Emendas Parlamentares Federais",
     ["--anos", "2014", "2026"]),
    ("baixar_fns_repasses.py", "Repasses FNS", _ANOS_FNS),
]

LOG_FILE: Path
PASS = FAIL = SKIP = 0


def log(msg: str) -> None:
    line = f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def carregar_municipios(ibge_csv: Path) -> list[dict]:
    with ibge_csv.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def filtrar(municipios: list[dict], ufs: list[str], ibges: list[str]) -> list[dict]:
    if ibges:
        return [m for m in municipios if m["ibge"] in set(ibges)]
    if ufs:
        return [m for m in municipios if m["uf"] in set(ufs)]
    return municipios


def criar_dirs(municipio_key: str) -> None:
    areas = [
        "transferencias_federais", "emendas_federais", "fns",
        "saude", "educacao", "receita", "executivo", "fiscal",
    ]
    for area in areas:
        (ROOT / "data" / "raw" / municipio_key / area).mkdir(parents=True, exist_ok=True)
        (ROOT / "data" / "extracted" / municipio_key / area / "saida").mkdir(parents=True, exist_ok=True)


def rodar_fonte(script: str, label: str, args: list[str], env: dict) -> bool:
    global PASS, FAIL
    cmd = [PYTHON, f"pipelines/{script}"] + args
    t0 = time.time()
    try:
        r = subprocess.run(cmd, env=env, cwd=str(ROOT), capture_output=True, text=True, timeout=7200)
        elapsed = time.time() - t0
        if r.returncode == 0:
            PASS += 1
            log(f"    ✓ {label} ({elapsed:.0f}s)")
            return True
        else:
            FAIL += 1
            stderr_tail = (r.stderr or "")[-300:]
            log(f"    ✗ {label} ({elapsed:.0f}s) exit={r.returncode}")
            if stderr_tail:
                log(f"    stderr: {stderr_tail}")
            return False
    except subprocess.TimeoutExpired:
        FAIL += 1
        log(f"    ✗ {label} TIMEOUT (>7200s)")
        return False


def coletar_municipio(m: dict, duplicated_keys: set[str] | None = None) -> bool:
    global PASS, FAIL, SKIP
    PASS = FAIL = SKIP = 0

    duplicated_keys = duplicated_keys or set()
    manifest_key = m["key"]
    key = municipio_storage_key(m, duplicated_keys)
    nome = m["nome"]
    ibge = m["ibge"]
    uf = m["uf"]

    log(f"\n{'='*55}")
    log(f"COLETANDO: {nome} — {uf} (IBGE {ibge}, key={key})")
    if key != manifest_key:
        log(f"CHAVE CANÔNICA: {manifest_key} é ambígua; usando {key}")
    log(f"{'='*55}")

    env = {
        **os.environ,
        "MUNICIPIO": key,
        "MUNICIPIO_IBGE": ibge,
        "MUNICIPIO_NOME": nome,
        "MUNICIPIO_UF": uf,
    }

    criar_dirs(key)

    for script, label, args in FONTES_FEDERAIS:
        rodar_fonte(script, f"{key}/{label}", args, env)

    log(f"  {key.upper()} — OK={PASS} FAIL={FAIL} SKIP={SKIP}")
    return FAIL == 0


def main() -> None:
    global LOG_FILE

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    LOG_FILE = LOG_DIR / f"coleta_brasil_{timestamp}.log"

    parser = argparse.ArgumentParser(description="Coleta fontes federais para municípios brasileiros.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--todos", action="store_true", help="Todos os 5571 municípios")
    group.add_argument("--uf", action="append", metavar="UF", dest="ufs",
                       help="Filtrar por UF (pode repetir: --uf SP --uf RJ)")
    group.add_argument("--ibge", action="append", metavar="IBGE", dest="ibges",
                       help="Municípios específicos por código IBGE (pode repetir)")
    parser.add_argument("--listar", action="store_true", help="Listar municípios selecionados sem coletar")
    parser.add_argument("--paralelas", type=int, default=1,
                        help="Municípios simultâneos (padrão: 1, usar com cuidado pela API rate limit)")
    args = parser.parse_args()

    if not IBGE_CSV.exists():
        print(f"ERRO: {IBGE_CSV} não encontrado.\n"
              "Gere com: .venv/bin/python3 -c \"import pipelines.gerar_ibge_csv\"")
        sys.exit(1)

    todos = carregar_municipios(IBGE_CSV)
    duplicated_keys = duplicate_keys(todos)
    ufs = args.ufs or []
    ibges = args.ibges or []
    alvos = filtrar(todos, ufs, ibges) if (ufs or ibges) else todos

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

    falhas_totais = 0
    for i, m in enumerate(alvos):
        ok = coletar_municipio(m, duplicated_keys)
        if not ok:
            falhas_totais += 1
        if i < len(alvos) - 1:
            time.sleep(2)  # pausa entre municípios (respeitar rate limit API)

    log(f"\nFim: {datetime.now(timezone.utc).isoformat()}")
    log(f"Log: {LOG_FILE}")
    if falhas_totais:
        log(f"ATENÇÃO: {falhas_totais} município(s) com falha(s)")
        sys.exit(1)
    else:
        log("Todos os municípios coletados com sucesso.")


if __name__ == "__main__":
    main()
