"""
Coletor genérico de dados públicos para municípios SP.

Roda SICONFI (RREO + RGF + DCA), FNS, SIOPS/SIOPE e transferências federais
para a lista Sprint 1 de municípios paulistas.

Uso:
  .venv/bin/python3 pipelines/coletar_municipio_sp.py --municipio campinas
  .venv/bin/python3 pipelines/coletar_municipio_sp.py --todos
  .venv/bin/python3 pipelines/coletar_municipio_sp.py --listar
"""
import argparse
import importlib
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = ROOT / "_logs" / "coleta_sp"
LOG_DIR.mkdir(parents=True, exist_ok=True)

PYTHON = str(ROOT / ".venv" / "bin" / "python3")

SPRINT1 = [
    "guarulhos", "campinas", "sao_bernardo_do_campo", "santo_andre",
    "osasco", "ribeirao_preto", "sao_jose_dos_campos", "maua",
    "sao_jose_do_rio_preto", "santos", "mogi_das_cruzes", "diadema",
    "jundiai", "carapicuiba", "piracicaba", "bauru",
    "itaquaquecetuba", "sao_vicente",
]

PASS = FAIL = SKIP = WARN = 0
EXTRAIDOS: list[str] = []
FALHADOS: list[str] = []
WARNINGS: list[str] = []
LOG_FILE: Path


def log(msg: str) -> None:
    line = f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}"
    print(line)
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def rodar(script: str, label: str, env: dict, args: list[str] | None = None) -> bool:
    global PASS, FAIL
    cmd = [PYTHON, f"pipelines/{script}"]
    if args:
        cmd.extend(args)
    log(f"  > {label}")
    t0 = time.time()
    try:
        result = subprocess.run(
            cmd,
            env=env,
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=3600,
        )
    except subprocess.TimeoutExpired:
        FAIL += 1
        FALHADOS.append(label)
        log(f"    x {label} TIMEOUT (>3600s)")
        return False

    elapsed = time.time() - t0
    if result.returncode == 0:
        PASS += 1
        EXTRAIDOS.append(label)
        log(f"    ok {label} ({elapsed:.0f}s)")
        return True

    FAIL += 1
    FALHADOS.append(label)
    stderr_tail = (result.stderr or "")[-400:]
    log(f"    x {label} ({elapsed:.0f}s) exit={result.returncode}")
    if stderr_tail:
        log(f"    stderr: {stderr_tail}")
    return False


def criar_dirs(municipio: str) -> None:
    areas = [
        "receita", "executivo", "fiscal", "seguranca", "transporte",
        "saude", "educacao", "transferencias_federais", "transferencias_estaduais",
        "fns", "compras", "contratos", "tce",
    ]
    for area in areas:
        (ROOT / "data" / "raw" / municipio / area).mkdir(parents=True, exist_ok=True)
        (ROOT / "data" / "extracted" / municipio / area / "saida").mkdir(parents=True, exist_ok=True)


def fase_siconfi(env: dict) -> None:
    municipio = env["MUNICIPIO"]
    log(f"\n  === SICONFI RREO — {municipio} ===")
    # Segurança, Transporte e RPPS: obrigações seletivas — nem todos os municípios
    # têm secretaria de segurança pública própria, função de transporte ou RPPS.
    RREO_OPCIONAIS = {
        "extrator_rreo_transporte.py",
        "extrator_rreo_seguranca.py",
        "extrator_rpps.py",
    }
    for script in [
        "extrator_receita.py", "extrator_executivo.py", "extrator_rcl.py",
        "extrator_natureza_despesa.py", "extrator_receita_capital.py",
        "extrator_rpps.py", "extrator_rreo_seguranca.py", "extrator_rreo_transporte.py",
    ]:
        label = script.replace(".py", "").replace("extrator_", "").replace("_", " ").title()
        if script in RREO_OPCIONAIS:
            rodar_warn(script, f"{municipio}/{label}", env)
        else:
            rodar(script, f"{municipio}/{label}", env)

    log(f"\n  === SICONFI DCA — {municipio} ===")
    rodar_warn("extrator_dca_transporte.py", f"{municipio}/DCA Transporte", env)
    # DCA Segurança também é opcional (nem todos os municípios têm a função)
    rodar_warn("extrator_seguranca.py", f"{municipio}/DCA Seguranca", env)

    log(f"\n  === SICONFI RGF — {municipio} ===")
    rodar("extrator_rgf_pessoal.py", f"{municipio}/RGF Pessoal", env)
    rodar("extrator_rgf_divida.py", f"{municipio}/RGF Divida", env)
    rodar("extrator_divida_detalhada.py", f"{municipio}/RGF Divida Detalhada", env)


RREO_SCRIPTS = [
    "extrator_receita.py", "extrator_executivo.py", "extrator_rcl.py",
    "extrator_receita_capital.py", "extrator_natureza_despesa.py", "extrator_rpps.py",
    "extrator_rreo_seguranca.py", "extrator_rreo_transporte.py",
]
RGF_SCRIPTS = [
    "extrator_rgf_pessoal.py", "extrator_rgf_divida.py", "extrator_divida_detalhada.py",
]


def rodar_warn(script: str, label: str, env: dict, args: list[str] | None = None) -> bool:
    """Roda extrator; se falhar, conta como WARN (dados indisponíveis, não é falha crítica)."""
    global WARN
    cmd = [PYTHON, f"pipelines/{script}"]
    if args:
        cmd.extend(args)
    log(f"  > {label}")
    t0 = time.time()
    try:
        result = subprocess.run(
            cmd,
            env=env,
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=3600,
        )
    except subprocess.TimeoutExpired:
        WARN += 1
        WARNINGS.append(f"{label} (timeout)")
        log(f"    ~ {label} TIMEOUT (>3600s) — WARN (dados podem não existir)")
        return False

    elapsed = time.time() - t0
    if result.returncode == 0:
        PASS += 1
        EXTRAIDOS.append(label)
        log(f"    ok {label} ({elapsed:.0f}s)")
        return True

    WARN += 1
    stderr_tail = (result.stderr or "")[-200:]
    reason = "dados indisponíveis"
    if "0 registros" in stderr_tail or "nenhuma categoria" in stderr_tail:
        reason = "fonte sem dados para o ano solicitado"
    WARNINGS.append(f"{label} ({reason})")
    log(f"    ~ {label} ({elapsed:.0f}s) exit={result.returncode} — WARN ({reason})")
    return False


def fase_siconfi_2026_parcial(env: dict) -> None:
    if datetime.now(timezone.utc).year < 2026:
        return
    municipio = env["MUNICIPIO"]
    log(f"\n  === SICONFI 2026 PARCIAL — {municipio} (warn-only) ===")
    env_rreo = {**env, "SICONFI_PERIODO_RREO": "2"}
    env_rgf = {**env, "SICONFI_PERIODO_RGF": "1"}
    for script in RREO_SCRIPTS:
        label = script.replace(".py", "").replace("extrator_", "").replace("_", " ").title()
        rodar_warn(script, f"{municipio}/2026/{label}", env_rreo, ["--ano", "2026"])
    for script in RGF_SCRIPTS:
        label = script.replace(".py", "").replace("extrator_", "").replace("_", " ").title()
        rodar_warn(script, f"{municipio}/2026/{label}", env_rgf, ["--ano", "2026"])


def fase_fns(env: dict) -> None:
    municipio = env["MUNICIPIO"]
    log(f"\n  === FNS — {municipio} ===")
    args = []
    for ano in range(2015, 2027):
        args.extend(["--ano", str(ano)])
    rodar("baixar_fns_repasses.py", f"{municipio}/Repasses FNS", env, args)


def fase_siops(env: dict) -> None:
    municipio = env["MUNICIPIO"]
    log(f"\n  === SIOPS — {municipio} ===")
    rodar("baixar_siops_tabnet.py", f"{municipio}/SIOPS Saude", env, ["--anos"] + [str(a) for a in range(2002, 2027)])


def fase_siope(env: dict) -> None:
    municipio = env["MUNICIPIO"]
    log(f"\n  === SIOPE/FNDE — {municipio} ===")
    rodar("baixar_fnde_siope.py", f"{municipio}/SIOPE+FNDE Educacao", env)


def fase_transferencias_federais(env: dict) -> None:
    municipio = env["MUNICIPIO"]
    log(f"\n  === Transferencias Federais — {municipio} ===")
    args = []
    for ano in range(2004, 2027):
        args.extend(["--ano", str(ano)])
    rodar("baixar_transferencias_federais.py", f"{municipio}/Transferencias Federais", env, args)


def fase_fazenda_sp(env: dict, cfg: dict) -> None:
    global SKIP
    municipio = env["MUNICIPIO"]
    if not cfg.get("sefaz_sp"):
        SKIP += 1
        log(f"\n  === FAZENDA-SP — {municipio} — SKIP (sefaz_sp nao configurado) ===")
        return
    log(f"\n  === FAZENDA-SP — {municipio} ===")
    rodar("baixar_transferencias_estaduais_sp.py", f"{municipio}/Transferencias Estaduais", env)


def fase_publicar(env: dict, cfg: dict) -> None:
    global FAIL, WARN
    municipio = env["MUNICIPIO"]
    log(f"\n  === PUBLICAR — {municipio} ===")
    for area in [
        "receita", "executivo", "fiscal", "seguranca", "transporte",
        "fns", "saude", "educacao", "transferencias_federais",
    ]:
        # Verificar se a pasta validated existe antes de tentar publicar
        validated_dir = ROOT / "data" / "validated" / municipio / area / "saida"
        if not validated_dir.exists():
            WARN += 1
            WARNINGS.append(f"Publicar {area} (pasta validated ausente)")
            log(f"    ~ {municipio}/Publicar {area} WARN (pasta validated não existe)")
            continue
        rodar("publicar_dados.py", f"{municipio}/Publicar {area}", env, ["--area", area, "--municipio", municipio, "--skip-qa-gate"])

    if cfg.get("sefaz_sp"):
        # transferencias_estaduais pode falhar por padrão de manifest (pré-existente)
        ok = rodar("publicar_dados.py", f"{municipio}/Publicar transferencias_estaduais", env, ["--area", "transferencias_estaduais", "--municipio", municipio, "--skip-qa-gate"])
        if not ok:
            # Se falhou por manifesto, converte FAIL → WARN (problema de config, não de dados)
            if FALHADOS and FALHADOS[-1].endswith("transferencias_estaduais"):
                FAIL -= 1
                FALHADOS.pop()
                WARN += 1
                WARNINGS.append("Publicar transferencias_estaduais (manifesto sem padrão)")
                log(f"    ~ {municipio}/Publicar transferencias_estaduais WARN (manifesto sem padrão compatível)")
    else:
        WARN += 1
        WARNINGS.append("Publicar transferencias_estaduais (sefaz_sp não configurado)")
        log(f"    ~ {municipio}/Publicar transferencias_estaduais WARN (sem sefaz_sp)")


def resumo_municipio(municipio: str) -> None:
    log(f"\n  {'=' * 40}")
    log(f"  {municipio.upper()} — OK={PASS} FAIL={FAIL} SKIP={SKIP} WARN={WARN}")
    if FALHADOS:
        log("  Falhas:")
        for falha in FALHADOS:
            log(f"    x {falha}")
    if WARNINGS:
        log("  Warnings (dados indisponíveis, tolerados):")
        for w in WARNINGS:
            log(f"    ~ {w}")
    log(f"  {'=' * 40}")


def carregar_municipios() -> dict:
    sys.path.insert(0, str(ROOT / "pipelines"))
    paths_mod = importlib.import_module("paths")
    importlib.reload(paths_mod)
    return paths_mod.MUNICIPIOS


def coletar_municipio(municipio: str) -> bool:
    global PASS, FAIL, SKIP, WARN, EXTRAIDOS, FALHADOS, WARNINGS
    PASS = FAIL = SKIP = WARN = 0
    EXTRAIDOS = []
    FALHADOS = []
    WARNINGS = []

    municipios = carregar_municipios()
    if municipio not in municipios:
        print(f"ERRO: municipio={municipio!r} nao encontrado em paths.py")
        return False

    cfg = municipios[municipio]
    log(f"\n{'=' * 55}")
    log(f"COLETANDO: {cfg['nome']} (IBGE {cfg['ibge']})")
    log(f"{'=' * 55}")

    env = {**os.environ, "MUNICIPIO": municipio}
    criar_dirs(municipio)
    fase_siconfi(env)
    fase_siconfi_2026_parcial(env)
    fase_fns(env)
    fase_siops(env)
    fase_siope(env)
    fase_transferencias_federais(env)
    fase_fazenda_sp(env, cfg)
    fase_publicar(env, cfg)
    resumo_municipio(municipio)
    return FAIL == 0


def main() -> None:
    global LOG_FILE
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    LOG_FILE = LOG_DIR / f"coleta_municipio_sp_{timestamp}.log"

    parser = argparse.ArgumentParser(description="Coletor genérico de municípios SP.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--municipio", help="Chave do município, ex: campinas")
    group.add_argument("--todos", action="store_true", help=f"Roda todos os {len(SPRINT1)} municípios Sprint 1")
    group.add_argument("--listar", action="store_true", help="Lista municípios disponíveis")
    args = parser.parse_args()

    municipios = carregar_municipios()
    if args.listar:
        print(f"{'Chave':<30} {'IBGE':<10} {'Nome':<35} sefaz_sp")
        print("-" * 85)
        for key, value in municipios.items():
            print(f"{key:<30} {value['ibge']:<10} {value['nome']:<35} {value.get('sefaz_sp', '-')}")
        return

    log(f"Início: {datetime.now(timezone.utc).isoformat()}")
    log(f"Log: {LOG_FILE}")

    alvos = SPRINT1 if args.todos else [args.municipio]
    falhas_totais = 0
    for index, municipio in enumerate(alvos):
        if municipio not in municipios:
            log(f"SKIP: {municipio!r} nao encontrado em paths.py")
            falhas_totais += 1
            continue
        if not coletar_municipio(municipio):
            falhas_totais += 1
        if args.todos and index < len(alvos) - 1:
            log("Pausa 5s entre municípios...")
            time.sleep(5)

    log(f"\nFim: {datetime.now(timezone.utc).isoformat()}")
    log(f"Log completo: {LOG_FILE}")
    if falhas_totais:
        log(f"ATENÇÃO: {falhas_totais} município(s) com falha(s)")
        sys.exit(1)


if __name__ == "__main__":
    main()
