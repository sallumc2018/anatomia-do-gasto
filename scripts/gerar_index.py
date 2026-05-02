"""
Gera index.html na pasta saida/ listando todos os relatórios disponíveis.
Chamado automaticamente pelo pipeline após cada geração de HTML.

Uso:
    python gerar_index.py
"""
import os
import re

DIRETORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))
SAIDA_DIR        = os.path.abspath(os.path.join(DIRETORIO_SCRIPT, '..', 'sorocaba', 'saude', 'saida'))


def descobrir_relatorios():
    """Varre saida/ e retorna lista de (ano, nome_arquivo) ordenada por ano desc."""
    relatorios = []
    for arquivo in os.listdir(SAIDA_DIR):
        match = re.match(r'despesas_saude_sorocaba_(\d{4})\.html$', arquivo)
        if match:
            ano = int(match.group(1))
            relatorios.append((ano, arquivo))
    return sorted(relatorios, reverse=True)


def cards_html(relatorios):
    if not relatorios:
        return '<p class="vazio">Nenhum relatório disponível ainda.</p>'

    cards = []
    for ano, arquivo in relatorios:
        cards.append(f"""
    <a class="card" href="{arquivo}">
      <div class="card-ano">{ano}</div>
      <div class="card-label">Ver relatório →</div>
    </a>""")
    return ''.join(cards)


def gerar_index(relatorios):
    cards = cards_html(relatorios)
    anos_disponiveis = ', '.join(str(a) for a, _ in relatorios)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cidadão Nota 10 — Sorocaba</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f4f6f9;
      color: #1a1a2e;
      min-height: 100vh;
    }}

    header {{
      background: #1a1a2e;
      color: white;
      padding: 32px;
    }}
    header h1 {{ font-size: 1.6rem; font-weight: 700; }}
    header p  {{ margin-top: 8px; font-size: 0.9rem; opacity: 0.7; }}

    .container {{ max-width: 900px; margin: 0 auto; padding: 40px 16px; }}

    .breadcrumb {{
      font-size: 0.82rem;
      color: #888;
      margin-bottom: 28px;
    }}
    .breadcrumb span {{ color: #1a1a2e; font-weight: 600; }}

    .secao-titulo {{
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      margin-bottom: 14px;
    }}

    .cards {{
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }}

    .card {{
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: white;
      border-radius: 10px;
      padding: 24px 28px;
      min-width: 160px;
      text-decoration: none;
      color: #1a1a2e;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      border-top: 4px solid #3a86ff;
      transition: transform 0.15s, box-shadow 0.15s;
    }}
    .card:hover {{
      transform: translateY(-3px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.12);
    }}
    .card-ano   {{ font-size: 2rem; font-weight: 800; }}
    .card-label {{ margin-top: 12px; font-size: 0.82rem; color: #3a86ff; font-weight: 600; }}

    .vazio {{ color: #aaa; font-size: 0.9rem; }}

    footer {{
      text-align: center;
      font-size: 0.78rem;
      color: #aaa;
      padding: 40px 16px;
    }}

    @media (max-width: 480px) {{
      header h1 {{ font-size: 1.2rem; }}
      .card {{ min-width: 100%; }}
    }}
  </style>
</head>
<body>

<header>
  <h1>Cidadão Nota 10</h1>
  <p>Transparência pública com linguagem acessível</p>
</header>

<div class="container">

  <div class="breadcrumb">
    Sorocaba / SP &rsaquo; <span>Saúde</span>
  </div>

  <div class="secao-titulo">Relatórios disponíveis — {anos_disponiveis}</div>

  <div class="cards">{cards}
  </div>

</div>

<footer>Dados extraídos dos Relatórios de Aplicação da LRF — Prefeitura de Sorocaba/SP · Cidadão Nota 10</footer>

</body>
</html>"""


def main():
    relatorios = descobrir_relatorios()
    html = gerar_index(relatorios)

    index_path = os.path.join(SAIDA_DIR, 'index.html')
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f'Index gerado em: {index_path}')
    print(f'Relatorios listados: {[a for a, _ in relatorios]}')


if __name__ == '__main__':
    main()
