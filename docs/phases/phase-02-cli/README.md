# Phase 2: CLI Environment (S2)

> CLI la ban phim cho ca nguoi va AI agent
> Agent noi bo tu goi CLI de self-manage

---

## Muc tieu
Xay khung ae CLI bang CLI-Anything + Commander.js. Moi output la JSON.
Agent noi bo dung CLI de: deploy agents, query status, assign tasks, search memory.

## Tai sao CLI quan trong?

1. Agent self-management: CEO agent goi ae task assign de giao viec
2. Scripting: cron jobs goi ae report de tao bao cao tu dong
3. Debugging: developer test tung function qua CLI
4. Automation: CI/CD pipeline goi ae test de verify

## Files tao moi

### 1. src/cli/index.ts
Commander.js entry point:
  program.name("ae").version("0.1.0").description("Agentic Enterprise CLI")
  program.addCommand(statusCommand)
  // Moi phase sau se addCommand() them nhieu commands
  program.parse()

### 2. src/cli/commands/status.ts
  ae status -> {
    version: "0.1.0",
    agents: { total: 0, active: 0, idle: 0, error: 0 },
    tasks: { total: 0, pending: 0, running: 0, completed: 0 },
    services: { postgresql: "connected", redis: "connected", openclaw: "unknown", ollama: "unknown" },
    uptime: "2h 30m"
  }

### 3. src/cli/utils/output.ts
  formatJSON(data: any): string -> JSON.stringify(data, null, 2)
  formatTable(headers: string[], rows: string[][]): string -> ASCII table
  formatSuccess(message: string): string -> green checkmark
  formatError(message: string): string -> red X

## Commands roadmap (bo sung moi phase):
  Phase 2: ae status, ae --help
  Phase 6: ae company create/info, ae agent create/list
  Phase 7: ae agent deploy/undeploy/status/restart
  Phase 8: ae tool list/grant, ae audit search
  Phase 9: ae task assign/list/status
  Phase 10: ae memory status
  Phase 11: ae memory ingest
  Phase 12: ae memory search/list
  Phase 13: ae message send
  Phase 14: ae trigger list/add
  Phase 15: ae approve list/accept/reject
  Phase 18: ae cost report/budget

## Kiem tra
1. ae status -> valid JSON output
2. ae --help -> lists all available groups
3. ae status --format table -> ASCII table format
4. npx ts-node src/cli/index.ts status -> works from source
5. Tests: parse JSON output -> validated schema

## Dependencies: Phase 1 (npm setup, PostgreSQL + Redis running)

## Lien quan PRD: F9 CLI, D11 CLI-Anything + custom ae commands
