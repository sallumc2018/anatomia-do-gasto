"""
Extrai dados dos PDFs de Aplicação no Ensino (CN-SIFPM) de Sorocaba.

Estrutura extraída (página 1 do PDF):
  - Receitas de impostos (próprios, federais, estaduais, líquidas)
  - Despesas Líquidas: Ensino Fundamental + Educação Infantil + TOTAL
  - Aplicação mínima constitucional (25%)

Uso:
    python extrator_educacao.py --ano 2025
"""
import argparse
import csv
import os
import re
import sys
from paths import as_str, EDUCACAO_RAW_DIR, EDUCACAO_EXTRACTED_DIR

SCRIPTS_DIR  = os.path.dirname(os.path.abspath(__file__))
ENTRADA_DIR  = as_str(EDUCACAO_RAW_DIR / "entrada")
SAIDA_DIR    = as_str(EDUCACAO_EXTRACTED_DIR / "saida")


# ── Helpers ───────────────────────────────────────────────────────────────────

def normalizar(texto):
    """Remove acentos e normaliza espaços."""
    import unicodedata
    texto = unicodedata.normalize('NFD', texto)
    texto = ''.join(c for c in texto if unicodedata.category(c) != 'Mn')
    return ' '.join(texto.split()).upper()


def parse_br(s):
    """Converte '1.234.567,89' → 1234567.89"""
    s = s.replace('.', '').replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return 0.0


def formatar_br(v):
    """Formata float como string BR para CSV."""
    return f"{v:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')


def extrair_texto_pagina1(pdf_path):
    import pdfplumber
    with pdfplumber.open(pdf_path) as pdf:
        texto = (pdf.pages[0].extract_text() or "") if pdf.pages else ""
    if re.search(r'abacoroS|ONISNE\b', texto):
        texto = "\n".join(linha[::-1] for linha in texto.splitlines())
    return texto


# ── Extração de receitas ──────────────────────────────────────────────────────

RE_PROPRIOS      = re.compile(r'Proprios\s+([\d.,]+)\s+([\d.,]+)')
RE_TRANSF_UNIAO  = re.compile(r'Transferencias da Uniao\s+([\d.,]+)\s+([\d.,]+)')
RE_TRANSF_EST    = re.compile(r'Transferencias do Estado\s+([\d.,]+)\s+([\d.,]+)')
RE_RETENCOES     = re.compile(r'Retencoes ao FUNDEB\s+([\d.,]+)\s+([\d.,]+)')
RE_REC_LIQ       = re.compile(r'Receitas Liquidas\s+([\d.,]+)\s+([\d.,]+)')
RE_MINIMO        = re.compile(r'TOTAL\s*\(\s*25%\s*\)\s+([\d.,]+)\s+([\d.,]+)')


def extrair_receitas(texto):
    """Extrai dados de receitas da página 1."""
    def g(pattern):
        m = pattern.search(texto)
        return (parse_br(m.group(1)), parse_br(m.group(2))) if m else (0.0, 0.0)

    prop_prev,  prop_arr   = g(RE_PROPRIOS)
    fed_prev,   fed_arr    = g(RE_TRANSF_UNIAO)
    est_prev,   est_arr    = g(RE_TRANSF_EST)
    ret_prev,   ret_arr    = g(RE_RETENCOES)
    liq_prev,   liq_arr    = g(RE_REC_LIQ)
    min_prev,   min_arr    = g(RE_MINIMO)

    total_prev = prop_prev + fed_prev + est_prev
    total_arr  = prop_arr  + fed_arr  + est_arr

    pct_liq = (min_arr / liq_arr * 100) if liq_arr else 0.0

    return {
        'proprios_previsao':                   prop_prev,
        'proprios_arrecadado':                 prop_arr,
        'transferencias_federais_previsao':    fed_prev,
        'transferencias_federais_arrecadado':  fed_arr,
        'transferencias_estaduais_previsao':   est_prev,
        'transferencias_estaduais_arrecadado': est_arr,
        'total_base_previsao':                 liq_prev,
        'total_base_arrecadado':               liq_arr,
        'minimo_educacao_previsao':            min_prev,
        'minimo_educacao_arrecadado':          min_arr,
        'percentual_aplicado_liquidado':       round(pct_liq, 2),
        'retencoes_fundeb_arrecadado':         ret_arr,
    }


# ── Extração de despesas ──────────────────────────────────────────────────────

# Padrão: Nome  dotacao%  empenhada%  liquidada%  paga%
# As colunas % são opcionais e ficam entre os valores
RE_DESPESA_LINE = re.compile(
    r'(Ensino Fundamental|Educacao Infantil|TOTAL\b)'
    r'\s+\*?\s*([\d.,]+)\s+[\d.,]+\s+([\d.,]+)\s+[\d.,]+\s+([\d.,]+)\s+[\d.,]+',
    re.IGNORECASE
)

# Dotação fica só na linha de TOTAL no bloco DESPESAS TOTAIS
RE_DOTACAO_TOTAL = re.compile(
    r'TOTAL\s+\*\s+([\d.,]+)\s+[\d.,]+'
)


def extrair_despesas_vertical(texto):
    """
    PDFs onde cada valor ocupa sua própria linha (algumas edições de 2023).
    Após reversão RTL, a ordem das colunas é: PAGA, LIQUIDADA, EMPENHADA.
    Cada coluna tem dois valores: percentual e valor absoluto.
    O nome da função aparece após os 6 números.
    """
    linhas = [l.strip().strip('|').strip() for l in texto.splitlines()]

    inicio = None
    for i, l in enumerate(linhas):
        if 'LIQUIDAS' in l:
            for j in range(i + 1, min(i + 5, len(linhas))):
                if 'DESPESAS' in linhas[j]:
                    inicio = j + 1
                    break
        if inicio is not None:
            break
        if 'DESPESAS LIQUIDAS' in l:
            inicio = i + 1
            break

    if inicio is None:
        return {}

    NUM_RE = re.compile(r'^\d{1,3}(?:\.\d{3})*,\d{2}$')
    IGNORAR = {'FUNDEB', 'RETENCOES', 'RETIDO', 'APLICADO', 'RETORNO', 'GANHOS',
               'FINANCEIRAS', 'APLICACOES', 'MUNICIPAL', 'APLICACAO', 'MINIMA',
               'PROPRIAS', 'RECEITA', 'BASE', 'IMPOSTOS', 'ARRECADADO'}

    resultado = {}
    num_buffer = []

    for l in linhas[inicio:]:
        if not l or l.startswith('-'):
            continue
        lu = l.upper()

        if NUM_RE.match(l):
            num_buffer.append(parse_br(l))
            continue

        if any(k in lu for k in IGNORAR):
            num_buffer = []
            continue

        funcao = None
        if 'FUNDAMENTAL' in lu or ('ENSINO' in lu and 'MUNICIPAL' not in lu):
            funcao = 'ENSINO FUNDAMENTAL'
        elif 'INFANTIL' in lu or ('EDUCACAO' in lu and 'MINIMA' not in lu and 'PROPRIAS' not in lu):
            funcao = 'EDUCACAO INFANTIL'
        elif 'TOTAL' in lu:
            funcao = 'TOTAL'

        if funcao and len(num_buffer) >= 6 and funcao not in resultado:
            # Pairs: paga%, paga, liq%, liq, emp%, emp → indices 1, 3, 5
            resultado[funcao] = {
                'dotacao':   0.0,
                'empenhada': num_buffer[5],
                'liquidada': num_buffer[3],
                'paga':      num_buffer[1],
            }
            num_buffer = []
        elif funcao:
            num_buffer = []

    return resultado


def extrair_despesas(texto):
    """
    Extrai despesas líquidas por função do bloco DESPESAS LIQUIDAS.
    Retorna dict: funcao → {dotacao, empenhada, liquidada, paga}
    """
    inicio = texto.find('DESPESAS LIQUIDAS')
    if inicio == -1:
        return extrair_despesas_vertical(texto)
    bloco = texto[inicio:]

    resultado = {}
    for m in RE_DESPESA_LINE.finditer(bloco):
        funcao     = normalizar(m.group(1))
        empenhada  = parse_br(m.group(2))
        liquidada  = parse_br(m.group(3))
        paga       = parse_br(m.group(4))
        resultado[funcao] = {'dotacao': 0.0, 'empenhada': empenhada, 'liquidada': liquidada, 'paga': paga}

    m_dot = RE_DOTACAO_TOTAL.search(texto)
    if m_dot and 'TOTAL' in resultado:
        resultado['TOTAL']['dotacao'] = parse_br(m_dot.group(1))

    return resultado


# ── Normalizar nome de função ─────────────────────────────────────────────────

FUNCAO_MAP = {
    'ENSINO FUNDAMENTAL': 'ensino fundamental',
    'EDUCACAO INFANTIL':  'educacao infantil',
    'TOTAL':              'DESPESAS LIQUIDAS DA EDUCACAO',
}


# ── Pipeline principal ────────────────────────────────────────────────────────

def processar_trimestre(pdf_path, trimestre, pdf_nome):
    texto = extrair_texto_pagina1(pdf_path)
    if not texto:
        return None, None

    receitas  = extrair_receitas(texto)
    despesas  = extrair_despesas(texto)

    if not despesas:
        print(f"    AVISO: nenhuma despesa extraida de {os.path.basename(pdf_path)}")
        return receitas, []

    linhas_despesa = []
    for funcao_raw, vals in despesas.items():
        funcao = FUNCAO_MAP.get(funcao_raw, funcao_raw.lower())
        linhas_despesa.append({
            'funcao':     funcao,
            'dotacao':    vals['dotacao'],
            'empenhada':  vals['empenhada'],
            'liquidada':  vals['liquidada'],
            'paga':       vals['paga'],
            'trimestre':  trimestre,
            'fonte_pdf':  pdf_nome,
        })

    return receitas, linhas_despesa


def salvar_despesas(rows, ano):
    os.makedirs(SAIDA_DIR, exist_ok=True)
    caminho = os.path.join(SAIDA_DIR, f'despesas_educacao_sorocaba_{ano}.csv')
    with open(caminho, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Funcao', 'Dotacao_Atualizada', 'Empenhada', 'Liquidada', 'Paga', 'Quadrimestre', 'Fonte_PDF'])
        for r in rows:
            writer.writerow([
                r['funcao'],
                formatar_br(r['dotacao']),
                formatar_br(r['empenhada']),
                formatar_br(r['liquidada']),
                formatar_br(r['paga']),
                r['trimestre'],
                r.get('fonte_pdf', ''),
            ])
    print(f"  Despesas salvas: {caminho}")


def salvar_receitas(rows, ano):
    os.makedirs(SAIDA_DIR, exist_ok=True)
    caminho = os.path.join(SAIDA_DIR, f'receitas_base_educacao_sorocaba_{ano}.csv')
    with open(caminho, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Quadrimestre',
            'Proprios_Previsao', 'Proprios_Arrecadado',
            'Transferencias_Federais_Previsao', 'Transferencias_Federais_Arrecadado',
            'Transferencias_Estaduais_Previsao', 'Transferencias_Estaduais_Arrecadado',
            'Total_Base_Previsao', 'Total_Base_Arrecadado',
            'Minimo_Educacao_Previsao', 'Minimo_Educacao_Arrecadado',
            'Percentual_Aplicado_Liquidado',
            'Fonte_PDF',
        ])
        for r in rows:
            writer.writerow([
                r['trimestre'],
                formatar_br(r['proprios_previsao']),
                formatar_br(r['proprios_arrecadado']),
                formatar_br(r['transferencias_federais_previsao']),
                formatar_br(r['transferencias_federais_arrecadado']),
                formatar_br(r['transferencias_estaduais_previsao']),
                formatar_br(r['transferencias_estaduais_arrecadado']),
                formatar_br(r['total_base_previsao']),
                formatar_br(r['total_base_arrecadado']),
                formatar_br(r['minimo_educacao_previsao']),
                formatar_br(r['minimo_educacao_arrecadado']),
                formatar_br(r['percentual_aplicado_liquidado']),
                r.get('fonte_pdf', ''),
            ])
    print(f"  Receitas salvas: {caminho}")


def processar_ano(ano):
    print(f"\n=== Educação {ano} ===")

    todas_despesas = []
    todas_receitas = []

    for t in range(1, 5):
        nome = f"{ano}-{t}-trimestre-relatorios-de-aplicacao-no-ensino.pdf"
        pdf_path = os.path.join(ENTRADA_DIR, nome)

        if not os.path.exists(pdf_path):
            print(f"  T{t}: arquivo nao encontrado, pulando")
            continue

        print(f"  T{t}: {nome}")
        receitas, despesas = processar_trimestre(pdf_path, t, nome)

        if despesas:
            todas_despesas.extend(despesas)
        if receitas:
            receitas['trimestre'] = t
            receitas['fonte_pdf'] = nome
            todas_receitas.append(receitas)

    if todas_despesas:
        salvar_despesas(todas_despesas, ano)
    else:
        print("  Nenhuma despesa extraida para o ano.")

    if todas_receitas:
        salvar_receitas(todas_receitas, ano)
    else:
        print("  Nenhuma receita extraida para o ano.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ano', type=int, action='append', required=True)
    args = parser.parse_args()

    for ano in sorted(set(args.ano)):
        processar_ano(ano)

    print("\nConcluido.")


if __name__ == '__main__':
    main()
