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

    def test_bate_com_municipio_tolera_acento_e_maiusculas(self) -> None:
        self.assertTrue(collector._bate_com_municipio("Sorocaba/SP", "sorocaba"))
        self.assertTrue(collector._bate_com_municipio("SÃO JOÃO DA BALIZA - RR", "Sao Joao da Baliza"))
        self.assertFalse(collector._bate_com_municipio("Campinas/SP", "Sorocaba"))
        self.assertFalse(collector._bate_com_municipio("", "Sorocaba"))

    def test_fetch_pagina_usa_apenas_parametros_reais_da_api(self) -> None:
        """Regressão: `localidadeGasto`, `anoExercicio` e `quantidade` não são
        parâmetros válidos do endpoint (confirmado via swagger oficial) — a URL
        deve usar somente `ano` e `pagina`."""
        capturado = {}

        class _FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self):
                return b"[]"

        def _fake_urlopen(req, timeout=30):
            capturado["url"] = req.full_url
            return _FakeResponse()

        with mock.patch.object(collector, "_urlopen_com_retry", side_effect=_fake_urlopen):
            collector._fetch_pagina(2, 2024, "fake-key")

        self.assertIn("ano=2024", capturado["url"])
        self.assertIn("pagina=2", capturado["url"])
        self.assertNotIn("localidadeGasto", capturado["url"])
        self.assertNotIn("anoExercicio", capturado["url"])
        self.assertNotIn("quantidade", capturado["url"])

    def test_coletar_ano_so_inclui_linhas_do_municipio_alvo(self) -> None:
        """Regressão do bug real: antes, todo item da página nacional era
        carimbado com o município alvo independente de `localidadeDoGasto`."""
        nacionais = [
            {"codigoEmenda": "1", "localidadeDoGasto": "Sorocaba/SP", "valorEmpenhado": "100.00"},
            {"codigoEmenda": "2", "localidadeDoGasto": "Campinas/SP", "valorEmpenhado": "999.00"},
        ]
        with mock.patch.object(collector, "_buscar_paginas_nacionais", return_value=nacionais):
            registros = collector.coletar_ano("3552205", "Sorocaba", 2024, "fake-key", forcar=False)

        self.assertEqual(len(registros), 1)
        self.assertEqual(registros[0]["numero_emenda"], "1")
        self.assertEqual(registros[0]["localidade_do_gasto_raw"], "Sorocaba/SP")

    @mock.patch.object(collector, "_chave_api", return_value="fake-key")
    def test_intervalo_invertido_aborta_antes_da_coleta(self, _key: mock.Mock) -> None:
        with mock.patch("sys.argv", ["baixar_emendas_federais.py", "--anos", "2025", "2024"]):
            with mock.patch("sys.stderr", new=io.StringIO()):
                with self.assertRaises(SystemExit) as error:
                    collector.main()

        self.assertEqual(error.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
