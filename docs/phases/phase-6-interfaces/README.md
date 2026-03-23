# Phase 6: Interfaces — API & Telegram (Sessions 10–11)

> **Status**: ⬜ Not Started
> **Sessions**: S10 (Dashboard API + Cost Management), S11 (Telegram Bot)
> **Phụ thuộc**: Phase 5 hoàn tất

---

## Mục Tiêu

REST API + realtime updates + Telegram bot + cost management.

## Session 10: Dashboard API + Cost Management

**Mục tiêu**: All REST endpoints + token/cost tracking

**API Endpoints**: (same as before — see SESSIONS.md)

**Cost Management** (Gap 7 fix):
```
src/core/cost/cost-tracker.ts           — Track token usage per agent
src/core/cost/budget-manager.ts         — Budget limits + alerts
```

```typescript
class CostTracker {
  async logUsage(agentId: string, tokens: number, cost: number): Promise<void>
  async getDailyUsage(agentId: string): Promise<UsageReport>
  async getTotalUsage(dateRange: DateRange): Promise<UsageReport>
}

class BudgetManager {
  async checkBudget(agentId: string): Promise<BudgetStatus>
  // → UNDER_BUDGET | WARNING | EXCEEDED
  // → EXCEEDED → auto-pause agent + notify owner
}
```

## Session 11: Telegram Bot

**Mục tiêu**: Owner ra lệnh + nhận reports + approve tasks

**Commands**: /status, /agents, /task, /approve, /report, /cost
**Inline Keyboards**: [Duyệt] [Sửa] [Từ chối]
**Auto-notifications**: task complete, approval needed, error alert, daily report, budget warning

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
