# Phase 31: Database Schema & Prisma (S31)

> Tao schema THAT cho toan bo models da build -> PostgreSQL.

## Map 30 phases → Prisma Models

| Phase | Logic Class | Prisma Model |
|-------|-----------|-------------|
| S5-S6 | CompanyManager, AgentConfig | `Company`, `Department`, `Agent` |
| S7 | Deploy/Undeploy | `AgentSession` |
| S8 | ToolRegistry | `Tool`, `ToolPermission` |
| S9 | TaskDecomposer | `Task`, `SubTask` |
| S10 | ConversationLogger | `Conversation`, `Message` |
| S11 | VectorStore | `Embedding` (pgvector) |
| S12 | KnowledgeBase | `Document`, `KnowledgeEntry` |
| S13-14 | MessageBus, Triggers | `Event`, `Trigger` |
| S15 | ApprovalEngine | `ApprovalRequest` |
| S17-18 | CostTracker, Budget | `CostEntry`, `Budget` |
| S19 | RealtimeHub | `ActivityLog` |
| S20 | TelegramBot | `NotificationLog` |
| S26 | FeedbackLoop | `CorrectionLog` |
| S29 | Scheduling | `ScheduledJob` |
| S30 | Tenant | `Tenant`, `TenantUsage` |

## Files tao moi

### prisma/schema.prisma — FULL schema

```prisma
model Company {
  id          String       @id @default(cuid())
  name        String
  industry    String?
  departments Department[]
  agents      Agent[]
  createdAt   DateTime     @default(now())
}

model Department {
  id        String   @id @default(cuid())
  name      String
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  agents    Agent[]
}

model Agent {
  id           String     @id @default(cuid())
  name         String
  role         String
  status       String     @default("idle")
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  companyId    String
  company      Company    @relation(fields: [companyId], references: [id])
  model        String     @default("qwen2.5:7b")
  systemPrompt String?
  tasks        Task[]
  costEntries  CostEntry[]
  sessions     AgentSession[]
  createdAt    DateTime   @default(now())
}

model AgentSession {
  id         String   @id @default(cuid())
  agentId    String
  agent      Agent    @relation(fields: [agentId], references: [id])
  sessionKey String   @unique
  status     String   @default("active")
  startedAt  DateTime @default(now())
  endedAt    DateTime?
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      String    @default("pending")
  priority    Int       @default(5)
  agentId     String?
  agent       Agent?    @relation(fields: [agentId], references: [id])
  parentId    String?
  subTasks    Task[]    @relation("SubTasks")
  parent      Task?     @relation("SubTasks", fields: [parentId], references: [id])
  approval    ApprovalRequest?
  createdAt   DateTime  @default(now())
  completedAt DateTime?
}

model ApprovalRequest {
  id       String   @id @default(cuid())
  taskId   String   @unique
  task     Task     @relation(fields: [taskId], references: [id])
  status   String   @default("pending")
  reason   String?
  decision String?
  decidedAt DateTime?
  createdAt DateTime @default(now())
}

model CostEntry {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id])
  tokens    Int
  costUsd   Float
  model     String
  createdAt DateTime @default(now())
}

model Budget {
  id           String @id @default(cuid())
  dailyLimit   Float
  warningPct   Int    @default(80)
  currentSpent Float  @default(0)
  date         String
}

model Conversation {
  id        String    @id @default(cuid())
  agentId   String
  messages  ChatMessage[]
  createdAt DateTime  @default(now())
}

model ChatMessage {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  role           String
  content        String
  tokens         Int?
  createdAt      DateTime     @default(now())
}

model CorrectionLog {
  id          String   @id @default(cuid())
  agentId     String
  original    String
  corrected   String
  rule        String
  keywords    String[]
  createdAt   DateTime @default(now())
}

model Trigger {
  id         String   @id @default(cuid())
  name       String
  type       String
  config     Json
  enabled    Boolean  @default(true)
  createdAt  DateTime @default(now())
}

model ActivityLog {
  id        String   @id @default(cuid())
  event     String
  data      Json?
  source    String?
  createdAt DateTime @default(now())
}

model ScheduledJob {
  id             String   @id @default(cuid())
  name           String
  cronExpression String
  agentId        String
  taskTemplate   String
  enabled        Boolean  @default(true)
  lastRun        DateTime?
  createdAt      DateTime @default(now())
}

model Tenant {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  plan            String   @default("trial")
  maxAgents       Int      @default(2)
  maxTokensPerDay Int      @default(10000)
  status          String   @default("trial")
  createdAt       DateTime @default(now())
}
```

### seed.ts — Sample data
- 1 Company "OpenClaw Corp"
- 3 Departments (Executive, Marketing, Finance)
- 4 Agents (CEO, Marketing, Finance, Developer)
- 5 Sample tasks
- 1 Budget entry

## Kiem tra
- `npx prisma migrate dev` → schema created
- `npx prisma db seed` → sample data inserted
- `npx prisma studio` → GUI to view data
