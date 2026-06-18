"""
Varre data/public/sorocaba/ e gera dois arquivos JSON com o status de cada
dataset do manifesto de lacunas:

  data/manifests/datasets_status.json     — cópia canônica (commitar com dados)
  apps/web/lib/datasets_status.json       — importada pelo TypeScript em build time

Uso:
    python pipelines/gerar_datasets_json.py            # gera ambos os JSONs
    python pipelines/gerar_datasets_json.py --check    # apenas verifica, sem escrever
    python pipelines/gerar_datasets_json.py --verbose  # detalha cada dataset

Workflow após publicar dados:
    1. Mova CSVs para data/public/sorocaba/<area>/saida/
    2. python pipelines/gerar_datasets_json.py
    3. git add data/manifests/datasets_status.json apps/web/lib/datasets_status.json
    4. git commit && git push   →  Vercel rebuild automático
"""

import argparse
import csv
import glob
import json
import os
import sys
from datetime import date
from pathlib import Path

DIRETORIO_SCRIPT = Path(__file__).parent
RAIZ = DIRETORIO_SCRIPT.parent

ANOS_BASE = list(range(2020, 2026))  # 2020–2025


# Cada entrada do catálogo pode ter:
#   glob_padrao  — padrão glob dentro de PUBLIC_DIR; {ano} é substituído
#   anos         — lista de anos esperados (para padrões com {ano})
#   arquivo      — arquivo único (sem {ano})
#   anos_cobertos_fixo — quando a cobertura não se deriva de arquivos
#
# Regra de status:
#   - Se todos os anos encontrados → "publicado"
#   - Se algum, mas não todos → "parcial"
#   - Se nenhum → consulta overrides ou retorna "lacuna"
#
CATALOGO = {
    "fornecedores-conta-corrente": {
        "glob_padrao": "fornecedores/saida/fornecedores_agregado_sorocaba_{ano}.csv",
        "anos": ANOS_BASE,
    },
    "fornecedores-restos-pagar": {
        "glob_padrao": "restos/saida/restos_agregado_sorocaba_{ano}.csv",
        "anos": ANOS_BASE,
    },
    "contratos-pncp": {
        "arquivo": "contratos/saida/pncp_sorocaba_2022_2026.csv",
        "anos_cobertos_fixo": 3,  # 2023, 2024, 2025 — 2022 não estava no PNCP
    },
    "contratos-pre2022": {
        "arquivo": "contratos/saida/licitacoes_sorocaba_2020_2021.csv",
        "anos_cobertos_fixo": 2,
    },
    "obras-publicas": {
        "arquivo": "contratos/saida/obras_sorocaba.csv",
        "anos_cobertos_fixo": 6,  # inventário parcial — override forçará "lacuna"
    },
    "receita-analitica": {
        "glob_padrao": "receita/saida/receitas_sorocaba_{ano}.csv",
        "anos": ANOS_BASE,
        # Override forçará "lacuna": esses arquivos são RREO agregado, não o registro analítico
    },
    "despesa-empenhos": {
        "glob_padrao": "empenho/saida/empenho_sorocaba_{ano}.csv",
        "anos": ANOS_BASE,
    },
    "despesa-orcamentaria": {
        "glob_padrao": "despesa/saida/despesa_orcamentaria_sorocaba_{ano}.csv",
        "anos": ANOS_BASE,
    },
    "orcamento-loa-audiencia": {
        "glob_padrao": "loa/saida/audiencia_loa_sorocaba_{ano}.csv",
        "anos": list(range(2022, 2027)),  # 2022–2026 (5 anos)
    },
    "orcamento-loa-2020-2021": {
        "glob_padrao": "loa/saida/audiencia_loa_sorocaba_{ano}.csv",
        "anos": [2020, 2021],
    },
    "camara-emendas": {
        "arquivo": "emendas/saida/emendas_cepa_sorocaba_2020_2026.csv",
        "anos_cobertos_fixo": 6,  # CEPA 2020–2025 (2020-2021: 2 regs cada; efetivo 2022+)
    },
    "camara-gabinete": {
        "glob_padrao": "camara/gabinete/saida/despesas_gabinete_camara_sorocaba_{ano}.csv",
        "anos": list(range(2020, 2027)),  # 2020–2026 (7 anos)
    },
    "camara-execucao": {
        "arquivo": "camara/saida/camara_despesas_tce_2020_2025.csv",
        "anos_cobertos_fixo": 6,
    },
    "camara-documentos-orcamentarios": {
        "arquivo": "camara/documentos_orcamentarios/saida/camara_documentos_orcamentarios_sorocaba_2017_2027.csv",
        "anos_cobertos_fixo": 4,
    },
    "camara-contratos": {
        # Não há arquivo ainda — override forçará "lacuna"
        "glob_padrao": "camara/saida/contratos_camara_*.csv",
        "anos": [],
    },
    "urbes-despesas-contratos": {
        # Lei 8890 despesas mensais publicadas (75 regs 2020-2026); override para "parcial"
        "glob_padrao": "transporte/saida/urbes_*.csv",
        "anos": [],
    },
    "saae-despesas-receitas": {
        "arquivo": "autarquias/saida/saae_despesas_tce_2020_2025.csv",
        "anos_cobertos_fixo": 6,
    },
    "saae-pessoal-rh": {
        "arquivo": "autarquias/saae/pessoal/saida/saae_pessoal_cargos_amostra_sorocaba_2026.csv",
        "anos_cobertos_fixo": 1,
    },
    "funserv-rpps": {
        "arquivo": "autarquias/saida/funserv_rpps_sorocaba.csv",
        "anos_cobertos_fixo": 6,
    },
    "funserv-saude": {
        "arquivo": "autarquias/saida/funserv_saude_tce_2020_2025.csv",
        "anos_cobertos_fixo": 6,
    },
    "empresas-municipais": {
        "arquivo": "autarquias/saida/empresas_municipais_tce_2020_2025.csv",
        "anos_cobertos_fixo": 6,
    },
    "consorcios-intermunicipais": {
        "glob_padrao": "autarquias/saida/consorcios_*.csv",
        "anos": [],
    },
    "transferencias-federais": {
        "arquivo": "transferencias/saida/transferencias_federais_tce_sorocaba.csv",
        "anos_cobertos_fixo": 6,
    },
    "transferencias-estaduais": {
        "arquivo": "transferencias/saida/transferencias_estaduais_sp_sorocaba.csv",
        "anos_cobertos_fixo": 6,
    },
    "subvencoes-osc": {
        "arquivo": "transferencias/saida/subvencoes_osc_sorocaba.csv",
        "anos_cobertos_fixo": 6,
    },
    "pessoal-remuneracao": {
        "glob_padrao": "executivo/saida/pessoal_individual_sorocaba_{ano}.csv",
        "anos": ANOS_BASE,
    },
    "precatorios": {
        "arquivo": "contratos/saida/precatorios_sorocaba_2020_2025.csv",
        "anos_cobertos_fixo": 6,
    },
    "patrimonio-imoveis": {
        "glob_padrao": "executivo/saida/patrimonio_imoveis_sorocaba*.csv",
        "anos": [],
    },
    "controle-externo-pareceres": {
        "arquivo": "controle_externo/saida/alertas_sdg_2025_sorocaba.csv",
        "anos_cobertos_fixo": 1,
    },
    "controle-externo-contas": {
        # julgamento formal TCE-SP ainda não estruturado; override define "parcial"
        "glob_padrao": "controle_externo/saida/julgamento_contas_*.csv",
        "anos": [],
    },
    "siconfi-dca": {
        "arquivo": "controle_externo/saida/dca_siconfi_sorocaba_2020_2025.csv",
        "anos_cobertos_fixo": 6,
    },
}


def contar_linhas(caminho: Path) -> int:
    """Conta linhas de dados (exclui cabeçalho) de um CSV."""
    try:
        with open(caminho, encoding="utf-8-sig", newline="") as f:
            return sum(1 for _ in csv.DictReader(f))
    except Exception:
        return 0


def checar_dataset(dataset_id: str, spec: dict, public_dir: Path, municipio: str) -> dict:
    """Retorna {'status', 'anosCobertos', 'registros', 'arquivos_encontrados'}."""
    # Patches específicos para Paulínia
    if municipio == "paulinia":
        spec = spec.copy()
        if dataset_id == "transferencias-federais":
            spec["glob_padrao"] = "transferencias_federais/saida/transferencias_federais_paulinia_{ano}.csv"
            spec["anos"] = list(range(2021, 2026))
            if "arquivo" in spec:
                del spec["arquivo"]
        elif dataset_id == "transferencias-estaduais":
            spec["glob_padrao"] = "transferencias_estaduais/saida/transferencias_estaduais_sp_paulinia_{ano}.csv"
            spec["anos"] = list(range(2020, 2026))
            if "arquivo" in spec:
                del spec["arquivo"]
        elif dataset_id == "pessoal-remuneracao":
            spec["glob_padrao"] = "fiscal/saida/pessoal_paulinia_{ano}.csv"
            spec["anos"] = list(range(2020, 2026))
        elif dataset_id == "funserv-rpps":
            spec["glob_padrao"] = "fiscal/saida/rpps_paulinia_{ano}.csv"
            spec["anos"] = list(range(2020, 2026))
            if "arquivo" in spec:
                del spec["arquivo"]
        elif dataset_id == "urbes-despesas-contratos":
            spec["glob_padrao"] = "transporte/saida/dca_transporte_paulinia_{ano}.csv"
            spec["anos"] = list(range(2020, 2026))
        elif dataset_id == "funserv-saude":
            spec["glob_padrao"] = "fns/saida/fns_repasses_faf_com_populacao_paulinia_{ano}.csv"
            spec["anos"] = list(range(2020, 2026))
            if "arquivo" in spec:
                del spec["arquivo"]
        elif dataset_id == "despesa-orcamentaria":
            spec["glob_padrao"] = "executivo/saida/despesas_executivo_paulinia_{ano}.csv"
            spec["anos"] = list(range(2020, 2026))

    encontrados = []
    registros_total = 0

    if "arquivo" in spec:
        p = public_dir / spec["arquivo"].replace("sorocaba", municipio)
        if p.exists():
            encontrados.append(str(p))
            registros_total += contar_linhas(p)

        anos_cobertos = spec.get("anos_cobertos_fixo", 0) if encontrados else 0
        if encontrados:
            status = "publicado"
        else:
            status = "lacuna"

    elif "glob_padrao" in spec:
        anos = spec.get("anos", [])
        if not anos:
            # sem anos esperados: arquivo deve existir pelo glob genérico
            padrao = public_dir / spec["glob_padrao"].replace("{ano}", "*").replace("sorocaba", municipio)
            matches = list(padrao.parent.glob(padrao.name))
            if matches:
                for m in matches:
                    encontrados.append(str(m))
                    registros_total += contar_linhas(m)

            anos_cobertos = spec.get("anos_cobertos_fixo", len(encontrados))
            status = "publicado" if encontrados else "lacuna"
        else:
            for ano in anos:
                padrao_str = spec["glob_padrao"].replace("{ano}", str(ano)).replace("sorocaba", municipio)
                p = public_dir / padrao_str
                if p.exists():
                    encontrados.append(str(p))
                    registros_total += contar_linhas(p)
                elif "glob_alternativo" in spec:
                    alt = public_dir / spec["glob_alternativo"].replace("{ano}", str(ano)).replace("sorocaba", municipio)
                    if alt.exists():
                        encontrados.append(str(alt))
                        registros_total += contar_linhas(alt)

            anos_cobertos = spec.get("anos_cobertos_fixo", len(encontrados))
            if len(encontrados) == 0:
                status = "lacuna"
            elif len(encontrados) < len(anos):
                status = "parcial"
            else:
                status = "publicado"
    else:
        status = "lacuna"
        anos_cobertos = 0

    return {
        "status": status,
        "anosCobertos": anos_cobertos,
        "registros": registros_total if registros_total > 0 else None,
        "_arquivos": len(encontrados),
    }


def carregar_overrides(overrides_path: Path) -> dict:
    """Lê datasets_overrides.json — valores têm precedência sobre a detecção automática."""
    if not overrides_path.exists():
        return {}
    with open(overrides_path, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("datasets", {})


def gerar_status(overrides_path: Path, public_dir: Path, municipio: str) -> dict:
    """Gera o dict completo de status para todos os datasets do catálogo."""
    overrides = carregar_overrides(overrides_path)
    resultado = {}

    for ds_id, spec in CATALOGO.items():
        detectado = checar_dataset(ds_id, spec, public_dir, municipio)
        override = overrides.get(ds_id, {})

        # Override tem precedência para status e anosCobertos
        entrada = {
            "status": override.get("status", detectado["status"]),
            "anosCobertos": override.get("anosCobertos", detectado["anosCobertos"]),
        }
        if detectado["registros"] is not None and "registros" not in override:
            entrada["registros"] = detectado["registros"]
        elif "registros" in override:
            entrada["registros"] = override["registros"]

        resultado[ds_id] = entrada

    return resultado


def main():
    parser = argparse.ArgumentParser(description="Gera datasets_status.json a partir de data/public/<municipio>/")
    parser.add_argument("--check", action="store_true", help="Apenas verifica, não escreve arquivos")
    parser.add_argument("--verbose", action="store_true", help="Detalha cada dataset")
    parser.add_argument("--municipio", default="sorocaba", choices=["sorocaba", "paulinia"], help="Município a processar (default: sorocaba)")
    args = parser.parse_args()

    municipio = args.municipio
    public_dir = RAIZ / "data" / "public" / municipio
    
    overrides_name = f"datasets_overrides_{municipio}.json"
    overrides_path = RAIZ / "data" / "manifests" / overrides_name
    if municipio == "sorocaba" and not overrides_path.exists():
        overrides_path = RAIZ / "data" / "manifests" / "datasets_overrides.json"

    out_manifests = RAIZ / "data" / "manifests" / f"datasets_status_{municipio}.json"
    out_weblib = RAIZ / "apps" / "web" / "lib" / f"datasets_status_{municipio}.json"
    
    if municipio == "sorocaba":
        out_manifests = RAIZ / "data" / "manifests" / "datasets_status.json"
        out_weblib = RAIZ / "apps" / "web" / "lib" / "datasets_status.json"

    overrides = carregar_overrides(overrides_path)
    datasets = gerar_status(overrides_path, public_dir, municipio)

    publicados = sum(1 for v in datasets.values() if v["status"] == "publicado")
    parciais   = sum(1 for v in datasets.values() if v["status"] == "parcial")
    em_coleta  = sum(1 for v in datasets.values() if v["status"] == "em_coleta")
    lacunas    = sum(1 for v in datasets.values() if v["status"] == "lacuna")

    print(f"\nDatasets ({municipio}): {len(datasets)} total")
    print(f"  publicado:  {publicados}")
    print(f"  parcial:    {parciais}")
    print(f"  em_coleta:  {em_coleta}")
    print(f"  lacuna:     {lacunas}")

    if args.verbose:
        print("\nDetalhes:")
        for ds_id, v in datasets.items():
            ov = " [override]" if ds_id in overrides else ""
            reg = f"  {v['registros']:,} registros" if v.get("registros") else ""
            print(f"  {ds_id:<35} {v['status']:<12} {v['anosCobertos']}a{reg}{ov}")

    if args.check:
        print("\n[--check] Nenhum arquivo escrito.")
        return

    payload = {
        "_note": "Gerado por pipelines/gerar_datasets_json.py — não editar manualmente",
        "_generated": str(date.today()),
        "datasets": datasets,
    }

    for destino in [out_manifests, out_weblib]:
        destino.parent.mkdir(parents=True, exist_ok=True)
        with open(destino, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(f"\nEscrito: {destino.relative_to(RAIZ)}")

    print("\nPróximo passo:")
    print(f"  git add {out_manifests.relative_to(RAIZ)} {out_weblib.relative_to(RAIZ)}")
    print("  git commit -m 'data(lacunas): atualiza status dos datasets'")


if __name__ == "__main__":
    main()
