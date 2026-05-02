import json
import os
import re
import sys
import pdfplumber
import pandas as pd


def extrair_tabela_saude(caminho_pdf):
    dados = []
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            for page in pdf.pages:
                linhas = extrair_linhas_da_pagina(page)
                if linhas:
                    dados.extend(linhas)
    except Exception as e:
        print(f"Erro ao processar {os.path.basename(caminho_pdf)}: {e}")
    return dados


def extrair_linhas_formato_invertido(texto):
    """
    Extrai dados de PDFs com texto em encoding invertido (RTL/espelhado).

    Nesses PDFs cada caractere de cada linha está em ordem inversa. Os blocos
    de dados aparecem como [4 linhas de números] seguidas de [linhas com partes
    do nome da função], todos com caracteres invertidos. A ordem das colunas
    também é invertida: o texto mostra [Paga, Liquidada, Empenhada, Dotação]
    e gravamos como [Dotação, Empenhada, Liquidada, Paga].

    Detectado pelo marcador 'abacoroS' (= 'Sorocaba' invertido).
    """
    if not re.search(r'abacoroS|SOIRPORP', texto):
        return []

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

    def _match_funcao(partes):
        nome = re.sub(r'[|_\s]+', ' ', ' '.join(partes)).strip().lower()
        for funcao in FUNCOES:
            if all(palavra in nome for palavra in funcao.split()):
                return funcao
        return None

    dados = []
    buffer_nums = []
    buffer_txt = []

    def _fechar_bloco():
        if len(buffer_nums) != 4 or not buffer_txt:
            return
        funcao = _match_funcao(buffer_txt)
        if not funcao:
            return
        paga, liquidada, empenhada, dotacao = buffer_nums
        chave = 'DESPESAS LIQUIDAS DA SAUDE' if funcao == 'despesas liquidas da saude' else funcao
        dados.append([chave, dotacao, empenhada, liquidada, paga])

    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha or re.match(r'^[|\-_ ]*$', linha):
            _fechar_bloco()
            buffer_nums.clear()
            buffer_txt.clear()
            continue

        linha_rev = linha[::-1].strip()

        if NUM_RE.match(linha_rev):
            if buffer_txt:
                _fechar_bloco()
                buffer_nums.clear()
                buffer_txt.clear()
            buffer_nums.append(linha_rev)
        else:
            buffer_txt.append(linha_rev.lower())

    _fechar_bloco()
    return dados


def extrair_linhas_da_pagina(page):
    texto = page.extract_text() or ""

    # Tentar formato invertido (RTL/espelhado) antes do formato normal
    dados = extrair_linhas_formato_invertido(texto)
    if dados:
        return dados

    dados = extrair_linhas_do_texto(texto)
    if dados:
        return dados
    return extrair_linhas_de_palavras(page)


def extrair_linha_de_texto(linha):
    linha_limpa = re.sub(r'[_|]+', ' ', linha).strip()
    if not linha_limpa:
        return None

    if re.search(r'PERCENTUAL.*APLICACAO|APURACAO|APURAÇÃO|VALOR MINIMO', linha_limpa, re.IGNORECASE):
        return None

    numeros = re.findall(r'\d{1,3}(?:\.\d{3})*,\d{2}', linha_limpa)
    if len(numeros) < 4:
        return None

    descricao, _ = re.split(re.escape(numeros[0]), linha_limpa, maxsplit=1)
    descricao = re.sub(r'\s+', ' ', descricao).strip()
    if not descricao:
        return None

    if re.search(r'\bTOTAL\b', descricao, re.IGNORECASE):
        return None

    return [descricao] + numeros[-4:]


def extrair_linhas_do_texto(texto):
    dados = []
    in_tabela = False
    for linha in texto.splitlines():
        linha_limpa = re.sub(r'[_|]+', ' ', linha).strip()
        if not linha_limpa:
            continue

        if re.search(r'DOTACAO.*ATUALIZADA.*EMPENHADA.*LIQUIDADA.*PAGA', linha_limpa, re.IGNORECASE):
            in_tabela = True
            continue

        if not in_tabela:
            continue

        if re.search(r'PERCENTUAL.*APLICACAO|SALDO DO EXERCICIO|TOTAL.*RECEITA|APURACAO|APURAÇÃO', linha_limpa, re.IGNORECASE):
            break

        linha_extraida = extrair_linha_de_texto(linha_limpa)
        if linha_extraida:
            dados.append(linha_extraida)
    return dados


def extrair_linhas_de_palavras(page):
    dados = []
    words = page.extract_words(use_text_flow=True)
    if not words:
        return dados

    linhas = []
    for word in words:
        top = round(float(word['top']), 1)
        for grupo in linhas:
            if abs(grupo[0] - top) < 3:
                grupo[1].append(word)
                break
        else:
            linhas.append([top, [word]])

    for _, row_words in sorted(linhas, key=lambda item: item[0]):
        row_words.sort(key=lambda w: float(w['x0']))
        linha = ' '.join(w['text'] for w in row_words)
        linha_extraida = extrair_linha_de_texto(linha)
        if linha_extraida:
            dados.append(linha_extraida)
    return dados


def traduzir_linha_pdf(linha):
    linha_limpa = linha.strip()
    if not linha_limpa:
        return None

    if re.search(r'DOTACAO.*ATUALIZADA.*EMPENHADA.*LIQUIDADA.*PAGA', linha_limpa, re.IGNORECASE):
        return "Início da tabela de despesas com colunas: Dotação Atualizada, Empenhada, Liquidada e Paga."

    if re.search(r'APURACAO.*PERCENTUAL.*APLICADO.*SAUDE', linha_limpa, re.IGNORECASE):
        return "Cabeçalho da seção que mostra o percentual aplicado à saúde."

    if re.search(r'TOTAL.*DESPESAS.*RECURSOS.*PROPRIOS', linha_limpa, re.IGNORECASE):
        return "Linha de total das despesas com recursos próprios."

    if re.search(r'PERCENTUAL.*APLICACAO', linha_limpa, re.IGNORECASE):
        return "Mostra percentuais de aplicação das despesas de saúde."

    if re.search(r'VALOR MINIMO.*APLICAR', linha_limpa, re.IGNORECASE):
        return "Mostra o valor mínimo que deveria ser aplicado na saúde."

    numeros = re.findall(r'\d{1,3}(?:\.\d{3})*,\d{2}', linha_limpa)
    if len(numeros) >= 4:
        descricao = re.split(re.escape(numeros[0]), linha_limpa, maxsplit=1)[0].strip()
        descricao = re.sub(r'\s+', ' ', descricao)
        return f"Linha de tabela: função = '{descricao}'; dotação_atualizada = {numeros[-4]}; empenhada = {numeros[-3]}; liquidada = {numeros[-2]}; paga = {numeros[-1]}."

    if re.search(r'RECEITAS.*DE.*IMPOSTOS', linha_limpa, re.IGNORECASE):
        return "Cabeçalho de receita de impostos, não parte da tabela de despesas."

    return None


def extrair_estrutura_pagina(page, numero):
    texto = page.extract_text() or ""
    words = page.extract_words(use_text_flow=True)
    return {
        "pagina": numero,
        "texto": texto.splitlines(),
        "tabelas": page.extract_tables(),
        "palavras": words,
        "chars": page.chars,
        "objetos": {
            "linhas": page.lines,
            "retangulos": page.rects,
            "curvas": page.curves,
            "imagens": page.images,
        },
        "dimensoes": {"width": page.width, "height": page.height},
    }


def extrair_tudo_pdf(caminho_pdf, destino_dir):
    caminho_destino = os.path.join(destino_dir, os.path.basename(caminho_pdf) + ".json")
    dump = {"arquivo": os.path.basename(caminho_pdf), "metadata": {}, "paginas": []}
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            dump["metadata"] = getattr(pdf, "metadata", {}) or {}
            for i, page in enumerate(pdf.pages, start=1):
                dump["paginas"].append(extrair_estrutura_pagina(page, i))
    except Exception as e:
        print(f"Erro ao extrair tudo de {os.path.basename(caminho_pdf)}: {e}")
        return None

    with open(caminho_destino, "w", encoding="utf-8") as f:
        json.dump(dump, f, ensure_ascii=False, indent=2)
    print(f"  Dump completo salvo em: {caminho_destino}")
    return dump


def imprimir_pdf_completo(caminho_pdf):
    with pdfplumber.open(caminho_pdf) as pdf:
        print(f"\n=== PDF COMPLETO: {os.path.basename(caminho_pdf)} ===")
        for i, page in enumerate(pdf.pages, start=1):
            print(f"\n--- Página {i} ---")
            texto = page.extract_text() or ""
            print("\n>>> Texto extraído:")
            if texto.strip():
                for linha_num, linha in enumerate(texto.splitlines(), start=1):
                    print(f"{linha_num:03d}: {linha}")
                    traducao = traduzir_linha_pdf(linha)
                    print(f"       No PDF diz: {linha}")
                    if traducao:
                        print(f"       Traduzindo: {traducao}")
                    else:
                        print("       Traduzindo: sem tradução disponível")
            else:
                print("(sem texto extraído)")

            print("\n>>> Quarry extract_table:")
            tabela = page.extract_table()
            if tabela:
                for row in tabela:
                    print(row)
            else:
                print("(nenhuma tabela extraída com extract_table)")

            print("\n>>> Palavras extraídas com posições:")
            words = page.extract_words(use_text_flow=True)
            if words:
                for word in words:
                    print(f"{word['text']} @ x0={word['x0']:.1f} top={word['top']:.1f} x1={word['x1']:.1f} bottom={word['bottom']:.1f}")
            else:
                print("(nenhuma palavra extraída)")

            print("\n>>> Linhas agrupadas por top:")
            linhas = {}
            for word in words:
                top = round(float(word['top']), 1)
                linhas.setdefault(top, []).append(word)
            for top in sorted(linhas):
                linha_texto = ' '.join(w['text'] for w in sorted(linhas[top], key=lambda w: float(w['x0'])))
                print(f"{top:6.1f}: {linha_texto}")

            print("\n" + '-' * 80)


def extrair_receitas_do_texto(texto):
    """Extrai base fiscal LRF (receitas) e percentual aplicado em saúde — formato normal, página 1."""
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
                resultado['proprios_previsao'] = nums[0]
                resultado['proprios_arrecadado'] = nums[1]
            elif re.search(r'\bfederais\b', s, re.IGNORECASE):
                resultado['transferencias_federais_previsao'] = nums[0]
                resultado['transferencias_federais_arrecadado'] = nums[1]
            elif re.search(r'\bestaduais\b', s, re.IGNORECASE):
                resultado['transferencias_estaduais_previsao'] = nums[0]
                resultado['transferencias_estaduais_arrecadado'] = nums[1]
            elif re.search(r'\bTOTAL\b', s, re.IGNORECASE) and 'proprios_previsao' in resultado:
                resultado['total_base_previsao'] = nums[0]
                resultado['total_base_arrecadado'] = nums[1]
            elif re.search(r'VALOR MINIMO', s, re.IGNORECASE):
                resultado['minimo_saude_previsao'] = nums[0]
                resultado['minimo_saude_arrecadado'] = nums[1]

        if re.search(r'PERCENTUAL DE APLICACAO', s, re.IGNORECASE) and len(nums) >= 4:
            resultado['percentual_aplicado_liquidado'] = nums[2]

    return resultado


def extrair_receitas_formato_invertido(texto):
    """Extrai receitas de PDFs com texto RTL/invertido (mesma lógica de estado do extrator de despesas)."""
    if not re.search(r'abacoroS|SOIRPORP', texto):
        return {}

    NUM_RE = re.compile(r'^\d{1,3}(?:\.\d{3})*,\d{2}$')
    resultado = {}
    buffer_nums = []
    buffer_txt = []

    def fechar_bloco():
        if not buffer_nums or not buffer_txt:
            return
        txt = ' '.join(buffer_txt)

        if 'proprios' in txt and 'despesas' not in txt and 'transferencias' not in txt and len(buffer_nums) >= 2:
            resultado['proprios_arrecadado'] = buffer_nums[0]
            resultado['proprios_previsao'] = buffer_nums[1]
        elif 'federais' in txt and len(buffer_nums) >= 2:
            resultado['transferencias_federais_arrecadado'] = buffer_nums[0]
            resultado['transferencias_federais_previsao'] = buffer_nums[1]
        elif 'estaduais' in txt and len(buffer_nums) >= 2:
            resultado['transferencias_estaduais_arrecadado'] = buffer_nums[0]
            resultado['transferencias_estaduais_previsao'] = buffer_nums[1]
        elif 'total' in txt and 'despesas' not in txt and 'proprios_arrecadado' in resultado and len(buffer_nums) >= 2:
            resultado['total_base_arrecadado'] = buffer_nums[0]
            resultado['total_base_previsao'] = buffer_nums[1]
        elif 'minimo' in txt and 'valor' in txt and len(buffer_nums) >= 2:
            resultado['minimo_saude_arrecadado'] = buffer_nums[0]
            resultado['minimo_saude_previsao'] = buffer_nums[1]
        elif 'percentual' in txt and 'aplicacao' in txt and 'apuracao' not in txt and len(buffer_nums) >= 4:
            # RTL inverte a ordem das colunas: [paga, liquidada, empenhada, dotacao]
            resultado['percentual_aplicado_liquidado'] = buffer_nums[1]

    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha or re.match(r'^[|\-_ ]*$', linha):
            fechar_bloco()
            buffer_nums.clear()
            buffer_txt.clear()
            continue

        linha_rev = linha[::-1].strip()
        if NUM_RE.match(linha_rev):
            if buffer_txt:
                fechar_bloco()
                buffer_nums.clear()
                buffer_txt.clear()
            buffer_nums.append(linha_rev)
        else:
            buffer_txt.append(linha_rev.lower())

    fechar_bloco()
    return resultado


def extrair_receitas_saude(caminho_pdf):
    """Extrai a seção de receitas (base fiscal LRF) da página 1 do PDF de saúde."""
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            if not pdf.pages:
                return {}
            texto = pdf.pages[0].extract_text() or ""
            resultado = extrair_receitas_formato_invertido(texto)
            if not resultado:
                resultado = extrair_receitas_do_texto(texto)
            return resultado
    except Exception as e:
        print(f"  Erro ao extrair receitas de {os.path.basename(caminho_pdf)}: {e}")
        return {}


def baixar_pdfs_sorocaba(pasta_pdfs):
    try:
        import requests
        from bs4 import BeautifulSoup
        import time
    except ImportError:
        print("Para baixar PDFs automaticamente, instale requests e beautifulsoup4.")
        return

    url_base = "https://fazenda.sorocaba.sp.gov.br/transparencia/"
    response = requests.get(url_base)
    if response.status_code != 200:
        print("Erro ao acessar o portal.")
        return

    soup = BeautifulSoup(response.content, 'html.parser')
    pdf_links = soup.find_all('a', href=re.compile(r'\.pdf$'))
    for link in pdf_links:
        href = link.get('href', '')
        if 'saude' in href.lower() and '2025' in href:
            pdf_url = href if href.startswith('http') else url_base + href.lstrip('/')
            nome_arquivo = os.path.basename(pdf_url)
            caminho_destino = os.path.join(pasta_pdfs, nome_arquivo)
            pdf_response = requests.get(pdf_url)
            if pdf_response.status_code == 200:
                with open(caminho_destino, 'wb') as f:
                    f.write(pdf_response.content)
                print(f"Baixado: {nome_arquivo}")
                import time as t
                t.sleep(1)
            else:
                print(f"Falha ao baixar {pdf_url}: HTTP {pdf_response.status_code}")


def main():
    if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    import argparse
    parser = argparse.ArgumentParser(description='Extrai despesas de saude dos PDFs de Sorocaba')
    parser.add_argument('--ano', type=int, default=2025, help='Ano a processar (padrão: 2025)')
    parser.add_argument('--debug', action='store_true', help='Imprime o PDF completo no console')
    args = parser.parse_args()

    ano = args.ano
    DEBUG_MODE = args.debug

    diretorio_script  = os.path.dirname(os.path.abspath(__file__))
    pasta_pdfs        = os.path.abspath(os.path.join(diretorio_script, "..", "sorocaba", "saude", "entrada"))
    intermediario_dir = os.path.abspath(os.path.join(diretorio_script, "..", "sorocaba", "saude", "intermediario"))
    saida_dir         = os.path.abspath(os.path.join(diretorio_script, "..", "frontend", "data", "saude", "saida"))
    os.makedirs(intermediario_dir, exist_ok=True)
    os.makedirs(saida_dir, exist_ok=True)

    quadrimestre_map = {'primeiro': 1, 'segundo': 2, 'terceiro': 3}

    pdfs = [
        os.path.join(pasta_pdfs, f"{ano}-{quad}-quadrimestre-relatorios-de-aplicacao-na-saude.pdf")
        for quad in quadrimestre_map
    ]

    print(f"Ano: {ano}")
    print("PDFs encontrados:")
    for pdf in pdfs:
        status = "OK" if os.path.exists(pdf) else "nao encontrado (quadrimestre ainda nao publicado?)"
        print(f" - {os.path.basename(pdf)}: {status}")

    print("\nIniciando extracao...")
    todas_as_despesas = []
    todas_as_receitas = []

    for pdf in pdfs:
        if not os.path.exists(pdf):
            continue

        nome = os.path.basename(pdf).lower()
        quadrimestre = next((n for palavra, n in quadrimestre_map.items() if palavra in nome), None)

        print(f"\nProcessando: {os.path.basename(pdf)}")
        extrair_tudo_pdf(pdf, intermediario_dir)
        if DEBUG_MODE:
            imprimir_pdf_completo(pdf)
        dados = extrair_tabela_saude(pdf)
        print(f"  Extraidas {len(dados)} linhas de tabela")
        if dados:
            todas_as_despesas.extend([linha + [quadrimestre] for linha in dados])
        else:
            print("  Nenhuma tabela de despesas encontrada.")

        receitas = extrair_receitas_saude(pdf)
        if receitas:
            receitas['Quadrimestre'] = quadrimestre
            todas_as_receitas.append(receitas)
            print(f"  Receitas: {len(receitas) - 1} campos extraidos")
        else:
            print("  Nenhuma receita extraida.")

    if todas_as_despesas:
        df = pd.DataFrame(todas_as_despesas, columns=['Funcao', 'Dotacao_Atualizada', 'Empenhada', 'Liquidada', 'Paga', 'Quadrimestre'])
        arquivo_csv = os.path.join(saida_dir, f'despesas_saude_sorocaba_{ano}.csv')
        df.to_csv(arquivo_csv, index=False, encoding='utf-8-sig')
        print(f"\nExtracao concluida! {len(df)} linhas salvas em '{arquivo_csv}'")
        print("Amostra dos dados:")
        print(df.head())
    else:
        print("\n❌ Nenhuma despesa foi extraída. Verifique se os PDFs têm o formato esperado.")

    if todas_as_receitas:
        RENAME = {
            'proprios_previsao': 'Proprios_Previsao',
            'proprios_arrecadado': 'Proprios_Arrecadado',
            'transferencias_federais_previsao': 'Transferencias_Federais_Previsao',
            'transferencias_federais_arrecadado': 'Transferencias_Federais_Arrecadado',
            'transferencias_estaduais_previsao': 'Transferencias_Estaduais_Previsao',
            'transferencias_estaduais_arrecadado': 'Transferencias_Estaduais_Arrecadado',
            'total_base_previsao': 'Total_Base_Previsao',
            'total_base_arrecadado': 'Total_Base_Arrecadado',
            'minimo_saude_previsao': 'Minimo_Saude_Previsao',
            'minimo_saude_arrecadado': 'Minimo_Saude_Arrecadado',
            'percentual_aplicado_liquidado': 'Percentual_Aplicado_Liquidado',
        }
        rows = [{RENAME.get(k, k): v for k, v in r.items()} for r in todas_as_receitas]
        df_receitas = pd.DataFrame(rows)
        cols = ['Quadrimestre'] + [v for v in RENAME.values() if v in df_receitas.columns]
        df_receitas = df_receitas.reindex(columns=cols)
        arquivo_receitas = os.path.join(saida_dir, f'receitas_base_saude_sorocaba_{ano}.csv')
        df_receitas.to_csv(arquivo_receitas, index=False, encoding='utf-8-sig')
        print(f"\nReceitas salvas em '{arquivo_receitas}'")
        print(df_receitas.to_string())
    else:
        print("\n⚠️  Nenhuma receita foi extraída.")


if __name__ == "__main__":
    main()
