---
description: How to start and end a coding session for the agentic-enterprise project
---

# Session Workflow

// turbo-all

## Starting a Session

1. Read `PROGRESS.md` to understand what was done in the previous session, any bugs, and next steps
2. Read `architecture_state.json` to check module statuses and known_issues
3. Read `RULES.md` for the full rules
4. Read `SESSIONS.md` to find the current session's scope (files, tests, CLI commands)
5. Read the relevant `docs/phases/phase-XX/README.md` for phase-specific context and discussion notes
6. Present your plan to the user: list files to create (max 6), tests, CLI commands
7. Wait for user confirmation before writing any code

## During a Session (per file)

1. Read `.agent/skills/test-driven-development/SKILL.md` — follow TDD strictly
2. Write a failing test first (RED)
3. Run the test to verify it FAILS
4. Write minimal code to make test PASS (GREEN)
5. Refactor if needed (keep tests passing)
6. Commit the file immediately: `git add <files> && git commit -m "<type>(<scope>): <description>"`
7. Repeat for each file

## When Debugging

1. Read `.agent/skills/systematic-debugging/SKILL.md` — follow 4-phase process
2. NEVER guess-fix. Always find root cause first.
3. If fix fails 2 times → STOP, report to user, start fresh with different approach

## Before Claiming "Done"

1. Read `.agent/skills/verification-before-completion/SKILL.md`
2. Run ALL tests → read output → confirm 0 failures
3. Run CLI commands → confirm they work
4. Only THEN claim completion with evidence

## Ending a Session

1. Update `PROGRESS.md` (session log, bugs, next steps)
2. Update `architecture_state.json` (module status, current_session, known_issues)
3. Final commit: `git add -A && git commit -m "docs: update progress session N"`
