import json
import os
import re
import pandas as pd
from paths import as_str, SAUDE_EXTRACTED_DIR

NOMES_FUNCAO = {
    'administracao geral': 'Administração Geral',
    'atencao basica': 'Atenção Básica',
    'assistencia hospitalar e ambulatorial': 'Assistência Hospitalar e Ambulatorial',
    'suporte profilatico e terapeutico': 'Suporte Profilático e Terapêutico',
    'vigilancia sanitaria': 'Vigilância Sanitária',
    'vigilancia epidemiologica': 'Vigilância Epidemiológica',
    'alimentacao e nutricao': 'Alimentação e Nutrição',
    'DESPESAS LIQUIDAS DA SAUDE': 'Total Geral',
}

NOMES_QUAD = {1: '1º Quadrimestre', 2: '2º Quadrimestre', 3: '3º Quadrimestre'}

FONTES_POR_AREA = {
    'administracao geral':                    ['proprios'],
    'atencao basica':                         ['proprios', 'federal', 'estadual'],
    'assistencia hospitalar e ambulatorial':  ['proprios', 'federal', 'estadual'],
    'suporte profilatico e terapeutico':      ['proprios', 'federal'],
    'vigilancia sanitaria':                   ['proprios', 'federal'],
    'vigilancia epidemiologica':              ['proprios', 'federal'],
    'alimentacao e nutricao':                 ['proprios'],
    'DESPESAS LIQUIDAS DA SAUDE':             [],
}

LABEL_FONTE = {
    'proprios':  'Rec. Próprios',
    'federal':   'SUS Federal',
    'estadual':  'SUS Estadual',
}

COR_FONTE = {
    'proprios':  '#1a1a2e',
    'federal':   '#3a86ff',
    'estadual':  '#06b98f',
}


def parse_br(valor):
    return float(str(valor).replace('.', '').replace(',', '.'))


def format_br(valor):
    s = f"{valor:,.2f}"
    return s.replace(',', 'X').replace('.', ',').replace('X', '.')


def formatar_funcao(funcao):
    return NOMES_FUNCAO.get(funcao, funcao.title())


def is_total(funcao):
    return funcao.strip().upper() == 'DESPESAS LIQUIDAS DA SAUDE'


def extrair_fontes(json_path):
    """Lê o JSON e retorna (federal_arrecadado, estadual_arrecadado) como strings BR."""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        return '0,00', '0,00'

    federal = estadual = '0,00'
    for page in data['paginas']:
        texto = '\n'.join(page['texto'])
        if 'RECEITAS VINCULADAS DA SAUDE' not in texto:
            continue
        for linha in texto.splitlines():
            nums = re.findall(r'\d{1,3}(?:\.\d{3})*,\d{2}', linha)
            if not nums:
                continue
            if re.search(r'05\s*-\s*TRANSFER.*FEDERAL', linha, re.IGNORECASE):
                federal = nums[-1]
            elif re.search(r'02\s*-\s*TRANSFER.*ESTADUAL', linha, re.IGNORECASE):
                estadual = nums[-1]
        break
    return federal, estadual


def cards_fontes(federal_str, estadual_str, total_pago_str):
    federal   = parse_br(federal_str)
    estadual  = parse_br(estadual_str)
    total     = parse_br(total_pago_str)
    proprios  = max(total - federal - estadual, 0)

    def card(titulo, valor, cor, descricao):
        return f"""
        <div class="card-fonte" style="border-top:4px solid {cor}">
          <div class="card-titulo">{titulo}</div>
          <div class="card-valor">R$ {format_br(valor)}</div>
          <div class="card-desc">{descricao}</div>
        </div>"""

    return (
        card('Recursos Próprios', proprios, '#1a1a2e',
             'Impostos municipais (IPTU, ISS, ITBI, IRRF) e dívida ativa') +
        card('SUS Federal', federal, '#3a86ff',
             'Repasses do Ministério da Saúde (atenção primária, especializada, vigilância, farmácia)') +
        card('SUS Estadual', estadual, '#06b98f',
             'Transferências do Estado de São Paulo via SUS')
    )


def pills_fontes(funcao):
    chaves = FONTES_POR_AREA.get(funcao, [])
    pills = ''
    for c in chaves:
        pills += f'<span class="pill" style="background:{COR_FONTE[c]}">{LABEL_FONTE[c]}</span>'
    return pills


def linhas_tabela(df_q):
    linhas = []
    for _, row in df_q.iterrows():
        funcao  = row['Funcao']
        nome    = formatar_funcao(funcao)
        classe  = 'linha-total' if is_total(funcao) else ''
        fontes  = pills_fontes(funcao)
        linhas.append(f"""
        <tr class="{classe}">
          <td>{nome}<br><span class="fontes-cell">{fontes}</span></td>
          <td class="valor">R$ {row['Dotacao_Atualizada']}</td>
          <td class="valor">R$ {row['Empenhada']}</td>
          <td class="valor">R$ {row['Liquidada']}</td>
          <td class="valor">R$ {row['Paga']}</td>
        </tr>""")
    return ''.join(linhas)


def gerar_html(df, fontes_por_quad, ano=2025):
    abas = []
    conteudos = []

    for q in [1, 2, 3]:
        df_q = df[df['Quadrimestre'] == q]
        ativo = 'active' if q == 1 else ''

        total_row = df_q[df_q['Funcao'].str.upper() == 'DESPESAS LIQUIDAS DA SAUDE']
        total_pago = total_row['Paga'].values[0] if len(total_row) else '0,00'

        federal_str, estadual_str = fontes_por_quad.get(q, ('0,00', '0,00'))
        cards = cards_fontes(federal_str, estadual_str, total_pago)

        abas.append(
            f'<button class="tab-btn {ativo}" onclick="mostrarAba({q})" id="btn-{q}">'
            f'{NOMES_QUAD[q]}</button>'
        )
        conteudos.append(f"""
      <div class="tab-content {'active' if q == 1 else ''}" id="quad-{q}">

        <div class="fontes-section">
          <h2 class="section-title">De onde vem o dinheiro?</h2>
          <div class="cards-fontes">{cards}
          </div>
          <p class="nota">Valores acumulados de janeiro até o fim do quadrimestre.
          A atribuição de fontes por área é uma estimativa baseada nos blocos de repasse do SUS — o relatório oficial não detalha esse vínculo por área.</p>
        </div>

        <h2 class="section-title" style="margin-top:32px">Como foi gasto?</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Área</th>
                <th title="Valor total previsto no orçamento">Orçamento</th>
                <th title="Valor comprometido para pagamento">Empenhado</th>
                <th title="Valor do serviço já entregue">Liquidado</th>
                <th title="Valor efetivamente pago">Pago</th>
              </tr>
            </thead>
            <tbody>{linhas_tabela(df_q)}
            </tbody>
          </table>
        </div>

      </div>""")

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cidadão Nota 10 — Saúde Sorocaba 2025</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f4f6f9;
      color: #1a1a2e;
    }}

    header {{
      background: #1a1a2e;
      color: white;
      padding: 24px 32px;
    }}
    header h1 {{ font-size: 1.5rem; font-weight: 700; }}
    header p  {{ margin-top: 6px; font-size: 0.9rem; opacity: 0.75; }}
    .voltar {{
      display: inline-block;
      color: rgba(255,255,255,0.6);
      font-size: 0.82rem;
      text-decoration: none;
      margin-bottom: 10px;
    }}
    .voltar:hover {{ color: white; }}

    .container {{ max-width: 1100px; margin: 0 auto; padding: 32px 16px; }}

    .legenda {{
      background: white;
      border-left: 4px solid #3a86ff;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 28px;
      font-size: 0.88rem;
      line-height: 1.8;
    }}
    .legenda strong {{ display: inline-block; min-width: 90px; }}

    .tabs {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 0;
    }}

    .tab-btn {{
      padding: 10px 20px;
      border: none;
      border-radius: 8px 8px 0 0;
      background: #d0d7e6;
      color: #444;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      transition: background 0.15s;
    }}
    .tab-btn.active, .tab-btn:hover {{
      background: white;
      color: #1a1a2e;
    }}

    .tab-content {{
      display: none;
      background: white;
      border-radius: 0 8px 8px 8px;
      padding: 28px 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }}
    .tab-content.active {{ display: block; }}

    .section-title {{
      font-size: 1rem;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}

    .cards-fontes {{
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }}

    .card-fonte {{
      flex: 1;
      min-width: 220px;
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px 18px;
    }}
    .card-titulo {{ font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #555; margin-bottom: 6px; }}
    .card-valor  {{ font-size: 1.15rem; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }}
    .card-desc   {{ font-size: 0.8rem; color: #777; line-height: 1.4; }}

    .nota {{
      font-size: 0.78rem;
      color: #999;
      line-height: 1.5;
      margin-top: 8px;
    }}

    .table-wrap {{ overflow-x: auto; }}

    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }}
    thead tr {{
      background: #1a1a2e;
      color: white;
    }}
    th, td {{
      padding: 12px 14px;
      text-align: left;
    }}
    th {{ font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }}
    td.valor {{ text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }}

    tbody tr:nth-child(even) {{ background: #f8fafc; }}
    tbody tr:hover {{ background: #eef2ff; }}

    .linha-total td {{
      font-weight: 700;
      background: #eef2ff !important;
      border-top: 2px solid #3a86ff;
    }}

    .fontes-cell {{ margin-top: 5px; display: flex; flex-wrap: wrap; gap: 4px; }}

    .pill {{
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 600;
      color: white;
      padding: 2px 7px;
      border-radius: 20px;
      white-space: nowrap;
    }}

    footer {{
      text-align: center;
      font-size: 0.8rem;
      color: #aaa;
      padding: 32px 16px;
    }}

    @media (max-width: 640px) {{
      th, td {{ padding: 10px 8px; font-size: 0.78rem; }}
      .card-fonte {{ min-width: 100%; }}
      header h1 {{ font-size: 1.15rem; }}
    }}
  </style>
</head>
<body>

<header>
  <a class="voltar" href="index.html">← Início</a>
  <h1>Cidadão Nota 10 — Saúde Sorocaba {ano}</h1>
  <p>Despesas com saúde por área — Relatórios de Aplicação da LRF</p>
</header>

<div class="container">

  <div class="legenda">
    <strong>Orçamento:</strong> valor total previsto para gastar no período.<br>
    <strong>Empenhado:</strong> valor já comprometido (reservado para pagamento).<br>
    <strong>Liquidado:</strong> valor cujo serviço ou bem já foi entregue.<br>
    <strong>Pago:</strong> valor efetivamente transferido ao fornecedor.
  </div>

  <div class="tabs">{''.join(abas)}</div>
  {''.join(conteudos)}

</div>

<footer>Dados extraídos dos Relatórios de Aplicação da LRF — Prefeitura de Sorocaba/SP · Cidadão Nota 10</footer>

<script>
  function mostrarAba(q) {{
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('quad-' + q).classList.add('active');
    document.getElementById('btn-' + q).classList.add('active');
  }}
</script>

</body>
</html>"""


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Gera o HTML de despesas de saude de Sorocaba')
    parser.add_argument('--ano', type=int, default=2025, help='Ano a processar (padrao: 2025)')
    args = parser.parse_args()

    ano = args.ano
    quadrimestres = ['primeiro', 'segundo', 'terceiro']

    diretorio_script  = os.path.dirname(os.path.abspath(__file__))
    intermediario_dir = as_str(SAUDE_EXTRACTED_DIR / "intermediario")
    saida_dir         = as_str(SAUDE_EXTRACTED_DIR / "saida")

    csv_path  = os.path.join(saida_dir, f'despesas_saude_sorocaba_{ano}.csv')
    html_path = os.path.join(saida_dir, f'despesas_saude_sorocaba_{ano}.html')

    if not os.path.exists(csv_path):
        print(f'CSV nao encontrado: {csv_path}')
        print(f'Execute antes: python extrator_saude.py --ano {ano}')
        return

    df = pd.read_csv(csv_path, encoding='utf-8-sig')

    nomes_pdf = {
        q + 1: f'{ano}-{quad}-quadrimestre-relatorios-de-aplicacao-na-saude.pdf.json'
        for q, quad in enumerate(quadrimestres)
    }

    fontes_por_quad = {}
    for q, nome in nomes_pdf.items():
        json_path = os.path.join(intermediario_dir, nome)
        fontes_por_quad[q] = extrair_fontes(json_path)

    html = gerar_html(df, fontes_por_quad, ano)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f'HTML gerado em: {html_path}')


if __name__ == '__main__':
    main()
