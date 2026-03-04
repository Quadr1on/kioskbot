# Documentation Engine: System Design

This document is auto-updated by the Documentation Agent.

## Core Components

- `scripts/orchestrator.sh`: dispatch + retry + merge automation.
- `scripts/validate.sh`: quality/security gate.
- `AGENTS.md`: role boundaries and constraints.
- `worktrees/*`: persistent execution sandboxes.

## Lifecycle

1. Parse feature spec.
2. Generate role-specific tasks.
3. Execute role workflows in parallel.
4. Validate all outputs.
5. Retry failures (bounded).
6. Merge successful branches into `main`.
