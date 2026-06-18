"""
Reparse dos contratos Urbes a partir do OCR ja extraido.

Melhorias sobre a 1a extracao:
- numero_contrato: derivado do nome do arquivo quando confiavel; OCR como fallback.
- cnpj_contratada: ignora CNPJs institucionais recorrentes.
- fornecedor: extrai padroes de URBES, Prefeitura/Municipio, operadora e contratada.
- valor: combina valores monetarios do texto com o campo OCR original validado.

Entrada: data/extracted/sorocaba/urbes/contratos_*_ocr.csv
Saida:   data/extracted/sorocaba/urbes/contratos_*_reparsed.csv
Nao publica.
"""
from __future__ import annotations

import csv
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URBES = ROOT / "data" / "extracted" / "sorocaba" / "urbes"

CNPJS_INSTITUCIONAIS = {
    "50.333.699/0001-80",  # URBES
    "46.634.044/0001-74",  # Prefeitura de Sorocaba; aparece em anexos/legislacao
}

_RE_ARQ_NUM = re.compile(r"_0*(\d{1,4})-(\d{4})_")
_RE_CNPJ = re.compile(r"\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}")
_RE_NUM_OCR = re.compile(r"CONTRATO\s*N[Âº°o]?\s*([\d]{1,4}\s*/\s*\d{2,4})", re.I)
_RE_MONEY = re.compile(r"R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2,3}|\d+,\d{2,3})", re.I)
_RE_BR_NUMBER = re.compile(r"^\d{1,3}(?:\.\d{3})*,\d{2,3}$|^\d+,\d{2,3}$")

_FORNECEDOR_PATTERNS = [
    (re.compile(r"CONTRATADA\s*:?\s*([A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ&.,/\- ]{5,140}?)(?=\s+Processo|,|\n|$)", re.I), "contratada"),
    (re.compile(r"MUNIC[ÍI]PIO\s+DE\s+SOROCABA\s+E\s+(?:A\s+EMPRESA\s+|A\s+|O\s+)?([A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ&.,/\- ]{5,140}?)(?=\.|,|\n)", re.I), "titulo_municipio"),
    (re.compile(r"do\s+outro\s+lado,?\s+(?:a\s+|o\s+)?([A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ&.,/\- ]{5,140}?)(?=,\s*(?:com sede|inscrit[ao]))", re.I), "outro_lado"),
    (re.compile(r"\be\s+(STU\s*[-—]\s*SOROCABA\s+TRANSPORTES\s+URBANOS\s+LTDA)", re.I), "stu"),
    (re.compile(r"\be\s+(CITY\s+TRANSPORTE\s+URBANO\s+GLOBAL\s+LTDA\.?)", re.I), "city"),
    (re.compile(r"\be\s+(CONS[ÓO]RCIO\s+MOBILITY\s+TRANSPORTES)", re.I), "consorcio"),
    (re.compile(r"firmado\s+com\s+a\s+empresa\s+([A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ&.,/\- ]{5,120}?)(?=,|\s+atrav)", re.I), "empresa_firmado"),
    (re.compile(r"URBES\s+E\s+([A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ&.\- ]{4,100}?)(?=[,.]|\bCONTRATO\b|\bcom\b|\bA EMPRESA\b|\n)", re.I), "urbes_e"),
]


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
    cnpjs: list[str] = []
    for raw in _RE_CNPJ.findall(texto):
        digs = re.sub(r"\D", "", raw)
        if len(digs) != 14:
            continue
        fmt = f"{digs[:2]}.{digs[2:5]}.{digs[5:8]}/{digs[8:12]}-{digs[12:]}"
        if fmt not in CNPJS_INSTITUCIONAIS and fmt not in cnpjs:
            cnpjs.append(fmt)
    return cnpjs[0] if cnpjs else ""


def _sem_acentos(valor: str) -> str:
    return "".join(
        ch for ch in unicodedata.normalize("NFKD", valor or "")
        if not unicodedata.combining(ch)
    )


def _limpar_nome(nome: str) -> str:
    nome = re.sub(r"\s+", " ", nome or "").strip(" .,-:;")
    nome = re.sub(r"^(A|O)\s+EMPRESA\s+", "", nome, flags=re.I)
    nome = re.sub(r"\s+LTDA\.?$", " LTDA.", nome, flags=re.I)
    return nome


def _nome_plausivel(nome: str, origem: str) -> bool:
    bruto = _sem_acentos(nome).upper()
    if len(nome) < 4:
        return False
    if any(token in bruto for token in [
        "PREFEITURA",
        "URBES",
        "MUNICIPIO",
        "INTERNET",
        "DESENVOLVIMENTO URBANO E SOCIAL",
    ]):
        return False
    if origem != "urbes_e":
        return any(token in bruto for token in ["LTDA", "S/A", "SA", "CONSORCIO", "STU", "CITY", "TRANSPORTE"])
    palavras = [p for p in re.split(r"\W+", bruto) if len(p) > 1]
    return len(palavras) >= 2 and not bruto.startswith("SOCIAL")


def fornecedor(texto: str) -> tuple[str, str]:
    compacto = re.sub(r"\s+", " ", texto or "")
    for pattern, origem in _FORNECEDOR_PATTERNS:
        m = pattern.search(compacto)
        if not m:
            continue
        nome = _limpar_nome(m.group(1))
        if _nome_plausivel(nome, origem):
            return nome, origem
    return "", ""


def _br_float(valor: str) -> float:
    return float(valor.replace(".", "").replace(",", "."))


def _valor_valido(valor: str) -> str:
    valor = (valor or "").strip()
    if not _RE_BR_NUMBER.match(valor):
        return ""
    return valor


def _contexto_valor(texto: str, valor: str) -> str:
    compacto = re.sub(r"\s+", " ", texto or "")
    pos = compacto.find(valor)
    if pos < 0:
        return ""
    return compacto[max(0, pos - 110):pos + len(valor) + 110]


def _tipo_valor(contexto: str) -> str:
    ctx = _sem_acentos(contexto).upper()
    if any(token in ctx for token in ["TARIFA", "QUILOMETR", "KM RODADO"]):
        return "tarifa_ou_km"
    if "REMUNERACAO PREVISTA ANUAL" in ctx:
        return "remuneracao_anual"
    if any(token in ctx for token in ["VALOR TOTAL", "VALOR ESTIMADO", "DA-SE AO PRESENTE", "PAGARA A URBES"]):
        return "valor_total_ou_estimado"
    if "R$" in contexto:
        return "monetario_contextual"
    return "ocr_original"


def valor_contrato(texto: str, valor_ocr: str = "") -> tuple[str, str, str]:
    candidatos: list[tuple[str, str, str]] = []
    for m in _RE_MONEY.finditer(texto or ""):
        valor = _valor_valido(m.group(1))
        if not valor:
            continue
        ctx = _contexto_valor(texto, valor)
        candidatos.append((valor, _tipo_valor(ctx), "texto"))

    valor_ocr = _valor_valido(valor_ocr)
    if valor_ocr and all(c[0] != valor_ocr for c in candidatos):
        candidatos.append((valor_ocr, "ocr_original", "ocr_original"))

    if not candidatos:
        return "", "", "valor monetario nao identificado no OCR disponivel"

    preferidos = [c for c in candidatos if _br_float(c[0]) >= 1000]
    return max(preferidos or candidatos, key=lambda c: _br_float(c[0]))


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
        forn, forn_origem = fornecedor(txt)
        valor, valor_tipo, valor_origem = valor_contrato(txt, r.get("valor", ""))
        out_rows.append({
            "subpasta": sub,
            "arquivo": arq,
            "numero_contrato": num,
            "numero_origem": origem,
            "fornecedor": forn,
            "fornecedor_origem": forn_origem,
            "cnpj_contratada": cnpj_contratada(txt),
            "valor_brl": valor,
            "valor_tipo": valor_tipo,
            "valor_origem": valor_origem,
            "valor_obs": "" if valor else "valor monetario nao identificado no OCR disponivel",
            "status_ocr": r.get("status_ocr", ""),
            "chars": r.get("chars", ""),
        })

    campos = [
        "subpasta", "arquivo", "numero_contrato", "numero_origem", "fornecedor",
        "fornecedor_origem", "cnpj_contratada", "valor_brl", "valor_tipo",
        "valor_origem", "valor_obs", "status_ocr", "chars",
    ]
    dest = URBES / f"contratos_{sub}_reparsed.csv"
    with dest.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(out_rows)

    n = len(out_rows)
    return {
        "sub": sub,
        "total": n,
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
        print(
            f"{sub}: {r['total']} contratos | "
            f"n={r['com_contrato']} forn={r['com_fornecedor']} "
            f"cnpj={r['com_cnpj']} valor={r['com_valor']}"
        )
        print(f"  -> {r['dest'].name}")


if __name__ == "__main__":
    main()
