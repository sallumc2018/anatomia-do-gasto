"""
Consolida dados SICONV/Transferegov para publicação.

Entrada:  data/extracted/sorocaba/transferegov/siconv_*.csv
Saída:    data/public/sorocaba/transferencias/saida/convenios_federais_sorocaba.csv
          data/public/sorocaba/transferencias/saida/convenios_por_orgao_sorocaba.csv

Cobertura: 2020-2025 (histórico completo desde 2008 disponível).
Fonte: http://repositorio.dados.gov.br/seges/detru/ (Transferegov/SICONV dados abertos)
"""
import csv
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / "data" / "extracted" / "sorocaba" / "transferegov"
PUBLIC = ROOT / "data" / "public" / "sorocaba" / "transferencias" / "saida"
PUBLIC.mkdir(parents=True, exist_ok=True)

ANOS_PUBLICAR = set(str(a) for a in range(2020, 2026))


def br_float(v: str) -> float:
    if not v or v.strip() in ("", "None"):
        return 0.0
    try:
        return float(v.strip().replace(".", "").replace(",", "."))
    except ValueError:
        return 0.0


def main() -> None:
    conv_path = EXTRACTED / "siconv_convenio_sorocaba.csv"
    desemp_path = EXTRACTED / "siconv_desembolso_sorocaba.csv"
    prop_path = EXTRACTED / "siconv_proposta_sorocaba.csv"

    # ── Lê propostas para obter nome do concedente ──────────────────────────
    concedente_por_proposta: dict[str, str] = {}
    objeto_por_proposta: dict[str, str] = {}
    if prop_path.exists():
        with prop_path.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                pid = row.get("ID_PROPOSTA", "").strip()
                if pid:
                    concedente_por_proposta[pid] = row.get("NM_ORGAO_CONCEDENTE_PROP", "").strip()
                    objeto_por_proposta[pid] = row.get("DS_OBJETO_PROPOSTA", "").strip()

    # ── Lê desembolsos para somar por convênio ───────────────────────────────
    desemp_por_conv: dict[str, float] = defaultdict(float)
    if desemp_path.exists():
        with desemp_path.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                nr = row.get("NR_CONVENIO", "").strip()
                if nr:
                    desemp_por_conv[nr] += br_float(row.get("VL_DESEMBOLSADO", ""))

    # ── Lê convênios ─────────────────────────────────────────────────────────
    registros = []
    if conv_path.exists():
        with conv_path.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                ano = row.get("ANO", "").strip()
                if not ano or ano not in ANOS_PUBLICAR:
                    continue
                nr = row.get("NR_CONVENIO", "").strip()
                pid = row.get("ID_PROPOSTA", "").strip()
                concedente = concedente_por_proposta.get(pid, row.get("UG_EMITENTE", "")).strip()
                objeto = objeto_por_proposta.get(pid, "").strip()
                registros.append({
                    "ano": ano,
                    "nr_convenio": nr,
                    "data_assinatura": row.get("DIA_ASSIN_CONV", "").strip(),
                    "situacao": row.get("SIT_CONVENIO", "").strip(),
                    "concedente": concedente,
                    "objeto": objeto[:200] if objeto else "",
                    "valor_repasse": row.get("VL_REPASSE_CONV", "").strip(),
                    "valor_total": row.get("VL_GLOBAL_CONV", "").strip(),
                    "valor_desembolsado": f"{desemp_por_conv.get(nr, 0):.2f}",
                    "vigencia_inicio": row.get("DIA_INIC_VIGENC_CONV", "").strip(),
                    "vigencia_fim": row.get("DIA_FIM_VIGENC_CONV", "").strip(),
                })

    registros.sort(key=lambda r: (r["ano"], r["nr_convenio"]))

    # ── CSV principal (um registro por convênio, 2020-2025) ──────────────────
    campos = ["ano", "nr_convenio", "data_assinatura", "situacao", "concedente",
              "objeto", "valor_repasse", "valor_total", "valor_desembolsado",
              "vigencia_inicio", "vigencia_fim"]
    out = PUBLIC / "convenios_federais_sorocaba.csv"
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(registros)
    print(f"Convenios: {len(registros)} registros -> {out}")

    # ── CSV agregado por concedente ──────────────────────────────────────────
    por_orgao: dict[tuple, dict] = defaultdict(lambda: {"total": 0, "valor": 0.0})
    for r in registros:
        chave = (r["ano"], r["concedente"])
        por_orgao[chave]["total"] += 1
        por_orgao[chave]["valor"] += br_float(r["valor_repasse"])

    agg = [{"ano": k[0], "concedente": k[1],
            "total_convenios": v["total"], "valor_repasse_total": round(v["valor"], 2)}
           for k, v in sorted(por_orgao.items())]
    agg.sort(key=lambda r: (-float(r["valor_repasse_total"])))

    out2 = PUBLIC / "convenios_por_orgao_sorocaba.csv"
    with out2.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["ano", "concedente", "total_convenios", "valor_repasse_total"])
        w.writeheader()
        w.writerows(agg)
    print(f"Por orgao: {len(agg)} grupos -> {out2}")

    valor_total = sum(br_float(r["valor_repasse"]) for r in registros)
    print(f"Valor total repassado 2020-2025: R$ {valor_total:,.2f}")


if __name__ == "__main__":
    main()
