#!/usr/bin/env python3
"""Repository-wide governance tests for GitHub Actions workflows."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

import yaml

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS_DIR = REPOSITORY_ROOT / ".github/workflows"
ALLOWED_WRITE_JOBS = {
    ("scheduled-pipeline.yml", "salvar-atualizacoes"),
}


class AllWorkflowGovernanceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.paths = sorted(WORKFLOWS_DIR.glob("*.yml"))
        if not cls.paths:
            raise AssertionError("nenhum workflow encontrado")

    def test_external_actions_are_pinned_to_full_commits(self) -> None:
        for path in self.paths:
            content = path.read_text(encoding="utf-8")
            references = re.findall(
                r"^\s*uses:\s*(\S+)",
                content,
                flags=re.MULTILINE,
            )
            for reference in references:
                if reference.startswith("./"):
                    continue
                with self.subTest(workflow=path.name, reference=reference):
                    self.assertRegex(reference, r"^[^@\s]+@[0-9a-f]{40}$")

    def test_no_workflow_relies_on_implicit_token_permissions(self) -> None:
        for path in self.paths:
            workflow = yaml.safe_load(path.read_text(encoding="utf-8"))
            global_permissions = workflow.get("permissions")
            jobs = workflow["jobs"]
            for job_name, job in jobs.items():
                with self.subTest(workflow=path.name, job=job_name):
                    self.assertTrue(
                        global_permissions is not None or "permissions" in job,
                        "workflow/job sem declaração explícita de permissions",
                    )

    def test_write_permission_is_restricted_to_allowlist(self) -> None:
        observed_writers: set[tuple[str, str]] = set()
        for path in self.paths:
            workflow = yaml.safe_load(path.read_text(encoding="utf-8"))
            global_permissions = workflow.get("permissions", {})
            if isinstance(global_permissions, dict):
                self.assertNotEqual(
                    global_permissions.get("contents"),
                    "write",
                    f"{path.name} concede escrita global",
                )

            for job_name, job in workflow["jobs"].items():
                permissions = job.get("permissions", global_permissions)
                if (
                    isinstance(permissions, dict)
                    and permissions.get("contents") == "write"
                ):
                    observed_writers.add((path.name, job_name))

        self.assertEqual(observed_writers, ALLOWED_WRITE_JOBS)


if __name__ == "__main__":
    unittest.main()
