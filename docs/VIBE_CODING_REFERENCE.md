# Anthropic Official Best Practices — Nguyên Gốc

> Source: https://docs.anthropic.com/en/docs/claude-code/best-practices
> Source: https://docs.anthropic.com/en/docs/claude-code/common-workflows
> Saved: 2026-03-23 — Copy nguyên mẫu, không tóm tắt

---

## Best Practices for Claude Code

### 1. Give Claude a way to verify its work

One of the highest-leverage actions is giving Claude a way to verify its own work —
tests, screenshots, or expected outputs. Claude performs significantly better when
it can self-check.

### 2. Explore first, then plan, then code

**Explore:**
```
read /src/auth and understand how we handle sessions and login.
also look at how we manage environment variables for secrets.
```

**Plan:**
```
I want to add Google OAuth. What files need to change?
What's the session flow? Create a plan.
```

**Implement:**
```
implement the OAuth flow from your plan. write tests for the
callback handler, run the test suite and fix any failures.
```

**Commit:**
```
commit with a descriptive message and open a PR
```

### 3. Provide specific context in your prompts

- Reference files with `@` instead of describing where code lives
- Paste images directly — copy/paste or drag and drop
- Give URLs for documentation and API references
- Pipe in data: `cat error.log | claude`
- Let Claude fetch what it needs using Bash commands, MCP, or file reading

### 4. Write an effective CLAUDE.md

```
# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible

# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, not the whole test suite, for performance
```

CLAUDE.md hierarchy:
- `~/.claude/CLAUDE.md` — applies to all Claude sessions (global)
- `./CLAUDE.md` — check into git, share with team (project)
- Parent directories — useful for monorepos
- Child directories — pulled in on demand when working with those files

Use `@path/to/file` references for linking related docs:
```
See @README.md for project overview and @package.json for available npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

### 5. Create skills

Skills are `.claude/skills/` folders with SKILL.md files:
```yaml
---
name: api-conventions
description: REST API design conventions for our services
---
# API Conventions
- Use kebab-case for URL paths
- Use camelCase for JSON properties
- Always include pagination for list endpoints
- Version APIs in the URL path (/v1/, /v2/)
```

Invocation skill example:
```yaml
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---
Analyze and fix the GitHub issue: $ARGUMENTS.
1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message
8. Push and create a PR
```

Usage: `/fix-issue 1234`

### 6. Create custom subagents

Place in `.claude/agents/`:
```yaml
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools: Read, Grep, Glob, Bash
model: opus
---
You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets or credentials in code
- Insecure data handling
Provide specific line references and suggested fixes.
```

### 7. Manage context aggressively

- `/clear` between unrelated tasks
- Auto compaction preserves: code patterns, file states, key decisions
- `/compact <instructions>` for manual compaction focus
- `/btw` for quick questions without filling context
- Customize compaction in CLAUDE.md:
  `"When compacting, always preserve the full list of modified files and any test commands"`

### 8. Course-correct early and often

- `Esc` — stop mid-action, context preserved, redirect
- `Esc + Esc` or `/rewind` — restore previous state
- `"Undo that"` — revert changes
- `/clear` — reset context between unrelated tasks

### 9. Use subagents for investigation

```
Use subagents to investigate how our authentication system
handles token refresh, and whether we have any existing
OAuth utilities I should reuse.
```

```
use a subagent to review this code for edge cases
```

### 10. Rewind with checkpoints

Press Escape or `/rewind` to open rewind menu.
Restore previous conversation and code state.

### 11. Resume conversations

```bash
claude --continue    # Resume most recent conversation
claude --resume      # Select from recent conversations
```

Use `/rename` to name sessions (e.g., "oauth-migration", "debugging-memory-leak").

---

## 5 Common Failure Patterns to Avoid

| Pattern | Description | Fix |
|---|---|---|
| Kitchen sink session | Start one task, ask something unrelated, go back. Context full of irrelevant info. | `/clear` between unrelated tasks |
| Correcting over and over | Claude wrong → correct → still wrong → correct again. Context polluted with failed approaches. | After 2 failed corrections, `/clear` and write better initial prompt |
| Over-specified CLAUDE.md | CLAUDE.md too long → important rules get lost in noise. | Ruthlessly prune. Delete rules Claude follows correctly without them |
| Trust-then-verify gap | Plausible-looking code that doesn't handle edge cases. | Always provide verification. Can't verify? Don't ship. |
| Infinite exploration | "Investigate" without scope → reads hundreds of files. | Scope narrowly or use subagents for exploration |

---

## Common Workflows (Original)

### Fix bugs efficiently

1. Share the error: `"I'm seeing an error when I run npm test"`
2. Ask for recommendations: `"suggest a few ways to fix the @ts-ignore in user.ts"`
3. Apply the fix: `"update user.ts to add the null check you suggested"`
4. Tips: Tell Claude the command to reproduce, mention steps to reproduce, note if intermittent

### Refactor code

1. Identify: `"find deprecated API usage in our codebase"`
2. Recommend: `"suggest how to refactor utils.js to use modern JavaScript features"`
3. Apply safely: `"refactor utils.js to use ES2024 features while maintaining same behavior"`
4. Verify: `"run tests for the refactored code"`
5. Tips: Small testable increments, maintain backward compatibility

### Work with tests

1. Find untested code: `"find functions in NotificationsService that are not covered by tests"`
2. Generate scaffolding: `"add tests for the notification service"`
3. Add edge cases: `"add test cases for edge conditions in the notification service"`
4. Run and fix: `"run the new tests and fix any failures"`

### Create pull requests

1. Summarize: `"summarize the changes I've made to the authentication module"`
2. Create PR: `"create a pr"` (uses `gh pr create`)
3. Refine: `"enhance the PR description with more context about security improvements"`

### Handle documentation

1. Find undocumented: `"find functions without proper JSDoc comments in the auth module"`
2. Generate: `"add JSDoc comments to the undocumented functions in auth.js"`
3. Enhance: `"improve the generated documentation with more context and examples"`
4. Verify: `"check if the documentation follows our project standards"`

---

## obra/superpowers Skills Reference (14 skills installed)

All 14 original SKILL.md files from obra/superpowers are installed at `.agent/skills/`.

### Core Workflow (7 steps):
1. **brainstorming** — Refines rough ideas through questions. Explores alternatives. Presents design in sections for validation. Saves design document.
2. **using-git-worktrees** — Creates isolated workspace on new branch. Runs project setup. Verifies clean test baseline.
3. **writing-plans** — Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.
4. **subagent-driven-development** or **executing-plans** — Dispatches fresh subagent per task with two-stage review (spec compliance, then code quality), or executes in batches with human checkpoints.
5. **test-driven-development** — RED-GREEN-REFACTOR: write failing test, watch fail, write minimal code, watch pass, commit. Deletes code written before tests.
6. **requesting-code-review** — Reviews against plan. Reports issues by severity. Critical issues block progress.
7. **finishing-a-development-branch** — Verifies tests. Presents options (merge/PR/keep/discard). Cleans up worktree.

### Supporting Skills:
- **systematic-debugging** — 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** — Ensure it's actually fixed. Evidence before assertions always.
- **receiving-code-review** — Responding to feedback
- **dispatching-parallel-agents** — Concurrent subagent workflows
- **writing-skills** — Create new skills following best practices (includes testing methodology)
- **using-superpowers** — Introduction to the skills system

### 3 Iron Laws:
```
TDD:          "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"
VERIFICATION: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"
DEBUGGING:    "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"
```

### Superpowers Philosophy:
- **Test-Driven Development** — Write tests first, always
- **Systematic over ad-hoc** — Process over guessing
- **Complexity reduction** — Simplicity as primary goal
- **Evidence over claims** — Verify before declaring success
