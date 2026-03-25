# Phase 30: Multi-Tenant (S30)

> 1 instance phuc vu NHIEU cong ty doc lap.
> Moi company co agents rieng, data rieng, budget rieng.

---

## Muc tieu
1. Tenant isolation: data + agents + budget tach biet
2. Tenant onboarding: tu dang ky, setup cong ty
3. Shared infrastructure: 1 Ollama, 1 PostgreSQL, nhieu schemas
4. Per-tenant billing: theo doi chi phi rieng tung tenant

## Architecture

```
+----------------------------------------------------------+
|                    SHARED INFRASTRUCTURE                  |
+----------------------------------------------------------+
|                                                          |
|   PostgreSQL (1 instance)                                |
|   ├── tenant_001 schema ──┐                              |
|   ├── tenant_002 schema ──┤  Data isolation              |
|   └── tenant_003 schema ──┘                              |
|                                                          |
|   Redis (1 instance)                                     |
|   ├── tenant_001:* keys ──┐                              |
|   ├── tenant_002:* keys ──┤  Key prefix isolation        |
|   └── tenant_003:* keys ──┘                              |
|                                                          |
|   Ollama (shared)         ── Models shared across tenants|
|   OpenClaw (shared)       ── Sessions isolated by key    |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|   ┌──────────┐  ┌──────────┐  ┌──────────┐             |
|   │ Tenant A │  │ Tenant B │  │ Tenant C │             |
|   │ Company  │  │ Company  │  │ Company  │             |
|   │ 3 agents │  │ 5 agents │  │ 2 agents │             |
|   │ Budget:  │  │ Budget:  │  │ Budget:  │             |
|   │ 500k/day │  │ 1M/day   │  │ 200k/day │             |
|   └──────────┘  └──────────┘  └──────────┘             |
|                                                          |
+----------------------------------------------------------+
```

## Files tao moi

### 1. src/core/tenant/tenant-manager.ts

```
class TenantManager:
  - constructor(db: PrismaClient)
  - async createTenant(data: CreateTenantInput): Tenant
  - async getTenant(tenantId: string): Tenant | null
  - async listTenants(): Tenant[]
  - async updateTenant(id: string, data: Partial<Tenant>): Tenant
  - async deleteTenant(id: string): void
  - async getTenantByDomain(domain: string): Tenant
  - async getTenantStats(id: string): TenantStats

interface Tenant:
  id: string
  name: string
  slug: string               # URL-friendly identifier
  domain?: string            # Custom domain
  plan: "free" | "starter" | "business" | "enterprise"
  maxAgents: number          # Gioi han agents
  maxTokensPerDay: number    # Gioi han tokens/ngay
  status: "active" | "suspended" | "trial"
  createdAt: Date
  expiresAt?: Date

interface TenantStats:
  agentsTotal: number
  agentsRunning: number
  tasksToday: number
  tokensToday: number
  costToday: number
  storageUsedMB: number
```

### 2. src/core/tenant/tenant-context.ts

```
class TenantContext:
  - static current(): TenantContext    # Get current tenant (from middleware)
  - tenantId: string
  - dbSchema: string
  - redisPrefix: string
  - getDb(): PrismaClient             # Scoped to tenant schema
  - getRedis(): RedisClient           # Scoped to tenant prefix
  - getCostTracker(): CostTracker     # Tenant-scoped
  - getBudgetManager(): BudgetManager # Tenant-scoped

// Middleware
function tenantMiddleware(req, res, next):
  1. Extract tenantId from:
     - Header: X-Tenant-ID
     - Subdomain: tenant-a.ae.example.com
     - JWT claim: token.tenantId
  2. Validate tenant exists + active
  3. Set TenantContext.current() cho request nay
  4. next()
```

### 3. src/core/tenant/tenant-billing.ts

```
class TenantBilling:
  - constructor(tenantManager, costTracker)
  - async getDailyUsage(tenantId: string, date?: Date): UsageReport
  - async getMonthlyInvoice(tenantId: string, month: string): Invoice
  - async checkQuota(tenantId: string): QuotaStatus
  - async suspendIfExceeded(tenantId: string): boolean

interface UsageReport:
  tenantId: string
  date: string
  totalTokens: number
  totalCostUSD: number
  perAgent: { agentId, tokens, cost }[]
  quota: { used, limit, percentUsed }

interface Invoice:
  tenantId: string
  period: string           # "2026-03"
  totalTokens: number
  totalCostUSD: number
  lineItems: InvoiceItem[]
  status: "draft" | "sent" | "paid"
```

### 4. src/core/tenant/tenant-isolation.ts

```
class TenantIsolation:
  - validateAccess(tenantId: string, resourceId: string): boolean
  - getSchemaName(tenantId: string): string
  - getRedisPrefix(tenantId: string): string
  - migrateSchema(tenantId: string): void    # Chay Prisma migrate cho tenant
  - seedSchema(tenantId: string): void       # Seed data cho tenant moi

// Isolation rules:
// 1. Moi query PHAI co WHERE tenant_id = ?
// 2. Redis keys: "t:{tenantId}:{key}"
// 3. File uploads: /storage/{tenantId}/
// 4. OpenClaw sessions: "{tenantId}_{agentId}"
```

### 5. prisma/schema additions

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  domain    String?  @unique
  plan      String   @default("trial")
  maxAgents Int      @default(3)
  maxTokens Int      @default(50000)
  status    String   @default("trial")
  createdAt DateTime @default(now())
  expiresAt DateTime?

  // Relations
  companies Company[]
  users     User[]
}

// Add tenantId to ALL existing models:
model Company {
  ...existing fields...
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])
}
```

## API moi

```
POST   /api/tenants              # Tao tenant moi
GET    /api/tenants              # List tenants (admin only)
GET    /api/tenants/:id          # Chi tiet tenant
PUT    /api/tenants/:id          # Update tenant
DELETE /api/tenants/:id          # Xoa tenant
GET    /api/tenants/:id/usage    # Usage report
GET    /api/tenants/:id/invoice  # Monthly invoice
```

## CLI moi

```
ae tenant create <name>          # Tao tenant
ae tenant list                   # Danh sach tenants
ae tenant switch <id>            # Chuyen context sang tenant khac
ae tenant usage <id>             # Xem usage
ae tenant suspend <id>           # Tam ngung tenant
ae tenant billing <id>           # Xem hoa don
```

## Plans & Pricing

| Plan | Max Agents | Max Tokens/Day | Features |
|------|-----------|----------------|----------|
| Trial | 2 | 10,000 | Basic, 14 days |
| Free | 3 | 50,000 | Basic |
| Starter | 5 | 200,000 | + Scheduling |
| Business | 15 | 1,000,000 | + Approval + Telegram |
| Enterprise | Unlimited | Unlimited | + Custom domain + SLA |

## Kiem tra
1. Tenant A tao task -> chi agent cua A nhan
2. Tenant B khong the xem data cua A
3. Tenant C vuot quota -> tu dong suspend
4. Monthly invoice tinh dung
5. Custom domain routing
6. Tenant xoa -> cascade delete all data

## Edge Cases
- 2 tenants cung slug -> reject (unique constraint)
- Trial het han -> auto-suspend, thong bao Owner
- Tenant admin forgot password -> recovery qua email
- Database migration -> chay cho TAT CA schemas
- Tenant vuot agent limit -> block deploy, thong bao

## Dependencies: ALL previous phases + Phase 28 (Docker)
## Lien quan: PRD F12 Multi-tenant (future)
