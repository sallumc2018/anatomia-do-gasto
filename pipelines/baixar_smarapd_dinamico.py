"""
Baixa dados dinâmicos do portal SMARAPD de Paulínia (e outras entidades SMARAPD).

Módulos suportados:
  despesas   → DespesaAgrupada/despesaorcamentarias
  empenhos   → convenios_santa_casa/empenhoanalitico
  liquidados → liquidacoes/EmpenhosLiquidados
  contratos  → 9/Contratos
  fornecedores → fornecedor/pagamentofornecedores

API: POST /paiportalserver/modulovisao/filter
  {"ChaveModulo": ..., "NomeVisao": ..., "Filtros": [], "Periodicidade": "ANUAL",
   "Exercicio": 2025, "Pagina": 1, "QuantidadeRegistros": "500", ...}

Uso:
    .venv/bin/python3 pipelines/baixar_smarapd_dinamico.py --modulo despesas
    .venv/bin/python3 pipelines/baixar_smarapd_dinamico.py --modulo despesas --anos 2023 2024 2025
    .venv/bin/python3 pipelines/baixar_smarapd_dinamico.py --modulo despesas --dry-run
"""
import argparse
import csv
import json
import ssl
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "paulinia" / "smarapd" / "dinamico"
OUT_DIR = ROOT / "data" / "extracted" / "paulinia" / "smarapd"

BASE = "https://transparencia-paulinia.smarapd.com.br"
FILTER_URL = f"{BASE}/paiportalserver/modulovisao/filter"
HEADERS = {
    "Origin": BASE,
    "Referer": BASE + "/",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
}
CTX = ssl.create_default_context()

MODULOS = {
    "despesas":      ("DespesaAgrupada", "despesaorcamentarias"),
    "empenhos":      ("convenios_santa_casa", "empenhoanalitico"),
    "liquidados":    ("liquidacoes", "EmpenhosLiquidados"),
    "contratos":     ("9", "Contratos"),
    "fornecedores":  ("fornecedor", "pagamentofornecedores"),
}


def filter_query(chave_modulo: str, nome_visao: str, exercicio: int,
                 pagina: int = 1, qtd: int = 500) -> dict:
    body = {
        "ChaveModulo": chave_modulo,
        "NomeVisao": nome_visao,
        "Filtros": [],
        "Periodicidade": "ANUAL",
        "Exercicio": exercicio,
        "Pagina": pagina,
        "QuantidadeRegistros": str(qtd),
        "Ordenacao": [],
        "FiltroRedirecionaVisao": {"Campo": None, "Valor": None, "TipoValor": None},
    }
    data = json.dumps(body).encode()
    req = urllib.request.Request(FILTER_URL, data=data, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, context=CTX, timeout=60) as resp:
        return json.loads(resp.read())


def collect_year(chave: str, visao: str, ano: int, page_size: int = 500) -> list[dict]:
    records = []
    r = filter_query(chave, visao, ano, pagina=1, qtd=page_size)
    total_pages = r.get("QuantidadePaginas", 0)
    total_regs = r.get("QuantidadeRegistros", 0)

    if total_regs == 0:
        return []

    print(f"  {ano}: {total_regs} registros, {total_pages} páginas")
    records.extend(r.get("Valores", []))

    for p in range(2, total_pages + 1):
        time.sleep(0.3)
        r = filter_query(chave, visao, ano, pagina=p, qtd=page_size)
        records.extend(r.get("Valores", []))
        print(f"    página {p}/{total_pages}: {len(r.get('Valores', []))} regs")

    return records


def save_raw(modulo: str, ano: int, records: list[dict]) -> Path:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    path = RAW_DIR / f"{modulo}_{ano}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    return path


def save_csv(modulo: str, anos_data: dict[int, list[dict]]) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    all_records = []
    for ano, records in sorted(anos_data.items()):
        for r in records:
            r = dict(r)
            r.pop("ID", None)
            r.pop("Id", None)
            r["Exercicio"] = ano
            r["Municipio"] = "paulinia"
            all_records.append(r)

    if not all_records:
        print("  Nenhum registro para exportar.")
        return None

    path = OUT_DIR / f"smarapd_{modulo}_paulinia.csv"
    fieldnames = list(all_records[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_records)
    print(f"  CSV exportado: {path} ({len(all_records)} linhas)")
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--modulo", choices=list(MODULOS.keys()), default="despesas")
    parser.add_argument("--anos", type=int, nargs="+", default=list(range(2020, 2027)))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--page-size", type=int, default=500)
    args = parser.parse_args()

    chave, visao = MODULOS[args.modulo]
    print(f"Módulo: {args.modulo} ({chave}/{visao})")
    print(f"Anos: {args.anos}")

    if args.dry_run:
        print("[dry-run] verificando disponibilidade...")
        for ano in args.anos:
            r = filter_query(chave, visao, ano, pagina=1, qtd=1)
            print(f"  {ano}: {r.get('QuantidadeRegistros', 0)} registros")
        return

    anos_data: dict[int, list[dict]] = {}
    for ano in args.anos:
        print(f"\n--- {ano} ---")
        try:
            records = collect_year(chave, visao, ano, args.page_size)
            if records:
                anos_data[ano] = records
                raw_path = save_raw(args.modulo, ano, records)
                print(f"  Raw salvo: {raw_path}")
        except Exception as e:
            print(f"  [erro] {ano}: {e}")
        time.sleep(0.5)

    if anos_data:
        total = sum(len(v) for v in anos_data.values())
        print(f"\nTotal coletado: {total} registros em {len(anos_data)} anos")
        save_csv(args.modulo, anos_data)
    else:
        print("Nenhum dado coletado.")


if __name__ == "__main__":
    main()
