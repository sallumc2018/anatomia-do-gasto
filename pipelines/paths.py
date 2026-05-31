import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"

MUNICIPIO = os.getenv("MUNICIPIO", "sorocaba")

MUNICIPIOS = {
    "sorocaba": {"ibge": "3552205", "uf": "SP", "nome": "Sorocaba", "sefaz_sp": "6695", "cnpj_prefeitura": "46634044000174"},
    "paulinia": {"ibge": "3536505", "uf": "SP", "nome": "Paulinia", "sefaz_sp": None, "cnpj_prefeitura": None},
}

if MUNICIPIO not in MUNICIPIOS:
    raise ValueError(
        f"MUNICIPIO={MUNICIPIO!r} nao registrado em pipelines/paths.py. "
        "Adicione uma entrada em MUNICIPIOS com ibge, uf e nome."
    )

CFG = MUNICIPIOS[MUNICIPIO]

RAW_BASE_DIR = Path(os.getenv("ANATOMIA_RAW_ROOT") or DATA_DIR / "raw")

RAW_DIR = RAW_BASE_DIR / MUNICIPIO
EXTRACTED_DIR = DATA_DIR / "extracted" / MUNICIPIO
VALIDATED_DIR = DATA_DIR / "validated" / MUNICIPIO
PUBLIC_DIR = DATA_DIR / "public" / MUNICIPIO

SAUDE_RAW_DIR = RAW_DIR / "saude"
SAUDE_EXTRACTED_DIR = EXTRACTED_DIR / "saude"
SAUDE_VALIDATED_DIR = VALIDATED_DIR / "saude"
SAUDE_PUBLIC_DIR = PUBLIC_DIR / "saude"

EDUCACAO_RAW_DIR = RAW_DIR / "educacao"
EDUCACAO_EXTRACTED_DIR = EXTRACTED_DIR / "educacao"
EDUCACAO_VALIDATED_DIR = VALIDATED_DIR / "educacao"
EDUCACAO_PUBLIC_DIR = PUBLIC_DIR / "educacao"

EXECUCAO_RAW_DIR = RAW_DIR / "execucao"
EXECUCAO_EXTRACTED_DIR = EXTRACTED_DIR / "execucao"
EXECUCAO_VALIDATED_DIR = VALIDATED_DIR / "execucao"
EXECUCAO_PUBLIC_DIR = PUBLIC_DIR / "execucao"

SEGURANCA_RAW_DIR = RAW_DIR / "seguranca"
SEGURANCA_EXTRACTED_DIR = EXTRACTED_DIR / "seguranca"
SEGURANCA_VALIDATED_DIR = VALIDATED_DIR / "seguranca"
SEGURANCA_PUBLIC_DIR = PUBLIC_DIR / "seguranca"

TRANSPORTE_RAW_DIR = RAW_DIR / "transporte"
TRANSPORTE_EXTRACTED_DIR = EXTRACTED_DIR / "transporte"
TRANSPORTE_VALIDATED_DIR = VALIDATED_DIR / "transporte"
TRANSPORTE_PUBLIC_DIR = PUBLIC_DIR / "transporte"

EXECUTIVO_RAW_DIR = RAW_DIR / "executivo"
EXECUTIVO_EXTRACTED_DIR = EXTRACTED_DIR / "executivo"
EXECUTIVO_VALIDATED_DIR = VALIDATED_DIR / "executivo"
EXECUTIVO_PUBLIC_DIR = PUBLIC_DIR / "executivo"

RECEITA_RAW_DIR = RAW_DIR / "receita"
RECEITA_EXTRACTED_DIR = EXTRACTED_DIR / "receita"
RECEITA_VALIDATED_DIR = VALIDATED_DIR / "receita"
RECEITA_PUBLIC_DIR = PUBLIC_DIR / "receita"

FISCAL_RAW_DIR = RAW_DIR / "fiscal"
FISCAL_EXTRACTED_DIR = EXTRACTED_DIR / "fiscal"
FISCAL_VALIDATED_DIR = VALIDATED_DIR / "fiscal"
FISCAL_PUBLIC_DIR = PUBLIC_DIR / "fiscal"

TRANSFERENCIAS_RAW_DIR = RAW_DIR / "transferencias_federais"
TRANSFERENCIAS_EXTRACTED_DIR = EXTRACTED_DIR / "transferencias_federais"
TRANSFERENCIAS_VALIDATED_DIR = VALIDATED_DIR / "transferencias_federais"
TRANSFERENCIAS_PUBLIC_DIR = PUBLIC_DIR / "transferencias_federais"


CONTRATOS_RAW_DIR = RAW_DIR / "contratos"
CONTRATOS_EXTRACTED_DIR = EXTRACTED_DIR / "contratos"
CONTRATOS_VALIDATED_DIR = VALIDATED_DIR / "contratos"
CONTRATOS_PUBLIC_DIR = PUBLIC_DIR / "contratos"


def as_str(path: Path) -> str:
    return str(path.resolve())
