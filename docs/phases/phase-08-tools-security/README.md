# Phase 8: Tools and Security (S8)

> Tru cot 1: Cong cu chuyen biet (Tool Use)
> Moi nhan vien AI duoc cap quyen truy cap cac API/tools khac nhau

---

## Muc tieu
ToolRegistry (dang ky tools) + ToolPermission (per-agent ACL) + AuditLogger.

## Vi du thuc te
- Agent Marketing duoc cap: facebook_api, tiktok_api, canva_api
- Agent Finance duoc cap: google_sheets, database_vattu, calculator
- Agent CEO duoc cap: ALL (full access)
- Agent moi tao: NONE (phai grant tu tung tool)

## Files tao moi

### 1. src/core/tools/tool-registry.ts
class ToolRegistry:
  - constructor(db: PrismaClient)
  - async registerTool(tool: ToolDefinition): void
    Luu tool definition (name, description, parameters, endpoint)
  - async getTool(name: string): ToolDefinition
  - async listTools(): ToolDefinition[]
  - async executeTool(agentId: string, toolName: string, input: any): ToolResult
    1. Check permission (ToolPermission)
    2. If denied -> throw PermissionDeniedError
    3. Execute tool
    4. Log to AuditLog
    5. Return result

interface ToolDefinition:
  name: string          // "facebook_api"
  description: string   // "Post content to Facebook page"
  parameters: JsonSchema
  endpoint?: string     // API URL if external
  handler?: Function    // local function if internal

### 2. src/core/tools/tool-permission.ts
class ToolPermission:
  - constructor(db: PrismaClient)
  - async grant(agentId: string, toolName: string, grantedBy: string): void
  - async revoke(agentId: string, toolName: string): void
  - async check(agentId: string, toolName: string): boolean
  - async getAgentTools(agentId: string): string[] (list granted tools)
  - async getToolAgents(toolName: string): string[] (list agents with access)

### 3. src/core/tools/audit-logger.ts
class AuditLogger:
  - constructor(db: PrismaClient)
  - async log(entry: AuditEntry): void
    INSERT vao AuditLog table
  - async search(filter: AuditFilter): AuditLog[]
    Filter by: agentId, action, dateRange, toolName
  - async getAgentActivity(agentId: string, limit: number): AuditLog[]

interface AuditEntry:
  agentId: string
  action: "DEPLOY" | "UNDEPLOY" | "SEND_MESSAGE" | "USE_TOOL" | "COMPLETE_TASK" | "ERROR"
  details: { toolName?: string, input?: any, output?: any, error?: string }

## CLI bo sung:
  ae tool list -> table of all registered tools
  ae tool grant <agentId> <toolName> -> grant permission
  ae tool revoke <agentId> <toolName> -> revoke permission
  ae tool check <agentId> <toolName> -> true/false
  ae audit search --agent <id> --action USE_TOOL --from 2024-01-01

## Kiem tra
1. Register tool facebook_api -> listed in ae tool list
2. Grant Marketing agent -> check returns true
3. Finance agent tries facebook_api -> PermissionDeniedError
4. Execute tool -> AuditLog entry created
5. ae audit search -> returns matching entries

## Edge Cases
- Grant tool that doesn't exist -> error
- Revoke already revoked -> idempotent (no error)
- Tool execution timeout -> log error + return failure
- Concurrent tool execution -> audit log ordering

## Dependencies: Phase 5 (ToolPermission + AuditLog tables), Phase 6 (Agent data)
## Lien quan: PRD F1 toolPermissions, F11 Audit, Cong cu chuyen biet
