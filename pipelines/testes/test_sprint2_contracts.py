from __future__ import annotations

import csv
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from pipelines.sprint2_contracts import (
    atomic_copy_verified,
    sha256_file,
    validate_csv,
)


class Sprint2ContractsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write_csv(
        self,
        name: str,
        fieldnames: list[str],
        rows: list[dict[str, str]],
        delimiter: str = ",",
    ) -> Path:
        path = self.root / name
        with path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames, delimiter=delimiter)
            writer.writeheader()
            writer.writerows(rows)
        return path

    def test_accepts_real_contract_for_each_sprint2_area(self) -> None:
        cases = {
            "transferencias_federais": (
                ["municipio_ibge", "valor_transferido"],
                {"municipio_ibge": "3552205", "valor_transferido": "10.00"},
            ),
            "emendas_federais": (
                ["codigo_municipio_ibge", "valor_empenhado"],
                {"codigo_municipio_ibge": "3552205", "valor_empenhado": "20.00"},
            ),
            "fns": (
                ["CO_MUNICIPIO_IBGE", "VL_BRUTO"],
                {"CO_MUNICIPIO_IBGE": "355220", "VL_BRUTO": "30.00"},
            ),
        }

        for area, (headers, row) in cases.items():
            with self.subTest(area=area):
                path = self._write_csv(f"{area}.csv", headers, [row])
                result = validate_csv(path, area, "3552205")
                self.assertTrue(result.valid, result.reason)
                self.assertEqual(result.data_rows, 1)

    def test_rejects_empty_file_and_header_only_csv(self) -> None:
        empty = self.root / "empty.csv"
        empty.touch()
        header_only = self._write_csv(
            "header-only.csv",
            ["municipio_ibge", "valor_transferido"],
            [],
        )

        self.assertIn(
            "arquivo vazio",
            validate_csv(empty, "transferencias_federais", "3552205").reason,
        )
        self.assertIn(
            "sem linhas de dados",
            validate_csv(header_only, "transferencias_federais", "3552205").reason,
        )

    def test_rejects_html_saved_as_csv(self) -> None:
        path = self.root / "response.csv"
        path.write_text("<!doctype html><title>503</title>", encoding="utf-8")

        result = validate_csv(path, "fns", "3552205")

        self.assertFalse(result.valid)
        self.assertIn("HTML/XML", result.reason)

    def test_rejects_invalid_schema_without_substring_false_positive(self) -> None:
        path = self._write_csv(
            "invalid.csv",
            ["sem_ibge_aqui", "valor_estimado"],
            [{"sem_ibge_aqui": "3552205", "valor_estimado": "10"}],
        )

        result = validate_csv(path, "emendas_federais", "3552205")

        self.assertFalse(result.valid)
        self.assertIn("coluna de 'municipio' ausente", result.reason)

    def test_rejects_ibge_mismatch(self) -> None:
        path = self._write_csv(
            "wrong-city.csv",
            ["municipio_ibge", "valor_transferido"],
            [{"municipio_ibge": "3509502", "valor_transferido": "10"}],
        )

        result = validate_csv(path, "transferencias_federais", "3552205")

        self.assertFalse(result.valid)
        self.assertIn("IBGE divergente", result.reason)

    def test_sha256_matches_stdlib_digest(self) -> None:
        path = self.root / "payload.bin"
        payload = b"anatomia-do-gasto\n"
        path.write_bytes(payload)

        self.assertEqual(sha256_file(path), hashlib.sha256(payload).hexdigest())

    def test_atomic_copy_replaces_destination_and_returns_verified_hash(self) -> None:
        source = self.root / "source.csv"
        destination = self.root / "public" / "destination.csv"
        source.write_bytes(b"new-content")
        destination.parent.mkdir()
        destination.write_bytes(b"old-content")

        digest = atomic_copy_verified(source, destination)

        self.assertEqual(destination.read_bytes(), b"new-content")
        self.assertEqual(digest, hashlib.sha256(b"new-content").hexdigest())
        self.assertEqual(list(destination.parent.glob("*.tmp")), [])

    def test_failed_atomic_replace_preserves_existing_destination(self) -> None:
        source = self.root / "source.csv"
        destination = self.root / "destination.csv"
        source.write_bytes(b"new-content")
        destination.write_bytes(b"old-content")

        with mock.patch(
            "pipelines.sprint2_contracts.os.replace",
            side_effect=OSError("replace failed"),
        ):
            with self.assertRaisesRegex(OSError, "replace failed"):
                atomic_copy_verified(source, destination)

        self.assertEqual(destination.read_bytes(), b"old-content")
        self.assertEqual(list(self.root.glob("*.tmp")), [])


if __name__ == "__main__":
    unittest.main()
