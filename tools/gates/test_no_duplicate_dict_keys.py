#!/usr/bin/env python3
"""Regression test: literal dictionaries must not contain duplicate string keys."""
from __future__ import annotations

import ast
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TARGETS = [
    ROOT / "pipelines" / "extrair_despesas_gabinete_camara.py",
    ROOT / "pipelines" / "gerar_dca_siconfi.py",
    ROOT / "tools" / "gates" / "check_grammar.py",
]


def duplicate_string_keys(path: Path) -> list[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    duplicates: list[str] = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.Dict):
            continue
        seen: set[str] = set()
        for key in node.keys:
            if not isinstance(key, ast.Constant) or not isinstance(key.value, str):
                continue
            if key.value in seen:
                duplicates.append(f"{path.relative_to(ROOT)}:{key.lineno}:{key.value}")
            seen.add(key.value)
    return duplicates


class DuplicateDictKeysTest(unittest.TestCase):
    def test_target_files_do_not_repeat_literal_string_keys(self) -> None:
        duplicates = [item for path in TARGETS for item in duplicate_string_keys(path)]
        self.assertEqual([], duplicates)


if __name__ == "__main__":
    unittest.main()
