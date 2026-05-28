"""Gera um alerta neutro de lacunas de transparencia para o Catao.

O texto produzido e deliberadamente editorialmente conservador: aponta a
lacuna registrada no manifesto, sem emitir juizo sobre agente, orgao ou fornecedor.
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_STATUS = ROOT / "data" / "manifests" / "datasets_status.json"

FRIENDLY_NAMES = {
    "receita-analitica": "Receita Analitica Detalhada",
    "camara-contratos": "Contratos Publicos da Camara Municipal",
    "consorcios-intermunicipais": "Dados de Consorcios Intermunicipais",
    "pessoal-remuneracao": "Remuneracao e Folha de Pagamento de Pessoal",
    "patrimonio-imoveis": "Inventario de Patrimonio e Imoveis Municipais",
    "orcamento-loa-2020-2021": "Orcamento LOA da serie historica 2020-2021",
}


def load_gaps(status_path: Path) -> list[tuple[str, str]]:
    if not status_path.exists():
        return []

    data = json.loads(status_path.read_text(encoding="utf-8"))
    datasets = data.get("datasets", {})
    return [
        (name, info.get("status", "indefinido"))
        for name, info in datasets.items()
        if info.get("status") in {"lacuna", "inexistente"}
    ]


def build_message(gaps: list[tuple[str, str]]) -> str:
    if not gaps:
        return (
            "Nenhuma lacuna registrada no manifesto de status. "
            "Manter verificacao periodica antes de qualquer publicacao."
        )

    selected_gap, status = random.choice(gaps)
    friendly_name = FRIENDLY_NAMES.get(selected_gap, selected_gap.replace("-", " ").title())
    return (
        "Lacuna de transparencia registrada no manifesto: "
        f"{friendly_name} (status: {status}). "
        "Requer validacao local e fonte oficial antes de publicacao."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--status", type=Path, default=DEFAULT_STATUS)
    args = parser.parse_args()

    print(build_message(load_gaps(args.status)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
