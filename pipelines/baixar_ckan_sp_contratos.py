"""
Baixa contratos da Prefeitura de São Paulo via CKAN SP (dados.prefeitura.sp.gov.br).

Cobre o período 2016-2024 — inclui a lacuna pré-PNCP (2016-2021) não coberta
pela API PNCP (que só inicia em 01/04/2022 pela Lei 14.133/2021).

Fonte: CKAN SP — dataset "base-de-compras-e-licitacoes"
URL: https://dados.prefeitura.sp.gov.br/dataset/base-de-compras-e-licitacoes

Schema de saída (CSV):
    ano, orgao, fornecedor, cnpj, objeto, valor_contrato, modalidade,
    numero_contrato, data_assinatura, vigencia_dias, processo_administrativo,
    numero_licitacao, tipo_evento, data_publicacao

Uso:
    MUNICIPIO=sao_paulo .venv/bin/python3 pipelines/baixar_ckan_sp_contratos.py
    MUNICIPIO=sao_paulo .venv/bin/python3 pipelines/baixar_ckan_sp_contratos.py --anos 2016 2017 2018 2019 2020 2021
    MUNICIPIO=sao_paulo .venv/bin/python3 pipelines/baixar_ckan_sp_contratos.py --forcar
"""
from __future__ import annotations

import argparse
import csv
import io
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    import requests
    HTTP_OK = True
except ImportError:
    HTTP_OK = False

MUNICIPIO = __import__("os").getenv("MUNICIPIO", "sao_paulo")
if MUNICIPIO != "sao_paulo":
    print(f"AVISO: este pipeline é específico para sao_paulo. MUNICIPIO={MUNICIPIO!r} ignorado.")

CKAN_BASE = "https://dados.prefeitura.sp.gov.br"
CKAN_DATASET = "base-de-compras-e-licitacoes"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Referer": f"{CKAN_BASE}/dataset/{CKAN_DATASET}",
}

SAIDA_FIELDS = [
    "ano", "orgao", "fornecedor", "cnpj", "objeto",
    "valor_contrato", "modalidade", "numero_contrato",
    "data_assinatura", "vigencia_dias", "processo_administrativo",
    "numero_licitacao", "tipo_evento", "data_publicacao",
]

CPF_RE = re.compile(r"\b(\d{3})\.(\d{3})\.(\d{3})-(\d{2})\b")


def _mask_cpf(s: str) -> str:
    return CPF_RE.sub(r"***.\2.\3-**", s)


def _clean_valor(s: str) -> str:
    """Converte '1.034.012,96' → '1034012.96'"""
    s = s.strip().lstrip("R$").strip()
    s = re.sub(r"\.", "", s)
    s = s.replace(",", ".")
    try:
        float(s)
        return s
    except ValueError:
        return s


def _parse_date(s: str) -> str:
    """dd/mm/yyyy → yyyy-mm-dd ou retorna original."""
    s = s.strip()
    m = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", s)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    return s


def listar_recursos_ckan(session: "requests.Session") -> dict[int, str]:
    """Retorna {ano: url_csv} via API CKAN."""
    url = f"{CKAN_BASE}/api/3/action/package_show?id={CKAN_DATASET}"
    try:
        resp = session.get(url, timeout=30)
        resp.raise_for_status()
        pkg = resp.json().get("result", {})
    except Exception as e:
        print(f"ERRO: não foi possível listar recursos do CKAN: {e}", file=sys.stderr)
        return {}

    recursos: dict[int, str] = {}
    for r in pkg.get("resources", []):
        if r.get("format", "").upper() != "CSV":
            continue
        nome = r.get("name", "")
        url_r = r.get("url", "")
        # Extrair ano do nome — "Janeiro/2021 a Dezembro/2021" → 2021
        m = re.search(r"(\d{4})\s*$", nome)
        if m:
            ano = int(m.group(1))
            # Preferir URL mais recente (pode haver duplicata por ano)
            if ano not in recursos:
                recursos[ano] = url_r

    return recursos


def baixar_csv(session: "requests.Session", url: str) -> list[list[str]] | None:
    """Faz download e retorna linhas do CSV (encoding latin-1, separador ;)."""
    try:
        resp = session.get(url, timeout=60)
        resp.raise_for_status()
        text = resp.content.decode("latin-1", errors="replace")
        reader = csv.reader(io.StringIO(text), delimiter=";")
        return list(reader)
    except Exception as e:
        print(f"ERRO download {url}: {e}", file=sys.stderr)
        return None


def processar_linhas(rows: list[list[str]], ano: int) -> list[dict]:
    """
    Pula linhas de cabeçalho extra (ex: 'Data de Processamento') e
    mapeia colunas para o schema de saída.
    """
    # Encontrar linha de header real — exige múltiplas keywords para não capturar
    # linhas de preâmbulo como "Contratos da Prefeitura..." (presente no 2023)
    header_idx = None
    for i, row in enumerate(rows):
        joined = ";".join(row).lower()
        score = sum(1 for kw in ["forn", "objeto", "valor", "modalidade"] if kw in joined)
        if score >= 2:
            header_idx = i
            break
    if header_idx is None:
        return []

    raw_headers = [h.strip().lower() for h in rows[header_idx]]

    # Mapeamento de colunas — variações entre anos
    field_map = {
        "orgao":      ["órgão", "orgao", "org\xe3o", "nome do", "secretaria"],
        "fornecedor": ["fornecedor"],
        "cnpj":       ["cnpj/cpf", "cnpj"],
        "objeto":     ["objeto"],
        "valor":      ["valor (r$)", "valor(r$)", "valor"],
        "modalidade": ["modalidade"],
        "contrato":   ["contrato", "número do contrato"],
        "data_ass":   ["data de assinatura", "assinatura"],
        "vigencia":   ["vigência(dias)", "vigencia(dias)", "vig\xeancia(dias)", "vigência (dias", "vigência"],
        "processo":   ["processo administrativo", "processo"],
        "licitacao":  ["licitação", "licita\xe7\xe3o", "licitacao"],
        "evento":     ["evento"],
        "data_pub":   ["data da publicação", "data da publica\xe7\xe3o", "publicação"],
    }

    def find_col(candidates: list[str]) -> int | None:
        for c in candidates:
            for i, h in enumerate(raw_headers):
                if c in h:
                    return i
        return None

    col = {k: find_col(v) for k, v in field_map.items()}

    def get(row: list[str], key: str) -> str:
        idx = col.get(key)
        if idx is None or idx >= len(row):
            return ""
        return row[idx].strip()

    result = []
    for row in rows[header_idx + 1:]:
        if not any(c.strip() for c in row):
            continue
        fornecedor = _mask_cpf(get(row, "fornecedor"))
        cnpj = get(row, "cnpj").strip().replace(".", "").replace("/", "").replace("-", "")
        # Mascarar CPF na coluna CNPJ (11 dígitos = CPF de PF)
        if len(cnpj) == 11:
            cnpj = f"***{cnpj[3:6]}***{cnpj[9:]}"

        result.append({
            "ano": ano,
            "orgao": get(row, "orgao"),
            "fornecedor": fornecedor,
            "cnpj": cnpj,
            "objeto": _mask_cpf(get(row, "objeto")),
            "valor_contrato": _clean_valor(get(row, "valor")),
            "modalidade": get(row, "modalidade"),
            "numero_contrato": get(row, "contrato"),
            "data_assinatura": _parse_date(get(row, "data_ass")),
            "vigencia_dias": get(row, "vigencia"),
            "processo_administrativo": get(row, "processo"),
            "numero_licitacao": get(row, "licitacao"),
            "tipo_evento": get(row, "evento"),
            "data_publicacao": _parse_date(get(row, "data_pub")),
        })
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Baixa contratos SP via CKAN")
    parser.add_argument("--anos", nargs="+", type=int, default=list(range(2016, 2025)))
    parser.add_argument("--forcar", action="store_true")
    args = parser.parse_args()

    if not HTTP_OK:
        print("ERRO: instale requests:  .venv/bin/pip install requests")
        return 1

    session = requests.Session()
    session.headers.update(HEADERS)

    print("Listando recursos CKAN SP...")
    recursos = listar_recursos_ckan(session)
    if not recursos:
        print("ERRO: não foi possível listar recursos. Verificar conectividade.")
        return 1
    print(f"  {len(recursos)} anos disponíveis: {sorted(recursos)}")

    pub_dir = ROOT / "data" / "public" / "sao_paulo" / "contratos" / "saida"
    pub_dir.mkdir(parents=True, exist_ok=True)

    total = 0
    for ano in sorted(args.anos):
        if ano not in recursos:
            print(f"  [{ano}] não disponível no CKAN — pulando")
            continue

        dest = pub_dir / f"ckan_contratos_sao_paulo_{ano}.csv"
        if dest.exists() and not args.forcar:
            print(f"  [{ano}] já existe, pulando ({dest.name})")
            total += 1
            continue

        print(f"  [{ano}] baixando {recursos[ano][:70]}...")
        rows = baixar_csv(session, recursos[ano])
        if rows is None:
            print(f"    → ERRO: download falhou")
            continue

        registros = processar_linhas(rows, ano)
        if not registros:
            print(f"    → AVISO: nenhum registro extraído (schema mudou?)")
            continue

        with dest.open("w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=SAIDA_FIELDS)
            w.writeheader()
            w.writerows(registros)

        print(f"    → {len(registros):,} registros → {dest.name}")
        total += len(registros)
        time.sleep(1.5)

    print(f"\nTotal: {total:,} registros em {pub_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
