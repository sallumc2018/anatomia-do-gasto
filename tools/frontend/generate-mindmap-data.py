from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATASETS = ROOT / "data" / "manifests" / "datasets.csv"
CLASSIFICATION = ROOT / "data" / "manifests" / "publication_classification.csv"
OUTPUT = ROOT / "apps" / "web" / "lib" / "generated" / "mindmap-data.ts"


AREA_CONFIG = {
    "sorocaba": {
        "parentId": None,
        "label": "Sorocaba/SP",
        "group": "root",
        "icon": "Network",
        "summary": "Município piloto da ONG",
        "href": "/sorocaba",
        "linkLabel": "Abrir painel de Sorocaba",
        "color": "var(--theme-accent)",
    },
    "executivo": {
        "parentId": "sorocaba",
        "label": "Executivo",
        "group": "dinheiro",
        "icon": "Building2",
        "areas": ["executivo", "receita", "fiscal", "despesa", "empenho", "fornecedores", "restos"],
        "summary": "Despesa, receita e execução",
        "href": "/sorocaba/executivo",
        "linkLabel": "Ver Executivo",
        "color": "var(--blue-40)",
    },
    "receita": {
        "parentId": "executivo",
        "label": "Receita",
        "group": "dinheiro",
        "icon": "Coins",
        "areas": ["receita"],
        "summary": "Entradas do município",
        "href": "/sorocaba/receita",
        "linkLabel": "Ver receita",
        "color": "var(--support-success)",
    },
    "fornecedores": {
        "parentId": "executivo",
        "label": "Fornecedores",
        "group": "dinheiro",
        "icon": "Landmark",
        "areas": ["fornecedores"],
        "summary": "Pagamentos agregados",
        "href": "/sorocaba/fornecedores",
        "linkLabel": "Ver fornecedores",
        "color": "var(--blue-60)",
    },
    "servicos": {
        "parentId": "sorocaba",
        "label": "Serviços públicos",
        "group": "servicos",
        "icon": "HeartPulse",
        "areas": ["saude", "educacao", "seguranca", "transporte"],
        "summary": "Saúde, educação, segurança e transporte",
        "href": "/sorocaba/saude",
        "linkLabel": "Começar pela saúde",
        "color": "var(--theme-accent-hover)",
    },
    "saude": {
        "parentId": "servicos",
        "label": "Saúde",
        "group": "servicos",
        "icon": "HeartPulse",
        "areas": ["saude"],
        "summary": "ASPS, RREO, SUS e FNS",
        "href": "/sorocaba/saude",
        "linkLabel": "Ver saúde",
        "color": "var(--support-error)",
    },
    "educacao": {
        "parentId": "servicos",
        "label": "Educação",
        "group": "servicos",
        "icon": "GraduationCap",
        "areas": ["educacao"],
        "summary": "Aplicação em ensino",
        "href": "/sorocaba/educacao",
        "linkLabel": "Ver educação",
        "color": "var(--blue-40)",
    },
    "seguranca": {
        "parentId": "servicos",
        "label": "Segurança",
        "group": "servicos",
        "icon": "Shield",
        "areas": ["seguranca"],
        "summary": "Função segurança pública",
        "href": "/sorocaba/seguranca",
        "linkLabel": "Ver segurança",
        "color": "var(--support-warning)",
    },
    "transporte": {
        "parentId": "servicos",
        "label": "Transporte",
        "group": "servicos",
        "icon": "Bus",
        "areas": ["transporte"],
        "summary": "Transporte e Urbes",
        "href": "/sorocaba/transporte",
        "linkLabel": "Ver transporte",
        "color": "var(--border-focus)",
    },
    "controle": {
        "parentId": "sorocaba",
        "label": "Controle",
        "group": "controle",
        "icon": "ShieldCheck",
        "areas": ["camara", "camara/gabinete", "contratos", "controle_externo", "emendas", "transferencias", "autarquias", "loa"],
        "summary": "Câmara, contratos, emendas e LAI",
        "href": "/sorocaba/lacunas",
        "linkLabel": "Ver lacunas",
        "color": "var(--support-success)",
    },
    "camara": {
        "parentId": "controle",
        "label": "Câmara",
        "group": "controle",
        "icon": "Landmark",
        "areas": ["camara", "camara/gabinete", "emendas"],
        "summary": "Legislativo municipal",
        "href": "/sorocaba/camara-municipal",
        "linkLabel": "Ver Câmara",
        "color": "var(--blue-30)",
    },
    "contratos": {
        "parentId": "controle",
        "label": "Contratos",
        "group": "controle",
        "icon": "FileCheck2",
        "areas": ["contratos"],
        "summary": "PNCP, obras e precatórios",
        "href": "/sorocaba/lacunas",
        "linkLabel": "Ver cobertura",
        "color": "var(--theme-accent)",
    },
    "fluxo": {
        "parentId": "controle",
        "label": "Fluxo de publicação",
        "group": "controle",
        "icon": "Workflow",
        "summary": "Como o dado chega ao site",
        "href": "/fluxo",
        "linkLabel": "Ver fluxo",
        "color": "var(--support-success)",
    },
}

NODE_ORDER = [
    "sorocaba",
    "executivo",
    "receita",
    "fornecedores",
    "servicos",
    "saude",
    "educacao",
    "seguranca",
    "transporte",
    "controle",
    "camara",
    "contratos",
    "fluxo",
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [dict(row) for row in csv.DictReader(handle)]


def key(row: dict[str, str]) -> tuple[str, str, str, str]:
    return (row["municipio"], row["Area"], row["Tipo"], row["Arquivo_Padrao"])


def validate_classification(datasets: list[dict[str, str]], classifications: list[dict[str, str]]) -> list[str]:
    errors: list[str] = []
    allowed_classes = {"publicavel", "publicavel_com_cautela", "nao_destacar_na_ui"}
    allowed_ui = {
        "pode_resumir",
        "resumir_sem_pessoa",
        "mostrar_cobertura_parcial",
        "agregar_sem_perfil_pessoal",
        "nao_exibir_ate_promocao",
    }
    dataset_keys = {key(row) for row in datasets}
    classification_keys = {
        (row["municipio"], row["area"], row["tipo"], row["arquivo_padrao"]) for row in classifications
    }
    for missing in sorted(dataset_keys - classification_keys):
        errors.append(f"classification missing for {missing}")
    for extra in sorted(classification_keys - dataset_keys):
        errors.append(f"classification has extra row {extra}")
    for row in classifications:
        if row.get("classe") not in allowed_classes:
            errors.append(f"invalid class {row.get('classe')} for {row.get('arquivo_padrao')}")
        if row.get("ui_policy") not in allowed_ui:
            errors.append(f"invalid ui_policy {row.get('ui_policy')} for {row.get('arquivo_padrao')}")
    return errors


def year_bounds(years: str) -> tuple[int, int] | None:
    try:
        start, end = years.split("-", 1)
        return int(start), int(end)
    except ValueError:
        return None


def period_label(rows: list[dict[str, str]]) -> str:
    bounds = [year_bounds(row.get("Anos", "")) for row in rows]
    bounds = [bound for bound in bounds if bound]
    if not bounds:
        return "publicado" if rows else "metodologia"
    start = min(bound[0] for bound in bounds)
    end = max(bound[1] for bound in bounds)
    exact = all(bound == (start, end) for bound in bounds)
    suffix = "" if exact else " parcial"
    return f"{start}-{end}{suffix}"


def detail_for(node_id: str, rows: list[dict[str, str]], policy_counts: Counter[str]) -> str:
    if node_id == "sorocaba":
        areas = sorted({row["Area"] for row in rows})
        return (
            f"Mapa cidadão gerado a partir de {len(rows)} trilhas publicadas "
            f"em {len(areas)} areas. A interface resume cobertura sem usar camadas internas."
        )
    if node_id == "fluxo":
        return "Mostra o gate institucional: fonte oficial, trabalho interno, validação local e somente depois publicação."
    if not rows:
        return "Nó sem trilha publicada própria; serve como navegação metodológica."

    noun = "trilha publicada" if len(rows) == 1 else "trilhas publicadas"
    parts = [f"{len(rows)} {noun}"]
    if policy_counts["publicavel_com_cautela"]:
        count = policy_counts["publicavel_com_cautela"]
        parts.append(f"{count} com cautela editorial")
    if policy_counts["nao_destacar_na_ui"]:
        count = policy_counts["nao_destacar_na_ui"]
        parts.append(f"{count} sem destaque individual na UI")
    return (
        "; ".join(parts)
        + ". A leitura pública privilegia cobertura, período, fonte e agregação, sem inferir conduta."
    )


def build_nodes(datasets: list[dict[str, str]], classifications: list[dict[str, str]]) -> list[dict]:
    class_by_pattern = {row["arquivo_padrao"]: row for row in classifications}
    public_rows = [row for row in datasets if row.get("Origem_Dir") == "public"]
    rows_by_area: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in public_rows:
        rows_by_area[row["Area"]].append(row)

    nodes = []
    for node_id in NODE_ORDER:
        config = AREA_CONFIG[node_id]
        areas = config.get("areas", [])
        rows = public_rows if node_id == "sorocaba" else [row for area in areas for row in rows_by_area.get(area, [])]
        classes = Counter(class_by_pattern[row["Arquivo_Padrao"]]["classe"] for row in rows)
        node = {
            "id": node_id,
            "parentId": config["parentId"],
            "label": config["label"],
            "group": config["group"],
            "icon": config["icon"],
            "summary": config["summary"],
            "detail": detail_for(node_id, rows, classes),
            "value": period_label(rows),
            "href": config.get("href"),
            "linkLabel": config.get("linkLabel"),
            "color": config["color"],
            "sourceCount": len(rows),
            "policy": {
                "publicavel": classes["publicavel"],
                "publicavelComCautela": classes["publicavel_com_cautela"],
                "naoDestacarNaUi": classes["nao_destacar_na_ui"],
            },
        }
        nodes.append(node)
    return nodes


def render_ts(nodes: list[dict]) -> str:
    payload = json.dumps(nodes, ensure_ascii=False, indent=2)
    return (
        "// Generated by tools/frontend/generate-mindmap-data.py. Do not edit by hand.\n"
        "\n"
        "export type GeneratedMindNode = {\n"
        "  id: string\n"
        "  parentId: string | null\n"
        '  group: "root" | "dinheiro" | "servicos" | "controle"\n'
        "  icon:\n"
        '    | "ArrowRight"\n'
        '    | "Building2"\n'
        '    | "Bus"\n'
        '    | "Coins"\n'
        '    | "FileCheck2"\n'
        '    | "GraduationCap"\n'
        '    | "HeartPulse"\n'
        '    | "Landmark"\n'
        '    | "Network"\n'
        '    | "Shield"\n'
        '    | "ShieldCheck"\n'
        '    | "Workflow"\n'
        "  label: string\n"
        "  summary: string\n"
        "  detail: string\n"
        "  value: string\n"
        "  href?: string\n"
        "  linkLabel?: string\n"
        "  color: string\n"
        "  sourceCount: number\n"
        "  policy: {\n"
        "    publicavel: number\n"
        "    publicavelComCautela: number\n"
        "    naoDestacarNaUi: number\n"
        "  }\n"
        "}\n\n"
        f"export const MINDMAP_NODES = {payload} satisfies GeneratedMindNode[]\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate public mindmap data from manifests.")
    parser.add_argument("--check", action="store_true", help="Fail when generated output is stale.")
    args = parser.parse_args()

    datasets = read_csv(DATASETS)
    classifications = read_csv(CLASSIFICATION)
    errors = validate_classification(datasets, classifications)
    if errors:
        for error in errors:
            print(error)
        return 1

    content = render_ts(build_nodes(datasets, classifications))
    if args.check:
        current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if current != content:
            print(f"stale generated file: {OUTPUT.relative_to(ROOT).as_posix()}")
            return 1
        print("Mindmap generated data is up to date.")
        return 0

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content, encoding="utf-8", newline="\n")
    print(f"Wrote {OUTPUT.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
