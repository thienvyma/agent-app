# Phase 2: CLI Environment (S2)

> CLI la giao dien chung cho ca nguoi va AI agent
> Agent noi bo tu goi CLI de self-manage (deploy agents, query status, assign tasks)

---

## Muc tieu

Tich hop CLI-Anything de tao khung ae CLI cho toan bo he thong.
Moi output la JSON de agent noi bo tu dung (machine-readable).

## CLI-Anything la gi?

Repo: https://github.com/HKUDS/CLI-Anything (13k+ stars)
- Framework tu dong tao CLI cho bat ky software nao
- Ho tro OpenClaw native (co san SKILL.md)
- 7-phase automated pipeline: Analyze -> Design -> Implement -> Plan Tests -> Write Tests -> Document -> Publish
- Output: Python Click CLI, JSON output, REPL mode, self-describing (--help)
- Install: pip install -e . -> cli tren PATH ngay

### Tai sao chon CLI-Anything?

1. Agent-native: JSON output match LLM format
2. Self-describing: --help flags tu dong documentation
3. REPL mode: interactive shell cho debugging
4. SKILL.md generation: AI tu dong discover CLI qua skill file
5. OpenClaw support: co san SKILL.md file cho OpenClaw
6. Production-grade testing: unit + E2E + CLI subprocess verification

### Cai dat CLI-Anything cho OpenClaw

`ash
# Clone repo
git clone https://github.com/HKUDS/CLI-Anything.git

# Install OpenClaw skill
mkdir -p ~/.openclaw/skills/cli-anything
cp CLI-Anything/openclaw-skill/SKILL.md ~/.openclaw/skills/cli-anything/SKILL.md

# Invoke trong OpenClaw session:
# @cli-anything build a CLI for ./agentic-enterprise
`

### 7-Phase Pipeline (CLI-Anything tu dong chay)

1. Analyze   - Scan source code, map GUI actions to APIs
2. Design    - Architect command groups, state model, output formats
3. Implement - Build Click CLI with REPL, JSON output, undo/redo
4. Plan Tests - Create TEST.md with unit + E2E test plans
5. Write Tests - Implement comprehensive test suite
6. Document  - Update TEST.md with results + README
7. Publish   - Create setup.py, install to PATH

## Cach dung trong du an nay

### Phuong an A: Dung CLI-Anything generate khung ae CLI
`ash
# Cho CLI-Anything analyze du an agentic-enterprise
@cli-anything build a CLI for ./agentic-enterprise

# CLI-Anything se tu dong:
# 1. Analyze src/ folder structure
# 2. Design command groups (agent, task, company, memory, cost...)
# 3. Implement Click CLI voi JSON output
# 4. Generate tests
# 5. Install: pip install -e . -> ae command available
`

### Phuong an B: Tu build ae CLI bang Commander.js (TypeScript native)
`ash
# Neu muon TypeScript thay vi Python:
# src/cli/index.ts - Commander.js entry point
# Uu diem: cung ngon ngu voi du an (TypeScript)
# Nhuoc diem: khong co 7-phase pipeline tu dong cua CLI-Anything
`

### Quyet dinh: chon phuong an nao
- Neu muon toc do + ecosystem CLI-Anything: Phuong an A
- Neu muon TypeScript nhat quan: Phuong an B
- Co the ket hop: CLI-Anything generate khung -> customize trong TypeScript

## Session 2 - Files tao moi

### Phuong an A (CLI-Anything):
- cli_anything/agentic_enterprise/ -> generated CLI package
- cli_anything/agentic_enterprise/cli.py -> Click CLI entry point
- cli_anything/agentic_enterprise/skills/SKILL.md -> AI-discoverable skill
- setup.py -> pip install -e .
- Test: ae status -> JSON, ae --help -> list groups

### Phuong an B (Commander.js):
- src/cli/index.ts -> Commander.js entry point
- src/cli/commands/status.ts -> ae status command
- src/cli/utils/output.ts -> JSON formatter
- Test: ae status -> JSON, ae --help -> list groups

## ae Commands roadmap (bo sung moi phase)

`
Phase 2:  ae status, ae --help
Phase 6:  ae company create/info, ae agent create/list
Phase 7:  ae agent deploy/undeploy/status/restart
Phase 8:  ae tool list/grant, ae audit search
Phase 9:  ae task assign/list/status
Phase 10: ae memory status
Phase 11: ae memory ingest
Phase 12: ae memory search/list
Phase 13: ae message send
Phase 14: ae trigger list/add
Phase 15: ae approve list/accept/reject
Phase 18: ae cost report/budget
`

## ae status output format

`json
{
  "version": "0.1.0",
  "agents": { "total": 0, "active": 0, "idle": 0, "error": 0 },
  "tasks": { "total": 0, "pending": 0, "running": 0, "completed": 0 },
  "services": {
    "postgresql": "connected",
    "redis": "connected",
    "openclaw": "unknown",
    "ollama": "unknown"
  },
  "uptime": "0h 0m"
}
`

## Kiem tra

1. ae status -> valid JSON output (parseable)
2. ae --help -> lists all groups: agent, task, company, memory, cost, trigger, approve
3. ae status --format table -> ASCII table (cho nguoi doc)
4. Test: pipe ae status output -> JSON.parse() -> valid
5. REPL mode (neu CLI-Anything): ae -> interactive shell

## Edge Cases
- CLI-Anything can Python 3.10+, phai verify version
- Windows path issues -> CLI-Anything da fix (cygpath guard)
- ae goi khi services chua chay -> graceful error messages

## Dependencies
- Phase 1: npm/Python setup, PostgreSQL + Redis running
- CLI-Anything repo: https://github.com/HKUDS/CLI-Anything

## Lien quan PRD: F9 CLI, D11 CLI-Anything + custom ae commands
