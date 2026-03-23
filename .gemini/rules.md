Agentic Enterprise — AI Rules (v6) — MUST READ FIRST
Ref: Anthropic best practices + obra/superpowers TDD methodology

=== MANDATORY 6-STEP SESSION WORKFLOW ===
STEP 1 READ: PROGRESS.md → architecture_state.json → RULES.md → SESSIONS.md → docs/phases/phase-XX/README.md → docs/INDEX.md (cross-reference map)
STEP 2 PLAN + APPROVE: List files (max 6), tests, CLI commands → PRESENT to owner → WAIT for confirmation before coding
STEP 3 CODE (TDD per file): Write test (FAIL) → Write code (PASS) → Refactor → Commit per file
STEP 4 CLOSE: UPDATE PROGRESS.md + architecture_state.json → commit "docs: update progress session N"
STEP 5 IF architecture changed: UPDATE ARCHITECTURE.md + DECISIONS.md + affected phase READMEs

=== CORE RULES ===
LOCAL-FIRST: Next.js localhost, $0 cost, Ollama + OpenClaw local
26 PHASES, 27 SESSIONS. Each session <= 4 files. Phase 2 = CLI-Anything foundation
NEVER modify OpenClaw source. Only IAgentEngine → HTTP API (port 18789)
TypeScript strict, <300 lines/file, JSDoc on every function
TDD: test BEFORE code, ALWAYS. No code written before tests (obra/superpowers)
One session = one module. Commit per file, not per session
No `any`, no hardcoded credentials, no silent fail

=== FAIL-FAST (Anthropic) ===
Fix failed 2 times → STOP. Report to owner. Start fresh with different approach
Do NOT dig deeper into a broken approach. git stash → clean state → new strategy

=== PERMISSION TO SAY "UNSURE" ===
AI is ENCOURAGED to say "I'm not sure about X" instead of guessing
Write questions to phase README "Ghi Chu Thao Luan" and ASK owner
Ask first, do right once > guess wrong 3 times

=== ANTI-CONTEXT-LOSS ===
PROGRESS.md = primary memory | architecture_state.json = module map
SESSIONS.md = plan | Phase README = discussion context | DECISIONS.md = rationale
Only read files needed for current session. Progressive disclosure — load on demand
Bug → PROGRESS.md "Loi ton dong" + architecture_state.json known_issues[]
Decision → DECISIONS.md + phase README

=== SUPERPOWERS WORKFLOW ===
Brainstorm → Plan → TDD Execution → Self-Review → Verify → Document
Philosophy: TDD-first, systematic > ad-hoc, YAGNI, evidence > claims
Setup: /install-plugin obra/superpowers (or apply workflow manually)

=== TECH ===
MEMORY 3-tier: OpenClaw MEMORY.md+Mem0 → pgvector (company KB) → Redis (STM)
Commit: <type>(<scope>): <description>
When uncertain: read RULES.md, ARCHITECTURE.md, DECISIONS.md, SESSIONS.md
