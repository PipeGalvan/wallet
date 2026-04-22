# Skill Registry — wallet

**Generated**: 2026-04-17
**Project**: wallet (financial management platform)

---

## User Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| `branch-pr` | Creating a PR, preparing changes for review | PR creation workflow following issue-first enforcement |
| `go-testing` | Writing Go tests, using teatest, adding test coverage | Go testing patterns including Bubbletea TUI testing |
| `issue-creation` | Creating a GitHub issue, reporting a bug, requesting a feature | Issue creation workflow following issue-first enforcement |
| `judgment-day` | "judgment day", "review adversarial", "dual review" | Parallel adversarial review protocol with two blind judges |
| `skill-creator` | Creating new AI skills, adding agent instructions | Creates new AI agent skills following the Agent Skills spec |

## Project Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| `openspec-propose` | Propose a new change, describe what to build | One-step proposal with design, specs, and tasks |
| `openspec-explore` | Think through something, investigate problems, clarify requirements | Explore mode — thinking partner before committing to a change |
| `openspec-apply-change` | Start implementing, continue implementation, work through tasks | Implement tasks from an OpenSpec change |
| `openspec-archive-change` | Finalize and archive a change after implementation | Archive a completed change in the OpenSpec workflow |

## Project Conventions
# test
| File | Purpose |
|------|---------|
| `ARQUITECTURA.md` | Full architecture documentation: DB schema, API design, folder structure, security model |
| `README.md` | Project overview, stack summary, quick start, API reference, deployment guide |

## Notes

- No `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, or `copilot-instructions.md` found in project root.
- SDD workflow skills (`sdd-*`) are excluded from this registry per convention.
- `skill-registry` skill is excluded from this registry per convention (meta-skill).
- Project uses OpenSpec variant skills (project-level `.opencode/skills/`) alongside user-level SDD skills.
