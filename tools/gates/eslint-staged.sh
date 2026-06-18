#!/bin/bash
# Wrapper for lint-staged in monorepo: cd into apps/web so ESLint finds
# eslint.config.mjs, then strip the "apps/web/" prefix from staged file paths.
set -e
ROOT="$(pwd)"
WEB="${ROOT}/apps/web"
FILES=()
for f in "$@"; do
  FILES+=("${f#apps/web/}")
done
cd "$WEB"
exec "./node_modules/.bin/eslint" --max-warnings 0 "${FILES[@]}"
