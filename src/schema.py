from dataclasses import dataclass, field, asdict
from datetime import date
from typing import Optional
from enum import Enum


class Nivel(str, Enum):
    MUNICIPAL = "municipal"
    ESTADUAL = "estadual"
    FEDERAL = "federal"


class TipoDado(str, Enum):
    EXECUCAO_ORCAMENTARIA = "execucao_orcamentaria"
    CONTRATO = "contrato"
    LICITACAO = "licitacao"
    FOLHA_PAGAMENTO = "folha_pagamento"
    TRANSFERENCIA = "transferencia"


@dataclass
class RegistroGasto:
    fonte: str                          # ex: "portaldatransparencia.gov.br"
    nivel: Nivel
    municipio: str                      # ex: "Sorocaba"
    tipo: TipoDado
    valor: float
    data: date
    ano: int = field(init=False)
    descricao: str = ""
    orgao: str = ""
    beneficiario: str = ""
    documento_origem: Optional[str] = None   # caminho para data/raw/
    url_origem: Optional[str] = None

    def __post_init__(self):
        self.ano = self.data.year

    def to_dict(self) -> dict:
        d = asdict(self)
        d["nivel"] = self.nivel.value
        d["tipo"] = self.tipo.value
        d["data"] = self.data.isoformat()
        return d
