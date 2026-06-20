"""
Script mestre de coleta — São Paulo (IBGE 3550308)
Roda todos os extratores, publica e sincroniza com GDrive.
Uso:  .venv/bin/python3 pipelines/coletar_sao_paulo.py
"""
import os
import subprocess
import sys
import time
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = ROOT / "_logs" / "coleta_sp"
LOG_DIR.mkdir(parents=True, exist_ok=True)
TIMESTAMP = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
LOG_FILE = LOG_DIR / f"coleta_sp_{TIMESTAMP}.log"

PYTHON = str(ROOT / ".venv" / "bin" / "python3")
ENV = {**os.environ, "MUNICIPIO": "sao_paulo"}

PASS = FAIL = SKIP = 0
EXTRAIDOS = []
FALHADOS = []


def log(msg: str):
    line = f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def rodar(script: str, label: str, args: list[str] | None = None) -> bool:
    global PASS, FAIL
    cmd = [PYTHON, f"pipelines/{script}"]
    if args:
        cmd.extend(args)
    log(f"▶ {label}")
    t0 = time.time()
    try:
        r = subprocess.run(cmd, env=ENV, cwd=str(ROOT), capture_output=True, text=True, timeout=3600)
        elapsed = time.time() - t0
        if r.returncode == 0:
            PASS += 1
            EXTRAIDOS.append(label)
            log(f"  ✓ {label} ({elapsed:.0f}s)")
        else:
            FAIL += 1
            FALHADOS.append(label)
            stderr_tail = (r.stderr or "")[-400:]
            log(f"  ✗ {label} ({elapsed:.0f}s) exit={r.returncode}")
            if stderr_tail:
                log(f"  stderr: {stderr_tail}")
        return r.returncode == 0
    except subprocess.TimeoutExpired:
        FAIL += 1
        FALHADOS.append(label)
        log(f"  ✗ {label} TIMEOUT (>3600s)")
        return False


def rodar_rclone(origem: str, destino: str, label: str) -> bool:
    log(f"▶ Sincronizando {label}")
    t0 = time.time()
    try:
        r = subprocess.run(
            ["rclone", "copy", origem, destino, "--verbose"],
            capture_output=True, text=True, timeout=600,
        )
        elapsed = time.time() - t0
        if r.returncode == 0:
            log(f"  ✓ {label} ({elapsed:.0f}s)")
            return True
        else:
            log(f"  ✗ {label} ({elapsed:.0f}s) exit={r.returncode}")
            log(f"  stderr: {(r.stderr or '')[-400:]}")
            return False
    except subprocess.TimeoutExpired:
        log(f"  ✗ {label} TIMEOUT (>600s)")
        return False


def criar_dirs():
    areas = [
        "receita", "executivo", "fiscal", "seguranca", "transporte",
        "saude", "educacao", "transferencias_federais", "transferencias_estaduais",
        "fns", "compras", "contratos", "tce",
    ]
    for area in areas:
        (ROOT / "data" / "raw" / "sao_paulo" / area).mkdir(parents=True, exist_ok=True)
        (ROOT / "data" / "extracted" / "sao_paulo" / area / "saida").mkdir(parents=True, exist_ok=True)


def fase_siconfi():
    log("\n═══════════ FASE 1: SICONFI (RREO) ═══════════")
    for s in ["extrator_receita.py", "extrator_executivo.py", "extrator_rcl.py",
              "extrator_natureza_despesa.py", "extrator_receita_capital.py",
              "extrator_rpps.py", "extrator_rreo_seguranca.py", "extrator_rreo_transporte.py"]:
        rodar(s, s.replace(".py", "").replace("extrator_", "").replace("_", " ").title())

    log("\n═══════════ FASE 2: SICONFI (DCA) ═══════════")
    rodar("gerar_dca_siconfi.py", "DCA Geral")
    rodar("extrator_dca_transporte.py", "DCA Transporte")
    rodar("extrator_seguranca.py", "DCA Seguranca")

    log("\n═══════════ FASE 3: SICONFI (RGF) ═══════════")
    rodar("extrator_rgf_pessoal.py", "RGF Pessoal")
    rodar("extrator_rgf_divida.py", "RGF Divida")
    rodar("extrator_divida_detalhada.py", "RGF Divida Detalhada")


def fase_fns():
    log("\n═══════════ FASE 4: FNS ═══════════")
    rodar("baixar_fns_repasses.py", "Repasses FNS", ["--ano", "2020", "--ano", "2021", "--ano", "2022", "--ano", "2023", "--ano", "2024", "--ano", "2025", "--ano", "2026"])


def fase_fazenda_sp():
    log("\n═══════════ FASE 5: FAZENDA-SP ═══════════")
    rodar("baixar_transferencias_estaduais_sp.py", "Transferencias Estaduais")


def fase_ckan():
    log("\n═══════════ FASE 6: CKAN SP (Contratos históricos) ═══════════")
    rodar("baixar_ckan_sp_contratos.py", "CKAN Contratos SP 2016-2024")


def fase_tce():
    log("\n═══════════ FASE 7: TCE-SP ═══════════")
    for ano in range(2020, 2026):
        for mes in range(1, 13):
            rodar("baixar_tce_sorocaba.py", f"TCE {ano}/{mes:02d}",
                  ["--ano", str(ano), "--mes", str(mes), "--amostra-transparencia"])
    rodar("extrator_tce_transparencia.py", "Extrator TCE", ["--dataset", "ambos"])


def publicar():
    log("\n═══════════ FASE 7: PUBLICAR ═══════════")
    for area in ["receita", "executivo", "fiscal", "seguranca", "transporte", "transferencias_estaduais"]:
        rodar("publicar_dados.py", f"Publicar {area}",
              ["--area", area, "--municipio", "sao_paulo", "--skip-qa-gate"])
    rodar("gerar_qa_manifest.py", "QA Manifest", ["--municipio", "sao_paulo"])
    rodar("gerar_datasets_json.py", "Datasets JSON")


def gdrive_sync():
    log("\n═══════════ FASE 8: GDRIVE SYNC ═══════════")
    raw_origem = str(ROOT / "data" / "raw" / "sao_paulo") + "/"
    raw_destino = "gdrive:Omega-data/raw/sao_paulo/"
    ext_origem = str(ROOT / "data" / "extracted" / "sao_paulo") + "/"
    ext_destino = "gdrive:Omega-data/extracted/sao_paulo/"
    pub_origem = str(ROOT / "data" / "public" / "sao_paulo") + "/"
    pub_destino = "gdrive:Omega-data/public/sao_paulo/"

    ok_raw = rodar_rclone(raw_origem, raw_destino, "raw → GDrive")
    ok_ext = rodar_rclone(ext_origem, ext_destino, "extracted → GDrive")
    ok_pub = rodar_rclone(pub_origem, pub_destino, "public → GDrive")

    if ok_raw:
        log("  Limpando raw local...")
        shutil.rmtree(ROOT / "data" / "raw" / "sao_paulo", ignore_errors=True)
    if ok_ext:
        log("  Limpando extracted local...")
        shutil.rmtree(ROOT / "data" / "extracted" / "sao_paulo", ignore_errors=True)

    return ok_raw and ok_ext


def resumo_final():
    log("\n" + "=" * 55)
    log(f"  COLETA SÃO PAULO — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}")
    log("=" * 55)
    log(f"  OK:      {PASS}")
    log(f"  Falha:   {FAIL}")
    if EXTRAIDOS:
        log("  Extraídos:")
        for e in EXTRAIDOS:
            log(f"    ✓ {e}")
    if FALHADOS:
        log("  Falhas:")
        for f in FALHADOS:
            log(f"    ✗ {f}")
    log("=" * 55)


def main():
    log(f"Início: {datetime.now(timezone.utc).isoformat()}")
    log(f"PID pai: {os.getpid()}")
    log(f"IBGE: 3550308 (São Paulo)")

    criar_dirs()
    fase_siconfi()
    fase_fns()
    fase_fazenda_sp()
    fase_ckan()
    fase_tce()
    publicar()
    gdrive_sync()
    resumo_final()

    log(f"Fim: {datetime.now(timezone.utc).isoformat()}")
    log(f"Log completo: {LOG_FILE}")

    if FAIL:
        log(f"ATENÇÃO: {FAIL} falha(s) — verifique o log")
        sys.exit(1)


if __name__ == "__main__":
    main()
