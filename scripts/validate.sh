#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

run_step() {
  local name="$1"
  shift
  echo "[validate] $name"
  "$@"
}

run_step "install deps" npm ci
run_step "lint" npm run lint
run_step "build" npm run build

if npm run | grep -q "test:unit"; then
  run_step "unit tests" npm run test:unit
else
  run_step "unit tests" npm run test -- --runInBand
fi

if npm run | grep -q "test:integration"; then
  run_step "integration tests" npm run test:integration
else
  run_step "integration tests" npm run test -- --runInBand
fi

if npm run | grep -q "test:coverage"; then
  run_step "coverage check" npm run test:coverage
else
  run_step "coverage check" npm run test -- --coverage
fi

run_step "security audit" npm audit --audit-level=high

echo "[validate] all checks passed"
