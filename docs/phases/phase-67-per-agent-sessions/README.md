# Phase 67: Per-Agent Sessions — OpenClaw Deep Integration

> **Session**: S67
> **Depends on**: S66 (Config+Polish)
> **Blocks**: Phase 68-73 (tất cả phụ thuộc)
> **Priority**: 🔴 Critical

---

## Mục Tiêu

Chuyển `OpenClawAdapter` từ **in-memory Map + shared `/v1/chat/completions`** sang dùng **OpenClaw native multi-agent** — mỗi app agent (CEO, Developer, Finance, Marketing) = 1 OpenClaw agent riêng với session, workspace, và system prompt riêng.

## Thiết Kế

### Hiện tại (SAI)
```
App → OpenClawAdapter → POST /v1/chat/completions (shared main session)
                       → In-memory Map tracks agents
```

### Sau Phase này (ĐÚNG)
```
App → OpenClawAdapter → openclaw agents add <id>
                       → POST /v1/chat/completions?session=agent:<id>:main
                       → openclaw agents delete <id>
                       → openclaw sessions --agent <id> --json
```

### OpenClaw Agent Mapping
| App Agent | OpenClaw Agent ID | Session Key | Workspace |
|-----------|------------------|-------------|-----------|
| CEO | `ceo` | `agent:ceo:main` | `~/.openclaw/workspace-ceo` |
| Developer | `developer` | `agent:developer:main` | `~/.openclaw/workspace-developer` |
| Finance | `finance` | `agent:finance:main` | `~/.openclaw/workspace-finance` |
| Marketing | `marketing` | `agent:marketing:main` | `~/.openclaw/workspace-marketing` |

## Files Cần Tạo/Sửa (≤6)

### 1. `tests/adapter/openclaw-adapter.test.ts` (MODIFY)
- Thêm tests cho per-agent session routing
- Test: `deploy()` calls `openclaw agents add`
- Test: `sendMessage()` uses session `agent:<id>:main`
- Test: `undeploy()` calls `openclaw agents delete`
- Test: `getStatus()` reads from `openclaw sessions --json`

### 2. `src/lib/openclaw-cli.ts` (MODIFY)
- Add `agentAdd(id: string, workspace?: string): Promise<CliResult>`
- Add `agentDelete(id: string): Promise<CliResult>`
- Add `agentsList(): Promise<CliResult>`
- Add `sessionsList(agentId?: string): Promise<CliResult>`

### 3. `src/core/adapter/openclaw-client.ts` (MODIFY)
- `chatCompletion()` → thêm `sessionKey` param → query `?session=agent:<id>:main`
- Giữ backwards-compatible (sessionKey optional)

### 4. `src/core/adapter/openclaw-adapter.ts` (MODIFY)
- `deploy(config)` → gọi `openclaw agents add <config.id>` via execOpenClaw()
- `sendMessage(agentId, msg)` → session key = `agent:<agentId>:main`
- `undeploy(agentId)` → gọi `openclaw agents delete <agentId>`
- `getStatus(agentId)` → `openclaw sessions --agent <agentId> --json`
- `listAgents()` → `openclaw agents list --json` (fallback in-memory)
- Giữ in-memory Map làm **cache** (không làm source of truth)

### 5. `src/core/adapter/i-agent-engine.ts` (VERIFY — NO CHANGE)
- Interface không đổi — chỉ implementation thay đổi
- Đảm bảo MockAdapter vẫn pass tất cả tests

### 6. `src/core/adapter/adapter-factory.ts` (VERIFY — NO CHANGE)
- Factory tạo OpenClawAdapter giống cũ
- MockAdapter không bị ảnh hưởng

## Tests Cần Viết (TDD — Red → Green)

```typescript
// tests/adapter/openclaw-adapter.test.ts (thêm mới)

// Test: deploy creates OpenClaw agent
test("deploy() calls openclaw agents add", async () => {
  // Mock execOpenClaw
  // Call adapter.deploy(config)
  // Verify execOpenClaw called with ["agents", "add", "ceo"]
});

// Test: sendMessage uses per-agent session
test("sendMessage() routes to agent-specific session", async () => {
  // Mock chatCompletion
  // Call adapter.sendMessage("ceo", "hello")
  // Verify sessionKey = "agent:ceo:main"
});

// Test: undeploy removes OpenClaw agent
test("undeploy() calls openclaw agents delete", async () => {
  // Call adapter.undeploy("ceo")
  // Verify execOpenClaw called with ["agents", "delete", "ceo"]
});

// Test: getStatus reads from OpenClaw sessions
test("getStatus() reads session data from OpenClaw", async () => {
  // Mock sessionsList()
  // Call adapter.getStatus("ceo")
  // Verify token usage from session JSON
});

// Test: MockAdapter still works (regression)
test("MockAdapter passes all existing tests unchanged", async () => {
  // Run existing MockAdapter tests
});
```

## CLI Commands Thêm

```
# Không thêm ae CLI commands — chỉ internal functions
# openclaw-cli.ts internal:
agentAdd(id, workspace?)
agentDelete(id)
agentsList()
sessionsList(agentId?)
```

## Rủi Ro + Giải Pháp

| Rủi ro | Giải pháp |
|--------|-----------|
| `openclaw agents add` fail → deploy thất bại | Fallback: in-memory Map (giống hiện tại) |
| Gateway restart khi add agent | stopGateway → add → startGateway (đã fix) |
| Tests cũ break | MockAdapter KHÔNG thay đổi → regression safe |
| `main` agent có sẵn xung đột | Dùng ID khác (`ceo`, `developer`, ...) không dùng `main` |

## Verification Checklist

```
□ npx jest → 0 failures (tất cả tests cũ + mới pass)
□ npx tsc --noEmit → 0 errors
□ openclaw agents list → shows CEO, Developer, etc.
□ openclaw sessions --all-agents --json → separate sessions
□ Chat qua app → response từ đúng agent session
□ MockAdapter tests unchanged
□ PROGRESS.md updated
□ architecture_state.json updated
```

## Ghi Chú Thảo Luận

- OpenClaw agent workspace cho phép mỗi agent có MEMORY.md riêng → Phase 70 sẽ tận dụng
- Session key format: `agent:<agentId>:main` — `main` là session ID mặc định
- `openclaw agents add` tạo thư mục workspace tự động
