# Documentation Engine: Architecture

This document is auto-updated by the Documentation Agent.

## System Topology

```mermaid
flowchart TD
    U[Feature Spec Input] --> S[Supervisor]
    S --> B[Backend Agent]
    S --> F[Frontend Agent]
    S --> D[DevOps Agent]
    S --> G[Documentation Agent]
    S --> T[Testing Agent]

    B --> V[Validation Pipeline]
    F --> V
    D --> V
    G --> V
    T --> V

    V --> M[Sequential Merge to main]
```

## Principles

- Isolated worktrees per agent.
- Explicit task contracts.
- Required validation gate before merge.
- Deterministic integration order.
