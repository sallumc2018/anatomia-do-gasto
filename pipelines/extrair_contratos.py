"""
Extrai licitações 2020-2021 e obras de Sorocaba para CSV.

Fontes:
  data/raw/sorocaba/contratos/legados/2020-2021/indice_licitacoes.json
  data/raw/sorocaba/contratos/obras/obras_sorocaba_detalhes.json

Saída:
  data/extracted/sorocaba/contratos/licitacoes_sorocaba_2020_2021.csv
  data/extracted/sorocaba/contratos/obras_sorocaba.csv
"""
import csv
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from paths import CONTRATOS_EXTRACTED_DIR, CONTRATOS_RAW_DIR

# Matches UTF-8 sequences mis-read as latin1 and stored as Unicode code points:
#   2-byte: U+00C2-U+00DF followed by U+0080-U+00BF
#   3-byte: U+00E0-U+00EF followed by two U+0080-U+00BF
_MOJIBAKE_RE = re.compile(r"[\xE0-\xEF][\x80-\xBF]{2}|[\xC2-\xDF][\x80-\xBF]")


def fix_mojibake(s: str) -> str:
    """Fix mojibake sequences selectively, leaving already-correct chars untouched.

    The whole-string encode/decode approach fails when a string has a mix of
    already-correct accented chars (e.g. Ú, É) and mojibake sequences (e.g. Ã§).
    This regex replaces only the mojibake patterns, char by char.
    """
    if not isinstance(s, str):
        return s

    def _fix(m: re.Match) -> str:
        try:
            return m.group(0).encode("latin1").decode("utf-8")
        except (UnicodeDecodeError, UnicodeEncodeError):
            return m.group(0)

    return _MOJIBAKE_RE.sub(_fix, s)


def _normalizar_percentual(s) -> str:
    """Normalize percentage strings to NN,NN% format (e.g. '0%' → '0,00%')."""
    if not s:
        return s
    s = str(s).strip()
    if re.match(r"^\d+,\d{2}%$", s):
        return s
    m = re.match(r"^(\d+(?:[.,]\d+)?)%$", s)
    if m:
        try:
            val = float(m.group(1).replace(",", "."))
            return f"{val:.2f}".replace(".", ",") + "%"
        except ValueError:
            return s
    return s


def _cnpj_check_digits(base12: str) -> str:
    """Calcula os dois dígitos verificadores do CNPJ a partir dos 12 primeiros."""
    pesos_dv1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos_dv2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma1 = sum(int(d) * p for d, p in zip(base12, pesos_dv1))
    dv1 = (soma1 % 11)
    dv1 = 0 if dv1 < 2 else 11 - dv1
    soma2 = sum(int(d) * p for d, p in zip(base12 + str(dv1), pesos_dv2))
    dv2 = (soma2 % 11)
    dv2 = 0 if dv2 < 2 else 11 - dv2
    return f"{dv1}{dv2}"


def normalizar_cnpj(raw: str | None) -> tuple[str, bool]:
    """Normaliza CNPJ para 14 dígitos sem máscara e valida os DVs.

    Retorna (cnpj_normalizado, valido). Vazio/inválido devolve ("", False).
    """
    if not raw:
        return "", False
    import re as _re
    digitos = _re.sub(r"\D", "", raw)
    if len(digitos) != 14 or len(set(digitos)) == 1:
        return digitos, False
    valido = _cnpj_check_digits(digitos[:12]) == digitos[12:]
    return digitos, valido


CAMPOS_LICITACOES = [
    "id",
    "ano_publicacao",
    "codigo_processo",
    "numero_edital",
    "modalidade",
    "descricao_objeto",
    "situacao",
    "data_abertura",
    "data_publicacao",
    "data_criacao",
]

CAMPOS_OBRAS = [
    "obra_id",
    "contrato",
    "cpl",
    "objeto",
    "secretaria",
    "empresa_contratada",
    "cnpj",
    "cnpj_valido",
    "valor_contrato",
    "percentual_concluido",
    "status",
    "financiadora",
    "previsao_conclusao",
    "quantidade",
    "logradouro",
    "bairro",
    "municipio",
    "uf",
    "cep",
]


def extrair_licitacoes(raw_dir: Path, dest: Path) -> int:
    fonte = raw_dir / "legados" / "2020-2021" / "indice_licitacoes.json"
    if not fonte.exists():
        print(f"Fonte não encontrada: {fonte}", file=sys.stderr)
        return 0

    with fonte.open(encoding="utf-8") as f:
        data = json.load(f)

    registros = data.get("registros", [])
    dest.parent.mkdir(parents=True, exist_ok=True)

    with dest.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS_LICITACOES)
        writer.writeheader()
        for r in registros:
            writer.writerow({
                "id": r.get("id"),
                "ano_publicacao": r.get("anoPublicacao"),
                "codigo_processo": r.get("codigoProcesso"),
                "numero_edital": r.get("numeroEdital"),
                "modalidade": fix_mojibake(r.get("modalidade") or ""),
                "descricao_objeto": fix_mojibake((r.get("descricaoObjeto") or "").strip()),
                "situacao": fix_mojibake(r.get("situacao") or ""),
                "data_abertura": r.get("dataAbertura"),
                "data_publicacao": r.get("dataPublicacao"),
                "data_criacao": r.get("dataHoraCriacao"),
            })

    return len(registros)


def _dedup_obras(registros: list[dict]) -> tuple[list[dict], int]:
    """Dedup por obra_id mantendo o primeiro registro; descarta obra_id=None."""
    vistos: set[int] = set()
    unicos: list[dict] = []
    descartados = 0
    for r in registros:
        oid = r.get("obra_id")
        if oid is None:
            descartados += 1
            continue
        if oid not in vistos:
            vistos.add(oid)
            unicos.append(r)
    return unicos, descartados


def _obra_to_row(r: dict) -> tuple[dict, bool]:
    """Converte um dict de obra crua em row CSV (mojibake + CNPJ tratados). Retorna (row, cnpj_ok)."""
    end = r.get("endereco") or {}
    cnpj_norm, cnpj_ok = normalizar_cnpj(r.get("cnpj"))
    row = {
        "obra_id": r.get("obra_id"),
        "contrato": r.get("contrato"),
        "cpl": r.get("cpl"),
        "objeto": fix_mojibake((r.get("objeto") or "").strip()),
        "secretaria": fix_mojibake(r.get("secretaria") or ""),
        "empresa_contratada": fix_mojibake(r.get("empresa_contratada") or ""),
        "cnpj": cnpj_norm,
        "cnpj_valido": "1" if cnpj_ok else "0",
        "valor_contrato": r.get("valor_contrato"),
        "percentual_concluido": _normalizar_percentual(r.get("percentual_concluido")),
        "status": fix_mojibake(r.get("status") or ""),
        "financiadora": fix_mojibake(r.get("financiadora") or ""),
        "previsao_conclusao": r.get("previsao_conclusao"),
        "quantidade": fix_mojibake(r.get("quantidade") or ""),
        "logradouro": fix_mojibake(f"{end.get('tipo', '')} {end.get('logradouro', '')}".strip()),
        "bairro": fix_mojibake(end.get("bairro") or ""),
        "municipio": fix_mojibake(end.get("municipio") or ""),
        "uf": end.get("uf"),
        "cep": end.get("cep"),
    }
    return row, cnpj_ok


def extrair_obras(raw_dir: Path, dest: Path) -> int:
    fonte = raw_dir / "obras" / "obras_sorocaba_detalhes.json"
    if not fonte.exists():
        print(f"Fonte não encontrada: {fonte}", file=sys.stderr)
        return 0

    with fonte.open(encoding="utf-8") as f:
        registros = json.load(f)

    unicos, descartados_sem_id = _dedup_obras(registros)
    if descartados_sem_id:
        print(f"  AVISO: {descartados_sem_id} registros descartados por obra_id=None", file=sys.stderr)

    dest.parent.mkdir(parents=True, exist_ok=True)

    cnpj_invalidos = 0
    with dest.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CAMPOS_OBRAS)
        writer.writeheader()
        for r in unicos:
            row, cnpj_ok = _obra_to_row(r)
            if not cnpj_ok:
                cnpj_invalidos += 1
            writer.writerow(row)

    if cnpj_invalidos:
        print(f"  AVISO: {cnpj_invalidos}/{len(unicos)} CNPJs invalidos (cnpj_valido=0)", file=sys.stderr)
    return len(unicos)


def main() -> None:
    dest_licitacoes = CONTRATOS_EXTRACTED_DIR / "licitacoes_sorocaba_2020_2021.csv"
    dest_obras = CONTRATOS_EXTRACTED_DIR / "obras_sorocaba.csv"

    n_lic = extrair_licitacoes(CONTRATOS_RAW_DIR, dest_licitacoes)
    print(f"Licitacoes: {n_lic} registros -> {dest_licitacoes}")

    n_obras = extrair_obras(CONTRATOS_RAW_DIR, dest_obras)
    print(f"Obras: {n_obras} registros unicos -> {dest_obras}")

    meta = {
        "data_extracao": datetime.now(timezone.utc).isoformat(),
        "licitacoes": {"registros": n_lic, "arquivo": str(dest_licitacoes)},
        "obras": {"registros": n_obras, "arquivo": str(dest_obras)},
    }
    meta_path = CONTRATOS_EXTRACTED_DIR / "meta_extracao.json"
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Meta: {meta_path}")


if __name__ == "__main__":
    main()
