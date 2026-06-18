from __future__ import annotations

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "data" / "extracted" / "sorocaba" / "saae"
OUT = BASE / "normalizado"


def read_rows(path: Path) -> list[list[str]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        next(reader, None)
        return [[cell.strip() for cell in row] for row in reader]


def write_rows(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def useful(row: list[str]) -> list[str]:
    return [cell for cell in row if cell]


def is_date(value: str) -> bool:
    return bool(re.fullmatch(r"\d{2}/\d{2}/\d{4}", value or ""))


def is_money(value: str) -> bool:
    return bool(re.fullmatch(r"-?\d{1,3}(\.\d{3})*,\d{2}|-?\d+,\d{2}", value or ""))


def normalizar_contratos() -> Path:
    source = BASE / "saae_contratos_sorocaba_2026.csv"
    rows_out: list[dict[str, str]] = []
    for cells in map(useful, read_rows(source)):
        if len(cells) < 12 or cells[0] != "2026":
            continue

        nome_fantasia = ""
        data_inicial = ""
        data_final = ""
        value_start = 5
        if len(cells) > 6 and is_date(cells[5]) and is_date(cells[6]):
            data_inicial, data_final = cells[5], cells[6]
            value_start = 7
        elif len(cells) > 7 and is_date(cells[6]) and is_date(cells[7]):
            nome_fantasia = cells[5]
            data_inicial, data_final = cells[6], cells[7]
            value_start = 8
        elif len(cells) > 6 and is_money(cells[6]):
            nome_fantasia = cells[5]
            value_start = 6

        values = cells[value_start : value_start + 4]
        if len(values) < 4 or not all(is_money(value) for value in values):
            continue
        tail_start = value_start + 4
        observacao = "normalizado de recorte TDAPortal; sem publicacao"
        if not data_inicial or not data_final:
            observacao += "; datas inicial/final ausentes no recorte"

        rows_out.append(
            {
                "ano": cells[0],
                "nro_siam": cells[1],
                "tipo": cells[2],
                "cnpj_cpf_fornecedor": cells[3],
                "fornecedor": cells[4],
                "nome_fantasia": nome_fantasia,
                "data_inicial": data_inicial,
                "data_final": data_final,
                "valor_contratado": values[0],
                "valor_empenhado": values[1],
                "valor_processado": values[2],
                "valor_pago": values[3],
                "objeto_contrato": cells[tail_start] if len(cells) > tail_start else "",
                "modalidade_processo_licitatorio": cells[tail_start + 1] if len(cells) > tail_start + 1 else "",
                "nro_processo_adm": cells[tail_start + 2] if len(cells) > tail_start + 2 else "",
                "fonte_arquivo": source.relative_to(ROOT).as_posix(),
                "observacao": observacao,
            }
        )
    path = OUT / "saae_contratos_sorocaba_2026_normalizado.csv"
    write_rows(
        path,
        [
            "ano",
            "nro_siam",
            "tipo",
            "cnpj_cpf_fornecedor",
            "fornecedor",
            "nome_fantasia",
            "data_inicial",
            "data_final",
            "valor_contratado",
            "valor_empenhado",
            "valor_processado",
            "valor_pago",
            "objeto_contrato",
            "modalidade_processo_licitatorio",
            "nro_processo_adm",
            "fonte_arquivo",
            "observacao",
        ],
        rows_out,
    )
    return path


def normalizar_licitacoes() -> Path:
    source = BASE / "saae_licitacoes_sorocaba_2026.csv"
    rows_out: list[dict[str, str]] = []
    for cells in map(useful, read_rows(source)):
        if len(cells) < 8 or cells[0] in {"TOTAL", "Modalidade"}:
            continue
        if not cells[1].startswith("000"):
            continue
        data_abertura = "" if cells[6] == ":" else cells[6]
        hora_abertura = "" if cells[7] == "0,00" else cells[7]
        observacao = "normalizado de recorte TDAPortal; sem publicacao"
        if not data_abertura or not hora_abertura:
            observacao += "; abertura nao informada/aplicavel no recorte"
        rows_out.append(
            {
                "modalidade": cells[0],
                "nro_processo_licitatorio": cells[1],
                "nro_processo_adm_cpl": cells[2],
                "objeto_finalidade_servico": cells[3],
                "situacao": cells[4],
                "data": cells[5],
                "data_abertura": data_abertura,
                "hora_abertura": hora_abertura,
                "fonte_arquivo": source.relative_to(ROOT).as_posix(),
                "observacao": observacao,
            }
        )
    path = OUT / "saae_licitacoes_sorocaba_2026_normalizado.csv"
    write_rows(
        path,
        [
            "modalidade",
            "nro_processo_licitatorio",
            "nro_processo_adm_cpl",
            "objeto_finalidade_servico",
            "situacao",
            "data",
            "data_abertura",
            "hora_abertura",
            "fonte_arquivo",
            "observacao",
        ],
        rows_out,
    )
    return path


def normalizar_obras() -> Path:
    source = BASE / "saae_obras_sorocaba_2026.csv"
    rows_out: list[dict[str, str]] = []
    seen: set[tuple[str, str, str, str]] = set()
    for cells in map(useful, read_rows(source)):
        if len(cells) < 4 or not re.fullmatch(r"[A-Z]\d+", cells[0]):
            continue
        obra = "" if cells[3].lower().startswith("sem descricao") else cells[3]
        key = (cells[0], cells[1], cells[2], obra)
        if key in seen:
            continue
        seen.add(key)
        observacao = "normalizado de recorte TDAPortal; sem publicacao"
        if not obra:
            observacao += "; descricao de obra ausente no recorte TDAPortal"
        rows_out.append(
            {
                "nro_processo": cells[0],
                "ano": cells[1],
                "situacao": cells[2],
                "obra": obra,
                "fonte_arquivo": source.relative_to(ROOT).as_posix(),
                "observacao": observacao,
            }
        )
    path = OUT / "saae_obras_sorocaba_2026_normalizado.csv"
    write_rows(path, ["nro_processo", "ano", "situacao", "obra", "fonte_arquivo", "observacao"], rows_out)
    return path


def main() -> int:
    outputs = [normalizar_contratos(), normalizar_licitacoes(), normalizar_obras()]
    for path in outputs:
        count = sum(1 for _ in csv.DictReader(path.open(encoding="utf-8")))
        print(f"{path.relative_to(ROOT).as_posix()}: {count} linhas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
