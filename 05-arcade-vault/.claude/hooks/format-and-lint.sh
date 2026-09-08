#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

INPUT="$(cat)"
FILE="$(echo "$INPUT" | jq -r '.tool_response.filePath // .tool_input.file_path // empty')"

[[ -z "$FILE" ]] && exit 0
[[ "$FILE" != "$PROJECT_DIR/"* ]] && exit 0
[[ ! -f "$FILE" ]] && exit 0

EXT="${FILE##*.}"

case "$EXT" in
  md)
    npx --prefix "$PROJECT_DIR" markdownlint-cli2 --fix "$FILE"
    ;;
  ts|tsx|js|jsx)
    npx --prefix "$PROJECT_DIR" prettier --write "$FILE" \
      && npx --prefix "$PROJECT_DIR" eslint --fix "$FILE"
    ;;
  *)
    exit 0
    ;;
esac
