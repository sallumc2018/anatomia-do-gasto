from __future__ import annotations

import io
import json
import unittest
import urllib.error
from unittest import mock

from pipelines import baixar_emendas_federais as collector


class _Response:
    def __init__(self, payload: object):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self) -> bytes:
        return self.payload


class BaixarEmendasFederaisTest(unittest.TestCase):
    def test_normaliza_item_para_contrato_sprint2(self) -> None:
        item = {
            "codigoEmenda": "202412345678",
            "autor": "Autor",
            "partido": "ABC",
            "uf": "SP",
            "tipoEmenda": "Individual",
            "funcao": "Saúde",
            "subfuncao": "Atenção básica",
            "valorEmpenhado": "123.45",
            "valorLiquidado": 100,
            "valorPago": 90,
        }

        row = collector._linha_para_csv(item, 2024, "3552205", "Sorocaba")

        self.assertEqual(row["municipio_ibge"], "3552205")
        self.assertEqual(row["valor_empenhado"], "123.45")
        self.assertEqual(row["tipo_emenda"], "Individual")
        self.assertEqual(row["autor"], "Autor")
        self.assertEqual(row["subfuncao"], "Atenção básica")

    def test_tipo_emenda_string_nao_vira_objeto_no_csv(self) -> None:
        row = collector._linha_para_csv(
            {"tipoEmenda": "Bancada"},
            2024,
            "3552205",
            "Sorocaba",
        )

        self.assertEqual(row["tipo_emenda"], "Bancada")

    @mock.patch.object(collector, "_urlopen_com_retry")
    def test_fetch_exige_lista_json(self, urlopen: mock.Mock) -> None:
        urlopen.return_value = _Response({"erro": "formato inesperado"})

        with self.assertRaisesRegex(ValueError, "esperado list"):
            collector._fetch_pagina(1, "3552205", 2024, "fake-key")

    @mock.patch.object(collector, "_urlopen_com_retry")
    def test_erro_de_rede_nao_e_convertido_em_resultado_vazio(
        self,
        urlopen: mock.Mock,
    ) -> None:
        urlopen.side_effect = urllib.error.URLError("offline")

        with self.assertRaisesRegex(RuntimeError, "Erro de rede"):
            collector._fetch_pagina(1, "3552205", 2024, "fake-key")

    def test_valor_decimal_aceita_formatos_da_api(self) -> None:
        self.assertEqual(collector._valor_decimal("1234.56"), collector.decimal.Decimal("1234.56"))
        self.assertEqual(
            collector._valor_decimal("R$ 1.234,56"),
            collector.decimal.Decimal("1234.56"),
        )

    @mock.patch.object(collector, "_chave_api", return_value="fake-key")
    def test_intervalo_invertido_aborta_antes_da_coleta(self, _key: mock.Mock) -> None:
        with mock.patch("sys.argv", ["baixar_emendas_federais.py", "--anos", "2025", "2024"]):
            with mock.patch("sys.stderr", new=io.StringIO()):
                with self.assertRaises(SystemExit) as error:
                    collector.main()

        self.assertEqual(error.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
