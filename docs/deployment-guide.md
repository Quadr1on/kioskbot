# Documentation Engine: Deployment Guide

This document is auto-updated by the Documentation Agent.

## Prerequisites

- Git with worktree support
- Bash shell
- Node.js and npm
- Codex CLI available as `codex`

## Setup

1. Ensure branches/worktrees exist (`git worktree list`).
2. Install dependencies (`npm ci`).
3. Run orchestration with feature spec.

## Run

```bash
./scripts/orchestrator.sh "FEATURE_SPEC_HERE"
```

## Outputs

- Agent branch commits
- Validation result
- Merge summary report
