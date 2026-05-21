"""
Promove emendas CEPA de extracted -> validated, com validacao semantica.

Entrada: data/extracted/sorocaba/cepa/saida/cepa_emendas_sorocaba_2020_2026.csv
Saidas (data/validated/sorocaba/emendas/saida/):
  emendas_cepa_sorocaba_2020_2026.csv          (uma linha por emenda, schema curado)
  emendas_cepa_por_parlamentar_sorocaba.csv    (agregado por parlamentar)

Este arquivo validado ainda nao e publicacao. A copia para data/public exige
revisao explicita: emendas mapeiam parlamentar -> destino -> valor -> execucao,
e um erro de atribuicao seria injusto com o parlamentar.
"""
import csv
from collections import defaultdict
from pathlib import Path

from paths import EXTRACTED_DIR, VALIDATED_DIR

ENTRADA = EXTRACTED_DIR / "cepa" / "saida" / "cepa_emendas_sorocaba_2020_2026.csv"
SAIDA_DIR = VALIDATED_DIR / "emendas" / "saida"

# Schema curado: campos uteis ao cidadao, sem ids internos volumosos.
COLS_PUB = [
    "ano_exercicio", "numero_emenda", "nome_parlamentar", "parlamentar_esfera",
    "esfera", "secretaria", "secretaria_sigla", "descricao", "situacao",
    "valor", "valor_fixado_final_dotacoes", "valor_empenhado",
    "valor_liquidado", "valor_pago", "qtd_dotacoes", "ativo", "bloqueada",
]

TOL = 0.01  # tolerancia de centavos na cadeia de execucao


def num(v: str) -> float:
    try:
        return float(v) if v not in (None, "") else 0.0
    except ValueError:
        return 0.0


def main() -> None:
    with ENTRADA.open(encoding="utf-8", newline="") as f:
        linhas = list(csv.DictReader(f))

    vistos: set[str] = set()
    limpas: list[dict] = []
    descartadas: list[str] = []
    violacoes_cadeia: list[str] = []

    for i, r in enumerate(linhas, start=2):
        ide = r.get("id_emenda", "")
        if ide in vistos:
            continue
        vistos.add(ide)

        if not r.get("ano_exercicio") or not r.get("nome_parlamentar"):
            descartadas.append(f"linha {i}: ano ou parlamentar vazio (emenda {r.get('numero_emenda')})")
            continue

        emp, liq, pago = num(r["valor_empenhado"]), num(r["valor_liquidado"]), num(r["valor_pago"])
        if not (pago <= liq + TOL and liq <= emp + TOL):
            violacoes_cadeia.append(
                f"emenda {r['numero_emenda']} ({r['ano_exercicio']}): "
                f"empenhado={emp:.2f} liquidado={liq:.2f} pago={pago:.2f}"
            )

        limpas.append({k: r.get(k, "") for k in COLS_PUB})

    SAIDA_DIR.mkdir(parents=True, exist_ok=True)

    destino = SAIDA_DIR / "emendas_cepa_sorocaba_2020_2026.csv"
    with destino.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLS_PUB)
        w.writeheader()
        w.writerows(limpas)

    # Agregado por parlamentar (curadoria de quem indicou quanto).
    agg: dict[str, dict] = defaultdict(
        lambda: {"qtd_emendas": 0, "valor": 0.0, "empenhado": 0.0, "liquidado": 0.0, "pago": 0.0}
    )
    for r in limpas:
        a = agg[r["nome_parlamentar"]]
        a["qtd_emendas"] += 1
        a["valor"] += num(r["valor"])
        a["empenhado"] += num(r["valor_empenhado"])
        a["liquidado"] += num(r["valor_liquidado"])
        a["pago"] += num(r["valor_pago"])

    destino_agg = SAIDA_DIR / "emendas_cepa_por_parlamentar_sorocaba.csv"
    with destino_agg.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f, fieldnames=["nome_parlamentar", "qtd_emendas", "valor", "empenhado", "liquidado", "pago"]
        )
        w.writeheader()
        for nome, a in sorted(agg.items(), key=lambda kv: kv[1]["valor"], reverse=True):
            w.writerow({"nome_parlamentar": nome, **{k: round(v, 2) for k, v in a.items()}})

    # Agregado por ano (para linha do tempo na pagina).
    por_ano_agg: dict[str, dict] = defaultdict(
        lambda: {"qtd_emendas": 0, "valor": 0.0, "empenhado": 0.0, "liquidado": 0.0, "pago": 0.0}
    )
    for r in limpas:
        a = por_ano_agg[r["ano_exercicio"]]
        a["qtd_emendas"] += 1
        a["valor"] += num(r["valor"])
        a["empenhado"] += num(r["valor_empenhado"])
        a["liquidado"] += num(r["valor_liquidado"])
        a["pago"] += num(r["valor_pago"])

    destino_ano = SAIDA_DIR / "emendas_cepa_por_ano_sorocaba.csv"
    with destino_ano.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f, fieldnames=["ano", "qtd_emendas", "valor", "empenhado", "liquidado", "pago"]
        )
        w.writeheader()
        for ano, a in sorted(por_ano_agg.items()):
            w.writerow({"ano": ano, **{k: round(v, 2) for k, v in a.items()}})

    # Resumo
    por_ano: dict[str, int] = {ano: a["qtd_emendas"] for ano, a in por_ano_agg.items()}
    total_valor = sum(num(r["valor"]) for r in limpas)
    total_pago = sum(num(r["valor_pago"]) for r in limpas)

    print("=== Validacao emendas CEPA Sorocaba ===")
    print(f"Linhas lidas: {len(linhas)} | emendas unicas validas: {len(limpas)}")
    print(f"Descartadas (campo critico vazio): {len(descartadas)}")
    print(f"Violacoes da cadeia pago<=liquidado<=empenhado: {len(violacoes_cadeia)}")
    print(f"Total indicado: R$ {total_valor:,.2f} | total pago: R$ {total_pago:,.2f}")
    print(f"Parlamentares distintos: {len(agg)}")
    print("Emendas por ano: " + ", ".join(f"{ano}={n}" for ano, n in sorted(por_ano.items())))
    if descartadas:
        print("\n[descartes]")
        for d in descartadas[:10]:
            print("  -", d)
    if violacoes_cadeia:
        print("\n[violacoes de cadeia - amostra]")
        for v in violacoes_cadeia[:10]:
            print("  -", v)
    resultado = "PASS" if not descartadas and not violacoes_cadeia else "WARN"
    print(f"\nResultado: {resultado}")
    print(f"Validado: {destino}")
    print(f"Agregado: {destino_agg}")


if __name__ == "__main__":
    main()
