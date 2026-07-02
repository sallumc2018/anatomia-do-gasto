"""
Orquestrador bulk Sprint 2 — publica fontes federais coletadas para qualquer
conjunto de municípios brasileiros sem precisar registrá-los em paths.py.

Áreas publicadas (fontes API federal):
  - transferencias_federais   (Portal Transparência /convenios)
  - emendas_federais          (Portal Transparência /emendas)
  - fns                       (FNS repasses fundo-a-fundo)

Fluxo: data/extracted/<key>/<area>/saida/*.csv → data/public/<key>/<area>/saida/

Gate de integridade (por arquivo):
  - Rejeita arquivo vazio, com menos de 2 linhas ou com conteúdo HTML/XML.
  - Verifica colunas mínimas obrigatórias no header (por área).
  - Copia atomicamente via arquivo temporário + Path.replace.
  - Gera manifesto JSON em data/manifests/sprint2/ com SHA-256, tamanho,
    linhas, fonte e instante.

Uso:
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --todos
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --uf RO --uf TO
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --ibge 3518800
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --uf SP --listar
  .venv/bin/python3 pipelines/publicar_municipios_brasil.py --uf AC --area fns
"""
import argparse
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from .sprint2_contracts import (
        AREA_CONTRACTS,
        atomic_copy_verified,
        sha256_file,
        validate_csv,
    )
except ImportError:
    from sprint2_contracts import (
        AREA_CONTRACTS,
        atomic_copy_verified,
        sha256_file,
        validate_csv,
    )

ROOT      = Path(__file__).resolve().parents[1]
LOG_DIR   = ROOT / "_logs" / "publicar_brasil"
LOG_DIR.mkdir(parents=True, exist_ok=True)

IBGE_CSV  = ROOT / "data" / "manifests" / "ibge_municipios_completo.csv"
EXTRACTED = ROOT / "data" / "extracted"
PUBLIC    = ROOT / "data" / "public"
MANIFESTS = ROOT / "data" / "manifests" / "sprint2"

AREAS_SPRINT2 = ["transferencias_federais", "emendas_federais", "fns"]

# Contrato mínimo de colunas por área.
# Pelo menos UMA opção de cada grupo deve aparecer no header (case-insensitive).
SCHEMA = AREA_CONTRACTS

LOG_FILE: Path
COPIADOS = IGNORADOS = MUNICIPIOS_OK = MUNICIPIOS_SEM_DADOS = REJEITADOS = 0


def log(msg: str) -> None:
    line = f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def sha256_arquivo(path: Path) -> str:
    return sha256_file(path)


def validar_csv(path: Path, area: str, ibge_esperado: str = "") -> tuple[bool, str, int]:
    """Retorna (valido, motivo_rejeicao, num_linhas_dados)."""
    result = validate_csv(path, area, ibge_esperado)
    return result.valid, result.reason, result.data_rows


def copiar_atomicamente(src: Path, dst: Path) -> str:
    """Copia src → dst via arquivo temporário; promoção atômica no mesmo filesystem."""
    return atomic_copy_verified(src, dst)


def salvar_manifesto(key: str, area: str, entradas: list[dict]) -> None:
    manifest_dir = MANIFESTS / key
    manifest_dir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "municipio_key": key,
        "area": area,
        "publicado_em": datetime.now(timezone.utc).isoformat(),
        "arquivos": entradas,
    }
    (manifest_dir / f"{area}.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )


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
    """Retorna True se nenhum arquivo foi rejeitado pelo gate de integridade."""
    global COPIADOS, IGNORADOS, MUNICIPIOS_OK, MUNICIPIOS_SEM_DADOS, REJEITADOS

    key  = m["key"]
    nome = m["nome"]
    uf   = m["uf"]
    ibge = m.get("ibge", "")

    extraidos = EXTRACTED / key
    if not extraidos.exists():
        MUNICIPIOS_SEM_DADOS += 1
        return True

    arquivos_encontrados = 0
    houve_rejeicao = False

    for area in areas:
        origem = extraidos / area / "saida"
        if not origem.exists():
            continue
        csvs = sorted(origem.glob("*.csv"))
        if not csvs:
            continue

        destino = PUBLIC / key / area / "saida"
        entradas_manifesto: list[dict] = []

        for src in csvs:
            arquivos_encontrados += 1

            if dry_run:
                log(f"  [DRY] {key}/{area}/saida/{src.name}")
                COPIADOS += 1
                continue

            # Arquivos de inventário/índice não têm coluna de município — pulam o gate
            if src.name.startswith("inventario_"):
                dst = destino / src.name
                if not (dst.exists() and src.stat().st_mtime <= dst.stat().st_mtime):
                    copiar_atomicamente(src, dst)
                    log(f"  ✓ {key}/{area}/saida/{src.name} (inventário, sem gate)")
                    COPIADOS += 1
                else:
                    IGNORADOS += 1
                continue

            # Gate de integridade
            valido, motivo, n_linhas = validar_csv(src, area, ibge)
            if not valido:
                log(f"  ✗ REJEITADO {key}/{area}/saida/{src.name} — {motivo}")
                REJEITADOS += 1
                houve_rejeicao = True
                continue

            dst = destino / src.name
            if dst.exists() and src.stat().st_mtime <= dst.stat().st_mtime:
                IGNORADOS += 1
                continue

            digest = copiar_atomicamente(src, dst)
            log(f"  ✓ {key}/{area}/saida/{src.name} ({n_linhas} linhas, sha256={digest[:12]}…)")
            COPIADOS += 1
            entradas_manifesto.append({
                "arquivo": src.name,
                "municipio_key": key,
                "municipio_ibge": ibge,
                "area": area,
                "linhas_dados": n_linhas,
                "tamanho_bytes": dst.stat().st_size,
                "sha256": digest,
                "publicado_em": datetime.now(timezone.utc).isoformat(),
            })

        if entradas_manifesto:
            salvar_manifesto(key, area, entradas_manifesto)

    if arquivos_encontrados > 0:
        MUNICIPIOS_OK += 1
        log(f"  {nome}/{uf} — {arquivos_encontrados} arquivo(s) avaliado(s)")
    else:
        MUNICIPIOS_SEM_DADOS += 1

    return not houve_rejeicao


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

    log("=== Publicação Sprint 2 iniciada ===")
    log(f"Municípios selecionados: {len(alvos)}")
    log(f"Áreas: {', '.join(areas)}")
    log(f"Log: {LOG_FILE}")

    falhas_municipio = 0
    for m in alvos:
        if not publicar_municipio(m, areas, dry_run=False):
            falhas_municipio += 1

    log("\n=== Publicação concluída ===")
    log(f"Municípios com dados:     {MUNICIPIOS_OK}")
    log(f"Sem dados coletados:      {MUNICIPIOS_SEM_DADOS}")
    log(f"Arquivos copiados:        {COPIADOS}")
    log(f"Rejeitados (gate):        {REJEITADOS}")
    log(f"Já publicados (skip):     {IGNORADOS}")

    if COPIADOS == 0 and MUNICIPIOS_OK == 0:
        log("Nenhum dado coletado encontrado. Rode coletar_municipios_brasil.py primeiro.")

    if REJEITADOS > 0 or falhas_municipio > 0:
        log(f"ATENÇÃO: {REJEITADOS} arquivo(s) rejeitado(s) pelo gate de integridade.")
        sys.exit(1)


if __name__ == "__main__":
    main()
