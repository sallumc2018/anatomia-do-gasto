"""
Gera retroativamente o qa.csv para um município a partir dos arquivos já em data/public/.

sha256_raw retroativo = SHA256 do arquivo público (proxy; raw original não preservado
localmente para fontes API). Campo observacao documenta isso.

Uso:
    python gerar_qa_manifest.py --municipio sorocaba [--autorizado-por mantenedor]
"""
import argparse
import csv
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MANIFEST_CSV = DATA_DIR / "manifests" / "datasets.csv"

_TRANSP_SOROCABA = "https://sorocaba.sp.gov.br/transparencia/"

FONTE_URL = {
    "SICONFI / Tesouro Nacional":                        "https://siconfi.tesouro.gov.br/",
    "Portal de Transparencia Sorocaba":                  _TRANSP_SOROCABA,
    "Portal de Transparencia Sorocaba / SICONFI":        _TRANSP_SOROCABA,
    "Portal da Transparencia Federal":                   "https://portaldatransparencia.gov.br/",
    "Portal da Transparencia Federal / Transferegov":    "https://portaldatransparencia.gov.br/transferencias",
    "Portal Camara Municipal de Sorocaba":               "https://www.camarasorocaba.sp.gov.br/arquivos_publicos.html",
    "CEPA Sorocaba (Agencia de Noticias)":               "https://cepa.agenciadesenvolvimento.org.br/",
    "PNCP / Compras.gov":                                "https://pncp.gov.br/",
    "TCE-SP / Tribunal de Contas do Estado de Sao Paulo": "https://www.tce.sp.gov.br/",
    "Fontes oficiais municipais e legislativas":         _TRANSP_SOROCABA,
    "Metodologia interna + fontes oficiais":             "https://sorocaba.sp.gov.br/",
    "FUNSERV / Portal Transparencia Sorocaba":           _TRANSP_SOROCABA,
}

SCRIPT_MAP: dict[tuple[str, str], str] = {
    ("saude",          "despesas"):            "pipelines/extrator_saude.py",
    ("saude",          "receitas"):            "pipelines/extrator_saude.py",
    ("saude",          "receitas-detalhamento"): "pipelines/extrator_saude.py",
    ("saude",          "rreo-despesas"):       "pipelines/extrator_rreo_sus.py",
    ("saude",          "rreo-receitas-sus"):   "pipelines/extrator_rreo_sus.py",
    ("educacao",       "despesas"):            "pipelines/extrator_educacao.py",
    ("educacao",       "receitas"):            "pipelines/extrator_educacao.py",
    ("seguranca",      "despesas"):            "pipelines/extrator_seguranca.py",
    ("seguranca",      "orcamento"):           "pipelines/extrator_rreo.py",
    ("transporte",     "orcamento-rreo"):      "pipelines/extrator_rreo_transporte.py",
    ("transporte",     "orcamento-dca"):       "pipelines/extrator_dca_transporte.py",
    ("executivo",      "despesas"):            "pipelines/extrator_executivo.py",
    ("receita",        "receitas"):            "pipelines/extrator_receita.py",
    ("fiscal",         "pessoal"):             "pipelines/extrator_rgf_pessoal.py",
    ("fiscal",         "divida"):              "pipelines/extrator_rgf_divida.py",
    ("fiscal",         "rcl"):                 "pipelines/extrator_rcl.py",
    ("fiscal",         "rcl-capital"):         "pipelines/extrator_receita_capital.py",
    ("fiscal",         "divida-detalhada"):    "pipelines/extrator_divida_detalhada.py",
    ("fiscal",         "natureza-despesa"):    "pipelines/extrator_natureza_despesa.py",
    ("fiscal",         "rpps"):                "pipelines/extrator_rpps.py",
    ("despesa",        "registro-analitico"):  "pipelines/extrator_despesa_orcamentaria.py",
    ("empenho",        "registro-empenho"):    "pipelines/extrator_empenho.py",
    ("fornecedores",   "conta-corrente"):      "pipelines/agregar_fornecedores_execucao.py",
    ("restos",         "restos-a-pagar"):      "pipelines/agregar_restos_a_pagar.py",
    ("camara/gabinete","despesas-gabinete"):   "pipelines/extrair_despesas_gabinete_camara.py",
    ("emendas",        "lista"):               "pipelines/validar_emendas_cepa.py",
    ("emendas",        "por-parlamentar"):     "pipelines/validar_emendas_cepa.py",
    ("emendas",        "por-ano"):             "pipelines/validar_emendas_cepa.py",
    ("contratos",      "pncp-completo"):       "pipelines/baixar_pncp_sorocaba.py",
    ("controle_externo","alertas-sdg"):        "pipelines/baixar_tce_sorocaba.py",
    ("loa",            "audiencia-publica"):   "pipelines/gerar_audiencia_loa.py",
    ("transferencias", "convenios-federais"):  "pipelines/baixar_transferegov_sorocaba.py",
    ("transferencias", "convenios-por-orgao"): "pipelines/baixar_transferegov_sorocaba.py",
    ("transferencias", "subvencoes-osc"):      "pipelines/baixar_funserv.py",
    ("transferencias", "subvencoes-por-entidade"): "pipelines/baixar_funserv.py",
    ("transferencias", "estaduais-resumo"):    "pipelines/baixar_transferencias_estaduais_sp.py",
    ("transferencias", "estaduais-analitico"): "pipelines/baixar_transferencias_estaduais_sp.py",
    ("fiscal",         "funserv-rpps"):        "pipelines/baixar_funserv.py",
}

FONTE_ARQUIVO_MAP: dict[tuple[str, str], str] = {
    ("saude",          "despesas"):            "RAD_saude_{ano}.pdf",
    ("saude",          "receitas"):            "ASPS_{ano}.pdf",
    ("saude",          "receitas-detalhamento"): "ASPS_{ano}.pdf",
    ("saude",          "rreo-despesas"):       "siconfi_rreo_an{ano}_bl6.json",
    ("saude",          "rreo-receitas-sus"):   "siconfi_rreo_sus_an{ano}_bl6.json",
    ("educacao",       "despesas"):            "RAD_educacao_{ano}.pdf",
    ("educacao",       "receitas"):            "FUNDEB_{ano}.pdf",
    ("seguranca",      "despesas"):            "siconfi_dca_an{ano}.json",
    ("seguranca",      "orcamento"):           "siconfi_rreo_an{ano}_bl6.json",
    ("transporte",     "orcamento-rreo"):      "siconfi_rreo_an{ano}_bl6.json",
    ("transporte",     "orcamento-dca"):       "siconfi_dca_an{ano}.json",
    ("executivo",      "despesas"):            "siconfi_rreo_an{ano}_bl6.json",
    ("receita",        "receitas"):            "siconfi_rreo_an{ano}_bl6.json",
    ("fiscal",         "pessoal"):             "siconfi_rgf_an{ano}_qd3.json",
    ("fiscal",         "divida"):              "siconfi_rgf_an{ano}_qd3.json",
    ("fiscal",         "rcl"):                 "siconfi_rreo_an{ano}_bl6.json",
    ("fiscal",         "rcl-capital"):         "siconfi_rreo_an{ano}_bl6.json",
    ("fiscal",         "divida-detalhada"):    "siconfi_rgf_an{ano}_qd3.json",
    ("fiscal",         "natureza-despesa"):    "siconfi_dca_an{ano}.json",
    ("fiscal",         "rpps"):                "siconfi_rgf_an{ano}_qd3.json",
    ("despesa",        "registro-analitico"):  "Livro_Contabil_Despesa_{ano}.pdf",
    ("empenho",        "registro-empenho"):    "Livro_Empenho_{ano}.pdf",
    ("fornecedores",   "conta-corrente"):      "Conta_Corrente_Fornecedor_{ano}.pdf",
    ("restos",         "restos-a-pagar"):      "Conta_Corrente_Restos_{ano}.pdf",
    ("camara/gabinete","despesas-gabinete"):   "gabinete_{ano}_<mes>.pdf",
    ("emendas",        "lista"):               "cepa_emendas_api.json",
    ("emendas",        "por-parlamentar"):     "cepa_emendas_api.json",
    ("emendas",        "por-ano"):             "cepa_emendas_api.json",
    ("contratos",      "pncp-completo"):       "pncp_api_contratos.json",
    ("controle_externo","alertas-sdg"):        "tce_sdg_{ano}.pdf",
    ("loa",            "audiencia-publica"):   "Relatorio_LOA_{ano}.pdf",
    ("transferencias", "convenios-federais"):  "transferegov_api_convenios.json",
    ("transferencias", "convenios-por-orgao"): "transferegov_api_convenios.json",
    ("transferencias", "subvencoes-osc"):      "funserv_subvencoes_{ano}.pdf",
    ("transferencias", "subvencoes-por-entidade"): "funserv_subvencoes_{ano}.pdf",
    ("transferencias", "estaduais-resumo"):    "siconfi_rreo_an{ano}_bl6.json",
    ("transferencias", "estaduais-analitico"): "siconfi_rreo_an{ano}_bl6.json",
    ("fiscal",         "funserv-rpps"):        "funserv_rpps.pdf",
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def padrao_para_regex(padrao: str) -> re.Pattern[str]:
    escaped = re.escape(padrao).replace(r"\{ano\}", r"(\d{4})")
    return re.compile(f"^{escaped}$")


def extrair_ano(nome: str, regex: re.Pattern[str]) -> str:
    m = regex.match(nome)
    return m.group(1) if m and m.lastindex else "multi"


def carregar_datasets(municipio: str) -> list[dict]:
    rows = []
    with MANIFEST_CSV.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if (row.get("municipio") or "").strip() == municipio:
                rows.append(row)
    return rows


def gerar(municipio: str, autorizado_por: str, dry_run: bool) -> None:
    public_dir = DATA_DIR / "public" / municipio
    qa_path = DATA_DIR / "manifests" / municipio / "qa.csv"

    if not public_dir.exists():
        print(f"ERRO: {public_dir} nao encontrado.", file=sys.stderr)
        sys.exit(1)

    datasets = carregar_datasets(municipio)
    # build lookup: arquivo_padrao regex -> row
    padrao_rows: list[tuple[re.Pattern[str], dict]] = []
    for row in datasets:
        p = (row.get("Arquivo_Padrao") or "").strip()
        if p:
            padrao_rows.append((padrao_para_regex(p), row))

    csvs = sorted(public_dir.rglob("*.csv"))
    print(f"Encontrados {len(csvs)} arquivos CSV em {public_dir}")

    linhas: list[dict] = []
    sem_match: list[str] = []

    for csv_path in csvs:
        nome = csv_path.name
        match_row: dict | None = None
        match_regex: re.Pattern[str] | None = None

        for regex, row in padrao_rows:
            if regex.match(nome):
                match_row = row
                match_regex = regex
                break

        if match_row is None:
            sem_match.append(nome)
            continue

        area = (match_row.get("Area") or "").strip()
        tipo = (match_row.get("Tipo") or "").strip()
        fonte = (match_row.get("Fonte") or "").strip()
        ano = extrair_ano(nome, match_regex) if match_regex else "multi"

        fonte_url = FONTE_URL.get(fonte, f"pendente:{fonte}")
        chave = (area, tipo)
        script = SCRIPT_MAP.get(chave, f"pipelines/extrator_universal.py")
        f_arquivo_tmpl = FONTE_ARQUIVO_MAP.get(chave, f"api_{area}.json")
        f_arquivo = f_arquivo_tmpl.replace("{ano}", ano)

        sha = sha256_file(csv_path)

        linhas.append({
            "arquivo":        nome,
            "area":           area,
            "ano":            ano,
            "municipio":      municipio,
            "fonte_url":      fonte_url,
            "fonte_arquivo":  f_arquivo,
            "script_extracao": script,
            "validado_por":   "retroativo",
            "validado_em":    "2026-05-22",
            "sha256_raw":     sha,
            "autorizado_por": autorizado_por,
            "status":         "retroativo",
            "observacao":     "retroativo: sha256_raw e hash do arquivo publico; raw original nao preservado localmente",
        })

    print(f"  Mapeados:    {len(linhas)}")
    print(f"  Sem match:   {len(sem_match)}")
    if sem_match:
        print("  Arquivos sem correspondencia em datasets.csv:")
        for s in sem_match:
            print(f"    - {s}")

    if dry_run:
        print("\nDRY RUN: nenhum arquivo escrito.")
        return

    qa_path.parent.mkdir(parents=True, exist_ok=True)
    campos = [
        "arquivo", "area", "ano", "municipio",
        "fonte_url", "fonte_arquivo", "script_extracao",
        "validado_por", "validado_em", "sha256_raw",
        "autorizado_por", "status", "observacao",
    ]
    with qa_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(linhas)

    print(f"\nqa.csv escrito em: {qa_path}")
    print(f"  {len(linhas)} entradas registradas.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera qa.csv retroativo para um municipio.")
    parser.add_argument("--municipio", default="sorocaba")
    parser.add_argument("--autorizado-por", default="mantenedor")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    gerar(args.municipio, args.autorizado_por, args.dry_run)


if __name__ == "__main__":
    main()
