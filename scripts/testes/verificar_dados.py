"""
Verifica se os valores do CSV batem com os valores brutos extraídos dos JSONs.
Para cada quadrimestre e cada área, compara as 4 colunas financeiras.
"""
import json
import os
import re
import sys
import pandas as pd

DIRETORIO_SCRIPT  = os.path.dirname(os.path.abspath(__file__))
RAIZ              = os.path.abspath(os.path.join(DIRETORIO_SCRIPT, '..', '..'))

COLUNAS = ['Dotacao_Atualizada', 'Empenhada', 'Liquidada', 'Paga']


def extrair_tabela_bruta(json_path):
    """
    Lê a página 1 do JSON e extrai as linhas da tabela de despesas diretamente
    do texto bruto, sem nenhum processamento do extrator.
    Detecta automaticamente o formato normal ou invertido (RTL/espelhado).
    Retorna dict: {funcao_lower: [dotacao, empenhada, liquidada, paga]}
    """
    with open(json_path, 'rb') as f:
        data = json.loads(f.read().decode('utf-8', errors='replace'))

    texto = '\n'.join(data['paginas'][0]['texto'])

    if re.search(r'abacoroS|SOIRPORP', texto):
        return _extrair_bruta_invertida(texto)
    return _extrair_bruta_normal(texto)


def _extrair_bruta_normal(texto):
    in_tabela = False
    resultado = {}

    for linha in texto.splitlines():
        linha_limpa = re.sub(r'[|_]+', ' ', linha).strip()

        if re.search(r'DOTACAO.*ATUALIZADA.*EMPENHADA.*LIQUIDADA.*PAGA', linha_limpa, re.IGNORECASE):
            in_tabela = True
            continue

        if not in_tabela:
            continue

        if re.search(r'PERCENTUAL.*APLICACAO', linha_limpa, re.IGNORECASE):
            break

        nums = re.findall(r'\d{1,3}(?:\.\d{3})*,\d{2}', linha_limpa)
        if len(nums) < 4:
            continue

        descricao = re.split(re.escape(nums[0]), linha_limpa, maxsplit=1)[0]
        descricao = re.sub(r'\s+', ' ', descricao).strip().lower()
        if not descricao:
            continue

        resultado[descricao] = nums[-4:]

    return resultado


def _extrair_bruta_invertida(texto):
    """
    Extrai tabela de PDFs com texto em encoding invertido (RTL/espelhado).
    Cada linha tem seus caracteres na ordem inversa. Blocos de dados aparecem
    como [4 linhas de números] + [linhas do nome da função], todos invertidos.
    Ordem das colunas no texto: [Paga, Liquidada, Empenhada, Dotação].
    """
    FUNCOES = [
        'administracao geral',
        'atencao basica',
        'assistencia hospitalar e ambulatorial',
        'suporte profilatico e terapeutico',
        'vigilancia sanitaria',
        'vigilancia epidemiologica',
        'alimentacao e nutricao',
        'despesas liquidas da saude',
    ]
    NUM_RE = re.compile(r'^\d{1,3}(?:\.\d{3})*,\d{2}$')

    def _match(partes):
        nome = re.sub(r'[|_\s]+', ' ', ' '.join(partes)).strip().lower()
        for funcao in FUNCOES:
            if all(p in nome for p in funcao.split()):
                return funcao
        return None

    resultado = {}
    buffer_nums = []
    buffer_txt = []

    def _fechar():
        if len(buffer_nums) != 4 or not buffer_txt:
            return
        funcao = _match(buffer_txt)
        if not funcao:
            return
        paga, liquidada, empenhada, dotacao = buffer_nums
        chave = 'despesas liquidas da saude' if funcao == 'despesas liquidas da saude' else funcao
        resultado[chave] = [dotacao, empenhada, liquidada, paga]

    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha or re.match(r'^[|\-_ ]*$', linha):
            _fechar()
            buffer_nums.clear()
            buffer_txt.clear()
            continue

        linha_rev = linha[::-1].strip()

        if NUM_RE.match(linha_rev):
            if buffer_txt:
                _fechar()
                buffer_nums.clear()
                buffer_txt.clear()
            buffer_nums.append(linha_rev)
        else:
            buffer_txt.append(linha_rev.lower())

    _fechar()
    return resultado


def extrair_receitas_bruta_normal(texto):
    """Extrai receitas da base fiscal LRF do texto normal da página 1."""
    resultado = {}
    in_receitas = False
    NUM_RE = re.compile(r'(\d{1,3}(?:\.\d{3})*,\d{2})')

    for linha in texto.splitlines():
        s = re.sub(r'[|_]+', ' ', linha).strip()
        if not s:
            continue

        if re.search(r'RECEITAS DE IMPOSTOS E TRANSFERENCIAS', s, re.IGNORECASE):
            in_receitas = True
            continue
        if re.search(r'APURACAO DO PERCENTUAL', s, re.IGNORECASE):
            in_receitas = False
            continue

        nums = NUM_RE.findall(s)

        if in_receitas and len(nums) == 2:
            if re.search(r'\bproprios\b', s, re.IGNORECASE):
                resultado['proprios'] = nums
            elif re.search(r'\bfederais\b', s, re.IGNORECASE):
                resultado['federais'] = nums
            elif re.search(r'\bestaduais\b', s, re.IGNORECASE):
                resultado['estaduais'] = nums
            elif re.search(r'\bTOTAL\b', s, re.IGNORECASE) and 'proprios' in resultado:
                resultado['total'] = nums
            elif re.search(r'VALOR MINIMO', s, re.IGNORECASE):
                resultado['minimo'] = nums

        if re.search(r'PERCENTUAL DE APLICACAO', s, re.IGNORECASE) and len(nums) >= 4:
            resultado['percentual_liquidado'] = nums[2]

    return resultado


def extrair_receitas_bruta_invertida(texto):
    """Extrai receitas de PDFs com texto RTL/espelhado. Retorna valores na ordem [previsao, arrecadado]."""
    if not re.search(r'abacoroS|SOIRPORP', texto):
        return {}

    NUM_RE = re.compile(r'^\d{1,3}(?:\.\d{3})*,\d{2}$')
    resultado = {}
    buffer_nums = []
    buffer_txt = []

    def fechar():
        if not buffer_nums or not buffer_txt:
            return
        txt = ' '.join(buffer_txt)
        # RTL: buffer_nums[0]=arrecadado, buffer_nums[1]=previsao — reordenar para [previsao, arrecadado]
        if 'proprios' in txt and 'despesas' not in txt and 'transferencias' not in txt and len(buffer_nums) >= 2:
            resultado['proprios'] = [buffer_nums[1], buffer_nums[0]]
        elif 'federais' in txt and len(buffer_nums) >= 2:
            resultado['federais'] = [buffer_nums[1], buffer_nums[0]]
        elif 'estaduais' in txt and len(buffer_nums) >= 2:
            resultado['estaduais'] = [buffer_nums[1], buffer_nums[0]]
        elif 'total' in txt and 'despesas' not in txt and 'proprios' in resultado and len(buffer_nums) >= 2:
            resultado['total'] = [buffer_nums[1], buffer_nums[0]]
        elif 'minimo' in txt and 'valor' in txt and len(buffer_nums) >= 2:
            resultado['minimo'] = [buffer_nums[1], buffer_nums[0]]
        elif 'percentual' in txt and 'aplicacao' in txt and 'apuracao' not in txt and len(buffer_nums) >= 4:
            # RTL: [paga, liquidada, empenhada, dotacao] — liquidada é índice 1
            resultado['percentual_liquidado'] = buffer_nums[1]

    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha or re.match(r'^[|\-_ ]*$', linha):
            fechar()
            buffer_nums.clear()
            buffer_txt.clear()
            continue

        linha_rev = linha[::-1].strip()
        if NUM_RE.match(linha_rev):
            if buffer_txt:
                fechar()
                buffer_nums.clear()
                buffer_txt.clear()
            buffer_nums.append(linha_rev)
        else:
            buffer_txt.append(linha_rev.lower())

    fechar()
    return resultado


def extrair_receitas_bruta(json_path):
    with open(json_path, 'rb') as f:
        data = json.loads(f.read().decode('utf-8', errors='replace'))
    texto = '\n'.join(data['paginas'][0]['texto'])
    if re.search(r'abacoroS|SOIRPORP', texto):
        return extrair_receitas_bruta_invertida(texto)
    return extrair_receitas_bruta_normal(texto)


# Mapeia coluna do CSV → (chave no dict bruto, índice); índice None = valor escalar
COLUNAS_RECEITAS = {
    'Proprios_Previsao':                    ('proprios',              0),
    'Proprios_Arrecadado':                  ('proprios',              1),
    'Transferencias_Federais_Previsao':     ('federais',              0),
    'Transferencias_Federais_Arrecadado':   ('federais',              1),
    'Transferencias_Estaduais_Previsao':    ('estaduais',             0),
    'Transferencias_Estaduais_Arrecadado':  ('estaduais',             1),
    'Total_Base_Previsao':                  ('total',                 0),
    'Total_Base_Arrecadado':                ('total',                 1),
    'Minimo_Saude_Previsao':                ('minimo',                0),
    'Minimo_Saude_Arrecadado':              ('minimo',                1),
    'Percentual_Aplicado_Liquidado':        ('percentual_liquidado', None),
}


def verificar_receitas(ano):
    intermediario_dir = os.path.join(RAIZ, 'sorocaba', 'saude', 'intermediario')
    csv_path = os.path.join(RAIZ, 'sorocaba', 'saude', 'saida', f'receitas_base_saude_sorocaba_{ano}.csv')

    quadrimestres = ['primeiro', 'segundo', 'terceiro']
    jsons = {
        q + 1: f'{ano}-{quad}-quadrimestre-relatorios-de-aplicacao-na-saude.pdf.json'
        for q, quad in enumerate(quadrimestres)
    }

    if not os.path.exists(csv_path):
        print(f'CSV de receitas nao encontrado: {csv_path}')
        return False

    df = pd.read_csv(csv_path, encoding='utf-8-sig')

    erros = []
    ok    = 0
    total = 0

    print(f'Verificando receitas {ano}...')

    for q, nome_json in jsons.items():
        json_path = os.path.join(intermediario_dir, nome_json)
        if not os.path.exists(json_path):
            print(f'  Q{q}: JSON nao encontrado, pulando.')
            continue

        bruto  = extrair_receitas_bruta(json_path)
        df_q   = df[df['Quadrimestre'] == q]

        if df_q.empty:
            erros.append(f'Q{q}: linha ausente no CSV de receitas')
            continue

        row = df_q.iloc[0]

        for col, (chave, idx) in COLUNAS_RECEITAS.items():
            total += 1

            if col not in df.columns or pd.isna(row.get(col)):
                erros.append(f'Q{q} | {col}: ausente no CSV')
                continue

            val_csv = normalizar(row[col])

            if chave not in bruto:
                erros.append(f'Q{q} | {col}: "{chave}" nao encontrado no PDF bruto')
                continue

            val_bruto_raw = bruto[chave] if idx is None else bruto[chave][idx]
            val_bruto     = normalizar(val_bruto_raw)

            if abs(val_csv - val_bruto) > 0.005:
                erros.append(f'Q{q} | {col}: CSV={row[col]}  PDF={val_bruto_raw}')
            else:
                ok += 1

    print(f'\nReceitas: {ok}/{total} valores corretos\n')
    if erros:
        print(f'DIVERGENCIAS ({len(erros)}):')
        for e in erros:
            print(f'  ERRO: {e}')
        return False
    else:
        print('Nenhuma divergencia. Todos os valores de receita batem com o PDF.')
        return True


def normalizar(valor_str):
    """Converte string BR para float para comparação."""
    return float(str(valor_str).replace('.', '').replace(',', '.'))


def verificar(ano):
    if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    intermediario_dir = os.path.join(RAIZ, 'sorocaba', 'saude', 'intermediario')
    csv_path          = os.path.join(RAIZ, 'sorocaba', 'saude', 'saida', f'despesas_saude_sorocaba_{ano}.csv')

    quadrimestres = ['primeiro', 'segundo', 'terceiro']
    jsons = {
        q + 1: f'{ano}-{quad}-quadrimestre-relatorios-de-aplicacao-na-saude.pdf.json'
        for q, quad in enumerate(quadrimestres)
    }

    if not os.path.exists(csv_path):
        print(f'CSV nao encontrado: {csv_path}')
        print(f'Execute antes: python extrator_saude.py --ano {ano}')
        return

    df = pd.read_csv(csv_path, encoding='utf-8-sig')

    erros = []
    ok    = 0
    total = 0

    print(f'Verificando ano {ano}...')

    for q, nome_json in jsons.items():
        json_path = os.path.join(intermediario_dir, nome_json)
        if not os.path.exists(json_path):
            print(f'  Q{q}: JSON nao encontrado, pulando.')
            continue
        bruto = extrair_tabela_bruta(json_path)
        df_q  = df[df['Quadrimestre'] == q]

        for _, row in df_q.iterrows():
            funcao_csv = row['Funcao'].strip().lower()

            if funcao_csv not in bruto:
                erros.append(f"Q{q} | '{row['Funcao']}' — nao encontrada no PDF bruto")
                continue

            vals_bruto = bruto[funcao_csv]

            for i, col in enumerate(COLUNAS):
                total += 1
                val_csv   = normalizar(row[col])
                val_bruto = normalizar(vals_bruto[i])
                if abs(val_csv - val_bruto) > 0.005:
                    erros.append(
                        f"Q{q} | '{row['Funcao']}' | {col}: "
                        f"CSV={row[col]}  PDF={vals_bruto[i]}"
                    )
                else:
                    ok += 1

    print(f"\nResultado: {ok}/{total} valores corretos\n")

    if erros:
        print(f"DIVERGENCIAS ENCONTRADAS ({len(erros)}):")
        for e in erros:
            print(f"  ERRO: {e}")
    else:
        print("Nenhuma divergencia encontrada. Todos os valores batem com o PDF.")


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Verifica integridade dos dados extraidos')
    parser.add_argument('--ano', type=int, default=2025, help='Ano a verificar (padrao: 2025)')
    args = parser.parse_args()
    verificar(args.ano)
    verificar_receitas(args.ano)
