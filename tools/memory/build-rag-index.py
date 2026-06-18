from __future__ import annotations

import argparse
import json
import math
import re
import sqlite3
import sys
from collections import Counter
from pathlib import Path

from common import (
    ACTIVE_AUTHORITIES,
    ACTIVE_STATUSES,
    INDEX_DB,
    configure_utf8_stdio,
    ensure_local_dirs,
    iter_entry_files,
    read_registry,
    read_text,
    relative,
    sha256_file,
    sha256_text,
)


MAX_CHARS = 1800
OVERLAP = 200
TOKEN_RE = re.compile(r"[\wÀ-ÿ]{3,}", re.UNICODE)
STOPWORDS = {
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
    "dados",
    "data",
}


def chunk_text(text: str) -> list[tuple[str, str]]:
    normalized = "\n".join(line.rstrip() for line in text.splitlines())
    blocks: list[tuple[str, str]] = []
    heading = ""
    cursor = 0
    while cursor < len(normalized):
        end = min(len(normalized), cursor + MAX_CHARS)
        if end < len(normalized):
            break_at = normalized.rfind("\n\n", cursor, end)
            if break_at > cursor + 400:
                end = break_at
        chunk = normalized[cursor:end].strip()
        if chunk:
            for line in chunk.splitlines():
                if line.startswith("#"):
                    heading = line.lstrip("#").strip()
                    break
            blocks.append((heading, chunk))
        if end >= len(normalized):
            break
        cursor = max(cursor + 1, end - OVERLAP)
    return blocks


def tokenize(text: str) -> list[str]:
    return [token for token in TOKEN_RE.findall(text.lower()) if token not in STOPWORDS]


def create_schema(conn: sqlite3.Connection) -> None:
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute(
        """
        CREATE TABLE sources (
            source_path TEXT PRIMARY KEY,
            source_hash TEXT NOT NULL,
            entry_id TEXT NOT NULL,
            type TEXT NOT NULL,
            visibility TEXT NOT NULL,
            authority TEXT NOT NULL,
            allowed_agents TEXT NOT NULL,
            tags TEXT NOT NULL,
            status TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE chunks (
            chunk_id TEXT PRIMARY KEY,
            source_path TEXT NOT NULL,
            source_hash TEXT NOT NULL,
            entry_id TEXT NOT NULL,
            visibility TEXT NOT NULL,
            authority TEXT NOT NULL,
            allowed_agents TEXT NOT NULL,
            tags TEXT NOT NULL,
            heading TEXT,
            text TEXT NOT NULL,
            text_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE chunk_vectors (
            chunk_id TEXT PRIMARY KEY,
            vector_json TEXT NOT NULL,
            norm REAL NOT NULL,
            FOREIGN KEY(chunk_id) REFERENCES chunks(chunk_id)
        )
        """
    )
    conn.execute(
        """
        CREATE VIRTUAL TABLE chunks_fts USING fts5(
            chunk_id UNINDEXED,
            source_path UNINDEXED,
            heading,
            text,
            tokenize='unicode61 remove_diacritics 2'
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        """
    )
    conn.execute(
        "INSERT INTO metadata(key, value) VALUES (?, ?)",
        ("search_backend", "sqlite-fts5+local-tfidf"),
    )
    conn.execute(
        "INSERT INTO metadata(key, value) VALUES (?, ?)",
        ("embedding_model", "local-tfidf-v1"),
    )


def check_fts5() -> None:
    conn = sqlite3.connect(":memory:")
    try:
        conn.execute("CREATE VIRTUAL TABLE test_fts USING fts5(text)")
    finally:
        conn.close()


def build_index(db_path: Path) -> tuple[int, int]:
    ensure_local_dirs()
    entries = [
        entry
        for entry in read_registry()
        if entry.index
        and entry.visibility == "public"
        and entry.authority in ACTIVE_AUTHORITIES
        and entry.status in ACTIVE_STATUSES
    ]
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(db_path)
    try:
        create_schema(conn)
        source_count = 0
        chunk_count = 0
        vector_inputs: list[tuple[str, str]] = []
        for entry in entries:
            for path in iter_entry_files(entry):
                rel_path = relative(path)
                text = read_text(path)
                source_hash = sha256_file(path)
                allowed = ";".join(sorted(entry.allowed_agents))
                tags = ";".join(sorted(entry.tags))
                conn.execute(
                    """
                    INSERT OR REPLACE INTO sources(
                        source_path, source_hash, entry_id, type, visibility,
                        authority, allowed_agents, tags, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        rel_path,
                        source_hash,
                        entry.id,
                        entry.type,
                        entry.visibility,
                        entry.authority,
                        allowed,
                        tags,
                        entry.status,
                    ),
                )
                source_count += 1
                for index, (heading, chunk) in enumerate(chunk_text(text), start=1):
                    chunk_id = f"{entry.id}:{rel_path}:{index}"
                    text_hash = sha256_text(chunk)
                    conn.execute(
                        """
                        INSERT INTO chunks(
                            chunk_id, source_path, source_hash, entry_id,
                            visibility, authority, allowed_agents, tags,
                            heading, text, text_hash
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            chunk_id,
                            rel_path,
                            source_hash,
                            entry.id,
                            entry.visibility,
                            entry.authority,
                            allowed,
                            tags,
                            heading,
                            chunk,
                            text_hash,
                        ),
                    )
                    conn.execute(
                        """
                        INSERT INTO chunks_fts(chunk_id, source_path, heading, text)
                        VALUES (?, ?, ?, ?)
                        """,
                        (chunk_id, rel_path, heading, chunk),
                    )
                    vector_inputs.append((chunk_id, f"{heading}\n{chunk}"))
                    chunk_count += 1
        write_vectors(conn, vector_inputs)
        conn.commit()
        return source_count, chunk_count
    finally:
        conn.close()


def write_vectors(conn: sqlite3.Connection, chunks: list[tuple[str, str]]) -> None:
    token_counts: dict[str, Counter[str]] = {}
    document_frequency: Counter[str] = Counter()
    for chunk_id, text in chunks:
        counts = Counter(tokenize(text))
        token_counts[chunk_id] = counts
        document_frequency.update(counts.keys())

    total_docs = max(len(chunks), 1)
    idf = {
        token: math.log((1 + total_docs) / (1 + frequency)) + 1.0
        for token, frequency in document_frequency.items()
    }

    for chunk_id, counts in token_counts.items():
        if not counts:
            conn.execute(
                "INSERT INTO chunk_vectors(chunk_id, vector_json, norm) VALUES (?, ?, ?)",
                (chunk_id, "{}", 0.0),
            )
            continue
        max_tf = max(counts.values())
        vector = {
            token: (count / max_tf) * idf[token]
            for token, count in counts.items()
        }
        norm = math.sqrt(sum(weight * weight for weight in vector.values()))
        conn.execute(
            "INSERT INTO chunk_vectors(chunk_id, vector_json, norm) VALUES (?, ?, ?)",
            (chunk_id, json.dumps(vector, sort_keys=True, separators=(",", ":")), norm),
        )

    conn.execute(
        "INSERT OR REPLACE INTO metadata(key, value) VALUES (?, ?)",
        ("embedding_dim", str(len(idf))),
    )
    conn.execute(
        "INSERT OR REPLACE INTO metadata(key, value) VALUES (?, ?)",
        ("tfidf_idf_json", json.dumps(idf, sort_keys=True, separators=(",", ":"))),
    )


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="Build local public RAG index.")
    parser.add_argument("--check", action="store_true", help="Check FTS5 support and registry readability only.")
    args = parser.parse_args()
    try:
        check_fts5()
        entries = read_registry()
        if args.check:
            print(f"RAG index check: OK (FTS5 available, {len(entries)} registry entries)")
            return 0
        source_count, chunk_count = build_index(INDEX_DB)
        print(f"RAG index built: {INDEX_DB}")
        print(f"Sources: {source_count}")
        print(f"Chunks: {chunk_count}")
        return 0
    except Exception as exc:
        print(f"RAG index build: FAIL: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
