import re
import sys
import json
import base64
import os
from pathlib import Path
import pdfplumber
from paths import SAUDE_RAW_DIR, SAUDE_EXTRACTED_DIR


def to_json_compatible(value):
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, bytes):
        return base64.b64encode(value).decode("ascii")
    if isinstance(value, dict):
        return {k: to_json_compatible(v) for k, v in value.items()}
    if isinstance(value, list):
        return [to_json_compatible(v) for v in value]
    try:
        return str(value)
    except Exception:
        return None


def extract_image_data(image_dict):
    image = {k: to_json_compatible(v) for k, v in image_dict.items() if k != "stream"}
    if "stream" in image_dict and isinstance(image_dict["stream"], (bytes, bytearray)):
        image["data_base64"] = base64.b64encode(image_dict["stream"]).decode("ascii")
    return image


def extract_page_structure(page, number):
    words = page.extract_words(use_text_flow=True) or []
    tables = page.extract_tables() or []
    page_objects = getattr(page, "objects", {}) or {}

    return {
        "pagina": number,
        "largura": page.width,
        "altura": page.height,
        "texto": (page.extract_text() or "").splitlines(),
        "palavras": [to_json_compatible(w) for w in words],
        "chars": [to_json_compatible(c) for c in page.chars or []],
        "tabelas": [to_json_compatible(t) for t in tables],
        "linhas": [to_json_compatible(l) for l in page.lines or []],
        "retangulos": [to_json_compatible(r) for r in page.rects or []],
        "curvas": [to_json_compatible(c) for c in page.curves or []],
        "imagens": [extract_image_data(i) for i in (page.images or [])],
        "objetos": {key: [to_json_compatible(v) for v in value] for key, value in page_objects.items()},
        "debug": {
            "palavras_por_top": [
                {
                    "top": top,
                    "texto": " ".join(w["text"] for w in sorted(words_at_top, key=lambda item: item["x0"])),
                    "items": [to_json_compatible(w) for w in sorted(words_at_top, key=lambda item: item["x0"])]
                }
                for top, words_at_top in group_words_by_top(words)
            ]
        }
    }


def group_words_by_top(words, precision=1.0):
    buckets = {}
    for word in words:
        top = round(float(word.get("top", 0.0)), int(precision))
        buckets.setdefault(top, []).append(word)
    for top in sorted(buckets):
        yield top, buckets[top]


def extract_pdf_content(path, output_dir):
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(path)

    with pdfplumber.open(path) as pdf:
        document = {
            "arquivo": path.name,
            "caminho": str(path.resolve()),
            "numero_paginas": len(pdf.pages),
            "metadata": to_json_compatible(getattr(pdf, "metadata", {}) or {}),
            "is_encrypted": getattr(pdf, "is_encrypted", False),
            "paginas": [extract_page_structure(page, index + 1) for index, page in enumerate(pdf.pages)],
        }

    output_path = output_dir / f"{path.name}.json"
    with output_path.open("w", encoding="utf-8") as output_file:
        json.dump(document, output_file, ensure_ascii=False, indent=2)

    return output_path, document


def parse_financial_data(document):
    entradas = []
    saidas = []

    for pagina in document["paginas"]:
        texto = "\n".join(pagina["texto"])
        tabelas = pagina["tabelas"]

        linhas = texto.splitlines()
        for linha in linhas:
            linha = linha.strip()
            if not linha:
                continue

            valores = re.findall(r'\d{1,3}(?:\.\d{3})*,\d{2}', linha)
            if valores:
                descricao = re.sub(r'\d{1,3}(?:\.\d{3})*,\d{2}', '', linha).strip()
                descricao = re.sub(r'[|_-]+', ' ', descricao).strip()

                if re.search(r'(receita|arrecadação|imposto|transferencia|doação|cota|municipalizacao)', linha, re.IGNORECASE):
                    for valor in valores:
                        entradas.append({"fonte": descricao, "valor": valor})
                elif re.search(r'(despesa|gastos|aplicação|saúde|hospitalar|ambulatorial)', linha, re.IGNORECASE):
                    for valor in valores:
                        saidas.append({"fonte": descricao, "valor": valor})

        for tabela in tabelas:
            for row in tabela:
                if not row or len(row) < 2:
                    continue
                row_str = " ".join(str(cell) for cell in row if cell)
                valores = re.findall(r'\d{1,3}(?:\.\d{3})*,\d{2}', row_str)
                if valores:
                    descricao = re.sub(r'\d{1,3}(?:\.\d{3})*,\d{2}', '', row_str).strip()
                    descricao = re.sub(r'[|_-]+', ' ', descricao).strip()
                    if re.search(r'(receita|arrecadação|imposto|transferencia|doação|cota|municipalizacao)', row_str, re.IGNORECASE):
                        for valor in valores:
                            entradas.append({"fonte": descricao, "valor": valor})
                    elif re.search(r'(despesa|gastos|aplicação|saúde|hospitalar|ambulatorial)', row_str, re.IGNORECASE):
                        for valor in valores:
                            saidas.append({"fonte": descricao, "valor": valor})

    return entradas, saidas


EXPLICACOES = {
    "receita orcamentaria": "Receitas que o governo planeja arrecadar no ano, como impostos, transferências e outras fontes de dinheiro público.",
    "divida ativa de impostos": "Dinheiro que pessoas ou empresas devem ao governo por impostos não pagos, que são cobrados pela justiça.",
    "divida ativa": "Dinheiro que pessoas ou empresas devem ao governo por impostos não pagos, que são cobrados pela justiça.",
    "subtotal receitas vinculadas": "Parte do dinheiro arrecadado que deve ser usado para coisas específicas, como saúde ou educação, por lei.",
    "impostos": "Dinheiro cobrado pelo governo sobre renda, vendas ou propriedades para financiar serviços públicos.",
    "transferencias": "Dinheiro enviado pelo governo federal ou estadual para ajudar cidades como Sorocaba.",
    "cota-parte": "Parte dos impostos arrecadados que é dividida entre estados e municípios.",
    "municipalizacao da saude": "Recursos destinados especificamente para financiar a saúde pública no município.",
    "atencao basica": "Serviços de saúde básicos, como consultas e vacinas, para toda a população.",
    "assistencia hospitalar": "Custos com hospitais, cirurgias e tratamentos em unidades de saúde.",
    "vigilancia sanitaria": "Ações para prevenir doenças e garantir a qualidade da água, alimentos e ambientes.",
    "vigilancia epidemiologica": "Monitoramento e controle de doenças contagiosas na população.",
    "suporte profilatico": "Medicamentos e tratamentos preventivos para evitar doenças.",
    "alimentacao e nutricao": "Programas para fornecer comida saudável e combater a desnutrição.",
    "despesa": "Dinheiro gasto pelo governo em serviços, salários e investimentos.",
    "receita": "Dinheiro que entra nos cofres públicos, como impostos e doações.",
    "orcamentaria": "Relacionado ao plano financeiro anual do governo.",
    "vinculadas": "Recursos que devem ser usados para fins específicos determinados por lei."
}


def explicar_fonte(fonte):
    fonte_lower = fonte.lower()
    for chave, explicacao in EXPLICACOES.items():
        if chave in fonte_lower:
            return explicacao
    if "receita" in fonte_lower:
        return "Fonte de dinheiro que entra no governo, como impostos ou transferências."
    elif "despesa" in fonte_lower or "gasto" in fonte_lower:
        return "Dinheiro gasto pelo governo em serviços públicos ou investimentos."
    elif "imposto" in fonte_lower:
        return "Taxa cobrada pelo governo sobre renda, vendas ou propriedades."
    elif "transferencia" in fonte_lower:
        return "Dinheiro enviado de outros níveis de governo (federal ou estadual)."
    else:
        return "Fonte financeira relacionada aos recursos públicos de saúde."


def wrap_text(text, width):
    if len(text) <= width:
        return [text]

    lines = []
    current_line = ""
    words = text.split()

    for word in words:
        if len(current_line) + len(word) + 1 <= width:
            current_line += word + " "
        else:
            if current_line:
                lines.append(current_line.rstrip())
            current_line = word + " "

    if current_line:
        lines.append(current_line.rstrip())

    return lines if lines else [text]


def print_financial_table(pdf_name, entradas, saidas):
    print(f"\nPDF: {pdf_name}")

    data = []
    for e in entradas:
        data.append({"Valor": e["valor"], "Fonte": e["fonte"], "Significado": explicar_fonte(e["fonte"])})
    for s in saidas:
        data.append({"Valor": s["valor"], "Fonte": s["fonte"], "Significado": explicar_fonte(s["fonte"])})

    if not data:
        print("Nenhum dado financeiro encontrado.")
        return

    col_width_valor = 17
    col_width_fonte = 60
    col_width_significado = 30
    total_width = col_width_valor + col_width_fonte + col_width_significado + 6

    header_row = f"{'-' * (col_width_valor + 1)}+{'-' * (col_width_fonte + 2)}+{'-' * (col_width_significado + 1)}+"
    print("=" * total_width)
    print(header_row)
    print(" | ".join([
        "Valor".ljust(col_width_valor),
        "Fonte".ljust(col_width_fonte),
        "Significado".ljust(col_width_significado)
    ]) + "|")
    print(header_row)

    for row in data:
        valor = str(row["Valor"]).ljust(col_width_valor)
        fonte_lines = wrap_text(str(row["Fonte"]), col_width_fonte)
        sig_lines = wrap_text(str(row["Significado"]), col_width_significado)
        max_lines = max(len(fonte_lines), len(sig_lines))

        fl = fonte_lines[0].ljust(col_width_fonte) if fonte_lines else "".ljust(col_width_fonte)
        sl = sig_lines[0].ljust(col_width_significado) if sig_lines else "".ljust(col_width_significado)
        print(f"{valor} | {fl} | {sl}|")

        for i in range(1, max_lines):
            empty = " ".ljust(col_width_valor)
            fl = fonte_lines[i].ljust(col_width_fonte) if i < len(fonte_lines) else "".ljust(col_width_fonte)
            sl = sig_lines[i].ljust(col_width_significado) if i < len(sig_lines) else "".ljust(col_width_significado)
            print(f"{empty} | {fl} | {sl}|")

        print(header_row)


def parse_args():
    import argparse
    parser = argparse.ArgumentParser(description="Extrai todo o conteúdo de PDFs para JSON.")
    parser.add_argument("input", nargs="*", help="Arquivos, pastas ou padrões de PDF. Se vazio, usa data/raw/sorocaba/saude/entrada.")
    parser.add_argument("--output", "-o", default=None, help="Pasta onde os JSONs serão salvos. Padrão: data/extracted/sorocaba/saude/intermediario.")
    parser.add_argument("--verbose", "-v", action="store_true", help="Imprime progresso no console.")
    return parser.parse_args()


def expand_inputs(inputs):
    paths = []
    for item in inputs:
        candidate = Path(item)
        if candidate.is_file() and candidate.suffix.lower() == ".pdf":
            paths.append(candidate)
            continue
        if candidate.is_dir():
            paths.extend(sorted(candidate.glob("*.pdf")))
            continue
        if any(wildcard in item for wildcard in ["*", "?", "["]):
            paths.extend(sorted(Path().glob(item)))
            continue
        if candidate.exists():
            paths.append(candidate)
            continue
        raise FileNotFoundError(item)
    return paths


def main():
    args = parse_args()
    base_dir = Path(__file__).resolve().parent
    default_pdf_dir = SAUDE_RAW_DIR / "entrada"
    output_dir = Path(args.output) if args.output else SAUDE_EXTRACTED_DIR / "intermediario"
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.input:
        inputs = expand_inputs(args.input)
    else:
        if not default_pdf_dir.exists():
            raise FileNotFoundError(f"Pasta padrão de PDFs não encontrada: {default_pdf_dir}")
        inputs = sorted(default_pdf_dir.glob("*.pdf"))

    if not inputs:
        print("Nenhum PDF encontrado para extrair.")
        return

    if args.verbose:
        print(f"Extraindo {len(inputs)} PDF(s) para {output_dir}")

    if sys.stdout.encoding != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    for idx, pdf_path in enumerate(inputs, start=1):
        if args.verbose:
            print(f"Processando {pdf_path}")
        try:
            total_pdfs = len(inputs)
            print("\n" + "#" * 4 + f" PDF {idx}/{total_pdfs}: {pdf_path.name} " + "#" * 4)
            output_file, document = extract_pdf_content(pdf_path, output_dir)
            print(f"Dump salvo: {output_file}")
            entradas, saidas = parse_financial_data(document)
            print_financial_table(pdf_path.name, entradas, saidas)
            print("\n" + "=" * 4 + f" FIM PDF {idx} " + "=" * 4 + "\n")
        except Exception as exc:
            print(f"Erro em {pdf_path}: {exc}")


if __name__ == "__main__":
    main()
