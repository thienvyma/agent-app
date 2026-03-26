# Phase 70: Memory Tier 1 — Read OpenClaw MEMORY.md

> **Session**: S70
> **Depends on**: Phase 67 (per-agent sessions)
> **Priority**: 🟡 Medium

---

## Mục Tiêu

`ContextBuilder.buildContext()` đọc OpenClaw MEMORY.md (Tier 1) bổ sung vào context, kết hợp với pgvector (Tier 2) và Redis (Tier 3).

## Memory File Locations
```
~/.openclaw/agents/<agentId>/agent/MEMORY.md       ← curated facts
~/.openclaw/agents/<agentId>/memory/YYYY-MM-DD.md   ← daily logs (2 ngày gần nhất)
```

## Files Cần Tạo/Sửa (≤3)

### 1. `tests/memory/memory-tier1.test.ts` (NEW)
- Test: readMemory returns MEMORY.md content
- Test: readDailyLogs returns last N days
- Test: graceful degradation when file not found

### 2. `src/lib/openclaw-memory.ts` (NEW)
- `readAgentMemory(agentId: string): Promise<string>`
- `readDailyLogs(agentId: string, days: number): Promise<string>`
- `getAgentDir(agentId: string): string`

### 3. `src/core/memory/context-builder.ts` (MODIFY)
- `buildContext()` → merge: OpenClaw MEMORY.md + pgvector + Redis + corrections

## Verification
```
□ Context includes MEMORY.md content
□ Missing file returns empty string (not error)
□ Tests pass
```
