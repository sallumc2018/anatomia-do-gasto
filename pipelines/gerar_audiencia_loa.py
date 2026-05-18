"""
Gera CSVs de audiencia publica LOA 2022-2026 a partir dos dados
extraidos visualmente dos PDFs relatorio_loa_{ano}.pdf.

Fonte: fazenda.sorocaba.sp.gov.br/transparencia -> Relatorios de Audiencia Publica LOA
Metodologia: leitura visual dos graficos via modelo multimodal; valores com
marcacao 'est' sao estimados a partir de proporcao visual (+/-2pp).
Nota: 2020-2021 nao publicados no portal (serie historica comeca em 2022).
Nota: 2026 usa eixos estrategicos; percentuais globais calculados como
      (% eixo global) x (% area dentro do eixo). Sem dados por regiao por area.

Schema de saida:
  ano, regiao, area, percentual, n_formularios_regiao, n_formularios_total,
  n_propostas_total, qualidade_dado, fonte_arquivo
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "extracted" / "sorocaba" / "loa" / "saida"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CAMPOS = [
    "ano", "regiao", "area", "percentual",
    "n_formularios_regiao", "n_formularios_total", "n_propostas_total",
    "qualidade_dado", "fonte_arquivo",
]

# ---------------------------------------------------------------------------
# Dados extraidos por leitura visual dos PDFs
# qualidade: 'exato' = numero legivel no grafico/tabela; 'est' = estimado visualmente
# ---------------------------------------------------------------------------

LOA_2022 = {
    "n_formularios_total": 140,
    "n_propostas_total": None,
    "fonte": "relatorio_loa_2022.pdf",
    # 2022 usa scores 1-5 por eixo, nao percentual por area.
    # O ranking global dos eixos e o unico dado agregado disponivel com precisao.
    # 'percentual' aqui representa a posicao no ranking (1=mais prioritario).
    "dados": [
        # regiao, area, percentual_ou_ranking, n_forms_regiao, qualidade
        ("Total", "Cidade Humanizada", 1, None, "exato"),
        ("Total", "Eixo Inovadora", 2, None, "exato"),
        ("Total", "Gestao e Transparencia", 3, None, "exato"),
        ("Total", "Cidade Urbanizada", 4, None, "exato"),
    ],
}

LOA_2023 = {
    "n_formularios_total": 200,
    "n_propostas_total": 200,
    "fonte": "relatorio_loa_2023.pdf",
    "dados": [
        # Global (tabela pagina 2)
        ("Total", "Educacao", 33.0, None, "exato"),
        ("Total", "Transito, Transporte, Sistema Viario e Politica Urbana", 18.0, None, "exato"),
        ("Total", "Saude", 12.0, None, "exato"),
        ("Total", "Meio Ambiente", 12.0, None, "exato"),
        ("Total", "Seguranca Urbana", 6.0, None, "exato"),
        ("Total", "Cultura", 5.0, None, "exato"),
        ("Total", "Zeladoria dos Espacos Publicos", 5.0, None, "exato"),
        ("Total", "Esporte", 4.0, None, "exato"),
        ("Total", "Sistema de Abastecimento de Agua, Esgoto e Drenagem", 2.0, None, "exato"),
        ("Total", "Modernizacao e Inovacao Tecnologica", 2.0, None, "exato"),
        ("Total", "Assistencia Social e Defesa de Direitos", 1.0, None, "exato"),
        ("Total", "Producao Habitacional e Regularizacao Fundiaria", 1.0, None, "exato"),
        ("Total", "Gestao, Controle e Transparencia Publica", 1.0, None, "exato"),
        ("Total", "Trabalho e Renda", 1.0, None, "exato"),
        # Centro (16 formularios)
        ("Centro", "Educacao", 31.0, 16, "exato"),
        ("Centro", "Saude", 25.0, 16, "exato"),
        ("Centro", "Cultura", 13.0, 16, "exato"),
        ("Centro", "Meio Ambiente", 13.0, 16, "exato"),
        ("Centro", "Producao Habitacional e Regularizacao Fundiaria", 6.0, 16, "exato"),
        ("Centro", "Seguranca Urbana", 6.0, 16, "exato"),
        ("Centro", "Zeladoria dos Espacos Publicos", 6.0, 16, "exato"),
        # Leste (42 formularios)
        ("Leste", "Educacao", 38.0, 42, "exato"),
        ("Leste", "Meio Ambiente", 14.0, 42, "exato"),
        ("Leste", "Transito, Transporte, Sistema Viario e Politica Urbana", 14.0, 42, "exato"),
        ("Leste", "Saude", 10.0, 42, "exato"),
        ("Leste", "Producao Habitacional e Regularizacao Fundiaria", 7.0, 42, "exato"),
        ("Leste", "Zeladoria dos Espacos Publicos", 7.0, 42, "exato"),
        ("Leste", "Seguranca Urbana", 5.0, 42, "exato"),
        ("Leste", "Esporte", 3.0, 42, "exato"),
        ("Leste", "Modernizacao e Inovacao Tecnologica", 2.0, 42, "exato"),
        # Norte (83 formularios)
        ("Norte", "Educacao", 39.0, 83, "exato"),
        ("Norte", "Saude", 16.0, 83, "exato"),
        ("Norte", "Transito, Transporte, Sistema Viario e Politica Urbana", 11.0, 83, "exato"),
        ("Norte", "Meio Ambiente", 9.0, 83, "exato"),
        ("Norte", "Cultura", 7.0, 83, "est"),
        ("Norte", "Seguranca Urbana", 7.0, 83, "est"),
        ("Norte", "Esporte", 4.0, 83, "est"),
        ("Norte", "Modernizacao e Inovacao Tecnologica", 2.0, 83, "est"),
        ("Norte", "Sistema de Abastecimento de Agua, Esgoto e Drenagem", 2.0, 83, "est"),
        ("Norte", "Assistencia Social e Defesa de Direitos", 1.0, 83, "est"),
        ("Norte", "Gestao, Controle e Transparencia Publica", 1.0, 83, "est"),
        ("Norte", "Producao Habitacional e Regularizacao Fundiaria", 1.0, 83, "est"),
        ("Norte", "Trabalho e Renda", 1.0, 83, "est"),
        # Oeste (49 formularios)
        ("Oeste", "Educacao", 23.0, 49, "exato"),
        ("Oeste", "Transito, Transporte, Sistema Viario e Politica Urbana", 17.0, 49, "exato"),
        ("Oeste", "Saude", 16.0, 49, "exato"),
        ("Oeste", "Meio Ambiente", 10.0, 49, "exato"),
        ("Oeste", "Zeladoria dos Espacos Publicos", 8.0, 49, "exato"),
        ("Oeste", "Esporte", 6.0, 49, "est"),
        ("Oeste", "Seguranca Urbana", 6.0, 49, "est"),
        ("Oeste", "Cultura", 4.0, 49, "est"),
        ("Oeste", "Assistencia Social e Defesa de Direitos", 2.0, 49, "exato"),
        ("Oeste", "Gestao, Controle e Transparencia Publica", 2.0, 49, "exato"),
        # Sul (10 formularios)
        ("Sul", "Transito, Transporte, Sistema Viario e Politica Urbana", 50.0, 10, "exato"),
        ("Sul", "Educacao", 20.0, 10, "exato"),
        ("Sul", "Cultura", 10.0, 10, "exato"),
        ("Sul", "Meio Ambiente", 10.0, 10, "exato"),
        ("Sul", "Seguranca Urbana", 10.0, 10, "exato"),
    ],
}

LOA_2024 = {
    "n_formularios_total": 163,
    "n_propostas_total": 414,
    "fonte": "relatorio_loa_2024.pdf",
    "dados": [
        # Global (tabela pagina 16 + descricao textual)
        ("Total", "Esporte", 24.88, None, "exato"),
        ("Total", "Zeladoria dos Espacos Publicos", 19.32, None, "exato"),
        ("Total", "Transito, Transporte, Sistema Viario e Politica Urbana", 16.00, None, "exato"),
        ("Total", "Saude", 14.49, None, "exato"),
        ("Total", "Seguranca Urbana", 4.11, None, "exato"),
        ("Total", "Assistencia Social e Defesa de Direitos", 2.17, None, "exato"),
        ("Total", "Educacao", 1.69, None, "exato"),
        ("Total", "Cultura", 1.21, None, "exato"),
        ("Total", "Gestao, Controle e Transparencia Publica", 0.97, None, "exato"),
        ("Total", "Trabalho e Renda", 0.72, None, "exato"),
        # Nota: ~14,44% nao identificado na descricao textual (possivelmente
        # Modernizacao e Inovacao Tecnologica e/ou Meio Ambiente na tabela)
        # Centro (Grafico 2, pagina 17)
        ("Centro", "Esporte", 28.57, None, "exato"),
        ("Centro", "Zeladoria dos Espacos Publicos", 19.05, None, "exato"),
        ("Centro", "Saude", 14.29, None, "exato"),
        ("Centro", "Transito, Transporte, Sistema Viario e Politica Urbana", 14.29, None, "exato"),
        ("Centro", "Cultura", 11.90, None, "exato"),
        ("Centro", "Modernizacao e Inovacao Tecnologica", 4.76, None, "exato"),
        ("Centro", "Seguranca Urbana", 4.76, None, "exato"),
        ("Centro", "Assistencia Social e Defesa de Direitos", 2.38, None, "exato"),
        # Leste (Grafico 3, pagina 17)
        ("Leste", "Zeladoria dos Espacos Publicos", 24.44, None, "exato"),
        ("Leste", "Transito, Transporte, Sistema Viario e Politica Urbana", 17.78, None, "exato"),
        ("Leste", "Esporte", 16.67, None, "est"),
        ("Leste", "Saude", 14.44, None, "est"),
        ("Leste", "Educacao", 14.44, None, "exato"),
        ("Leste", "Seguranca Urbana", 4.44, None, "est"),
        ("Leste", "Modernizacao e Inovacao Tecnologica", 2.22, None, "exato"),
        ("Leste", "Assistencia Social e Defesa de Direitos", 1.11, None, "exato"),
        ("Leste", "Gestao, Controle e Transparencia Publica", 1.11, None, "exato"),
        ("Leste", "Trabalho e Renda", 1.11, None, "exato"),
        # Norte (Grafico 4, pagina 18)
        ("Norte", "Esporte", 25.63, None, "exato"),
        ("Norte", "Zeladoria dos Espacos Publicos", 20.00, None, "est"),
        ("Norte", "Transito, Transporte, Sistema Viario e Politica Urbana", 18.75, None, "est"),
        ("Norte", "Saude", 16.75, None, "est"),
        ("Norte", "Seguranca Urbana", 6.75, None, "est"),
        ("Norte", "Modernizacao e Inovacao Tecnologica", 4.44, None, "est"),
        ("Norte", "Assistencia Social e Defesa de Direitos", 2.50, None, "est"),
        ("Norte", "Meio Ambiente", 0.62, None, "est"),
        ("Norte", "Educacao", 1.25, None, "est"),
        # Oeste (Grafico 5, pagina 18)
        ("Oeste", "Esporte", 25.28, None, "exato"),
        ("Oeste", "Zeladoria dos Espacos Publicos", 28.32, None, "est"),
        ("Oeste", "Transito, Transporte, Sistema Viario e Politica Urbana", 14.74, None, "exato"),
        ("Oeste", "Saude", 11.59, None, "est"),
        ("Oeste", "Seguranca Urbana", 6.32, None, "est"),
        ("Oeste", "Educacao", 4.21, None, "est"),
        ("Oeste", "Assistencia Social e Defesa de Direitos", 3.16, None, "est"),
        ("Oeste", "Modernizacao e Inovacao Tecnologica", 2.16, None, "est"),
        ("Oeste", "Cultura", 1.05, None, "est"),
        ("Oeste", "Trabalho e Renda", 1.08, None, "est"),
        # Sul (Grafico 6, pagina 19)
        ("Sul", "Saude", 37.38, None, "exato"),
        ("Sul", "Seguranca Urbana", 14.69, None, "exato"),
        ("Sul", "Mobilidade Urbana", 14.69, None, "exato"),
        ("Sul", "Transito, Transporte, Sistema Viario e Politica Urbana", 7.42, None, "exato"),
        ("Sul", "Modernizacao e Inovacao Tecnologica", 5.75, None, "exato"),
        ("Sul", "Zeladoria dos Espacos Publicos", 5.73, None, "exato"),
        ("Sul", "Meio Ambiente", 4.09, None, "exato"),
        ("Sul", "Gestao, Controle e Transparencia Publica", 4.09, None, "exato"),
    ],
}

LOA_2025 = {
    "n_formularios_total": 100,
    "n_propostas_total": 277,
    "fonte": "relatorio_loa_2025.pdf",
    "dados": [
        # Centro (Grafico 2, pagina 31)
        ("Centro", "Seguranca Urbana", 42.85, 7, "exato"),
        ("Centro", "Educacao", 28.57, 7, "exato"),
        ("Centro", "Saude", 14.29, 7, "exato"),
        ("Centro", "Transito, Transporte, Sistema Viario e Politica Urbana", 14.29, 7, "exato"),
        # Leste (Grafico 3, pagina 31)
        ("Leste", "Seguranca Urbana", 25.0, 20, "exato"),
        ("Leste", "Educacao", 20.0, 20, "exato"),
        ("Leste", "Saude", 20.0, 20, "exato"),
        ("Leste", "Transito, Transporte, Sistema Viario e Politica Urbana", 15.0, 20, "exato"),
        ("Leste", "Cultura", 5.0, 20, "exato"),
        ("Leste", "Gestao, Controle e Transparencia Publica", 5.0, 20, "exato"),
        ("Leste", "Meio Ambiente", 5.0, 20, "exato"),
        ("Leste", "Zeladoria dos Espacos Publicos", 5.0, 20, "exato"),
        # Norte (Grafico 4, pagina 32)
        ("Norte", "Zeladoria dos Espacos Publicos", 31.38, 38, "exato"),
        ("Norte", "Transito, Transporte, Sistema Viario e Politica Urbana", 28.95, 38, "exato"),
        ("Norte", "Meio Ambiente", 13.04, 38, "exato"),
        ("Norte", "Modernizacao e Inovacao Tecnologica", 2.67, 38, "exato"),
        ("Norte", "Esporte", 8.0, 38, "est"),
        ("Norte", "Seguranca Urbana", 6.0, 38, "est"),
        ("Norte", "Saude", 5.0, 38, "est"),
        ("Norte", "Educacao", 5.0, 38, "est"),
        # Oeste (Grafico 5, pagina 32)
        ("Oeste", "Zeladoria dos Espacos Publicos", 33.33, 27, "exato"),
        ("Oeste", "Transito, Transporte, Sistema Viario e Politica Urbana", 13.57, 27, "exato"),
        ("Oeste", "Saude", 5.37, 27, "est"),
        ("Oeste", "Educacao", 1.79, 27, "est"),
        ("Oeste", "Assistencia Social e Defesa de Direitos", 1.76, 27, "est"),
        ("Oeste", "Sistema de Abastecimento de Agua, Esgoto e Drenagem", 10.0, 27, "est"),
        ("Oeste", "Meio Ambiente", 12.0, 27, "est"),
        ("Oeste", "Esporte", 12.0, 27, "est"),
        ("Oeste", "Seguranca Urbana", 10.0, 27, "est"),
        # Sul (Grafico 6, pagina 33)
        ("Sul", "Transito, Transporte, Sistema Viario e Politica Urbana", 62.50, 8, "exato"),
        ("Sul", "Educacao", 12.50, 8, "exato"),
        ("Sul", "Meio Ambiente", 12.50, 8, "exato"),
        ("Sul", "Seguranca Urbana", 12.50, 8, "exato"),
    ],
}

LOA_2026 = {
    "n_formularios_total": None,
    "n_propostas_total": None,
    "fonte": "relatorio_loa_2026.pdf",
    # Schema diferente de 2022-2025: relatório organizado por eixos estratégicos.
    # Percentuais globais calculados: (% eixo global) x (% área dentro do eixo).
    # Fontes exatas: texto dos gráficos 7-10, pgs 25-26. Eixos globais: gráfico 2, pg 23.
    # Eixo global: Humanizada 34,56% | Inovadora 21,89% | Gestao 21,83% | Urbanizada 21,64%
    "dados": [
        # regiao, area, percentual_global_calculado, n_forms_regiao, qualidade
        # Cidade Humanizada (34,56% global): Saude 20,98% | Educ 20,48% | AssocSoc 20,24% | Cultura 19,27% | Esporte 19,02%
        ("Total", "Saude", 7.25, None, "est"),
        ("Total", "Educacao", 7.08, None, "est"),
        ("Total", "Assistencia Social e Defesa de Direitos", 7.00, None, "est"),
        ("Total", "Cultura e Turismo", 6.66, None, "est"),
        ("Total", "Esporte", 6.57, None, "est"),
        # Cidade Urbanizada (21,64% global): Zeladoria 35,94% | Transito 33,59% | Habitacao 30,47%
        ("Total", "Zeladoria dos Espacos Publicos", 7.78, None, "est"),
        ("Total", "Transito, Transporte, Sistema Viario e Politica Urbana", 7.27, None, "est"),
        ("Total", "Producao Habitacional e Regularizacao Fundiaria", 6.59, None, "est"),
        # Cidade com Gestao e Transparencia (21,83% global): Atend 34,81% | Gestao 34,17% | Seg 31,02%
        ("Total", "Atendimento ao Cidadao", 7.60, None, "est"),
        ("Total", "Gestao Integrada, Controle e Transparencia Publica", 7.46, None, "est"),
        ("Total", "Seguranca Urbana", 6.77, None, "est"),
        # Cidade Inovadora, Tecnologica e Sustentavel (21,89% global): MeioAmb 34,79% | Inov 33,59% | Trab 31,46%
        ("Total", "Meio Ambiente", 7.62, None, "est"),
        ("Total", "Modernizacao e Inovacao Tecnologica", 7.35, None, "est"),
        ("Total", "Trabalho, Empreendedorismo e Desenvolvimento Economico", 6.89, None, "est"),
    ],
}

ANOS = {2022: LOA_2022, 2023: LOA_2023, 2024: LOA_2024, 2025: LOA_2025, 2026: LOA_2026}


def gerar_csv(ano: int, config: dict) -> Path:
    saida = OUT_DIR / f"audiencia_loa_sorocaba_{ano}.csv"
    total_forms = config["n_formularios_total"]
    total_prop = config["n_propostas_total"]
    fonte = config["fonte"]

    with saida.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS)
        writer.writeheader()
        for regiao, area, pct, forms_reg, qualidade in config["dados"]:
            writer.writerow({
                "ano": ano,
                "regiao": regiao,
                "area": area,
                "percentual": pct,
                "n_formularios_regiao": forms_reg if forms_reg is not None else "",
                "n_formularios_total": total_forms,
                "n_propostas_total": total_prop if total_prop is not None else "",
                "qualidade_dado": qualidade,
                "fonte_arquivo": fonte,
            })

    return saida


def main():
    for ano, config in sorted(ANOS.items()):
        path = gerar_csv(ano, config)
        count = sum(1 for _ in open(path, encoding="utf-8")) - 1
        print(f"LOA {ano}: {count} registros -> {path.name}")


if __name__ == "__main__":
    main()
