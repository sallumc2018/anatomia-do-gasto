#!/usr/bin/env python3
"""Teste rápido da formatação de tabela com quebra de linha"""

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


data = [
    {
        "Valor": "2.161.490,38",
        "Fonte": "1.7.2.1.52.0.1.0000 COTA PARTE DO IPI MUNICIPALIZACAO",
        "Significado": "Fonte financeira relacionada aos recursos públicos de saúde"
    },
    {
        "Valor": "1.568.436.123,81",
        "Fonte": "Impostos",
        "Significado": "Dinheiro cobrado pelo governo sobre renda, vendas ou propriedades para financiar serviços públicos."
    },
    {
        "Valor": "134.272.956,00",
        "Fonte": "1.7.1.1.51.1.1.0000   COTA PARTE DO FPM   COTA MENSAL   PRINCIPAL",
        "Significado": "Fonte financeira relacionada aos recursos públicos de saúde."
    },
]

col_width_valor = 17  # igual ao extrator_universal.py
col_width_fonte = 60
col_width_significado = 30
total_width = col_width_valor + col_width_fonte + col_width_significado + 6

print("PDF: test-example.pdf")
print("=" * total_width)

header_row = f"{'-' * col_width_valor}+{'-' * col_width_fonte}+{'-' * col_width_significado}+"
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
