#!/usr/bin/env bash
# Cursor `stop` hook: run Stryker only on source files touched this conversation.
#
# Depends on `afterFileEdit` → track-touched-files.sh writing
# `.cursor/hooks/state/touched-files.json`.
#
# Stdout must be a single JSON object. Diagnostics go to stderr.
# Local debug:
#   echo '{"status":"completed","loop_count":0,"conversation_id":"t"}' \
#     | .cursor/hooks/stryker-stop.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STATE_FILE="$ROOT/.cursor/hooks/state/touched-files.json"
REPORT_JSON="$ROOT/reports/mutation/mutation.json"

json_input="$(cat || true)"

status="completed"
loop_count=0
conversation_id=""
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
conversation_id = data.get("conversation_id") or ""
print(f"status={shlex.quote(str(status))}")
print(f"loop_count={shlex.quote(str(loop_count))}")
print(f"conversation_id={shlex.quote(str(conversation_id))}")
'
  )"
fi

emit_empty() {
  printf '%s\n' '{}'
  exit 0
}

log() {
  printf '[stryker-stop] %s\n' "$*" >&2
}

clear_state_if_ours() {
  if [[ ! -f "$STATE_FILE" ]]; then
    return 0
  fi
  python3 - "$STATE_FILE" "$conversation_id" <<'PY'
import json, sys
from pathlib import Path
path, conv = Path(sys.argv[1]), sys.argv[2]
try:
    data = json.loads(path.read_text())
except Exception:
    path.unlink(missing_ok=True)
    raise SystemExit(0)
if not conv or data.get("conversation_id") == conv:
    path.unlink(missing_ok=True)
PY
}

# Skip cancelled / errored turns and optional escape hatch.
if [[ "$status" == "aborted" || "$status" == "error" ]]; then
  log "status=${status} — skipping Stryker"
  emit_empty
fi

if [[ -f "$ROOT/.cursor/skip-stryker-stop" ]]; then
  log "skip file present (.cursor/skip-stryker-stop) — skipping Stryker"
  emit_empty
fi

if ! command -v python3 >/dev/null 2>&1; then
  log "python3 missing — skipping Stryker"
  emit_empty
fi

# Resolve mutate targets from the afterFileEdit ledger.
mutate_targets="$(
  python3 - "$STATE_FILE" "$conversation_id" "$ROOT" <<'PY'
import json
import sys
from pathlib import Path

state_path = Path(sys.argv[1])
conversation_id = sys.argv[2]
root = Path(sys.argv[3])

if not state_path.exists():
    raise SystemExit(0)

try:
    data = json.loads(state_path.read_text())
except Exception:
    raise SystemExit(0)

if conversation_id and data.get("conversation_id") not in (None, conversation_id):
    raise SystemExit(0)

files = data.get("files") or []
if not isinstance(files, list):
    raise SystemExit(0)

targets = []
for rel in files:
    if not isinstance(rel, str) or not rel:
        continue
    path = root / rel
    if path.is_file():
        targets.append(rel)

# Deduplicate while preserving order
seen = set()
ordered = []
for rel in targets:
    if rel not in seen:
        seen.add(rel)
        ordered.append(rel)

print(",".join(ordered))
PY
)"

if [[ -z "$mutate_targets" ]]; then
  log "no agent-touched source files to mutate — skipping"
  clear_state_if_ours
  emit_empty
fi

# Cursor may put its bundled Node early on PATH; prefer the system toolchain.
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

log "node=$(command -v node || echo missing) $(node -v 2>/dev/null || true)"
log "mutating: ${mutate_targets} (loop_count=${loop_count})"

mkdir -p "$(dirname "$REPORT_JSON")"
rm -f "$REPORT_JSON"

tmp="$(mktemp -t stryker-stop.XXXXXX)"
cleanup() { rm -f "$tmp"; }
trap cleanup EXIT

set +e
npx stryker run --mutate "$mutate_targets" >"$tmp" 2>&1
stryker_exit=$?
set -e

# Always keep the text log available for follow-up truncation.
log "stryker exit=${stryker_exit}"

# Parse survivors from the JSON report when present.
followup="$(
  python3 - "$REPORT_JSON" "$tmp" "$stryker_exit" "$loop_count" "$mutate_targets" <<'PY'
import json
import sys
from pathlib import Path

report_path = Path(sys.argv[1])
log_path = Path(sys.argv[2])
code = int(sys.argv[3])
loop = sys.argv[4]
mutate_targets = sys.argv[5]

survived = []
score = None
if report_path.exists():
    try:
        report = json.loads(report_path.read_text())
    except Exception:
        report = None
    if isinstance(report, dict):
        files = report.get("files") or {}
        if isinstance(files, dict):
            for file_name, meta in files.items():
                mutants = (meta or {}).get("mutants") or []
                for mutant in mutants:
                    if (mutant or {}).get("status") != "Survived":
                        continue
                    loc = (mutant or {}).get("location") or {}
                    start = (loc.get("start") or {})
                    line = start.get("line")
                    mutator = (mutant or {}).get("mutatorName") or "unknown"
                    replacement = (mutant or {}).get("replacement")
                    desc = f"{file_name}:{line} [{mutator}]"
                    if replacement is not None:
                        desc += f" → {replacement!r}"
                    survived.append(desc)
        # Schema varies slightly by Stryker version.
        if "mutationScore" in report:
            score = report.get("mutationScore")
        elif isinstance(report.get("metrics"), dict):
            score = report["metrics"].get("mutationScore")
        elif isinstance(report.get("system"), dict) and isinstance(
            report["system"].get("metrics"), dict
        ):
            score = report["system"]["metrics"].get("mutationScore")

raw_log = log_path.read_text(errors="replace")
max_chars = 10000
body = raw_log if len(raw_log) <= max_chars else raw_log[:max_chars] + "\n…[truncated]…"

# Hard failures (dry-run / config / runner) still deserve a follow-up.
if code != 0 and not survived:
    msg = (
        "Stop hook: Stryker failed while mutation-testing agent-touched files "
        f"(exit {code}, auto-follow-up {loop}/2).\n\n"
        f"Mutate targets: {mutate_targets}\n\n"
        "Fix the underlying test/runner issue, then stop so Stryker can re-check. "
        "Do not weaken Stryker config just to silence this.\n\n"
        "To skip this check for one turn, create `.cursor/skip-stryker-stop`.\n\n"
        "----- stryker output -----\n"
        f"{body}"
    )
    print(json.dumps({"followup_message": msg}, ensure_ascii=False))
    raise SystemExit(0)

if not survived:
    # Clean run — signal empty stdout via exit marker for the shell wrapper.
    print("")
    raise SystemExit(0)

score_line = f"Mutation score: {score}\n" if score is not None else ""
listing = "\n".join(f"- {item}" for item in survived[:40])
if len(survived) > 40:
    listing += f"\n- …and {len(survived) - 40} more"

msg = (
    "Stop hook: Stryker found surviving mutants in agent-touched files "
    f"(auto-follow-up {loop}/2).\n\n"
    f"Mutate targets: {mutate_targets}\n"
    f"{score_line}"
    f"Survivors ({len(survived)}):\n{listing}\n\n"
    "Strengthen tests (preferred) or tighten the production code so these "
    "mutants are killed. Do not disable mutators or broaden ignore lists just "
    "to clear the report. When done, stop so Stryker can re-check only the "
    "touched files.\n\n"
    "To skip this check for one turn, create `.cursor/skip-stryker-stop`.\n\n"
    "----- stryker output -----\n"
    f"{body}"
)
print(json.dumps({"followup_message": msg}, ensure_ascii=False))
PY
)"

if [[ -z "$followup" ]]; then
  log "no surviving mutants — clearing touched-file ledger"
  clear_state_if_ours
  emit_empty
fi

# Keep the ledger so the next stop re-checks the same mutate set after fixes.
printf '%s\n' "$followup"
exit 0
