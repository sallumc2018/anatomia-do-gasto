#!/usr/bin/env bash
# Sobe (ou entra) no container rootless do projeto Anatomia do Gasto.
# Uso:
#   .container/dev.sh          -> entra no shell do container (sobe se preciso)
#   .container/dev.sh build    -> reconstroi a imagem
#   .container/dev.sh stop     -> para e remove o container
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="anatomia-do-gasto-dev"
NAME="anatomia-do-gasto-dev"

build() {
  podman build -t "$IMAGE" -f "$REPO_ROOT/.container/Containerfile" "$REPO_ROOT/.container"
}

case "${1:-}" in
  build)
    build
    exit 0
    ;;
  stop)
    podman rm -f "$NAME" 2>/dev/null || true
    exit 0
    ;;
esac

if ! podman image exists "$IMAGE"; then
  build
fi

if ! podman container exists "$NAME"; then
  podman run -d --name "$NAME" \
    --userns=keep-id \
    -v "$REPO_ROOT:/repo:Z" \
    -v "$HOME/.gitconfig:/home/node/.gitconfig:ro,Z" \
    -v "$HOME/.ssh:/home/node/.ssh:ro,Z" \
    -p 127.0.0.1:3000:3000 \
    -w /repo \
    "$IMAGE"
fi

if ! podman ps --filter "name=$NAME" --filter "status=running" -q | grep -q .; then
  podman start "$NAME"
fi

exec podman exec -it -u node "$NAME" bash
