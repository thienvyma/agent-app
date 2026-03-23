Agentic Enterprise SaaS — AI Rules Summary (v3)

LOCAL-FIRST APP: Next.js on localhost, $0 cost, Ollama + OpenClaw local.
19 PHASES, 20 SESSIONS. Each session <= 6 files for safe vibe coding.
NEVER modify OpenClaw source. Communicate ONLY via IAgentEngine interface → HTTP API (port 18789).
TypeScript strict mode. Every file < 300 lines.
Test BEFORE feature. Interface BEFORE implementation.
One session = one module. Commit BEFORE ending session.
CLI command for every feature — build CLI in parallel with each phase.

DOCUMENT WORKFLOW (MANDATORY):
- START session: READ PROGRESS.md + architecture_state.json + RULES.md
- END session: UPDATE PROGRESS.md + architecture_state.json BEFORE last commit
- Architecture change: UPDATE ARCHITECTURE.md + DECISIONS.md
- Bug found: ADD to PROGRESS.md "Lỗi tồn đọng" + architecture_state.json known_issues

MEMORY: 3-tier — OpenClaw MEMORY.md+Mem0 (per-agent) → pgvector (company KB) → Redis (STM)
No hardcoded credentials. Use environment variables.
Commit format: <type>(<scope>): <description>
When in doubt, read RULES.md, ARCHITECTURE.md, docs/phases/phase-X/README.md
