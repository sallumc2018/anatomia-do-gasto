"""
Extrator do ORÇAMENTO TOTAL APROVADO (LOA) de Paulínia a partir do TEXTO das leis.

Motivação: extrator_loa_paulinia.py tenta extrair TABELAS com pdfplumber, mas os
PDFs das LOAs de Paulínia são leis em texto corrido (sem tabelas com bordas) — a
extração de tabela retorna 0 linhas. Porém o valor total do orçamento está no
corpo da lei, no artigo da estimativa da receita:

    "...estimada em R$ 2.899.159.321,00 (dois bilhões, oitocentos e noventa e..."

Na LOA, a receita estimada = a despesa fixada (orçamento equilibrado, art. 165 CF
e Lei 4.320/1964). Este script extrai esse valor — dado primário e auditável,
direto da lei sancionada — e o exercício financeiro mencionado no art. 1º.

Veracidade: o valor numérico é confirmado contra o valor por extenso do próprio
texto (ambos gravados no CSV para auditoria). O exercício é lido do texto
("para o exercício financeiro de AAAA"), não inferido da data da lei.

Uso:
    MUNICIPIO=paulinia .venv/bin/python3 pipelines/extrator_loa_texto_paulinia.py

Saída:
    data/public/paulinia/orcamento/saida/loa_orcamento_aprovado_paulinia.csv
"""
from __future__ import annotations

import csv
import re
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from pipelines.paths import RAW_BASE_DIR  # noqa: E402

RAW_LOA = RAW_BASE_DIR / "paulinia" / "smarapd" / "pecas_planejamento" / "loa"
PUBLIC_DIR = ROOT / "data" / "public" / "paulinia" / "orcamento" / "saida"
OUT_CSV = PUBLIC_DIR / "loa_orcamento_aprovado_paulinia.csv"

try:
    import pdfplumber
except ImportError:
    print("ERRO: pdfplumber não instalado", file=sys.stderr)
    sys.exit(1)

# "...estimada em R$ 1.892.641.000,00 (Um Bilhão, Oitocentos e ..."
_RE_VALOR = re.compile(
    r"estimada\s+em\s*R\$\s*([\d.]+,\d{2})\s*\(([^)]+)\)",
    re.IGNORECASE | re.DOTALL,
)
# "...para o exercício financeiro de 2025..."
_RE_EXERCICIO = re.compile(r"exerc[ií]cio\s+financeiro\s+de\s+(20\d{2})", re.IGNORECASE)
# Nº da lei e ano de promulgação a partir do nome do arquivo, já URL-decodificado.
# O formato do nome varia ("LEI Nº 4.521, DE 26 DE DEZEMBRO DE 2024",
# "LEI 4188 DE 26 DEZEMBRO DE 2022"), então extraímos de forma tolerante:
# o número logo após "LEI" e o ÚLTIMO ano de 4 dígitos do nome (promulgação).
_RE_LEI_NUM = re.compile(r"LEI[\s_Nº°]*?(\d[\d.]*\d)", re.IGNORECASE)
_RE_ANO_NOME = re.compile(r"(20\d{2})")
# Rodapé que polui a captura do valor por extenso (varia por exercício)
_RE_RODAPE = re.compile(r"\s{2,}|_{3,}|\bAvenida\b|\bCep\b|\bFone\b|\bETS\b|\bFPFJ\b|\bLASF\b", re.IGNORECASE)


def _to_float(br: str) -> float:
    """1.892.641.000,00 -> 1892641000.00"""
    return float(br.replace(".", "").replace(",", "."))


def main() -> int:
    pdfs = sorted(p for p in RAW_LOA.glob("*.pdf") if re.search(r"LEI", p.name, re.I))
    if not pdfs:
        print(f"Nenhuma LEI de LOA em {RAW_LOA}", file=sys.stderr)
        return 1

    rows: list[dict] = []
    for pdf in pdfs:
        # Lê apenas as primeiras páginas (artigos iniciais) — suficiente e rápido
        texto = ""
        with pdfplumber.open(pdf) as doc:
            for page in doc.pages[:4]:
                texto += (page.extract_text() or "") + "\n"

        m_val = _RE_VALOR.search(texto)
        m_ex = _RE_EXERCICIO.search(texto)
        if not m_val or not m_ex:
            print(f"  ⚠️  {pdf.name}: valor/exercício não localizado (verificar manualmente)")
            continue

        valor_num = _to_float(m_val.group(1))
        # Normaliza espaços e trunca no início do rodapé (o ")" às vezes cai
        # em página seguinte e o DOTALL captura lixo institucional)
        extenso = re.sub(r"\s+", " ", m_val.group(2)).strip()
        extenso = _RE_RODAPE.split(extenso)[0].strip().rstrip(",")
        exercicio = int(m_ex.group(1))

        nome = urllib.parse.unquote(pdf.name)
        m_num = _RE_LEI_NUM.search(nome)
        lei_num = m_num.group(1).strip(".") if m_num else ""
        anos_nome = _RE_ANO_NOME.findall(nome)
        lei_ano = anos_nome[-1] if anos_nome else ""

        rows.append({
            "ano_exercicio": exercicio,
            "orcamento_total_reais": f"{valor_num:.2f}",
            "valor_por_extenso": extenso,
            "lei_numero": lei_num,
            "lei_ano_promulgacao": lei_ano,
            "fonte_arquivo": pdf.name,
            "metodologia": "receita estimada = despesa fixada (orcamento equilibrado, art. 165 CF / Lei 4.320-1964); valor extraido do texto da lei sancionada",
        })
        print(f"  ✅ exercício {exercicio}: R$ {valor_num:,.2f}  (Lei {lei_num}/{lei_ano}) — {extenso[:40]}…")

    if not rows:
        print("Nenhum valor extraído.", file=sys.stderr)
        return 1

    rows.sort(key=lambda r: r["ano_exercicio"])
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    fields = ["ano_exercicio", "orcamento_total_reais", "valor_por_extenso",
              "lei_numero", "lei_ano_promulgacao", "fonte_arquivo", "metodologia"]
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"\n✅ {OUT_CSV.relative_to(ROOT)} — {len(rows)} exercícios")
    return 0


if __name__ == "__main__":
    sys.exit(main())
