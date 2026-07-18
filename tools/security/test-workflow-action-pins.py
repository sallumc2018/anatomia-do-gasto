#!/usr/bin/env python3
"""Regression tests for immutable GitHub Action references."""

from __future__ import annotations

import re
import unittest
from collections import Counter
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = REPOSITORY_ROOT / ".github/workflows/scheduled-pipeline.yml"

EXPECTED_REFERENCES = Counter(
    {
        "actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0": 2,
        "astral-sh/setup-uv@11f9893b081a58869d3b5fccaea48c9e9e46f990": 1,
        "actions/setup-python@ece7cb06caefa5fff74198d8649806c4678c61a1": 1,
        "taiki-e/install-action@7ebe462223a33af951eed3c3ab1f754ddf2992e2": 1,
        "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a": 1,
        "actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c": 1,
    }
)


class WorkflowActionPinsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.content = WORKFLOW.read_text(encoding="utf-8")

    def test_every_action_uses_expected_commit(self) -> None:
        references = Counter(
            f"{action}@{commit}"
            for action, commit in
            re.findall(
                r"^\s*uses:\s*([^@\s]+)@([0-9a-f]{40})(?:\s+#.*)?$",
                self.content,
                flags=re.MULTILINE,
            )
        )
        self.assertEqual(references, EXPECTED_REFERENCES)

    def test_no_mutable_action_reference_remains(self) -> None:
        uses_lines = re.findall(
            r"^\s*uses:\s*(\S+)",
            self.content,
            flags=re.MULTILINE,
        )
        self.assertEqual(len(uses_lines), sum(EXPECTED_REFERENCES.values()))
        for reference in uses_lines:
            with self.subTest(reference=reference):
                self.assertRegex(reference, r"^[^@\s]+@[0-9a-f]{40}$")

    def test_just_is_selected_explicitly(self) -> None:
        self.assertRegex(
            self.content,
            (
                r"uses:\s*taiki-e/install-action@"
                r"7ebe462223a33af951eed3c3ab1f754ddf2992e2"
                r"\s+# just 1\.56\.0\n"
                r"\s+with:\n"
                r"\s+tool:\s+just"
            ),
        )


if __name__ == "__main__":
    unittest.main()
