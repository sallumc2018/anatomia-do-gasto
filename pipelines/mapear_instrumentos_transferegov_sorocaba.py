"""
Consolida instrumentos SICONV/Transferegov para Sorocaba (etapa extracted).

Cruza siconv_convenio + siconv_emenda + siconv_empenho por NR_CONVENIO.
Enriquece com objeto e concedente da proposta.

Entrada:  data/extracted/sorocaba/transferegov/siconv_*.csv
Saída:    data/extracted/sorocaba/transferegov/instrumentos_consolidado_sorocaba.csv
          (NÃO publica em data/public/ — etapa extracted apenas)

Uso:
  python pipelines/mapear_instrumentos_transferegov_sorocaba.py
"""
import csv
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / "data" / "extracted" / "sorocaba" / "transferegov"


def br_float(v: str) -> float:
    if not v or v.strip() in ("", "None"):
        return 0.0
    try:
        return float(v.strip().replace(".", "").replace(",", "."))
    except ValueError:
        return 0.0


def ano_de_data(v: str) -> str | None:
    m = re.search(r"(\d{4})", v or "")
    return m.group(1) if m else None


def ler_csv(path: Path) -> list[dict]:
    if not path.exists():
        print(f"[AVISO] Arquivo nao encontrado: {path}")
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def main() -> None:
    # ── Proposta: objeto + concedente ────────────────────────────────────────
    objeto_por_prop: dict[str, str] = {}
    concedente_por_prop: dict[str, str] = {}
    for row in ler_csv(EXTRACTED / "siconv_proposta_sorocaba.csv"):
        pid = row.get("ID_PROPOSTA", "").strip()
        if not pid:
            continue
        objeto_por_prop[pid] = row.get("OBJETO_PROPOSTA", "").strip()
        # preferir DESC_ORGAO; fallback DESC_ORGAO_SUP
        concedente_por_prop[pid] = (
            row.get("DESC_ORGAO", "").strip() or row.get("DESC_ORGAO_SUP", "").strip()
        )

    # ── Emenda: por ID_PROPOSTA ───────────────────────────────────────────────
    emendas_por_prop: dict[str, list[dict]] = defaultdict(list)
    for row in ler_csv(EXTRACTED / "siconv_emenda_sorocaba.csv"):
        pid = row.get("ID_PROPOSTA", "").strip()
        if pid:
            emendas_por_prop[pid].append(row)

    # ── Empenho: por NR_CONVENIO ─────────────────────────────────────────────
    empenhos_por_conv: dict[str, list[dict]] = defaultdict(list)
    for row in ler_csv(EXTRACTED / "siconv_empenho_sorocaba.csv"):
        nr = row.get("NR_CONVENIO", "").strip()
        if nr:
            empenhos_por_conv[nr].append(row)

    # ── Convênio: base, uma linha por NR_CONVENIO ────────────────────────────
    registros = []
    for row in ler_csv(EXTRACTED / "siconv_convenio_sorocaba.csv"):
        nr = row.get("NR_CONVENIO", "").strip()
        pid = row.get("ID_PROPOSTA", "").strip()
        if not nr:
            continue

        # Emendas deste convênio (via ID_PROPOSTA)
        emendas = emendas_por_prop.get(pid, [])
        parlamentares = sorted({e.get("NOME_PARLAMENTAR", "").strip() for e in emendas} - {""})
        valor_emenda = sum(br_float(e.get("VALOR_REPASSE_EMENDA", "")) for e in emendas)

        # Empenhos deste convênio
        empenhos = empenhos_por_conv.get(nr, [])
        valor_emp = sum(br_float(e.get("VALOR_EMPENHO", "")) for e in empenhos)
        anos_emp = sorted({ano_de_data(e.get("DATA_EMISSAO", "")) for e in empenhos} - {None})

        registros.append({
            "nr_convenio": nr,
            "ano_convenio": row.get("ANO", "").strip(),
            "situacao": row.get("SIT_CONVENIO", "").strip(),
            "data_assinatura": row.get("DIA_ASSIN_CONV", "").strip(),
            "vigencia_inicio": row.get("DIA_INIC_VIGENC_CONV", "").strip(),
            "vigencia_fim": row.get("DIA_FIM_VIGENC_CONV", "").strip(),
            "nr_processo": row.get("NR_PROCESSO", "").strip(),
            "concedente": concedente_por_prop.get(pid, row.get("UG_EMITENTE", "")).strip(),
            "objeto": (objeto_por_prop.get(pid, "")[:200]),
            "valor_global": row.get("VL_GLOBAL_CONV", "").strip(),
            "valor_repasse": row.get("VL_REPASSE_CONV", "").strip(),
            "valor_desembolsado": row.get("VL_DESEMBOLSADO_CONV", "").strip(),
            "valor_empenhado_conv": row.get("VL_EMPENHADO_CONV", "").strip(),
            "tem_emenda": "sim" if emendas else "nao",
            "qtd_emendas": len(emendas),
            "parlamentares": "; ".join(parlamentares),
            "valor_emenda_total": f"{valor_emenda:.2f}" if emendas else "",
            "qtd_empenhos": len(empenhos),
            "valor_empenho_total": f"{valor_emp:.2f}" if empenhos else "",
            "anos_empenho": "; ".join(anos_emp),
        })

    registros.sort(key=lambda r: (r["ano_convenio"] or "0", r["nr_convenio"]))

    campos = [
        "nr_convenio", "ano_convenio", "situacao", "data_assinatura",
        "vigencia_inicio", "vigencia_fim", "nr_processo",
        "concedente", "objeto",
        "valor_global", "valor_repasse", "valor_desembolsado", "valor_empenhado_conv",
        "tem_emenda", "qtd_emendas", "parlamentares", "valor_emenda_total",
        "qtd_empenhos", "valor_empenho_total", "anos_empenho",
    ]

    out = EXTRACTED / "instrumentos_consolidado_sorocaba.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(registros)

    # Estatísticas
    total_conv = len(registros)
    com_emenda = sum(1 for r in registros if r["tem_emenda"] == "sim")
    com_empenho = sum(1 for r in registros if r["qtd_empenhos"])
    nr_unicos_empenho = len(empenhos_por_conv)

    print(f"Saida: {out}")
    print(f"Convenios unicos: {total_conv}")
    print(f"Com emenda parlamentar: {com_emenda}")
    print(f"Com empenho (por NR_CONVENIO): {com_empenho}  (NR_CONVENIOs em empenho: {nr_unicos_empenho})")
    print("Nenhum arquivo foi salvo em data/public.")


if __name__ == "__main__":
    main()
