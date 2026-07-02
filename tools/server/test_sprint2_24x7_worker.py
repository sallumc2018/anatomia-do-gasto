from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "sprint2_24x7_worker.py"
SPEC = importlib.util.spec_from_file_location("sprint2_24x7_worker", SCRIPT)
worker = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules["sprint2_24x7_worker"] = worker
SPEC.loader.exec_module(worker)


class Sprint224x7WorkerTest(unittest.TestCase):
    def test_load_municipios_filters_uf(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            manifest = Path(temp_dir) / "ibge.csv"
            manifest.write_text(
                "ibge,nome,uf,key\n"
                "1111111,Acrelandia,AC,acrelandia\n"
                "2222222,Sorocaba,SP,sorocaba\n",
                encoding="utf-8",
            )
            result = worker.load_municipios(manifest, {"SP"})
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].ibge, "2222222")

    def test_state_roundtrip_and_cursor(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            state_path = Path(temp_dir) / "state.json"
            state = worker.load_state(state_path)
            self.assertEqual(state["cursor"], 0)
            worker.advance_cursor(state, 3)
            worker.save_state(state, state_path)
            loaded = worker.load_state(state_path)
            self.assertEqual(loaded["cursor"], 1)

    def test_next_municipio_wraps_cursor(self) -> None:
        municipios = [
            worker.Municipio("1", "A", "SP", "a"),
            worker.Municipio("2", "B", "RJ", "b"),
        ]
        self.assertEqual(worker.next_municipio(municipios, {"cursor": 3}).ibge, "2")

    def test_safe_command_redacts_sensitive_words(self) -> None:
        command = worker.safe_command(["cmd", "TOKEN=abc", "ok"])
        self.assertEqual(command, ["cmd", "<redacted>", "ok"])


if __name__ == "__main__":
    unittest.main()
