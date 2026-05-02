"""
Extrai dados do RREO Anexo 12 (LC 141/2012) de Sorocaba.

Lê PDFs dos bimestres 2, 4 e 6 (= quadrimestres 1, 2, 3) e extrai:
  - Despesas ASPS por subfunção (conta para o mínimo constitucional de 15%)
  - Despesas SUS por subfunção (não contadas no mínimo)
  - Receitas de transferências SUS (União, Estados)
  - Percentual aplicado em ASPS

Salva dois CSVs por ano:
  sorocaba/saude/saida/rreo_despesas_saude_sorocaba_{ano}.csv
  sorocaba/saude/saida/rreo_receitas_sus_sorocaba_{ano}.csv

Uso:
    python extrator_rreo_sus.py --ano 2025
    python extrator_rreo_sus.py --ano 2023 --ano 2024 --ano 2025
"""
import argparse
import csv
import os
import re
import sys

DIRETORIO_SCRIPT = os.path.dirname(os.path.abspath(__file__))
RAIZ             = os.path.abspath(os.path.join(DIRETORIO_SCRIPT, '..'))
ENTRADA_DIR      = os.path.join(RAIZ, 'sorocaba', 'saude', 'rreo', 'entrada')
SAIDA_DIR        = os.path.join(RAIZ, 'sorocaba', 'saude', 'saida')

# bimestre → quadrimestre
QUAD = {2: 1, 4: 2, 6: 3}

NUM_RE = re.compile(r'(\d{1,3}(?:\.\d{3})*,\d{2})')

# Chaves internas (lower, sem acentos)
SUBFUNCOES = [
    "atencao basica",
    "assistencia hospitalar e ambulatorial",
    "suporte profilatico e terapeutico",
    "vigilancia sanitaria",
    "vigilancia epidemiologica",
    "alimentacao e nutricao",
    "outras subfuncoes",
]

# Numerais romanos no PDF → subfunção key
ASPS_ROMAN = {
    "IV":    "atencao basica",
    "V":     "assistencia hospitalar e ambulatorial",
    "VI":    "suporte profilatico e terapeutico",
    "VII":   "vigilancia sanitaria",
    "VIII":  "vigilancia epidemiologica",
    "IX":    "alimentacao e nutricao",
    "X":     "outras subfuncoes",
    "XI":    "TOTAL",
}
SUS_ROMAN = {
    "XXXII":   "atencao basica",
    "XXXIII":  "assistencia hospitalar e ambulatorial",
    "XXXIV":   "suporte profilatico e terapeutico",
    "XXXV":    "vigilancia sanitaria",
    "XXXVI":   "vigilancia epidemiologica",
    "XXXVII":  "alimentacao e nutricao",
    "XXXVIII": "outras subfuncoes",
    "XXXIX":   "TOTAL",
}

# Regex para linha principal de subfunção: | NAME (ROMAN) |
FUNC_LINE_RE = re.compile(
    r'\|\s*([A-Z][A-Z\s\-]+?)\s*\(((?:XXXVIII|XXXVII|XXXVI|XXXV|XXXIV|XXXIII|XXXII|XXXIX'
    r'|VIII|VII|VI|IV|IX|XI|X|V)\s*)\)\s*[=|]'
)


def br2float(s):
    return float(s.replace('.', '').replace(',', '.'))


def extrair_nums(linha):
    return NUM_RE.findall(linha)


def parse_tabela_despesas(texto, mapa_roman):
    """
    Extrai empenhada, liquidada, paga para cada subfunção
    a partir de um bloco de texto da tabela CN-SIFPM.
    """
    resultado = {}

    # Regex adicional para linha de TOTAL sem nome: | (XXXIX) = (...) | | | val| ...
    TOTAL_LINE_RE = re.compile(r'\|\s*\((([IVX]+))\)\s*=')

    for linha in texto.splitlines():
        roman = None

        m = FUNC_LINE_RE.search(linha)
        if m:
            roman = m.group(2).strip()
        else:
            mt = TOTAL_LINE_RE.search(linha)
            if mt:
                roman = mt.group(1).strip()

        if roman is None or roman not in mapa_roman:
            continue

        key = mapa_roman[roman]
        nums = extrair_nums(linha)
        if len(nums) >= 3:
            resultado[key] = {
                'empenhada': br2float(nums[0]),
                'liquidada': br2float(nums[1]),
                'paga':      br2float(nums[2]),
            }

    # Se TOTAL ainda não foi encontrado, calcula somando as subfunções
    if "TOTAL" not in resultado and resultado:
        resultado["TOTAL"] = {
            'empenhada': sum(v['empenhada'] for v in resultado.values()),
            'liquidada': sum(v['liquidada'] for v in resultado.values()),
            'paga':      sum(v['paga']      for v in resultado.values()),
        }

    return resultado


def parse_receitas_sus(texto):
    """
    Extrai receitas de transferências para saúde (seção XXVIII).
    Retorna dict com previsao_atualizada e arrecadado para total, uniao, estados.
    """
    resultado = {}
    for linha in texto.splitlines():
        s = re.sub(r'[|_]+', ' ', linha).strip()
        nums = extrair_nums(linha)
        if not nums:
            continue

        if re.search(r'RECEITAS DE TRANSFERENCIAS PARA A SAUDE.*XXVIII', s, re.IGNORECASE):
            if len(nums) >= 3:
                resultado['total_previsao']    = br2float(nums[1])
                resultado['total_arrecadado']  = br2float(nums[2])

        elif re.search(r'Provenientes da Uniao', s, re.IGNORECASE):
            if len(nums) >= 3:
                resultado['uniao_previsao']    = br2float(nums[1])
                resultado['uniao_arrecadado']  = br2float(nums[2])

        elif re.search(r'Provenientes dos Estados', s, re.IGNORECASE):
            if len(nums) >= 3:
                resultado['estados_previsao']  = br2float(nums[1])
                resultado['estados_arrecadado'] = br2float(nums[2])

    return resultado


def parse_percentual(texto):
    """Extrai o percentual aplicado em ASPS (linha 'PERCENTUAL DA RECEITA...')."""
    for linha in texto.splitlines():
        if re.search(r'PERCENTUAL DA RECEITA.*APLICADO.*ASPS', linha, re.IGNORECASE):
            nums = extrair_nums(linha)
            if nums:
                return br2float(nums[-1])
        # A linha com o valor fica logo depois, como: | 23,78 |
        if re.search(r'minimo de 15%', linha, re.IGNORECASE):
            nums = extrair_nums(linha)
            if nums:
                return br2float(nums[-1])
    return None


def normalizar_texto(texto_completo):
    """
    Detecta e corrige PDFs com texto RTL/espelhado (cada linha invertida).
    Ativado quando "abacoroS" ou "MPFIS-NC" aparecem no texto bruto.
    """
    if not re.search(r'abacoroS|MPFIS-NC|MANOC\b', texto_completo):
        return texto_completo
    linhas = []
    for linha in texto_completo.splitlines():
        linhas.append(linha[::-1])
    return "\n".join(linhas)


def extrair_texto_pdf(pdf_path):
    """
    Extrai texto com pdfplumber; cai para PyMuPDF se Anexo 12 não for encontrado.
    Alguns PDFs (ex: 2023 Q2) têm páginas renderizadas como imagem que pdfplumber
    não consegue ler mas fitz (PyMuPDF) extrai normalmente.
    """
    import pdfplumber
    texto_total = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            texto_total.append(page.extract_text() or "")
    texto = normalizar_texto("\n".join(texto_total))
    # Aceitar pdfplumber apenas se há valor monetário real na linha de ATENCAO BASICA
    if re.search(r'ATENCAO BASICA.*\(IV\).*\d{1,3}(?:\.\d{3})+,\d{2}', texto, re.IGNORECASE):
        return texto
    # Fallback: PyMuPDF
    import fitz
    texto_total = []
    doc = fitz.open(pdf_path)
    for page in doc:
        texto_total.append(page.get_text("text"))
    doc.close()
    return normalizar_texto("\n".join(texto_total))


def extrair_bimestre(pdf_path):
    """
    Extrai todos os dados do Anexo 12 de um PDF de RREO.
    Retorna (asps, sus, receitas_sus, pct_aplicado).
    Suporta PDFs normais e RTL/espelhados.
    """
    texto_completo = extrair_texto_pdf(pdf_path)

    asps_dados = parse_tabela_despesas(texto_completo, ASPS_ROMAN)
    sus_dados  = parse_tabela_despesas(texto_completo, SUS_ROMAN)
    rec_sus    = parse_receitas_sus(texto_completo)
    pct        = parse_percentual(texto_completo)

    return asps_dados, sus_dados, rec_sus, pct


def salvar_despesas(ano, registros):
    os.makedirs(SAIDA_DIR, exist_ok=True)
    caminho = os.path.join(SAIDA_DIR, f'rreo_despesas_saude_sorocaba_{ano}.csv')
    campos = [
        'Funcao',
        'ASPS_Empenhada', 'ASPS_Liquidada', 'ASPS_Paga',
        'SUS_Empenhada',  'SUS_Liquidada',  'SUS_Paga',
        'Total_Empenhada','Total_Liquidada','Total_Paga',
        'Quadrimestre',
    ]
    with open(caminho, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        for row in registros:
            w.writerow({k: f"{v:.2f}".replace('.', ',') if isinstance(v, float) else v
                        for k, v in row.items()})
    return caminho


def salvar_receitas(ano, registros):
    os.makedirs(SAIDA_DIR, exist_ok=True)
    caminho = os.path.join(SAIDA_DIR, f'rreo_receitas_sus_sorocaba_{ano}.csv')
    campos = [
        'Quadrimestre',
        'SUS_Total_Previsao',    'SUS_Total_Arrecadado',
        'SUS_Uniao_Previsao',    'SUS_Uniao_Arrecadado',
        'SUS_Estados_Previsao',  'SUS_Estados_Arrecadado',
        'Percentual_ASPS',
    ]
    with open(caminho, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        for row in registros:
            w.writerow({k: f"{v:.2f}".replace('.', ',') if isinstance(v, float) else v
                        for k, v in row.items()})
    return caminho


def fmt(v):
    if v is None:
        return "N/D"
    return f"R$ {v:>17,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')


def processar_ano(ano):
    print(f"\n{'='*50}")
    print(f"  Extração RREO Anexo 12 — {ano}")
    print(f"{'='*50}")

    registros_desp = []
    registros_rec  = []
    erros = []

    for bim, quad in sorted(QUAD.items()):
        nome    = f"rreo_{ano}_{bim}bimestre.pdf"
        caminho = os.path.join(ENTRADA_DIR, nome)

        if not os.path.exists(caminho):
            print(f"\n  Q{quad} (bim {bim}): PDF nao encontrado — {nome}")
            print(f"  Execute antes: python baixar_rreo_sus.py --ano {ano}")
            erros.append(f"Q{quad}: PDF ausente")
            continue

        print(f"\n  Q{quad} (bimestre {bim})...")
        try:
            asps, sus, rec, pct = extrair_bimestre(caminho)
        except Exception as e:
            print(f"  ERRO ao extrair: {e}")
            erros.append(f"Q{quad}: {e}")
            continue

        # Verificar extração mínima
        if not asps or "TOTAL" not in asps:
            print(f"  ATENCAO: tabela ASPS nao encontrada ou incompleta")
            erros.append(f"Q{quad}: tabela ASPS incompleta")
        if not sus or "TOTAL" not in sus:
            print(f"  ATENCAO: tabela SUS nao encontrada ou incompleta")
            erros.append(f"Q{quad}: tabela SUS incompleta")

        # Montar linhas de despesa (por subfunção + TOTAL)
        funcoes = SUBFUNCOES + ["TOTAL"]
        for fn in funcoes:
            key = fn if fn == "TOTAL" else fn
            a = asps.get(key, {})
            s = sus.get(key, {})
            registros_desp.append({
                'Funcao':           fn,
                'ASPS_Empenhada':   a.get('empenhada', 0.0),
                'ASPS_Liquidada':   a.get('liquidada', 0.0),
                'ASPS_Paga':        a.get('paga',      0.0),
                'SUS_Empenhada':    s.get('empenhada', 0.0),
                'SUS_Liquidada':    s.get('liquidada', 0.0),
                'SUS_Paga':         s.get('paga',      0.0),
                'Total_Empenhada':  a.get('empenhada', 0.0) + s.get('empenhada', 0.0),
                'Total_Liquidada':  a.get('liquidada', 0.0) + s.get('liquidada', 0.0),
                'Total_Paga':       a.get('paga',      0.0) + s.get('paga',      0.0),
                'Quadrimestre':     quad,
            })

        # Montar linha de receita
        registros_rec.append({
            'Quadrimestre':          quad,
            'SUS_Total_Previsao':    rec.get('total_previsao',    0.0),
            'SUS_Total_Arrecadado':  rec.get('total_arrecadado',  0.0),
            'SUS_Uniao_Previsao':    rec.get('uniao_previsao',    0.0),
            'SUS_Uniao_Arrecadado':  rec.get('uniao_arrecadado',  0.0),
            'SUS_Estados_Previsao':  rec.get('estados_previsao',  0.0),
            'SUS_Estados_Arrecadado':rec.get('estados_arrecadado',0.0),
            'Percentual_ASPS':       pct or 0.0,
        })

        # Resumo no console
        at = asps.get("TOTAL", {})
        st = sus.get("TOTAL", {})
        print(f"    ASPS liquidada:  {fmt(at.get('liquidada'))}")
        print(f"    SUS  liquidada:  {fmt(st.get('liquidada'))}")
        print(f"    TOTAL liquidada: {fmt(at.get('liquidada', 0) + st.get('liquidada', 0))}")
        if pct:
            print(f"    % aplicado ASPS: {pct:.2f}%")
        if rec.get('total_arrecadado'):
            print(f"    Transf. SUS rec: {fmt(rec['total_arrecadado'])}")

    if not registros_desp:
        print(f"\n  Nenhum dado extraido para {ano}.")
        return False

    p1 = salvar_despesas(ano, registros_desp)
    p2 = salvar_receitas(ano, registros_rec)
    print(f"\n  Despesas → {p1}")
    print(f"  Receitas → {p2}")

    if erros:
        print(f"\n  AVISOS ({len(erros)}):")
        for e in erros:
            print(f"    {e}")
        return False

    return True


def main():
    parser = argparse.ArgumentParser(description='Extrai RREO Anexo 12 de Sorocaba')
    parser.add_argument('--ano', type=int, action='append', required=True)
    args = parser.parse_args()

    if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    ok = err = 0
    for ano in sorted(set(args.ano)):
        if processar_ano(ano):
            ok += 1
        else:
            err += 1

    print(f"\nConcluido: {ok} OK, {err} com problema.")
    sys.exit(1 if err else 0)


if __name__ == '__main__':
    main()
