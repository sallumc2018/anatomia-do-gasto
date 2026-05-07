from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"

RAW_DIR = DATA_DIR / "raw" / "sorocaba"
EXTRACTED_DIR = DATA_DIR / "extracted" / "sorocaba"
VALIDATED_DIR = DATA_DIR / "validated" / "sorocaba"
PUBLIC_DIR = DATA_DIR / "public" / "sorocaba"

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


def as_str(path: Path) -> str:
    return str(path.resolve())
