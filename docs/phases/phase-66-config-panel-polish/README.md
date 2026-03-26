# Phase 66: Config Panel + CLI Additions + Final Polish

> **Session 66** | 3 files | TDD + Extract + CLI
> **Phụ thuộc**: Phase 65 (gateway + models panels done)

---

## Bối Cảnh

### Config Panel hiện có (Settings page lines 388-446):
- ✅ Get/Set any config path (raw text input)
- ✅ Result display (pre-formatted)
- ❌ THIẾU: Common configs quick-access (gateway.port, model, provider)
- ❌ THIẾU: Config tree view (thay raw text)

### `openclaw-cli.ts` hiện có (201 dòng, 13 functions):
- ❌ THIẾU: `gatewayLogs()` — cho logs viewer (Phase 65)
- ❌ THIẾU: `channelsStatus()` — cho gateway panel
- ❌ THIẾU: `agentChat()` — cho test model
- ❌ THIẾU: `agentsList()` — cho agent management

## Files (3)

### 1. [NEW] `src/components/settings/config-panel.tsx`
Extract từ Settings page lines 388-446 + thêm:
- **Common configs**: quick-access buttons:
  - `gateway.port` → editable input
  - `gateway.auth.token` → masked display
  - `agents.defaults.model.primary` → editable
  - Provider list → expandable cards
- **Inline validate**: real-time khi edit

### 2. [MODIFY] `src/lib/openclaw-cli.ts`
Thêm 4 functions:
```typescript
// Gateway logs (for logs viewer)
export async function gatewayLogs(lines?: number): Promise<CliResult>
  → execOpenClaw(["logs", "--lines", String(lines ?? 50)])

// Channels status (for gateway panel)
export async function channelsStatus(): Promise<CliResult>
  → execOpenClaw(["channels", "status", "--probe", "--json"])

// Agent chat (for test model)
export async function agentChat(agentId: string, message: string): Promise<CliResult>
  → execOpenClaw(["agent", "--agent", agentId, "--message", message], 60_000)

// Agents list (for agent management)
export async function agentsList(): Promise<CliResult>
  → execOpenClaw(["agents", "list", "--json"])
```

### 3. [MODIFY] `src/app/(dashboard)/settings/openclaw/page.tsx`
- Import `ConfigPanel`, `GatewayPanel`, `ModelsPanel` (from phases 65-66)
- Replace inline panel JSX với imported components
- Final cleanup: remove dead code, update comments
- Giữ nguyên: System Info panel, Provider Auth panel, Action Log (đã đầy đủ)

## Kiểm Tra
- [ ] Config panel: common configs load/save đúng
- [ ] New CLI functions: `gatewayLogs`, `channelsStatus`, `agentChat`, `agentsList`
- [ ] Settings page renders clean (all panels = components)
- [ ] Full test suite: `npx jest` → 0 failures
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] PROGRESS.md + architecture_state.json updated
