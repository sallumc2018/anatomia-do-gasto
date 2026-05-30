"""
Reparse dos contratos Urbes a partir do OCR ja extraido.

Melhorias sobre a 1a extracao:
- numero_contrato: derivado do NOME DO ARQUIVO (confiavel) em vez do OCR (erra muito)
- cnpj_contratada: ignora o CNPJ da URBES (50.333.699/0001-80) e pega o da contratada
- fornecedor: extraido do padrao "URBES E [NOME]"
- valor: mantem padrao R$ / valores monetarios

Entrada: data/extracted/sorocaba/urbes/contratos_*_ocr.csv (tem texto_bruto_p1p2)
Saida:   data/extracted/sorocaba/urbes/contratos_*_reparsed.csv
Nao publica.
"""
from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URBES = ROOT / "data" / "extracted" / "sorocaba" / "urbes"

CNPJ_URBES = "50.333.699/0001-80"

# numero do contrato pelo nome do arquivo: _0023-2022_  ->  23/2022
_RE_ARQ_NUM = re.compile(r"_0*(\d{1,4})-(\d{4})_")
_RE_CNPJ = re.compile(r"\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}")
_RE_VALOR = re.compile(r"R\$\s*([\d.]+,\d{2})")
# numero pelo OCR (fallback p/ transporte): "CONTRATO N° X/YY" ou "CONTRATO N° XXX"
_RE_NUM_OCR = re.compile(r"CONTRATO\s*N[º°o]?\s*([\d]{1,4}\s*/\s*\d{2,4})", re.I)
# qualquer valor monetario, p/ escolher o do contrato (ignora ruido < 1000)
_RE_MONEY = re.compile(r"(\d{1,3}(?:\.\d{3})+,\d{2})")
# fornecedor: "URBES E <NOME>" ate pontuacao/CONTRATO/com sede
_RE_FORN = re.compile(
    r"URBES\s+E\s+([A-Z0-9ÇÃÕÁÉÍÓÚÂÊÔÀ&.\-\s]{4,90}?)"
    r"(?:[,.]|\bCONTRATO\b|\bcom\b|\bcom sede\b|\bcom endere|\n\n|\bA EMPRESA\b)",
    re.I,
)


def numero_contrato(arquivo: str, texto: str = "") -> tuple[str, str]:
    """Retorna (numero, origem). Filename e confiavel; OCR e fallback de menor confianca."""
    m = _RE_ARQ_NUM.search(arquivo)
    if m:
        return f"{int(m.group(1))}/{m.group(2)}", "arquivo"
    m2 = _RE_NUM_OCR.search(texto)
    if m2:
        return re.sub(r"\s+", "", m2.group(1)), "ocr"
    return "", ""


def cnpj_contratada(texto: str) -> str:
    cnpjs = []
    for raw in _RE_CNPJ.findall(texto):
        # normaliza para formato com pontuacao
        digs = re.sub(r"\D", "", raw)
        if len(digs) != 14:
            continue
        fmt = f"{digs[:2]}.{digs[2:5]}.{digs[5:8]}/{digs[8:12]}-{digs[12:]}"
        if fmt != CNPJ_URBES and fmt not in cnpjs:
            cnpjs.append(fmt)
    return cnpjs[0] if cnpjs else ""


def fornecedor(texto: str) -> str:
    m = _RE_FORN.search(texto)
    if not m:
        return ""
    nome = re.sub(r"\s+", " ", m.group(1)).strip(" .,-")
    # descarta capturas obviamente ruins (muito curtas / so a propria URBES)
    if len(nome) < 4 or nome.upper().startswith("SOCIAL"):
        return ""
    return nome


def valor_contrato(texto: str) -> str:
    # so valores com separador de milhar (>= 1.000,00) — ignora precos unitarios/ruido
    vals = _RE_MONEY.findall(texto)
    def num(v):
        return float(v.replace(".", "").replace(",", "."))
    vals = [v for v in vals if num(v) >= 1000]
    if not vals:
        return ""
    # valor global do contrato costuma ser o maior nas primeiras paginas
    return max(vals, key=num)


def reparse(sub: str) -> dict:
    src = URBES / f"contratos_{sub}_ocr.csv"
    if not src.exists():
        return {"sub": sub, "erro": "fonte ausente"}
    rows = list(csv.DictReader(src.open(encoding="utf-8")))

    out_rows = []
    for r in rows:
        arq = r.get("arquivo", "")
        txt = r.get("texto_bruto_p1p2", "") or ""
        num, origem = numero_contrato(arq, txt)
        out_rows.append({
            "subpasta": sub,
            "arquivo": arq,
            "numero_contrato": num,
            "numero_origem": origem,
            "fornecedor": fornecedor(txt),
            "cnpj_contratada": cnpj_contratada(txt),
            "valor_brl": valor_contrato(txt),
            "valor_obs": "" if valor_contrato(txt) else "valor nao consta nas 3 primeiras paginas OCR",
            "status_ocr": r.get("status_ocr", ""),
            "chars": r.get("chars", ""),
        })

    campos = ["subpasta", "arquivo", "numero_contrato", "numero_origem", "fornecedor",
              "cnpj_contratada", "valor_brl", "valor_obs", "status_ocr", "chars"]
    dest = URBES / f"contratos_{sub}_reparsed.csv"
    with dest.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(out_rows)

    n = len(out_rows)
    return {
        "sub": sub, "total": n,
        "com_contrato": sum(1 for r in out_rows if r["numero_contrato"]),
        "com_fornecedor": sum(1 for r in out_rows if r["fornecedor"]),
        "com_cnpj": sum(1 for r in out_rows if r["cnpj_contratada"]),
        "com_valor": sum(1 for r in out_rows if r["valor_brl"]),
        "dest": dest,
    }


def main() -> None:
    for sub in ["contratos_outros", "contratos_receitas", "contratos_transporte"]:
        r = reparse(sub)
        if "erro" in r:
            print(f"{sub}: {r['erro']}")
            continue
        print(f"{sub}: {r['total']} contratos | "
              f"nº={r['com_contrato']} forn={r['com_fornecedor']} "
              f"cnpj={r['com_cnpj']} valor={r['com_valor']}")
        print(f"  -> {r['dest'].name}")


if __name__ == "__main__":
    main()
