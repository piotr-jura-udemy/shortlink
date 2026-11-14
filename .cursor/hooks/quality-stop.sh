#!/usr/bin/env bash
# Cursor `stop` hook: run Knip, then scoped Stryker, and merge follow-ups.
#
# Stdout must be a single JSON object. Diagnostics go to stderr.
# Local debug:
#   echo '{"status":"completed","loop_count":0,"conversation_id":"t"}' \
#     | .cursor/hooks/quality-stop.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

json_input="$(cat || true)"

emit() {
  printf '%s\n' "$1"
  exit 0
}

emit_empty() {
  emit '{}'
}

if ! command -v python3 >/dev/null 2>&1; then
  printf '[quality-stop] python3 missing — skipping\n' >&2
  emit_empty
fi

run_hook() {
  local script="$1"
  local out ec
  out="$(mktemp -t quality-stop.XXXXXX)"
  set +e
  # Keep stdin payload identical for each child hook. Child scripts already
  # prefix their own stderr diagnostics.
  printf '%s' "$json_input" | "$script" >"$out"
  ec=$?
  set -e
  if [[ "$ec" -ne 0 ]]; then
    # Child hooks should exit 0; if not, treat as empty rather than breaking stop.
    printf '{}'
  else
    cat "$out"
  fi
  rm -f "$out"
}

knip_json="$(run_hook "$ROOT/.cursor/hooks/knip-stop.sh")"
stryker_json="$(run_hook "$ROOT/.cursor/hooks/stryker-stop.sh")"

python3 - "$knip_json" "$stryker_json" <<'PY'
import json
import sys

def load(raw: str):
    try:
        data = json.loads(raw or "{}")
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}

knip = load(sys.argv[1])
stryker = load(sys.argv[2])

messages = []
for part in (knip.get("followup_message"), stryker.get("followup_message")):
    if isinstance(part, str) and part.strip():
        messages.append(part.strip())

if not messages:
    print("{}")
else:
    print(json.dumps({"followup_message": "\n\n---\n\n".join(messages)}, ensure_ascii=False))
PY

exit 0
