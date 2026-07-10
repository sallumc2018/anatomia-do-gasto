"""Configuração central de paths e municípios. Seleciona município via env var MUNICIPIO (default: sorocaba)."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"

MUNICIPIO = os.getenv("MUNICIPIO", "sorocaba")

MUNICIPIOS = {
    # Municípios originais (com sefaz_sp e cnpj_prefeitura completos)
    "sorocaba":              {"ibge": "3552205", "uf": "SP", "nome": "Sorocaba",              "sefaz_sp": "6695", "cnpj_prefeitura": "46634044000174"},
    "paulinia":              {"ibge": "3536505", "uf": "SP", "nome": "Paulinia",              "sefaz_sp": "5137", "cnpj_prefeitura": "45751435000106"},
    "sao_paulo":             {"ibge": "3550308", "uf": "SP", "nome": "Sao Paulo",             "sefaz_sp": "1004", "cnpj_prefeitura": "46395000000139"},
    # Top 20 SP por população — Sprint 1 (sefaz_sp/cnpj pendentes: coleta SICONFI+FNS já funciona)
    "guarulhos":             {"ibge": "3518800", "uf": "SP", "nome": "Guarulhos"},
    "campinas":              {"ibge": "3509502", "uf": "SP", "nome": "Campinas"},
    # ATENÇÃO: chave canônica (nome IBGE completo) da coleta Sprint2 nacional.
    # NÃO confundir com "sao_bernardo" — dataset curado à parte, registrado em
    # data/manifests/datasets.csv + publication_classification.csv e usado pela
    # página dedicada /sao-bernardo. Os dois coexistem de propósito: um é a
    # coleta bruta nacional (esta chave), o outro já passou pelo gate de
    # publicação. Não renomear/mesclar sem atualizar os 3 manifests + as
    # páginas do frontend juntos (ver handoff 2026-07-09).
    "sao_bernardo_do_campo": {"ibge": "3548708", "uf": "SP", "nome": "Sao Bernardo do Campo"},
    "santo_andre":           {"ibge": "3547809", "uf": "SP", "nome": "Santo Andre"},
    "osasco":                {"ibge": "3534401", "uf": "SP", "nome": "Osasco"},
    "ribeirao_preto":        {"ibge": "3543402", "uf": "SP", "nome": "Ribeirao Preto"},
    "sao_jose_dos_campos":   {"ibge": "3549904", "uf": "SP", "nome": "Sao Jose dos Campos"},
    "maua":                  {"ibge": "3529401", "uf": "SP", "nome": "Maua"},
    "sao_jose_do_rio_preto": {"ibge": "3549805", "uf": "SP", "nome": "Sao Jose do Rio Preto"},
    "santos":                {"ibge": "3548500", "uf": "SP", "nome": "Santos"},
    "mogi_das_cruzes":       {"ibge": "3530607", "uf": "SP", "nome": "Mogi das Cruzes"},
    "diadema":               {"ibge": "3513801", "uf": "SP", "nome": "Diadema"},
    "jundiai":               {"ibge": "3525904", "uf": "SP", "nome": "Jundiai"},
    "carapicuiba":           {"ibge": "3510609", "uf": "SP", "nome": "Carapicuiba"},
    "piracicaba":            {"ibge": "3538709", "uf": "SP", "nome": "Piracicaba"},
    "bauru":                 {"ibge": "3506003", "uf": "SP", "nome": "Bauru"},
    "itaquaquecetuba":       {"ibge": "3523602", "uf": "SP", "nome": "Itaquaquecetuba"},
    "sao_vicente":           {"ibge": "3551009", "uf": "SP", "nome": "Sao Vicente"},
}

if MUNICIPIO in MUNICIPIOS:
    CFG = MUNICIPIOS[MUNICIPIO]
else:
    # Modo dinâmico (Sprint 2 bulk): município não precisa estar no dict.
    # Requer MUNICIPIO_IBGE, MUNICIPIO_NOME e MUNICIPIO_UF no ambiente.
    _ibge = os.getenv("MUNICIPIO_IBGE")
    _nome = os.getenv("MUNICIPIO_NOME")
    _uf   = os.getenv("MUNICIPIO_UF")
    if not (_ibge and _nome and _uf):
        raise ValueError(
            f"MUNICIPIO={MUNICIPIO!r} nao registrado em pipelines/paths.py.\n"
            "Adicione ao dict MUNICIPIOS, ou defina MUNICIPIO_IBGE, MUNICIPIO_NOME e MUNICIPIO_UF."
        )
    CFG = {"ibge": _ibge, "nome": _nome, "uf": _uf}

RAW_BASE_DIR = Path(os.getenv("ANATOMIA_RAW_ROOT") or DATA_DIR / "raw")
EXTRACTED_BASE_DIR = Path(os.getenv("ANATOMIA_EXTRACTED_ROOT") or DATA_DIR / "extracted")

RAW_DIR = RAW_BASE_DIR / MUNICIPIO
EXTRACTED_DIR = EXTRACTED_BASE_DIR / MUNICIPIO
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

EMENDAS_RAW_DIR = RAW_DIR / "emendas_federais"
EMENDAS_EXTRACTED_DIR = EXTRACTED_DIR / "emendas_federais"
EMENDAS_VALIDATED_DIR = VALIDATED_DIR / "emendas_federais"
EMENDAS_PUBLIC_DIR = PUBLIC_DIR / "emendas_federais"


def as_str(path: Path) -> str:
    return str(path.resolve())
