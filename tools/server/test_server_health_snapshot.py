from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.server import server_health_snapshot as snapshot


class ServerHealthSnapshotTest(unittest.TestCase):
    def test_parse_meminfo(self) -> None:
        parsed = snapshot.parse_meminfo("MemTotal: 1024 kB\nMemAvailable: 256 kB\nBroken: n/a\n")
        self.assertEqual(parsed["MemTotal"], 1024)
        self.assertEqual(parsed["MemAvailable"], 256)
        self.assertNotIn("Broken", parsed)

    def test_sanitize_text_redacts_sensitive_markers(self) -> None:
        value = snapshot.sanitize_text("TOKEN=abc Authorization: Bearer secret api_key=123")
        self.assertIn("<redacted>", value)
        self.assertNotIn("abc", value)
        self.assertNotIn("secret", value)
        self.assertNotIn("123", value)

    def test_write_snapshot_creates_latest_and_versioned_file(self) -> None:
        payload = {
            "generated_at_utc": "2026-07-02T12:34:56+00:00",
            "memory": {},
            "disk": {},
            "load": {},
            "host": {},
            "git": {},
            "coleta": {},
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            versioned, latest = snapshot.write_snapshot(payload, Path(temp_dir))
            self.assertTrue(versioned.exists())
            self.assertTrue(latest.exists())
            self.assertIn("20260702_123456", versioned.name)

    def test_analyze_latest_coleta_log_counts_markers(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            log_dir = Path(temp_dir)
            log_path = log_dir / "coleta_20260702_010203.log"
            log_path.write_text("ok\nATENÇÃO teste\n✗ falha\nColeta noturna concluída\n", encoding="utf-8")
            result = snapshot.analyze_latest_coleta_log(log_dir)
            self.assertTrue(result["found"])
            self.assertEqual(result["failure_markers"], 1)
            self.assertEqual(result["warning_markers"], 1)
            self.assertTrue(result["looks_finished"])


if __name__ == "__main__":
    unittest.main()
