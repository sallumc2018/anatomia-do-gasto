"""Théo autonomous training cycle.

Reads training cases, runs Théo's keyword matcher (Python port) against the snapshot of
THEO_ROUTES, classifies outcomes, and writes sanitized candidate lessons to
memory/agents/theo-learning-log.csv.

Subcommands:
  --refresh-snapshot   Parse apps/web/components/theo/theo-guide.tsx and rewrite
                       memory/training/theo/routes-snapshot.json.
  --cycle              Run a training cycle against the cases.csv and append candidates.
  --summary            Print a stats summary of the learning log.

Constraints (do NOT remove):
  - never edits apps/web/components/theo/theo-guide.tsx
  - never autonomously promotes a candidate to policy
  - respects scope.md (off-scope cases are tagged, not answered)
  - respects confidence-state.csv (C0 = log only; C1 = keyword candidates; C2 = route candidates)
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

from common import ROOT, configure_utf8_stdio


THEO_TSX = ROOT / "apps" / "web" / "components" / "theo" / "theo-guide.tsx"
SNAPSHOT = ROOT / "memory" / "training" / "theo" / "routes-snapshot.json"
CASES = ROOT / "memory" / "training" / "theo" / "cases.csv"
LOG = ROOT / "memory" / "agents" / "theo-learning-log.csv"
STATE = ROOT / "memory" / "agents" / "theo-confidence-state.csv"
LEVELS = ROOT / "memory" / "agents" / "theo-confidence-levels.csv"

LOG_FIELDS = [
    "date", "source", "query", "matched_route", "score",
    "outcome_signal", "scope_check", "lesson", "action",
    "status", "related_path", "privacy",
]


def normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value.lower())
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def parse_theo_routes(tsx_text: str) -> list[dict]:
    routes: list[dict] = []
    pattern = re.compile(
        r'id:\s*"([^"]+)",.*?keywords:\s*\[(.*?)\]',
        re.DOTALL,
    )
    for match in pattern.finditer(tsx_text):
        route_id = match.group(1)
        keywords_blob = match.group(2)
        keywords = [
            kw.strip().strip(",").strip('"').strip()
            for kw in re.findall(r'"([^"]+)"', keywords_blob)
        ]
        keywords = [kw for kw in keywords if kw]
        routes.append({"id": route_id, "keywords": keywords})
    return routes


def refresh_snapshot() -> int:
    if not THEO_TSX.exists():
        print(f"ERR: missing {THEO_TSX}")
        return 1
    text = THEO_TSX.read_text(encoding="utf-8")
    routes = parse_theo_routes(text)
    if not routes:
        print("ERR: no routes parsed from theo-guide.tsx")
        return 1
    SNAPSHOT.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT.write_text(
        json.dumps(
            {
                "source": "apps/web/components/theo/theo-guide.tsx",
                "extracted_at": datetime.now(timezone.utc).isoformat(),
                "count": len(routes),
                "routes": routes,
            },
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    print(f"OK: snapshot refreshed with {len(routes)} routes -> {SNAPSHOT.relative_to(ROOT).as_posix()}")
    return 0


def load_snapshot() -> list[dict]:
    if not SNAPSHOT.exists():
        raise FileNotFoundError(
            f"snapshot missing; run --refresh-snapshot first: {SNAPSHOT}"
        )
    with SNAPSHOT.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data.get("routes", [])


def load_cases() -> list[dict]:
    with CASES.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def active_level() -> str:
    with STATE.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row.get("agent") == "theo" and row.get("status") == "active":
                return row["current_level"]
    raise RuntimeError("no active Théo confidence row")


def score_query(query: str, routes: list[dict]) -> tuple[str, int]:
    norm_q = normalize(query)
    best_id, best_score = "fontes", 0
    for route in routes:
        score = 0
        for kw in route["keywords"]:
            if normalize(kw) in norm_q:
                score += 1
        if score > best_score:
            best_score = score
            best_id = route["id"]
    return best_id, best_score


def classify_outcome(case: dict, matched: str, score: int) -> tuple[str, str]:
    expected = case["expected_route"]
    min_score = int(case.get("expected_score_min", "0") or "0")
    scope = case.get("scope_check", "in")

    if scope == "off":
        if matched in ("fontes",) and score == 0:
            return "off_scope_detected", "good"
        return "off_scope_leak", "bad"

    if matched == expected and score >= min_score and min_score >= 3:
        return "match_high_confidence", "good"
    if matched == expected and score >= 1 and score < 3:
        return "match_low_confidence", "candidate_keyword"
    if score == 0:
        return "fallback_in_scope", "candidate_route"
    if matched != expected:
        return f"mismatch_got_{matched}", "candidate_keyword"
    return "match_min_threshold", "good"


def lesson_for(case: dict, matched: str, score: int, signal: str, action: str) -> str:
    expected = case["expected_route"]
    gap = case.get("gap_type", "none") or "none"
    if action == "good":
        return f"OK: '{case['query']}' -> {matched} score={score}"
    if action == "candidate_keyword":
        return (
            f"Add keywords to route '{expected}' to match query '{case['query']}' "
            f"(currently got {matched} score={score}; gap_type={gap})"
        )
    if action == "candidate_route":
        return (
            f"Consider new route for query '{case['query']}' "
            f"(fallback returned; gap_type={gap}; scope=in)"
        )
    if action == "bad":
        return f"SCOPE LEAK: off-scope query '{case['query']}' matched {matched} score={score}"
    return f"unclassified: {signal}"


def cycle() -> int:
    level = active_level()
    routes = load_snapshot()
    cases = load_cases()

    write_header = not LOG.exists() or LOG.stat().st_size == 0
    if write_header:
        with LOG.open("w", encoding="utf-8", newline="") as handle:
            csv.writer(handle).writerow(LOG_FIELDS)

    stats = {"good": 0, "candidate_keyword": 0, "candidate_route": 0, "bad": 0}
    appended = 0
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    with LOG.open("a", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        for case in cases:
            matched, score = score_query(case["query"], routes)
            signal, action = classify_outcome(case, matched, score)
            lesson = lesson_for(case, matched, score, signal, action)
            stats[action] = stats.get(action, 0) + 1

            should_log = False
            if level == "C0":
                should_log = action in ("bad", "candidate_keyword", "candidate_route")
                status = "candidate" if action != "bad" else "incident"
            elif level == "C1":
                should_log = action in ("bad", "candidate_keyword")
                status = "candidate" if action != "bad" else "incident"
            elif level == "C2":
                should_log = action in ("bad", "candidate_keyword", "candidate_route")
                status = "candidate" if action != "bad" else "incident"
            else:
                should_log = False
                status = "skipped"

            if not should_log:
                continue

            writer.writerow([
                now, "train-theo", case["query"], matched, score,
                signal, case.get("scope_check", "in"),
                lesson,
                "review_and_promote" if action != "bad" else "investigate_scope_leak",
                status,
                "apps/web/components/theo/theo-guide.tsx",
                "sanitized",
            ])
            appended += 1

    print(f"OK: Théo training cycle (level={level})")
    print(f"- cases run: {len(cases)}")
    print(f"- good: {stats['good']}")
    print(f"- candidate_keyword: {stats['candidate_keyword']}")
    print(f"- candidate_route: {stats['candidate_route']}")
    print(f"- scope_leak: {stats['bad']}")
    print(f"- appended to log: {appended}")
    print(f"- log: {LOG.relative_to(ROOT).as_posix()}")
    return 0 if stats["bad"] == 0 else 2


def summary() -> int:
    if not LOG.exists():
        print("no log yet")
        return 0
    with LOG.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        print("log empty")
        return 0
    by_status: dict[str, int] = {}
    by_signal: dict[str, int] = {}
    for row in rows:
        by_status[row["status"]] = by_status.get(row["status"], 0) + 1
        by_signal[row["outcome_signal"]] = by_signal.get(row["outcome_signal"], 0) + 1
    print(f"log entries: {len(rows)}")
    print(f"by status: {by_status}")
    print(f"by signal: {by_signal}")
    return 0


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh-snapshot", action="store_true")
    parser.add_argument("--cycle", action="store_true")
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args()

    if not any([args.refresh_snapshot, args.cycle, args.summary]):
        parser.print_help()
        return 1

    code = 0
    if args.refresh_snapshot:
        code = refresh_snapshot() or code
    if args.cycle:
        code = cycle() or code
    if args.summary:
        code = summary() or code
    return code


if __name__ == "__main__":
    sys.exit(main())
