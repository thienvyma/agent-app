Agentic Enterprise — AI Rules (v5) — MUST READ FIRST

=== MANDATORY SESSION WORKFLOW ===
BEFORE coding: READ these 5 files IN ORDER:
  1. PROGRESS.md → last session, bugs, next steps
  2. architecture_state.json → module status, known_issues
  3. RULES.md → full rules
  4. SESSIONS.md → current session scope (files, tests, CLI)
  5. docs/phases/phase-XX/README.md → phase details + discussion notes
Then CONFIRM: session number, files to create (max 6), tests, CLI commands.
AFTER coding: UPDATE PROGRESS.md + architecture_state.json + commit "docs: update progress session N"

=== CORE RULES ===
LOCAL-FIRST APP: Next.js localhost, $0 cost, Ollama + OpenClaw local.
20 PHASES, 21 SESSIONS. Each session <= 6 files.
Phase 2 = CLI-Anything foundation. Each phase adds CLI commands to ae framework.
NEVER modify OpenClaw source. Communicate ONLY via IAgentEngine → HTTP API (port 18789).
TypeScript strict mode. Every file < 300 lines. JSDoc on every function.
Test BEFORE feature. Interface BEFORE implementation.
One session = one module. Commit BEFORE ending. No uncommitted code between sessions.
No `any` type. No hardcoded credentials. No silent fail — error handling + logging everywhere.
Do NOT edit files from other modules. Do NOT write features not in current session scope.
Do NOT delete or modify passing tests to "fix" code.

=== ANTI-CONTEXT-LOSS ===
PROGRESS.md = primary memory (AI reads first)
architecture_state.json = module map (what's done, what's not)
SESSIONS.md = plan (what's next)
docs/phases/phase-XX/README.md = discussion context (phase-specific notes)
Bug found → PROGRESS.md "Lỗi tồn đọng" + architecture_state.json known_issues[]
Design decision → DECISIONS.md + phase README "Ghi Chú Thảo Luận"
Architecture change → ARCHITECTURE.md + DECISIONS.md + affected phase READMEs

=== TECH REFERENCE ===
MEMORY: 3-tier — OpenClaw MEMORY.md+Mem0 (per-agent) → pgvector (company KB) → Redis (STM)
Commit format: <type>(<scope>): <description>
When uncertain: read RULES.md, ARCHITECTURE.md, DECISIONS.md, SESSIONS.md
