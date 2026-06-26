from __future__ import annotations

import csv
import tempfile
import unittest
from datetime import date
from pathlib import Path

from pipelines.gerar_cobertura_sprint2 import (
    AREAS_SPRINT2,
    carregar_municipios,
    coletar_cobertura,
    formatar_texto,
    montar_resultado,
    salvar_relatorio,
)


class GerarCoberturaSprint2Test(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.manifest = self.root / "ibge.csv"
        self.extracted = self.root / "extracted"
        self.logs = self.root / "logs"

        with self.manifest.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["ibge", "uf", "regiao", "nome", "key"])
            writer.writeheader()
            writer.writerows(
                [
                    {"ibge": "1000001", "uf": "AA", "regiao": "N", "nome": "Cidade Única", "key": "cidade_unica"},
                    {"ibge": "2000002", "uf": "BB", "regiao": "S", "nome": "Cidade Repetida", "key": "cidade_repetida"},
                    {"ibge": "3000003", "uf": "CC", "regiao": "S", "nome": "Cidade Repetida", "key": "cidade_repetida"},
                    {"ibge": "4000004", "uf": "CC", "regiao": "S", "nome": "Cidade Sem Dados", "key": "cidade_sem_dados"},
                ]
            )

        self._write_csv(
            "cidade_unica",
            "transferencias_federais",
            [{"UF": "AA", "MUNICIPIO": "CIDADE UNICA", "codigo_ibge": "1000001"}],
        )
        self._write_csv(
            "cidade_unica",
            "emendas_federais",
            [{"UF": "AA", "MUNICIPIO": "CIDADE UNICA", "codigo_ibge": "1000001"}],
        )
        self._write_csv(
            "cidade_unica",
            "fns",
            [{"UF": "AA", "MUNICIPIO": "CIDADE UNICA", "CO_MUNICIPIO_IBGE": "100000"}],
        )
        self._write_csv(
            "cidade_repetida",
            "fns",
            [{"UF": "CC", "MUNICIPIO": "CIDADE REPETIDA", "CO_MUNICIPIO_IBGE": "300000"}],
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write_csv(self, key: str, area: str, rows: list[dict[str, str]]) -> None:
        output_dir = self.extracted / key / area / "saida"
        output_dir.mkdir(parents=True, exist_ok=True)
        path = output_dir / f"{area}.csv"
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)

    def test_calcula_cobertura_e_resolve_slug_ambiguo_por_csv(self) -> None:
        municipios = carregar_municipios(self.manifest)
        cobertura, unresolved = coletar_cobertura(municipios, self.extracted)
        result = montar_resultado(
            municipios,
            cobertura,
            unresolved,
            report_date=date(2026, 6, 25),
        )

        self.assertEqual(result["total_municipios"], 4)
        self.assertEqual(result["municipios_com_dados"], 2)
        self.assertEqual(result["municipios_com_todas_areas"], 1)
        self.assertEqual(result["por_area"], {
            "transferencias_federais": 1,
            "emendas_federais": 1,
            "fns": 2,
        })
        self.assertEqual(result["por_uf"]["AA"], {"com_dados": 1, "total": 1, "percentual": 100.0})
        self.assertEqual(result["por_uf"]["CC"], {"com_dados": 1, "total": 2, "percentual": 50.0})
        self.assertEqual(result["ufs_completas"], ["AA"])
        self.assertEqual(result["ufs_sem_dados"], ["BB"])
        self.assertEqual(unresolved, [])

    def test_filtro_uf_listagem_e_persistencia(self) -> None:
        municipios = carregar_municipios(self.manifest)
        cobertura, unresolved = coletar_cobertura(municipios, self.extracted)
        result = montar_resultado(
            municipios,
            cobertura,
            unresolved,
            uf="CC",
            report_date=date(2026, 6, 25),
        )
        text = formatar_texto(result, listar=True)
        output_path = salvar_relatorio(text, self.logs, result["data"])

        self.assertEqual(result["total_municipios"], 2)
        self.assertIn("Total municípios CC: 2", text)
        self.assertIn("Cidade Repetida, CC (3000003): fns", text)
        self.assertEqual(output_path.name, "cobertura_sprint2_20260625.txt")
        self.assertEqual(output_path.read_text(encoding="utf-8"), text)

    def test_manifesto_ausente_aborta(self) -> None:
        with self.assertRaisesRegex(FileNotFoundError, "Manifesto IBGE não encontrado"):
            carregar_municipios(self.root / "nao-existe.csv")

    def test_slug_ambiguo_sem_metadados_fica_nao_resolvido(self) -> None:
        output_dir = self.extracted / "cidade_repetida" / "emendas_federais" / "saida"
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "sem_metadados.csv").write_text("valor\n10\n", encoding="utf-8")
        for path in (self.extracted / "cidade_repetida" / "fns" / "saida").glob("*.csv"):
            path.unlink()

        municipios = carregar_municipios(self.manifest)
        cobertura, unresolved = coletar_cobertura(municipios, self.extracted)

        self.assertNotIn("2000002", cobertura)
        self.assertNotIn("3000003", cobertura)
        self.assertEqual(len(unresolved), 1)
        self.assertEqual(unresolved[0].key, "cidade_repetida")
        self.assertEqual(unresolved[0].areas, ("emendas_federais",))

    def test_ordem_das_areas_e_estavel(self) -> None:
        self.assertEqual(
            AREAS_SPRINT2,
            ("transferencias_federais", "emendas_federais", "fns"),
        )


if __name__ == "__main__":
    unittest.main()
