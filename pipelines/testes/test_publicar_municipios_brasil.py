from __future__ import annotations

import csv
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from pipelines import publicar_municipios_brasil as publisher
from pipelines.sprint2_contracts import sha256_file


class PublicarMunicipiosBrasilTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.extracted = self.root / "extracted"
        self.public = self.root / "public"
        self.manifests = self.root / "manifests"
        self.log_file = self.root / "publisher.log"
        self.patches = [
            mock.patch.object(publisher, "EXTRACTED", self.extracted),
            mock.patch.object(publisher, "PUBLIC", self.public),
            mock.patch.object(publisher, "MANIFESTS", self.manifests),
            mock.patch.object(publisher, "LOG_FILE", self.log_file, create=True),
        ]
        for patcher in self.patches:
            patcher.start()
        publisher.COPIADOS = 0
        publisher.IGNORADOS = 0
        publisher.MUNICIPIOS_OK = 0
        publisher.MUNICIPIOS_SEM_DADOS = 0
        publisher.REJEITADOS = 0

    def tearDown(self) -> None:
        for patcher in reversed(self.patches):
            patcher.stop()
        self.temp_dir.cleanup()

    def _write_transferencias(self, ibge: str, value: str = "10.00", key: str = "sorocaba") -> Path:
        output_dir = (
            self.extracted
            / key
            / "transferencias_federais"
            / "saida"
        )
        output_dir.mkdir(parents=True, exist_ok=True)
        path = output_dir / "transferencias.csv"
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=["municipio_ibge", "valor_transferido"],
            )
            writer.writeheader()
            writer.writerow(
                {"municipio_ibge": ibge, "valor_transferido": value}
            )
        return path

    def test_publication_writes_verified_file_and_manifest(self) -> None:
        source = self._write_transferencias("3552205")
        municipality = {
            "key": "sorocaba",
            "nome": "Sorocaba",
            "uf": "SP",
            "ibge": "3552205",
        }

        success = publisher.publicar_municipio(
            municipality,
            ["transferencias_federais"],
            dry_run=False,
        )

        destination = (
            self.public
            / "sorocaba"
            / "transferencias_federais"
            / "saida"
            / source.name
        )
        manifest_path = (
            self.manifests
            / "sorocaba"
            / "transferencias_federais.json"
        )
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

        self.assertTrue(success)
        self.assertEqual(destination.read_bytes(), source.read_bytes())
        self.assertEqual(manifest["arquivos"][0]["sha256"], sha256_file(source))
        self.assertEqual(manifest["arquivos"][0]["municipio_ibge"], "3552205")
        self.assertEqual(publisher.COPIADOS, 1)
        self.assertEqual(publisher.REJEITADOS, 0)

    def test_ibge_mismatch_preserves_existing_public_file(self) -> None:
        source = self._write_transferencias("3509502")
        destination = (
            self.public
            / "sorocaba"
            / "transferencias_federais"
            / "saida"
            / source.name
        )
        destination.parent.mkdir(parents=True)
        destination.write_bytes(b"previous-publication")
        municipality = {
            "key": "sorocaba",
            "nome": "Sorocaba",
            "uf": "SP",
            "ibge": "3552205",
        }

        success = publisher.publicar_municipio(
            municipality,
            ["transferencias_federais"],
            dry_run=False,
        )

        self.assertFalse(success)
        self.assertEqual(destination.read_bytes(), b"previous-publication")
        self.assertEqual(publisher.COPIADOS, 0)
        self.assertEqual(publisher.REJEITADOS, 1)
        self.assertFalse(
            (self.manifests / "sorocaba" / "transferencias_federais.json").exists()
        )

    def test_slug_duplicado_publica_em_chave_com_uf_a_partir_de_legado_validado(self) -> None:
        source = self._write_transferencias("1721000", key="palmas")
        municipality = {
            "key": "palmas",
            "nome": "Palmas",
            "uf": "TO",
            "ibge": "1721000",
        }

        success = publisher.publicar_municipio(
            municipality,
            ["transferencias_federais"],
            dry_run=False,
            duplicated_keys={"palmas"},
        )

        destination = (
            self.public
            / "palmas_to"
            / "transferencias_federais"
            / "saida"
            / source.name
        )
        legacy_destination = (
            self.public
            / "palmas"
            / "transferencias_federais"
            / "saida"
            / source.name
        )
        manifest_path = (
            self.manifests
            / "palmas_to"
            / "transferencias_federais.json"
        )

        self.assertTrue(success)
        self.assertEqual(destination.read_bytes(), source.read_bytes())
        self.assertFalse(legacy_destination.exists())
        self.assertTrue(manifest_path.exists())
        self.assertEqual(json.loads(manifest_path.read_text(encoding="utf-8"))["municipio_key"], "palmas_to")


if __name__ == "__main__":
    unittest.main()
