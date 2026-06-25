"""
Orquestrador bulk Sprint 2 — publica fontes federais coletadas para qualquer
conjunto de municípios brasileiros sem precisar registrá-los em paths.py.

Áreas publicadas (fontes API federal, sem gate QA — integridade garantida pela
fonte, idêntico ao tratamento de segurança/transporte no publicar_dados.py):
  - transferencias_federais   (Portal Transparência /convenios)
  - emendas_federais          (Portal Transparência /emendas)
  - fns                       (FNS repasses fundo-a-fundo)

Fluxo: data/extracted/<key>/<area>/saida/*.csv → data/public/<key>/<area>/saida/

Uso:
  # Todos os municípios com dados coletados
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --todos

  # Filtrar por UF
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --uf RO --uf TO

  # Municípios específicos por IBGE
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --ibge 3518800

  # Modo dry-run (listar o que seria publicado sem copiar)
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --uf SP --listar

  # Publicar áreas específicas
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --uf AC --area fns
"""
import argparse
import csv
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = ROOT / "_logs" / "publicar_brasil"
LOG_DIR.mkdir(parents=True, exist_ok=True)

IBGE_CSV = ROOT / "data" / "manifests" / "ibge_municipios_completo.csv"
EXTRACTED = ROOT / "data" / "extracted"
PUBLIC    = ROOT / "data" / "public"

AREAS_SPRINT2 = ["transferencias_federais", "emendas_federais", "fns"]

LOG_FILE: Path
COPIADOS = IGNORADOS = MUNICIPIOS_OK = MUNICIPIOS_SEM_DADOS = 0


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


def publicar_municipio(m: dict, areas: list[str], dry_run: bool) -> bool:
    global COPIADOS, IGNORADOS, MUNICIPIOS_OK, MUNICIPIOS_SEM_DADOS

    key  = m["key"]
    nome = m["nome"]
    uf   = m["uf"]

    extraidos = EXTRACTED / key
    if not extraidos.exists():
        MUNICIPIOS_SEM_DADOS += 1
        return True  # sem dados coletados — silencioso (esperado para municípios não processados ainda)

    arquivos_encontrados = 0
    for area in areas:
        origem = extraidos / area / "saida"
        if not origem.exists():
            continue
        csvs = sorted(origem.glob("*.csv"))
        if not csvs:
            continue

        destino = PUBLIC / key / area / "saida"
        if not dry_run:
            destino.mkdir(parents=True, exist_ok=True)

        for src in csvs:
            arquivos_encontrados += 1
            dst = destino / src.name
            if dry_run:
                log(f"  [DRY] {key}/{area}/saida/{src.name}")
                COPIADOS += 1
            elif not dst.exists() or src.stat().st_mtime > dst.stat().st_mtime:
                shutil.copy2(src, dst)
                log(f"  ✓ {key}/{area}/saida/{src.name}")
                COPIADOS += 1
            else:
                IGNORADOS += 1  # arquivo já publicado e sem mudança

    if arquivos_encontrados > 0:
        MUNICIPIOS_OK += 1
        log(f"  {nome}/{uf} — {arquivos_encontrados} arquivo(s) processado(s)")
    else:
        MUNICIPIOS_SEM_DADOS += 1

    return True


def main() -> None:
    global LOG_FILE

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    LOG_FILE = LOG_DIR / f"publicar_brasil_{timestamp}.log"

    parser = argparse.ArgumentParser(
        description="Publica fontes federais Sprint 2 para municípios brasileiros."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--todos",  action="store_true", help="Todos os municípios com dados coletados")
    group.add_argument("--uf",     action="append", metavar="UF", dest="ufs",
                       help="Filtrar por UF (pode repetir: --uf RO --uf TO)")
    group.add_argument("--ibge",   action="append", metavar="IBGE", dest="ibges",
                       help="Municípios específicos por código IBGE (pode repetir)")
    parser.add_argument("--area",  action="append", dest="areas", metavar="AREA",
                        choices=AREAS_SPRINT2,
                        help=f"Áreas a publicar (padrão: todas). Escolha: {', '.join(AREAS_SPRINT2)}")
    parser.add_argument("--listar", action="store_true",
                        help="Listar o que seria publicado sem copiar (dry-run)")
    args = parser.parse_args()

    if not IBGE_CSV.exists():
        print(f"ERRO: {IBGE_CSV} não encontrado.")
        sys.exit(1)

    todos = carregar_municipios(IBGE_CSV)
    ufs   = args.ufs   or []
    ibges = args.ibges or []
    areas = args.areas or AREAS_SPRINT2
    alvos = filtrar(todos, ufs, ibges) if (ufs or ibges) else todos

    if args.listar:
        print(f"\n{'IBGE':<10} {'UF':<4} {'Nome':<40} {'Áreas com dados'}")
        print("-" * 70)
        count = 0
        for m in alvos:
            key = m["key"]
            areas_com_dados = [
                a for a in areas
                if (EXTRACTED / key / a / "saida").exists()
                and any((EXTRACTED / key / a / "saida").glob("*.csv"))
            ]
            if areas_com_dados:
                print(f"{m['ibge']:<10} {m['uf']:<4} {m['nome']:<40} {', '.join(areas_com_dados)}")
                count += 1
        print(f"\nTotal com dados: {count}/{len(alvos)}")
        return

    log(f"=== Publicação Sprint 2 iniciada ===")
    log(f"Municípios selecionados: {len(alvos)}")
    log(f"Áreas: {', '.join(areas)}")
    log(f"Log: {LOG_FILE}")

    for m in alvos:
        publicar_municipio(m, areas, dry_run=False)

    log(f"\n=== Publicação concluída ===")
    log(f"Municípios com dados: {MUNICIPIOS_OK}")
    log(f"Sem dados coletados:  {MUNICIPIOS_SEM_DADOS}")
    log(f"Arquivos copiados:    {COPIADOS}")
    log(f"Já publicados (skip): {IGNORADOS}")

    if COPIADOS == 0 and MUNICIPIOS_OK == 0:
        log("Nenhum dado coletado encontrado. Rode coletar_municipios_brasil.py primeiro.")


if __name__ == "__main__":
    main()
