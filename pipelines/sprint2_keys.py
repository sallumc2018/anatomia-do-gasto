"""Chaves canônicas de armazenamento para municípios do Sprint 2."""

from __future__ import annotations

from collections import Counter
from typing import Iterable, Mapping


def duplicate_keys(municipios: Iterable[Mapping[str, str]]) -> set[str]:
    counts = Counter((municipio.get("key") or "").strip() for municipio in municipios)
    return {key for key, count in counts.items() if key and count > 1}


def municipio_storage_key(municipio: Mapping[str, str], duplicated: set[str]) -> str:
    key = (municipio.get("key") or "").strip()
    uf = (municipio.get("uf") or "").strip().lower()
    if key in duplicated:
        return f"{key}_{uf}"
    return key


def municipio_input_keys(municipio: Mapping[str, str], duplicated: set[str]) -> tuple[str, ...]:
    """Retorna chaves a procurar em ordem: canônica atual e legado, se existir."""
    canonical = municipio_storage_key(municipio, duplicated)
    legacy = (municipio.get("key") or "").strip()
    if canonical == legacy:
        return (canonical,)
    return (canonical, legacy)
