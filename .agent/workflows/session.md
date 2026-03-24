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
6. Read `docs/INDEX.md` to check if extra docs are needed (openclaw-integration.md, MEMORY_RESEARCH.md, etc.)
7. Present your plan to the user: list files to create (max 6), tests, CLI commands
8. **CROSS-CHECK plan against phase README spec**: every item in README must appear in your plan
9. Wait for user confirmation before writing any code

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

## ⭐ SPEC VERIFICATION (NEW — prevents missed items)

Before closing a session, MUST do **line-by-line comparison**:

1. Open `docs/phases/phase-XX/README.md` (the spec)
2. For EVERY item listed in the spec, check:
   - [ ] File exists on disk?
   - [ ] File has the specified content/interfaces?
   - [ ] Dependencies mentioned in spec are installed?
   - [ ] Config files mentioned in spec exist?
   - [ ] Tests mentioned in spec pass?
   - [ ] CLI commands mentioned in spec work?
3. For EVERY "Kiem tra" item in the spec:
   - [ ] Actually ran the check?
   - [ ] Evidence captured (output)?
4. **If anything in spec is NOT done → do it BEFORE closing session**
5. Update the phase README `Verification Checklist` section (mark items [x])

## ⭐ DOC CONSISTENCY CHECK (NEW — prevents stale references)

If a decision changed during the session (e.g., chose tool B instead of tool A):

1. Search ALL docs for references to the old decision
2. Update EVERY reference to reflect the new decision
3. Add decision to `DECISIONS.md`
4. Verify: `grep -r "old_term" *.md docs/*.md` returns empty

## Ending a Session

1. **Run SPEC VERIFICATION (above)**
2. **Run DOC CONSISTENCY CHECK (above)**
3. Update `PROGRESS.md` (session log, bugs, next steps)
4. Update `architecture_state.json` (module status, current_session, known_issues)
5. Final commit: `git add -A && git commit -m "docs: update progress session N"`
