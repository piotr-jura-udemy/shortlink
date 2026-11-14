#!/usr/bin/env bash
# Cursor `stop` hook: run Knip after an agent turn and auto-follow up on findings.
#
# Stdout must be a single JSON object. Diagnostics go to stderr.
# Local debug:
#   echo '{"status":"completed","loop_count":0}' | .cursor/hooks/knip-stop.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

json_input="$(cat || true)"

status="completed"
loop_count=0
if command -v python3 >/dev/null 2>&1; then
  eval "$(
    printf '%s' "$json_input" | python3 -c '
import json, shlex, sys
try:
    data = json.load(sys.stdin)
except Exception:
    data = {}
status = data.get("status") or "completed"
loop_count = data.get("loop_count", 0)
print(f"status={shlex.quote(str(status))}")
print(f"loop_count={shlex.quote(str(loop_count))}")
'
  )"
fi

emit_empty() {
  printf '%s\n' '{}'
  exit 0
}

log() {
  printf '[knip-stop] %s\n' "$*" >&2
}

# Skip cancelled / errored turns and optional escape hatch.
if [[ "$status" == "aborted" || "$status" == "error" ]]; then
  log "status=${status} — skipping Knip"
  emit_empty
fi

if [[ -f "$ROOT/.cursor/skip-knip-stop" ]]; then
  log "skip file present (.cursor/skip-knip-stop) — skipping Knip"
  emit_empty
fi

# Cursor may put its bundled Node early on PATH; prefer the system toolchain.
if command -v python3 >/dev/null 2>&1; then
  PATH="$(
    python3 -c '
import os
skip = (".cursor-server", ".vscode-server", "cursor-server")
print(":".join(
    part for part in os.environ.get("PATH", "").split(":")
    if part and not any(token in part for token in skip)
))
'
  )"
  export PATH
fi

log "node=$(command -v node || echo missing) $(node -v 2>/dev/null || true)"
log "running npm run knip (loop_count=${loop_count})"

tmp="$(mktemp -t knip-stop.XXXXXX)"
cleanup() { rm -f "$tmp"; }
trap cleanup EXIT

set +e
npm run knip --silent >"$tmp" 2>&1
knip_exit=$?
set -e

if [[ "$knip_exit" -eq 0 ]]; then
  log "Knip clean"
  emit_empty
fi

# Knip found issues — ask the agent to fix them, then stop again.
python3 - "$tmp" "$knip_exit" "$loop_count" <<'PY'
import json
import sys
from pathlib import Path

path, code, loop = Path(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
raw = path.read_text(errors="replace")
# Keep the follow-up within a reasonable context budget.
max_chars = 12000
body = raw if len(raw) <= max_chars else raw[:max_chars] + "\n…[truncated]…"

msg = (
    "Stop hook: Knip reported unused files, exports, or dependencies "
    f"(exit {code}, auto-follow-up {loop}/3).\n\n"
    "Fix the findings below. Prefer removing truly dead code or wiring "
    "it up if it was meant to be used. Do not weaken Knip config just to "
    "silence the report. When done, stop so Knip can re-check.\n\n"
    "To skip this check for one turn, create `.cursor/skip-knip-stop`.\n\n"
    "----- knip output -----\n"
    f"{body}"
)
print(json.dumps({"followup_message": msg}, ensure_ascii=False))
PY

exit 0
