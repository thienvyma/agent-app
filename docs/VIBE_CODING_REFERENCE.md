# Anthropic Official Best Practices for Claude Code

> Source: https://docs.anthropic.com/en/docs/claude-code/best-practices
> Saved: 2026-03-23

---

## 1. Give Claude a way to verify its work

Highest-leverage action. Provide tests, scripts, screenshots, expected outputs.
Claude performs significantly better when it can self-check.

## 2. Explore first, then plan, then code

```
Explore → "read /src/auth and understand how we handle sessions"
Plan    → "What files need to change? Create a plan"
Code    → "implement from your plan, write tests, fix failures"
Commit  → "commit with descriptive message"
```

## 3. Write an effective CLAUDE.md

- Keep concise — if too long, important rules get lost
- Include: code style, workflow preferences, test commands
- Use @path/to/file references for linking docs
- Hierarchy: ~/.claude/CLAUDE.md (global) → ./CLAUDE.md (project) → child dirs

## 4. Manage context aggressively

- /clear between unrelated tasks
- Auto compaction preserves: code patterns, file states, key decisions
- /compact <instructions> for manual compaction
- /btw for quick questions without filling context

## 5. Course-correct early and often

- Esc: stop mid-action, context preserved
- Esc+Esc or /rewind: restore previous state
- "Undo that": revert changes

## 6. Avoid 5 common failure patterns

| Pattern | Fix |
|---|---|
| Kitchen sink session (mixing unrelated tasks) | /clear between tasks |
| Correcting over and over (2+ failed fixes) | /clear + better initial prompt |
| Over-specified CLAUDE.md (too long) | Prune ruthlessly |
| Trust-then-verify gap (no edge case testing) | Always provide verification |
| Infinite exploration (reads too many files) | Scope narrowly + use subagents |

## 7. Use subagents for investigation

```
"use subagents to investigate how our auth handles token refresh"
"use a subagent to review this code for edge cases"
```

## 8. Resume conversations

```
claude --continue    # Resume most recent
claude --resume      # Select from recent
/rename "feature-name"
```

---

## obra/superpowers Skills (Installed at .superpowers/)

14 skills available:
1. brainstorming — Socratic design refinement
2. dispatching-parallel-agents — Concurrent subagent workflows
3. executing-plans — Batch execution with checkpoints
4. finishing-a-development-branch — Merge/PR decision workflow
5. receiving-code-review — Responding to feedback
6. requesting-code-review — Pre-review checklist
7. subagent-driven-development — Fast iteration with two-stage review
8. systematic-debugging — 4-phase root cause process
9. test-driven-development — RED-GREEN-REFACTOR cycle
10. using-git-worktrees — Parallel development branches
11. using-superpowers — Introduction to skills system
12. verification-before-completion — Evidence before claims
13. writing-plans — Detailed implementation plans
14. writing-skills — Create new skills

**Key Iron Laws:**
- TDD: "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"
- Verification: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"
- Debugging: "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"
