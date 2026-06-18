from __future__ import annotations

import argparse
import json
import math
import re
import sqlite3
import sys
from collections import Counter

from common import ACTIVE_AUTHORITIES, ACTIVE_STATUSES, INDEX_DB, configure_utf8_stdio


def fts_query(text: str, operator: str = "AND") -> str:
    terms = re.findall(r"[\wÀ-ÿ]{3,}", text.lower())
    stop = {
        "para",
        "com",
        "como",
        "que",
        "dos",
        "das",
        "uma",
        "por",
        "the",
        "and",
        "from",
    }
    terms = [term for term in terms if term not in stop]
    if not terms:
        raise ValueError("Query must contain at least one searchable term")
    joiner = f" {operator} "
    return joiner.join(f'"{term}"' for term in terms[:12])


def tokens(text: str) -> list[str]:
    return re.findall(r"[\wÀ-ÿ]{3,}", text.lower())


def agent_allowed(agent: str, allowed_agents: str) -> bool:
    allowed = {item.strip() for item in allowed_agents.split(";") if item.strip()}
    return agent in allowed or "all" in allowed


def load_metadata(conn: sqlite3.Connection) -> dict[str, str]:
    rows = conn.execute("SELECT key, value FROM metadata").fetchall()
    return {row["key"]: row["value"] for row in rows}


def query_tfidf_vector(query_text: str, idf: dict[str, float]) -> tuple[dict[str, float], float]:
    counts = Counter(token for token in tokens(query_text) if token in idf)
    if not counts:
        return {}, 0.0
    max_tf = max(counts.values())
    vector = {
        token: (count / max_tf) * idf[token]
        for token, count in counts.items()
    }
    norm = math.sqrt(sum(weight * weight for weight in vector.values()))
    return vector, norm


def cosine(query_vector: dict[str, float], query_norm: float, vector_json: str, vector_norm: float) -> float:
    if query_norm <= 0 or vector_norm <= 0:
        return 0.0
    chunk_vector = json.loads(vector_json)
    dot = 0.0
    for token, weight in query_vector.items():
        dot += weight * float(chunk_vector.get(token, 0.0))
    return dot / (query_norm * vector_norm)


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="Query the local public RAG index.")
    parser.add_argument("--agent", required=True)
    parser.add_argument("--query", required=True)
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--mode", choices=("hybrid", "fts"), default="hybrid")
    args = parser.parse_args()

    if not INDEX_DB.exists():
        print(f"RAG index not found: {INDEX_DB}")
        print("Run: python tools/memory/build-rag-index.py")
        return 1

    query = fts_query(args.query, "AND")
    conn = sqlite3.connect(INDEX_DB)
    conn.row_factory = sqlite3.Row
    try:
        metadata = load_metadata(conn)
        fts_sql = """
            SELECT
                c.chunk_id,
                c.source_path,
                c.heading,
                c.text,
                c.authority,
                c.allowed_agents,
                bm25(chunks_fts) AS fts_score
            FROM chunks_fts
            JOIN chunks c ON c.chunk_id = chunks_fts.chunk_id
            WHERE chunks_fts MATCH ?
              AND c.visibility = 'public'
              AND c.authority IN (?, ?)
            ORDER BY
              CASE c.authority WHEN 'canonical' THEN 0 ELSE 1 END,
              fts_score
            LIMIT ?
            """
        fts_rows = conn.execute(
            fts_sql,
            (query, *sorted(ACTIVE_AUTHORITIES), max(args.limit * 6, args.limit)),
        ).fetchall()
        if not fts_rows:
            query = fts_query(args.query, "OR")
            fts_rows = conn.execute(
                fts_sql,
                (query, *sorted(ACTIVE_AUTHORITIES), max(args.limit * 6, args.limit)),
            ).fetchall()

        candidate_by_id = {row["chunk_id"]: dict(row) for row in fts_rows}
        for candidate in candidate_by_id.values():
            candidate["vector_score"] = 0.0

        if args.mode == "hybrid" and metadata.get("embedding_model") == "local-tfidf-v1":
            idf = json.loads(metadata.get("tfidf_idf_json", "{}"))
            query_vector, query_norm = query_tfidf_vector(args.query, idf)
            vector_rows = conn.execute(
                """
                SELECT
                    c.chunk_id,
                    c.source_path,
                    c.heading,
                    c.text,
                    c.authority,
                    c.allowed_agents,
                    cv.vector_json,
                    cv.norm
                FROM chunks c
                JOIN chunk_vectors cv ON cv.chunk_id = c.chunk_id
                WHERE c.visibility = 'public'
                  AND c.authority IN (?, ?)
                """,
                tuple(sorted(ACTIVE_AUTHORITIES)),
            ).fetchall()
            for row in vector_rows:
                if not agent_allowed(args.agent, row["allowed_agents"]):
                    continue
                vector_score = cosine(query_vector, query_norm, row["vector_json"], row["norm"])
                if vector_score <= 0 and row["chunk_id"] not in candidate_by_id:
                    continue
                candidate = candidate_by_id.setdefault(row["chunk_id"], dict(row))
                candidate["vector_score"] = vector_score
    finally:
        conn.close()

    ranked = []
    for candidate in candidate_by_id.values():
        if not agent_allowed(args.agent, candidate["allowed_agents"]):
            continue
        fts_score = float(candidate.get("fts_score", 0.0) or 0.0)
        fts_component = 1.0 / (1.0 + abs(fts_score)) if "fts_score" in candidate else 0.0
        vector_component = float(candidate.get("vector_score", 0.0) or 0.0)
        authority_bonus = 0.05 if candidate["authority"] == "canonical" else 0.0
        combined = 0.65 * fts_component + 0.35 * vector_component + authority_bonus
        candidate["combined_score"] = combined
        ranked.append(candidate)

    results = sorted(
        ranked,
        key=lambda item: (
            -item["combined_score"],
            0 if item["authority"] == "canonical" else 1,
            item["source_path"],
        ),
    )[: args.limit]

    if not results:
        print("No RAG results for this agent/query.")
        return 1

    for index, row in enumerate(results, start=1):
        snippet = re.sub(r"\s+", " ", row["text"]).strip()
        if len(snippet) > 420:
            snippet = snippet[:417].rstrip() + "..."
        heading = f" | {row['heading']}" if row["heading"] else ""
        print(f"{index}. {row['source_path']}{heading} [{row['authority']} | {args.mode}]")
        print(f"   {snippet}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
