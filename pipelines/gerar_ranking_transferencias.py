"""
Gera o ranking Fase 1 ("quem mais recebe" — transferências) a partir de
data/public/<municipio>/{fns,emendas_federais}/saida/*.csv.

Segue a Regra-mãe de docs/ranking-municipios-metodologia.md: nenhum manifest
sai sem os campos de cobertura (n_incluidos, n_universo, metrica, fontes,
data_corte) preenchidos — sem eles o ranking não deve ser publicado.

Fontes agregadas (cada uma vira um ranking próprio; não somamos fontes com
cobertura desigual sem declarar isso):
  - fns              → VL_LIQUIDO por município, todos os anos disponíveis
  - emendas_federais → valor_pago por município, todos os anos disponíveis

Uso:
    python pipelines/gerar_ranking_transferencias.py            # gera o manifest
    python pipelines/gerar_ranking_transferencias.py --check    # apenas verifica
    python pipelines/gerar_ranking_transferencias.py --gate     # exit 1 se faltar campo obrigatório
"""

import argparse
import csv
import json
import sys
from datetime import date
from pathlib import Path

DIRETORIO_SCRIPT = Path(__file__).parent
RAIZ = DIRETORIO_SCRIPT.parent
PUBLIC_DIR = RAIZ / "data" / "public"
MANIFEST_PATH = RAIZ / "data" / "manifests" / "rankings" / "transferencias.json"

TOTAL_MUNICIPIOS_BRASIL = 5571

FONTES = {
    "fns": {
        # "fns_repasses_faf_com_populacao_*" = dado real de repasse; ignora
        # "inventario_fns_repasses_faf_*" (apenas metadado de coleta pendente).
        "glob": "fns/saida/fns_repasses_faf_com_populacao_*.csv",
        "col_ibge": "CO_MUNICIPIO_IBGE",
        "col_nome": "MUNICIPIO",
        "col_uf": "UF",
        "col_valor": "VL_LIQUIDO",
        "metrica": "Soma de repasses do Fundo Nacional de Saúde (FNS), valor líquido, todos os anos disponíveis por município",
        "fonte_label": "Fundo Nacional de Saúde (portalfns.saude.gov.br)",
    },
    "emendas_federais": {
        "glob": "emendas_federais/saida/*.csv",
        "col_ibge": "municipio_ibge",
        "col_nome": "municipio_nome",
        "col_uf": None,
        "col_valor": "valor_pago",
        "metrica": "Soma de emendas parlamentares federais pagas, todos os anos disponíveis por município",
        "fonte_label": "Portal da Transparência (api.portaldatransparencia.gov.br)",
    },
}


def parse_valor_brl(valor: str) -> float:
    """Converte valor numérico em float, aceitando dois formatos que coexistem
    nos CSVs de origem (formato mudou entre safras de coleta):
      - BR: '1.234.567,89' ou '560662,88' (vírgula decimal, ponto de milhar)
      - US: '97577.139999999985' (ponto decimal, sem vírgula)
    Vazio/inválido = 0.0.
    """
    if not valor:
        return 0.0
    valor = valor.strip()
    try:
        if "," in valor:
            return float(valor.replace(".", "").replace(",", "."))
        return float(valor)
    except ValueError:
        return 0.0


def agregar_fonte(fonte_id: str, spec: dict) -> dict:
    """Varre todos os municípios publicados e soma o valor por município para uma fonte."""
    agregado = {}  # ibge -> {nome, uf, valor}

    for csv_path in sorted(PUBLIC_DIR.glob(f"*/{spec['glob']}")):
        with open(csv_path, encoding="utf-8-sig", newline="") as f:
            for linha in csv.DictReader(f):
                ibge = linha.get(spec["col_ibge"], "").strip()
                if not ibge:
                    continue
                valor = parse_valor_brl(linha.get(spec["col_valor"], "0"))
                if ibge not in agregado:
                    agregado[ibge] = {
                        "ibge": ibge,
                        "nome": linha.get(spec["col_nome"], "").strip(),
                        "uf": linha.get(spec["col_uf"], "").strip() if spec["col_uf"] else None,
                        "valor_total": 0.0,
                    }
                agregado[ibge]["valor_total"] += valor

    ranking = sorted(agregado.values(), key=lambda m: m["valor_total"], reverse=True)
    for posicao, item in enumerate(ranking, start=1):
        item["posicao"] = posicao
        item["valor_total"] = round(item["valor_total"], 2)

    soma_geral = sum(item["valor_total"] for item in ranking)
    bloqueado_valor_zerado = len(ranking) > 0 and soma_geral == 0

    resultado = {
        "metrica": spec["metrica"],
        "fontes": [spec["fonte_label"]],
        "n_incluidos": len(ranking),
        "n_universo": TOTAL_MUNICIPIOS_BRASIL,
        "cobertura_pct": round(100 * len(ranking) / TOTAL_MUNICIPIOS_BRASIL, 2),
        "ranking": [] if bloqueado_valor_zerado else ranking,
    }
    if bloqueado_valor_zerado:
        resultado["bloqueado"] = (
            f"Ranking não publicável: valor monetário zerado em 100% das linhas "
            f"coletadas ({len(ranking)} municípios) — bug de coleta upstream, "
            f"não falta de execução real. Corrigir extrator antes de rankear."
        )
    return resultado


CAMPOS_OBRIGATORIOS = ["metrica", "fontes", "n_incluidos", "n_universo", "cobertura_pct"]


def validar_manifest(manifest: dict) -> list:
    """Retorna lista de erros — vazio se todos os campos obrigatórios estão presentes."""
    erros = []
    for fonte_id, bloco in manifest["fontes_disponiveis"].items():
        for campo in CAMPOS_OBRIGATORIOS:
            if bloco.get(campo) in (None, "", []):
                erros.append(f"{fonte_id}: campo obrigatório '{campo}' ausente ou vazio")
    return erros


def main():
    parser = argparse.ArgumentParser(description="Gera ranking de transferências (Fase 1) a partir de data/public/")
    parser.add_argument("--check", action="store_true", help="Apenas verifica, não escreve arquivo")
    parser.add_argument("--gate", action="store_true", help="Exit 1 se faltar campo obrigatório de cobertura")
    args = parser.parse_args()

    fontes_disponiveis = {fonte_id: agregar_fonte(fonte_id, spec) for fonte_id, spec in FONTES.items()}

    manifest = {
        "_note": "Gerado por pipelines/gerar_ranking_transferencias.py — não editar manualmente",
        "_generated": str(date.today()),
        "data_corte": str(date.today()),
        "aviso_metodologico": (
            "Ausência de um município não significa valor zero: pode ser que o dado "
            "ainda não tenha sido coletado. Fontes com cobertura desigual não são "
            "somadas entre si — cada uma é um ranking próprio. Metodologia completa: "
            "docs/ranking-municipios-metodologia.md"
        ),
        "fontes_disponiveis": fontes_disponiveis,
    }

    erros = validar_manifest(manifest)

    for fonte_id, bloco in fontes_disponiveis.items():
        print(f"{fonte_id}: {bloco['n_incluidos']} de {bloco['n_universo']} municípios ({bloco['cobertura_pct']}%)")
        if bloco.get("bloqueado"):
            print(f"  ⚠ BLOQUEADO: {bloco['bloqueado']}")

    if erros:
        print("\nErros de cobertura:")
        for e in erros:
            print(f"  - {e}")

    if args.gate and erros:
        sys.exit(1)

    if args.check:
        print("\n[--check] Nenhum arquivo escrito.")
        return

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"\nEscrito: {MANIFEST_PATH.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
