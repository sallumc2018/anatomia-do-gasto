#!/usr/bin/env python3
# Hook Stop: ao fim do turno, se data/public mudou desde a ultima checagem,
# roda verificar_publicacao.py e avisa (exit 2 + mensagem) somente se algo quebrou.
# Caminho rapido: se nada mudou em data/public, sai em ms (sem rodar o python de ~4s).
# Porte cross-platform do check_public_on_stop.ps1.
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    pub = root / "data" / "public"
    if not pub.exists():
        return 0

    marker = root / ".local" / "last_public_check.txt"

    # mtime mais recente em data/public (apenas stat — rapido)
    latest = None
    for p in pub.rglob("*"):
        if not p.is_file():
            continue
        try:
            m = p.stat().st_mtime
        except OSError:
            continue
        if latest is None or m > latest:
            latest = m
    if latest is None:
        return 0

    if marker.exists():
        try:
            last_checked = datetime.fromisoformat(marker.read_text(encoding="utf-8").strip()).timestamp()
            if last_checked >= latest:
                return 0  # nada novo desde a ultima checagem
        except Exception:
            pass

    # roda a verificacao (so chega aqui se houve mudanca)
    try:
        proc = subprocess.run(
            [sys.executable, str(root / "pipelines" / "testes" / "verificar_publicacao.py")],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        out = (proc.stdout or "") + (proc.stderr or "")
    except Exception as exc:  # nao deixa o hook derrubar o turno
        out = str(exc)

    # atualiza marcador
    marker.parent.mkdir(parents=True, exist_ok=True)
    marker.write_text(datetime.now().isoformat(), encoding="utf-8")

    if "problema" in out:
        resumo = " ".join(out.split())
        if len(resumo) > 400:
            resumo = resumo[:400]
        # async + asyncRewake: exit 2 acorda o modelo com esta mensagem para corrigir
        print("verificar_publicacao detectou problema apos mudanca em data/public: " + resumo)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
