#!/usr/bin/env bash
# Cursor `afterFileEdit` hook: record agent-touched source files for scoped Stryker.
#
# Stdout must be a single JSON object. Diagnostics go to stderr.
# Local debug:
#   echo '{"conversation_id":"t","file_path":"'"$PWD"'/lib/foo.ts"}' \
#     | .cursor/hooks/track-touched-files.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_DIR="$ROOT/.cursor/hooks/state"
STATE_FILE="$STATE_DIR/touched-files.json"

json_input="$(cat || true)"

log() {
  printf '[track-touched] %s\n' "$*" >&2
}

emit_empty() {
  printf '%s\n' '{}'
  exit 0
}

if ! command -v python3 >/dev/null 2>&1; then
  log "python3 missing — cannot track touched files"
  emit_empty
fi

mkdir -p "$STATE_DIR"
tmp="$(mktemp -t track-touched.XXXXXX)"
cleanup() { rm -f "$tmp"; }
trap cleanup EXIT
printf '%s' "$json_input" >"$tmp"

python3 - "$ROOT" "$STATE_FILE" "$tmp" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
state_path = Path(sys.argv[2])
payload_path = Path(sys.argv[3])

try:
    data = json.loads(payload_path.read_text())
except Exception:
    data = {}

conversation_id = data.get("conversation_id") or ""
file_path = data.get("file_path") or ""
if not conversation_id or not file_path:
    raise SystemExit(0)

path = Path(file_path)
try:
    rel = path.resolve().relative_to(root).as_posix()
except Exception:
    raise SystemExit(0)

name = Path(rel).name
if not (rel.endswith(".ts") or rel.endswith(".tsx")):
    raise SystemExit(0)
if (
    ".test." in name
    or ".spec." in name
    or rel.startswith("e2e/")
    or rel.startswith("node_modules/")
    or rel.startswith(".next")
    or rel.startswith(".cursor/")
    or rel.startswith("components/ui/")
    or rel.startswith("reports/")
):
    raise SystemExit(0)

allowed_prefixes = ("lib/", "components/", "app/", "scripts/")
if not (rel in ("proxy.ts",) or rel.startswith(allowed_prefixes)):
    raise SystemExit(0)

state = {"conversation_id": conversation_id, "files": []}
if state_path.exists():
    try:
        loaded = json.loads(state_path.read_text())
        if isinstance(loaded, dict) and loaded.get("conversation_id") == conversation_id:
            files = loaded.get("files") or []
            if isinstance(files, list):
                state["files"] = [f for f in files if isinstance(f, str)]
    except Exception:
        pass

if rel not in state["files"]:
    state["files"].append(rel)
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(state, indent=2) + "\n")
    print(f"[track-touched] recorded {rel} (n={len(state['files'])})", file=sys.stderr)
else:
    print(f"[track-touched] already tracked {rel}", file=sys.stderr)
PY

emit_empty
