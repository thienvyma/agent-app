# Phase 71: Tool Execution — Sync Permissions + Parse Tool Calls

> **Session**: S71
> **Depends on**: Phase 67 (per-agent sessions)
> **Priority**: 🟡 Medium

---

## Cross-Check: App Tools ≠ OpenClaw Built-in Tools

### Hiện tại
```typescript
// tool-registry.ts — app-level custom tools
registerTool(tool: ToolDefinition)     // in-memory Map
executeTool(agentId, toolName, input)  // check permission → run handler → audit
// ❌ KHÔNG sync với OpenClaw per-agent tools config
// ❌ KHÔNG parse tool_calls từ chat response
```

### OpenClaw cung cấp
```json
// Per-agent tool config trong openclaw.json
{
  "agents": {
    "list": [{
      "id": "finance",
      "tools": {
        "allow": ["read", "web_search"],      // whitelist
        "deny": ["exec", "write", "edit"]      // blacklist
      }
    }]
  }
}
```
```
26+ built-in tools: web_search, web_fetch, exec, read, write, edit, 
apply_patch, browser, image, image_generate, message, sessions_spawn, 
sessions_list, sessions_history, sessions_send, agents_list, cron, 
canvas, nodes, gateway, process
```

## Enhancement Plan

### ToolRegistry → Sync permissions to OpenClaw + Parse tool_calls
| Hiện tại | Enhance |
|----------|---------|
| `registerTool()` → in-memory Map | ✅ Giữ cho app tools + **trigger** sync to OpenClaw |
| `executeTool()` → local handler | ✅ Giữ cho app tools — OpenClaw tools chạy native |
| ❌ Không sync | **Thêm** `syncPermissionsToOpenClaw(agentId)` → write `tools.allow/deny` |
| ❌ Không parse | **Thêm** `parseToolCalls(response)` → extract tool_calls from chat |
| ❌ Không audit OpenClaw | **Thêm**: log OpenClaw tool_calls vào Prisma AuditLog |

### Mapping: DB ToolPermission → OpenClaw tools.allow/deny
```typescript
// Ví dụ: Finance agent
// DB ToolPermission rows:
//   { agentId: "finance", toolName: "web_search" }    → allow
//   { agentId: "finance", toolName: "read" }           → allow
// Agent config → tools.deny: ["exec", "write", "edit"] (all not in allow)

async syncPermissionsToOpenClaw(agentId: string): Promise<void> {
  const permissions = await this.db.toolPermission.findMany({ where: { agentId } });
  const allowed = permissions.map(p => p.toolName);
  // Update OpenClaw agent config với tools.allow = allowed
  await updateAgentConfig(agentId, { tools: { allow: allowed } });
}
```

## Files Cần Sửa (≤4)

### 1. `tests/tools/tool-sync.test.ts` (NEW)
- Test: syncPermissionsToOpenClaw generates correct allow/deny
- Test: parseToolCalls extracts tool usage from response
- Test: tool calls logged to AuditLog

### 2. `src/core/tools/tool-registry.ts` (MODIFY)
- Add `syncPermissionsToOpenClaw(agentId)` → generate config
- Add `parseToolCalls(response)` → extract from OpenAI format
- Add `logToolCalls(agentId, toolCalls)` → Prisma audit

### 3. `src/core/adapter/openclaw-adapter.ts` (MODIFY)
- `sendMessage()` → parse `tool_calls` from response.choices[0].message
- Log tool calls via `toolRegistry.logToolCalls()`

### 4. `src/lib/openclaw-config.ts` (NEW)
- `updateAgentConfig(agentId, config)` → read/write openclaw.json
- Safely merge per-agent config without affecting others

## Verification
```
□ ToolRegistry existing 6 tests unchanged
□ syncPermissionsToOpenClaw generates valid config
□ Chat response with tool_calls → parsed + logged
□ AuditLog shows OpenClaw tool usage
```
