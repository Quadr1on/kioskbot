# Autonomous Multi-Agent Build System

This repository is configured as an autonomous, parallel build system using Git worktrees. A single Supervisor coordinates specialized agents that each operate in isolated branches and filesystem worktrees.

## Architecture Overview

- `main` is the integration branch.
- Each agent has a long-lived branch and a dedicated worktree under `worktrees/`.
- The Supervisor decomposes feature specs, dispatches role-specific instructions, validates results, and merges successful work.
- Validation is centralized in `scripts/validate.sh` and is required before merge.

## Agent Branch Model

- Backend Agent: `agent-backend` in `worktrees/backend`
- Frontend Agent: `agent-frontend` in `worktrees/frontend`
- DevOps Agent: `agent-devops` in `worktrees/devops`
- Documentation Agent: `agent-docs` in `worktrees/docs`
- Testing Agent: `agent-testing` in `worktrees/testing`

## Orchestration Flow

1. Run `./scripts/orchestrator.sh "<feature spec>"`
2. Supervisor splits work into backend/frontend/devops/docs/testing tasks.
3. Codex runs in each worktree with role constraints.
4. Supervisor waits for completion and runs `scripts/validate.sh`.
5. On failure, orchestrator performs retry loops for failed agents.
6. On success, branches are merged into `main` sequentially.
7. A summary report is emitted at the end of each run.

## Guardrails

- Agents work only in their own branches and role domains.
- Agents commit all changes before merge.
- Integration only happens from `main` after successful validation.
- Docs in `docs/` are maintained continuously by the Documentation Agent.

## Quick Start

```bash
./scripts/orchestrator.sh "FEATURE_SPEC_HERE"
```
