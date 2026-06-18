"""
Rastreamento de hash SHA-256 para arquivos coletados.

Detecta quando um portal muda um arquivo silenciosamente — sem precisar
baixar novamente para comparar.

Uso:
    from tools.pipeline.hash_utils import registrar_hash, arquivo_mudou

    # Após baixar um arquivo:
    mudou = registrar_hash("data/raw/sorocaba/fns/repasses_2024.zip",
                           url_fonte="https://portalfns.saude.gov.br/...")
    if mudou:
        print("FONTE MUDOU — reprocessar extracted!")

    # Para verificar sem registrar:
    if arquivo_mudou("data/raw/sorocaba/fns/repasses_2024.zip"):
        ...

Formato do arquivo .hash.json gerado ao lado do arquivo:
    {
      "arquivo": "repasses_2024.zip",
      "historico": [
        {"sha256": "abc123...", "baixado_em": "2026-05-01T12:00:00+00:00", "url_fonte": "..."},
        {"sha256": "def456...", "baixado_em": "2026-06-03T09:00:00+00:00", "url_fonte": "..."}
      ]
    }

Regra: quando hash muda, o evento é logado no stderr com prefixo MUDANÇA DETECTADA.
Não apaga o arquivo extraído — cabe ao pipeline decidir o reprocessamento.
"""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for bloco in iter(lambda: f.read(65536), b""):
            h.update(bloco)
    return h.hexdigest()


def registrar_hash(arquivo: str | Path, url_fonte: str = "") -> bool:
    """
    Calcula SHA-256 do arquivo e registra em <arquivo>.hash.json.

    Returns:
        True  se o arquivo mudou desde o último registro (ou é novo).
        False se o hash é idêntico ao último registro.
    """
    arquivo = Path(arquivo)
    if not arquivo.exists():
        return False

    hash_path = arquivo.with_suffix(arquivo.suffix + ".hash.json")
    sha = _sha256(arquivo)
    historico: list[dict] = []

    if hash_path.exists():
        try:
            data = json.loads(hash_path.read_text(encoding="utf-8"))
            historico = data.get("historico", [])
        except Exception:
            historico = []

    ultimo_sha = historico[-1]["sha256"] if historico else None
    if ultimo_sha == sha:
        return False  # sem mudança

    if ultimo_sha is not None:
        print(
            f"[hash_utils] MUDANÇA DETECTADA em {arquivo.name}\n"
            f"  anterior: {ultimo_sha[:12]}...\n"
            f"  atual:    {sha[:12]}...",
            file=sys.stderr,
        )

    historico.append(
        {
            "sha256": sha,
            "baixado_em": datetime.now(timezone.utc).isoformat(),
            "url_fonte": url_fonte,
        }
    )
    hash_path.write_text(
        json.dumps({"arquivo": arquivo.name, "historico": historico}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return True


def arquivo_mudou(arquivo: str | Path) -> bool:
    """Verifica se o arquivo mudou sem registrar o novo hash."""
    arquivo = Path(arquivo)
    if not arquivo.exists():
        return False
    hash_path = arquivo.with_suffix(arquivo.suffix + ".hash.json")
    if not hash_path.exists():
        return True  # sem registro anterior → tratar como novo
    try:
        data = json.loads(hash_path.read_text(encoding="utf-8"))
        ultimo = data.get("historico", [{}])[-1].get("sha256", "")
        return _sha256(arquivo) != ultimo
    except Exception:
        return True


def hash_atual(arquivo: str | Path) -> str | None:
    """Retorna o SHA-256 do último registro, ou None se não há registro."""
    hash_path = Path(arquivo).with_suffix(Path(arquivo).suffix + ".hash.json")
    if not hash_path.exists():
        return None
    try:
        data = json.loads(hash_path.read_text(encoding="utf-8"))
        return data.get("historico", [{}])[-1].get("sha256")
    except Exception:
        return None
