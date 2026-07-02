from __future__ import annotations

import unittest

from pipelines.sprint2_keys import (
    duplicate_keys,
    municipio_input_keys,
    municipio_storage_key,
)


class Sprint2KeysTest(unittest.TestCase):
    def setUp(self) -> None:
        self.municipios = [
            {"ibge": "4117602", "uf": "PR", "nome": "Palmas", "key": "palmas"},
            {"ibge": "1721000", "uf": "TO", "nome": "Palmas", "key": "palmas"},
            {"ibge": "3552205", "uf": "SP", "nome": "Sorocaba", "key": "sorocaba"},
        ]
        self.duplicated = duplicate_keys(self.municipios)

    def test_detecta_chaves_duplicadas(self) -> None:
        self.assertEqual(self.duplicated, {"palmas"})

    def test_chave_unica_preserva_key_original(self) -> None:
        municipio = self.municipios[2]

        self.assertEqual(municipio_storage_key(municipio, self.duplicated), "sorocaba")
        self.assertEqual(municipio_input_keys(municipio, self.duplicated), ("sorocaba",))

    def test_chave_duplicada_recebe_sufixo_uf_e_mantem_fallback_legado(self) -> None:
        municipio = self.municipios[1]

        self.assertEqual(municipio_storage_key(municipio, self.duplicated), "palmas_to")
        self.assertEqual(municipio_input_keys(municipio, self.duplicated), ("palmas_to", "palmas"))


if __name__ == "__main__":
    unittest.main()
