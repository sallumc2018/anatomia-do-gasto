"""
Consolida e publica dados PNCP (atas, compras, contratos) para Sorocaba.

Entradas:
  Formato legado  — data/extracted/sorocaba/pncp/saida/pncp_sorocaba_atas-compras-contratos_*.csv
  Formato Playwright — data/extracted/sorocaba/pncp/saida/pncp_sorocaba_{tipo}_{ano}.csv
Saída:    data/public/sorocaba/contratos/saida/pncp_sorocaba_2022_2026.csv

Remove duplicatas por controle_pncp, limpa raw_path, remove janelas de coleta.
Fonte: https://pncp.gov.br (Portal Nacional de Contratações Públicas)
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / "data" / "extracted" / "sorocaba" / "pncp" / "saida"
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "contratos" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

CAMPOS_SAIDA = [
    "dataset", "ano", "orgao_cnpj", "orgao_nome", "unidade_nome",
    "controle_pncp", "numero", "objeto", "valor", "situacao",
    "data_publicacao", "data_assinatura", "vigencia_inicio", "vigencia_fim",
]

# Mapeamento do formato Playwright (baixar_pncp_playwright.py) para CAMPOS_SAIDA
PLAYWRIGHT_MAP = {
    "controle_pncp": "numero_controle_pncp",
    "numero":        "numero",
    "objeto":        "description",
    "valor":         "valor_global",
    "situacao":      "situacao_nome",
    "data_publicacao": "data_publicacao_pncp",
    "data_assinatura": "data_assinatura",
    "vigencia_inicio": "data_inicio_vigencia",
    "vigencia_fim":    "data_fim_vigencia",
}


def _enc(fonte: Path) -> str:
    return "utf-8-sig" if fonte.read_bytes()[:3] == b"\xef\xbb\xbf" else "utf-8"


def ler_fonte(fonte: Path, vistos: set, registros: list) -> int:
    """Lê arquivo no formato legado (colunas diretas: controle_pncp, dataset, etc.)."""
    count = 0
    with fonte.open(encoding=_enc(fonte), newline="") as f:
        for row in csv.DictReader(f):
            chave = row.get("controle_pncp", "").strip()
            dataset = row.get("dataset", "").strip()
            dedup_key = f"{dataset}:{chave}"
            if dedup_key in vistos:
                continue
            vistos.add(dedup_key)
            registros.append({
                "dataset":       dataset,
                "ano":           row.get("ano", "").strip(),
                "orgao_cnpj":    row.get("orgao_cnpj", "").strip(),
                "orgao_nome":    row.get("orgao_nome", "").strip(),
                "unidade_nome":  row.get("unidade_nome", "").strip(),
                "controle_pncp": chave,
                "numero":        row.get("numero", "").strip(),
                "objeto":        (row.get("objeto", "") or "").strip()[:300],
                "valor":         row.get("valor", "").strip(),
                "situacao":      row.get("situacao", "").strip(),
                "data_publicacao": (row.get("data_publicacao", "") or "")[:10],
                "data_assinatura": (row.get("data_assinatura", "") or "")[:10],
                "vigencia_inicio": (row.get("vigencia_inicio", "") or "")[:10],
                "vigencia_fim":    (row.get("vigencia_fim", "") or "")[:10],
            })
            count += 1
    return count


def ler_fonte_playwright(fonte: Path, dataset: str, vistos: set, registros: list) -> int:
    """Lê arquivo no formato Playwright (numero_controle_pncp, valor_global, etc.)."""
    count = 0
    with fonte.open(encoding=_enc(fonte), newline="") as f:
        for row in csv.DictReader(f):
            chave = row.get("numero_controle_pncp", "").strip()
            if not chave:
                continue
            dedup_key = f"{dataset}:{chave}"
            if dedup_key in vistos:
                continue
            vistos.add(dedup_key)
            pub = row.get("data_publicacao_pncp", "") or ""
            registros.append({
                "dataset":       dataset,
                "ano":           row.get("ano", "").strip(),
                "orgao_cnpj":    row.get("orgao_cnpj", "").strip(),
                "orgao_nome":    row.get("orgao_nome", "").strip(),
                "unidade_nome":  row.get("unidade_nome", "").strip(),
                "controle_pncp": chave,
                "numero":        row.get("numero", "").strip(),
                "objeto":        (row.get("description", "") or "").strip()[:300],
                "valor":         row.get("valor_global", "").strip(),
                "situacao":      row.get("situacao_nome", "").strip(),
                "data_publicacao": pub[:10],
                "data_assinatura": (row.get("data_assinatura", "") or "")[:10],
                "vigencia_inicio": (row.get("data_inicio_vigencia", "") or "")[:10],
                "vigencia_fim":    (row.get("data_fim_vigencia", "") or "")[:10],
            })
            count += 1
    return count


def main() -> None:
    vistos: set[str] = set()
    registros: list = []

    # ── Formato legado (fontes históricas mais completas para atas) ───────────
    legado = [
        EXTRACTED / "pncp_sorocaba_atas-compras-contratos_20220101_20261231.csv",
        EXTRACTED / "pncp_sorocaba_atas_20200101_20260521.csv",
        EXTRACTED / "pncp_sorocaba_20200101_20260520.csv",
    ]
    for fonte in legado:
        if not fonte.exists():
            print(f"  AVISO: nao encontrado {fonte.name}")
            continue
        n = ler_fonte(fonte, vistos, registros)
        print(f"  {fonte.name}: +{n} novos registros")

    # ── Formato Playwright (mais recente, usa /api/search/) ───────────────────
    anos = [2022, 2023, 2024, 2025]
    tipos = ["contratos", "compras", "atas"]
    for tipo in tipos:
        for ano in anos:
            fonte = EXTRACTED / f"pncp_sorocaba_{tipo}_{ano}.csv"
            if not fonte.exists() or fonte.stat().st_size < 500:
                continue
            n = ler_fonte_playwright(fonte, tipo, vistos, registros)
            print(f"  {fonte.name}: +{n} novos registros")

    registros.sort(key=lambda r: (r["ano"], r["dataset"], r["controle_pncp"]))

    out = PUBLIC / "pncp_sorocaba_2022_2026.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS_SAIDA)
        w.writeheader()
        w.writerows(registros)

    por_dataset: dict[str, int] = {}
    for r in registros:
        por_dataset[r["dataset"]] = por_dataset.get(r["dataset"], 0) + 1
    por_ano: dict[str, int] = {}
    for r in registros:
        por_ano[r["ano"]] = por_ano.get(r["ano"], 0) + 1

    print(f"\nPublicado: {len(registros)} registros unicos -> {out}")
    print(f"Por dataset: {dict(sorted(por_dataset.items()))}")
    print(f"Por ano: {dict(sorted(por_ano.items()))}")


if __name__ == "__main__":
    main()
