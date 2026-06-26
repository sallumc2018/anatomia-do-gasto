from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.gates.check_canonical_routes import scan


class CheckCanonicalRoutesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.app_root = Path(self.temp_dir.name) / "app"
        self.app_root.mkdir()
        (self.app_root / "page.tsx").write_text("export default function Home() { return null }\n")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def write_page(self, route: str, text: str, layout: str | None = None) -> None:
        directory = self.app_root / route
        directory.mkdir(parents=True)
        (directory / "page.tsx").write_text(text, encoding="utf-8")
        if layout is not None:
            (directory / "layout.tsx").write_text(layout, encoding="utf-8")

    def test_flags_indexable_page_without_metadata(self) -> None:
        self.write_page("fluxo", '"use client"\nexport default function Page() { return null }\n')
        findings = scan(self.app_root)
        self.assertEqual([item.route for item in findings], ["/fluxo"])

    def test_accepts_canonical_noindex_and_layout_metadata(self) -> None:
        self.write_page(
            "canonical",
            'export const metadata = { alternates: { canonical: "/canonical" } }\n',
        )
        self.write_page(
            "private",
            "export const metadata = { robots: { index: false, follow: false } }\n",
        )
        self.write_page(
            "client",
            '"use client"\nexport default function Page() { return null }\n',
            'export const metadata = { alternates: { canonical: "/client" } }\n',
        )
        self.assertEqual(scan(self.app_root), [])


if __name__ == "__main__":
    unittest.main()
