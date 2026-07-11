#!/usr/bin/env python3
"""
Le o Painel de Monitoramento de Dados Abertos do Poder Executivo Federal (CGU)
e calcula metricas de conformidade nacional, para uso como referencia/contexto
no Anatomia do Gasto (nao substitui dado municipal, e benchmark de contexto).

Fonte: painel.dados.gov.br (export manual pelo usuario em 2026-07-11).
Escopo: apenas orgaos do Poder Executivo Federal (Decreto 8.777/2016).
"""
import csv
import json
import sys
from datetime import datetime
from pathlib import Path

RAW_DIR = Path("data/raw/_nacional/monitoramento_dados_abertos_federal")
OUT_PATH = Path("data/manifests/benchmark_dados_abertos_federal.json")


def normaliza_status(valor):
    valor = valor.strip()
    if valor.upper() == "SEM PDA":
        return "Sem PDA"
    return valor


def parse_data(valor):
    valor = valor.strip()
    if not valor:
        return None
    try:
        return datetime.strptime(valor, "%d/%m/%Y")
    except ValueError:
        return None


def ler_monitoramento(path):
    with open(path, encoding="ISO-8859-1", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        linhas = [row for row in reader]
    for row in linhas:
        row["situacao_pda"] = normaliza_status(row["situacao_pda"])
    return linhas


def ler_cronograma(path):
    with open(path, encoding="ISO-8859-1", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        linhas = [row for row in reader]
    return linhas


def calcula_metricas(monitoramento, cronograma):
    total_orgaos = len(monitoramento)
    contagem_status = {}
    for row in monitoramento:
        s = row["situacao_pda"]
        contagem_status[s] = contagem_status.get(s, 0) + 1

    total_bases = len(cronograma)
    abertas = 0
    atrasadas = 0
    nao_abertas_no_prazo = 0
    sem_previsao = 0

    for row in cronograma:
        previsao = parse_data(row.get("previsao_abertura", ""))
        efetiva = parse_data(row.get("efetiva_abertura", ""))
        if efetiva:
            abertas += 1
            if previsao and efetiva.date() > previsao.date():
                atrasadas += 1
        elif previsao:
            nao_abertas_no_prazo += 1
        else:
            sem_previsao += 1

    return {
        "orgaos": {
            "total": total_orgaos,
            "por_status": contagem_status,
            "pct_pda_publicado": round(
                100 * contagem_status.get("PDA publicado", 0) / total_orgaos, 1
            ) if total_orgaos else None,
        },
        "bases_previstas": {
            "total": total_bases,
            "abertas": abertas,
            "abertas_com_atraso": atrasadas,
            "nao_abertas_com_previsao_vencida_ou_futura": nao_abertas_no_prazo,
            "sem_data_previsao": sem_previsao,
            "pct_abertas": round(100 * abertas / total_bases, 1) if total_bases else None,
        },
    }


def main():
    monitoramento_path = RAW_DIR / "monitoramento_2026-07-11.csv"
    cronograma_path = RAW_DIR / "cronograma_2026-07-11.csv"

    if not monitoramento_path.exists() or not cronograma_path.exists():
        print(f"Arquivos brutos nao encontrados em {RAW_DIR}", file=sys.stderr)
        sys.exit(1)

    monitoramento = ler_monitoramento(monitoramento_path)
    cronograma = ler_cronograma(cronograma_path)
    metricas = calcula_metricas(monitoramento, cronograma)

    resultado = {
        "fonte": "Painel de Monitoramento de Dados Abertos do Poder Executivo Federal (CGU)",
        "escopo": "Apenas orgaos do Poder Executivo Federal (Decreto 8.777/2016 e Resolucao CGINDA 3/2017); nao cobre municipios.",
        "data_extracao": "2026-07-11",
        "metodo": "Export manual do painel pelo usuario; processado por pipelines/analisar_dados_abertos_federal.py",
        "limitacao": "Nao ha vinculo direto com Sorocaba/Paulinia; serve como contexto de conformidade nacional, nao como comparador municipal.",
        "metricas": metricas,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print(json.dumps(resultado, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
