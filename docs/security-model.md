# Documentation Engine: Security Model

This document is auto-updated by the Documentation Agent.

## Trust Boundaries

- Supervisor controls orchestration and merge operations.
- Agents have branch/worktree isolation.
- Validation gate is mandatory before integration.

## Controls

- Branch-scoped ownership in `AGENTS.md`.
- Non-zero exit behavior on failed validation.
- Sequential merge to reduce conflict surface.
- Security audit included in validation loop.

## Risks and Mitigations

- Risk: cross-domain edits.
  - Mitigation: branch + ownership constraints.
- Risk: flaky validation.
  - Mitigation: bounded retry loop and targeted reruns.
- Risk: unsafe dependency drift.
  - Mitigation: install lockfile + audit checks.
