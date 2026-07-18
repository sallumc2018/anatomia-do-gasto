#!/usr/bin/env python3
"""Regression tests for workflow year input validation."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("validate-workflow-years.py")
REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT = "2023 2024 2025 2026"


def run_validator(value: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), value, "--default", DEFAULT],
        check=False,
        capture_output=True,
        text=True,
    )


class ValidateWorkflowYearsTest(unittest.TestCase):
    def test_workflows_use_validated_array_instead_of_direct_interpolation(self) -> None:
        for relative_path in (
            ".github/workflows/scheduled-pipeline.yml",
            ".github/workflows/sorocaba-pipeline.yml",
        ):
            with self.subTest(workflow=relative_path):
                content = (REPOSITORY_ROOT / relative_path).read_text(encoding="utf-8")
                self.assertIn(
                    "INPUT_ANOS: ${{ github.event.inputs.anos }}",
                    content,
                )
                self.assertIn("validate-workflow-years.py", content)
                self.assertIn('--anos "${ANOS_ARGS[@]}"', content)
                self.assertNotIn(
                    'ANOS="${{ github.event.inputs.anos }}"',
                    content,
                )

    def test_empty_input_uses_default(self) -> None:
        result = run_validator("")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout.strip(), DEFAULT)

    def test_valid_custom_years_are_preserved(self) -> None:
        result = run_validator("2022 2024 2026")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout.strip(), "2022 2024 2026")

    def test_shell_payloads_are_rejected_without_echoing_them(self) -> None:
        for value in (
            '2026"; id; #',
            "2026 $(id)",
            "2026\nid",
            "2026`id`",
        ):
            with self.subTest(value=value):
                result = run_validator(value)
                self.assertEqual(result.returncode, 2)
                self.assertNotIn(value, result.stderr)

    def test_noncanonical_separators_and_digits_are_rejected(self) -> None:
        for value in ("2025  2026", "2025\t2026", "２０２６"):
            with self.subTest(value=value):
                self.assertEqual(run_validator(value).returncode, 2)

    def test_excessive_input_is_rejected(self) -> None:
        value = " ".join(["2026"] * 30)
        self.assertGreater(len(value), 128)
        self.assertEqual(run_validator(value).returncode, 2)


if __name__ == "__main__":
    unittest.main()
