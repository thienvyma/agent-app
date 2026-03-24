# Phase 2: CLI Environment (S2)

> CLI la giao dien chung cho ca nguoi va AI agent
> Agent noi bo tu goi CLI de self-manage (deploy agents, query status, assign tasks)

---

## Muc tieu

Tao khung ae CLI bang Commander.js (TypeScript) cho toan bo he thong.
Moi output la JSON de agent noi bo tu dung (machine-readable).

## Quyet dinh: Commander.js (TypeScript) — xem DECISIONS.md D14

### Da evaluate CLI-Anything (REJECTED)

Repo: https://github.com/HKUDS/CLI-Anything (13k+ stars)
- Framework tu dong tao CLI wrapper cho phan mem da co (GIMP, Blender, LibreOffice)
- 7-phase automated pipeline: Analyze -> Design -> Implement -> Plan Tests -> Write Tests -> Document -> Publish
- Output: Python Click CLI, JSON output, REPL mode

### Ly do KHONG dung CLI-Anything:
1. **Muc dich khac nhau**: CLI-Anything wrap phan mem da co -> ae CLI la custom business logic
2. **Ngon ngu**: CLI-Anything output Python Click -> du an dung TypeScript
3. **OpenClaw da co CLI**: Khong can wrap lai
4. **Commander.js**: Cung TypeScript, lightweight, da cai san

### Ly do chon Commander.js:
1. Cung ngon ngu TypeScript (nhat quan toan du an)
2. Ecosystem npm, khong can Python dependency
3. `commander` package da cai san tu Session 1
4. Linh hoat viet custom business logic (check services, manage agents...)

## Session 2 - Files da tao (DONE)

| # | File | Lines | Noi dung |
|---|---|---|---|
| 1 | src/cli/index.ts | 106 | Commander.js entry point, 8 command groups |
| 2 | src/cli/commands/status.ts | 121 | TCP port check 4 services |
| 3 | src/cli/utils/output.ts | 68 | JSON + ASCII table formatter |
| T | tests/cli/status.test.ts | 88 | 7 tests (TDD, viet truoc code) |

## ae Commands roadmap (bo sung moi phase)

```
Phase 2:  ae status, ae --help               ← DONE
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
```

## ae status output format

```json
{
  "version": "0.1.0",
  "agents": { "total": 0, "active": 0, "idle": 0, "error": 0 },
  "tasks": { "total": 0, "pending": 0, "running": 0, "completed": 0 },
  "services": {
    "postgresql": "connected",
    "redis": "connected",
    "openclaw": "disconnected",
    "ollama": "disconnected"
  },
  "uptime": "0h 0m"
}
```

## Verification Checklist (POST-SESSION)

```
[x] src/cli/index.ts — Commander.js entry, `ae --help` lists 8 groups
[x] src/cli/commands/status.ts — TCP check, JSON output
[x] src/cli/utils/output.ts — FormattableData, JSON + table formatter
[x] tests/cli/status.test.ts — 7/7 pass
[x] package.json bin field — "ae": "./src/cli/index.ts"
[x] package.json ae script — "ae": "tsx src/cli/index.ts"
[x] ae status -> valid JSON (parseable)
[x] ae --help -> lists groups: agent, task, company, memory, cost, trigger, approve
[x] ae status --format table -> ASCII table
[x] DECISIONS.md D14 — Commander.js vs CLI-Anything documented
[ ] ae status reads ports from .env (fix in progress)
```

## Edge Cases
- ae goi khi services chua chay -> graceful "disconnected" (da handle)
- Port timeout set 2000ms de khong block
- JSON output luon parseable, ke ca khi error

## Dependencies
- Phase 1: npm setup, Docker running

## Lien quan PRD: F9 CLI, D14 Commander.js (thay cho D11 CLI-Anything)
