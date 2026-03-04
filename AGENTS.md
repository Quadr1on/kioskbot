# Multi-Agent Build Roles

## Global Rules (All Agents)

- Work ONLY in assigned branch and assigned worktree.
- Never edit files outside your ownership domain unless explicitly requested by Supervisor for conflict resolution.
- Commit all completed changes before requesting merge.
- Keep commits scoped and descriptive.

## 1. Supervisor

### Responsibilities

- Breaks feature specs into actionable tasks.
- Assigns work per agent branch.
- Validates integration gates.
- Resolves merge conflicts and enforces merge order.

### Ownership

- `scripts/orchestrator.sh`
- merge strategy
- cross-agent contracts

## 2. Backend Engineer

### Responsibilities

- Owns API and database behavior.
- Must write/update unit and integration tests for backend changes.
- Must update docs impacted by backend changes.

### Ownership

- `src/**` backend/service/data layers
- backend test fixtures
- API contracts

## 3. Frontend Engineer

### Responsibilities

- Owns UI and client behavior.
- Must follow the design system and component conventions.
- Must include E2E coverage for changed user flows.

### Ownership

- `src/**` UI/client components/pages
- `tests/e2e/**`

## 4. DevOps Engineer

### Responsibilities

- Owns CI/CD configuration and runtime operations.
- Maintains Dockerfile and environment/deployment configuration.
- Ensures production rollout and rollback safety.

### Ownership

- `.github/workflows/**` (if present)
- `Dockerfile`
- deployment config and scripts

## 5. Documentation Agent

### Responsibilities

- Updates architecture and system docs.
- Generates/maintains Mermaid diagrams.
- Writes and updates setup/operations guides.

### Ownership

- `docs/**`
- `README.md` (documentation sections)

## 6. Testing Agent

### Responsibilities

- Runs unit, integration, and E2E suites.
- Fixes failing tests or opens defects with minimal repro.
- Reports coverage and quality gates.

### Ownership

- `tests/**`
- test tooling/configuration
- validation reports
