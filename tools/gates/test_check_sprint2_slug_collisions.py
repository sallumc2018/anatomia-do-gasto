from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.gates.check_sprint2_slug_collisions import audit, load_municipios, main


class CheckSprint2SlugCollisionsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.manifest = self.root / "ibge_municipios_completo.csv"
        self.manifest.write_text(
            "\n".join(
                [
                    "ibge,uf,regiao,nome,key",
                    "4117602,PR,S,Palmas,palmas",
                    "1721000,TO,N,Palmas,palmas",
                    "3552205,SP,SE,Sorocaba,sorocaba",
                ]
            )
            + "\n",
            encoding="utf-8",
        )
        self.extracted = self.root / "extracted"
        self.public = self.root / "public"
        self.extracted.mkdir()
        self.public.mkdir()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_flags_legacy_directory_for_duplicate_key(self) -> None:
        (self.extracted / "palmas").mkdir()
        municipios = load_municipios(self.manifest)

        result = audit(municipios, [self.extracted, self.public], self.manifest)

        self.assertEqual(result.duplicate_keys, ("palmas",))
        self.assertEqual(len(result.findings), 1)
        self.assertEqual(result.findings[0].legacy_key, "palmas")
        self.assertEqual(result.findings[0].canonical_keys, ("palmas_pr", "palmas_to"))

    def test_accepts_only_canonical_directories(self) -> None:
        (self.extracted / "palmas_pr").mkdir()
        (self.extracted / "palmas_to").mkdir()
        municipios = load_municipios(self.manifest)

        result = audit(municipios, [self.extracted], self.manifest)

        self.assertEqual(result.findings, ())

    def test_strict_returns_nonzero_when_finding_exists(self) -> None:
        (self.extracted / "palmas").mkdir()

        code = main(["--manifest", str(self.manifest), "--root", str(self.extracted), "--strict"])

        self.assertEqual(code, 1)

    def test_default_mode_is_advisory(self) -> None:
        (self.extracted / "palmas").mkdir()

        code = main(["--manifest", str(self.manifest), "--root", str(self.extracted)])

        self.assertEqual(code, 0)

    def test_max_findings_option_is_accepted(self) -> None:
        (self.extracted / "palmas").mkdir()

        code = main(
            [
                "--manifest",
                str(self.manifest),
                "--root",
                str(self.extracted),
                "--max-findings",
                "0",
            ]
        )

        self.assertEqual(code, 0)


if __name__ == "__main__":
    unittest.main()
