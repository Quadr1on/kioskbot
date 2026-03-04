#!/usr/bin/env bash
set -euo pipefail

FEATURE_SPEC="${1:-}"
if [ -z "$FEATURE_SPEC" ]; then
  echo "Usage: ./scripts/orchestrator.sh \"FEATURE_SPEC_HERE\""
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.orchestrator"
mkdir -p "$LOG_DIR"
SUMMARY_FILE="$LOG_DIR/summary-$(date +%Y%m%d-%H%M%S).md"

AGENTS=(backend frontend devops docs testing)
BRANCHES=(agent-backend agent-frontend agent-devops agent-docs agent-testing)
WORKTREES=(worktrees/backend worktrees/frontend worktrees/devops worktrees/docs worktrees/testing)
ROLE_FILES=(agents/backend.md agents/frontend.md agents/devops.md agents/docs.md agents/testing.md)

MAX_RETRIES="${MAX_RETRIES:-2}"

find_codex_exec_mode() {
  if ! command -v codex >/dev/null 2>&1; then
    echo "missing"
    return
  fi

  if codex --help 2>/dev/null | grep -qi "exec"; then
    echo "exec"
  elif codex --help 2>/dev/null | grep -q -- "-p"; then
    echo "prompt"
  else
    echo "raw"
  fi
}

run_codex() {
  local mode="$1"
  local prompt="$2"

  case "$mode" in
    exec)
      codex exec "$prompt"
      ;;
    prompt)
      codex -p "$prompt"
      ;;
    raw)
      codex "$prompt"
      ;;
    *)
      echo "Codex CLI not found. Install Codex or set it on PATH."
      return 127
      ;;
  esac
}

build_prompt() {
  local agent="$1"
  local branch="$2"
  local role_file="$3"

  cat <<EOF
You are the $agent agent working in branch $branch.

Global constraints:
- Follow AGENTS.md exactly.
- Only modify files in your ownership domain.
- Commit your changes when complete.

Feature specification:
$FEATURE_SPEC

Role instructions:
$(cat "$ROOT_DIR/$role_file")

Deliverables:
1) Implement your scoped tasks.
2) Add/update tests required by AGENTS.md.
3) Update docs where required.
4) Create at least one commit with a clear message.
EOF
}

echo "# Orchestration Summary" > "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "- Feature spec: $FEATURE_SPEC" >> "$SUMMARY_FILE"
echo "- Started: $(date -u)" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

echo "[Supervisor] Verifying worktrees..."
for i in "${!AGENTS[@]}"; do
  wt_path="$ROOT_DIR/${WORKTREES[$i]}"
  branch="${BRANCHES[$i]}"

  if [ ! -d "$wt_path/.git" ] && [ ! -f "$wt_path/.git" ]; then
    echo "Missing worktree: $wt_path for branch $branch"
    exit 1
  fi

done

CODEX_MODE="$(find_codex_exec_mode)"
if [ "$CODEX_MODE" = "missing" ]; then
  echo "Codex CLI is required for orchestration."
  exit 1
fi

echo "[Supervisor] Dispatching parallel agents..."
PIDS=()
for i in "${!AGENTS[@]}"; do
  agent="${AGENTS[$i]}"
  branch="${BRANCHES[$i]}"
  wt="$ROOT_DIR/${WORKTREES[$i]}"
  role_file="${ROLE_FILES[$i]}"
  log_file="$LOG_DIR/${agent}.log"

  prompt="$(build_prompt "$agent" "$branch" "$role_file")"

  (
    cd "$wt"
    run_codex "$CODEX_MODE" "$prompt"
  ) >"$log_file" 2>&1 &

  PIDS+=("$!")
  echo "- dispatched $agent ($branch)" >> "$SUMMARY_FILE"
done

FAIL_AGENTS=()
for i in "${!PIDS[@]}"; do
  if ! wait "${PIDS[$i]}"; then
    FAIL_AGENTS+=("${AGENTS[$i]}")
  fi
done

retry_agent() {
  local agent="$1"
  local retry="$2"

  local idx=-1
  for i in "${!AGENTS[@]}"; do
    if [ "${AGENTS[$i]}" = "$agent" ]; then
      idx="$i"
      break
    fi
  done

  if [ "$idx" -lt 0 ]; then
    return 1
  fi

  local branch="${BRANCHES[$idx]}"
  local wt="$ROOT_DIR/${WORKTREES[$idx]}"
  local role_file="${ROLE_FILES[$idx]}"
  local log_file="$LOG_DIR/${agent}-retry-${retry}.log"

  local prompt
  prompt="$(build_prompt "$agent" "$branch" "$role_file")

Previous run failed. Debug and fix issues, then commit."

  (
    cd "$wt"
    run_codex "$CODEX_MODE" "$prompt"
  ) >"$log_file" 2>&1
}

if [ "${#FAIL_AGENTS[@]}" -gt 0 ]; then
  echo "[Supervisor] Agent failures detected: ${FAIL_AGENTS[*]}"
  for retry in $(seq 1 "$MAX_RETRIES"); do
    [ "${#FAIL_AGENTS[@]}" -eq 0 ] && break

    NEXT_FAIL=()
    for agent in "${FAIL_AGENTS[@]}"; do
      echo "[Supervisor] Retry $retry for $agent"
      if ! retry_agent "$agent" "$retry"; then
        NEXT_FAIL+=("$agent")
      fi
    done
    FAIL_AGENTS=("${NEXT_FAIL[@]}")
  done
fi

if [ "${#FAIL_AGENTS[@]}" -gt 0 ]; then
  echo "[Supervisor] Unresolved agent failures: ${FAIL_AGENTS[*]}"
  echo "- Status: failed (agent execution)" >> "$SUMMARY_FILE"
  exit 1
fi

echo "[Supervisor] Running validation..."
if ! (cd "$ROOT_DIR" && bash scripts/validate.sh); then
  echo "[Supervisor] Validation failed. Starting auto-debug loop..."

  for retry in $(seq 1 "$MAX_RETRIES"); do
    fixed=false
    for i in "${!AGENTS[@]}"; do
      agent="${AGENTS[$i]}"
      branch="${BRANCHES[$i]}"
      wt="$ROOT_DIR/${WORKTREES[$i]}"
      role_file="${ROLE_FILES[$i]}"
      log_file="$LOG_DIR/${agent}-autofix-${retry}.log"

      prompt="$(build_prompt "$agent" "$branch" "$role_file")

Validation failed in supervisor gate. Inspect failing tests/build and apply targeted fixes. Commit changes."

      if (
        cd "$wt"
        run_codex "$CODEX_MODE" "$prompt"
      ) >"$log_file" 2>&1; then
        fixed=true
      fi
    done

    if [ "$fixed" = true ] && (cd "$ROOT_DIR" && bash scripts/validate.sh); then
      break
    fi

    if [ "$retry" -eq "$MAX_RETRIES" ]; then
      echo "- Status: failed (validation after retries)" >> "$SUMMARY_FILE"
      exit 1
    fi
  done
fi

echo "[Supervisor] Validation passed. Merging branches..."
cd "$ROOT_DIR"

for branch in "${BRANCHES[@]}"; do
  git fetch --all --prune >/dev/null 2>&1 || true
  git checkout main
  if ! git merge --no-ff "$branch" -m "merge($branch): integrate agent output"; then
    echo "Merge conflict while merging $branch. Attempting automatic resolution..."

    if git checkout --theirs . && git add -A && git commit -m "merge($branch): auto-resolve conflicts using incoming changes"; then
      echo "Auto-resolved conflicts for $branch"
    else
      echo "Unable to auto-resolve conflicts for $branch"
      exit 1
    fi
  fi

done

echo "- Status: success" >> "$SUMMARY_FILE"
echo "- Finished: $(date -u)" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "## Worktree Status" >> "$SUMMARY_FILE"
git worktree list >> "$SUMMARY_FILE"

echo "[Supervisor] Completed successfully."
echo "Summary: $SUMMARY_FILE"
