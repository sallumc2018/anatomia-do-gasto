from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from tools.gates.check_turbopack_data_tracing import (
    scan_next_config,
    scan_source,
)


class CheckTurbopackDataTracingTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def write(self, relative: str, text: str) -> Path:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def test_accepts_process_cwd_with_nearby_turbopack_ignore(self) -> None:
        path = self.write(
            "page.tsx",
            'const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..")\n',
        )

        self.assertEqual(scan_source(path), [])

    def test_accepts_multiline_process_cwd_with_nearby_turbopack_ignore(self) -> None:
        path = self.write(
            "page.tsx",
            "\n".join(
                [
                    "const FILE = path.join(",
                    "  /*turbopackIgnore: true*/ process.cwd(),",
                    '  ".."',
                    ")",
                ]
            ),
        )

        self.assertEqual(scan_source(path), [])

    def test_flags_process_cwd_without_turbopack_ignore(self) -> None:
        path = self.write("page.tsx", 'const DATA_ROOT = path.join(process.cwd(), "..")\n')

        findings = scan_source(path)

        self.assertEqual(len(findings), 1)
        self.assertIn("process.cwd()", findings[0].reason)

    def test_flags_path_resolve_data_root(self) -> None:
        path = self.write("route.ts", "const dataRootResolved = path.resolve(DATA_ROOT)\n")

        findings = scan_source(path)

        self.assertEqual(len(findings), 1)
        self.assertIn("path.resolve(DATA_ROOT)", findings[0].reason)

    def test_flags_api_dados_broad_include(self) -> None:
        path = self.write(
            "next.config.ts",
            """
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/dados/[...slug]": ["../../data/public/**/*"],
  },
}
""",
        )

        with patch("tools.gates.check_turbopack_data_tracing.ROOT", self.root):
            findings = scan_next_config(path)

        self.assertEqual(len(findings), 1)
        self.assertIn("outputFileTracingIncludes", findings[0].reason)


if __name__ == "__main__":
    unittest.main()
