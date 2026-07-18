#!/usr/bin/env python3
"""Regression tests for least privilege in the scheduled workflow."""

from __future__ import annotations

import unittest
from pathlib import Path

import yaml

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = REPOSITORY_ROOT / ".github/workflows/scheduled-pipeline.yml"


class WorkflowLeastPrivilegeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.content = WORKFLOW.read_text(encoding="utf-8")
        cls.workflow = yaml.safe_load(cls.content)
        cls.jobs = cls.workflow["jobs"]
        cls.collect = cls.jobs["executar-pipeline"]
        cls.commit = cls.jobs["salvar-atualizacoes"]

    def test_default_and_collection_permissions_are_read_only(self) -> None:
        self.assertEqual(self.workflow["permissions"], {"contents": "read"})
        self.assertEqual(self.collect["permissions"], {"contents": "read"})

    def test_only_commit_job_can_write_contents(self) -> None:
        writers = {
            name
            for name, job in self.jobs.items()
            if job.get("permissions", {}).get("contents") == "write"
        }
        self.assertEqual(writers, {"salvar-atualizacoes"})
        self.assertEqual(self.commit["needs"], "executar-pipeline")

    def test_r2_secrets_and_push_are_separated(self) -> None:
        collect_text = yaml.safe_dump(self.collect, sort_keys=False)
        commit_text = yaml.safe_dump(self.commit, sort_keys=False)
        self.assertIn("R2_SECRET_ACCESS_KEY", collect_text)
        self.assertNotIn("R2_", commit_text)
        self.assertNotIn("git push", collect_text)
        self.assertIn("git push", commit_text)

    def test_artifact_transport_is_narrow_and_short_lived(self) -> None:
        upload_steps = [
            step
            for step in self.collect["steps"]
            if str(step.get("uses", "")).startswith("actions/upload-artifact@")
        ]
        self.assertEqual(len(upload_steps), 1)
        upload = upload_steps[0]["with"]
        self.assertEqual(upload["name"], "pipeline-publicavel")
        self.assertEqual(upload["if-no-files-found"], "error")
        self.assertEqual(upload["retention-days"], 1)
        self.assertTrue(upload["include-hidden-files"])
        self.assertEqual(
            set(upload["path"].splitlines()),
            {
                "data/manifests/datasets_status*.json",
                "apps/web/lib/datasets_status*.json",
                "data/public/.schemas/",
            },
        )

        download_steps = [
            step
            for step in self.commit["steps"]
            if str(step.get("uses", "")).startswith("actions/download-artifact@")
        ]
        self.assertEqual(len(download_steps), 1)
        self.assertEqual(download_steps[0]["with"]["name"], "pipeline-publicavel")


if __name__ == "__main__":
    unittest.main()
