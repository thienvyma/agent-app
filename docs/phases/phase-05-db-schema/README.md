# Phase 5: Database Schema (S5)

> Tru cot 1: Quan ly Nhan su - Database Foundation
> Moi agent khong chi la mot prompt, ma la mot thuc the co bo ky nang rieng.

---

## Muc tieu

Thiet ke va trien khai Prisma schema cho TOAN BO he thong. Day la nen tang du lieu
cho 21 sessions tiep theo - moi sai sot o day se anh huong cascade.

## Tai sao phase nay quan trong?

Database schema quyet dinh:
- Cau truc cong ty (CEO -> Departments -> Agents)
- Cach agent luu tru SOP, model, tools, skills
- Cach system hoc tu sai lam (CorrectionLog)
- Cach tracking chi phi (lien ket voi CostTracker P18)
- Cach approval workflow hoat dong (ApprovalRequest)

## Files tao moi

### 1. prisma/schema.prisma
9 tables voi relationships:

Company (1) ---> (N) Department ---> (N) Agent ---> (N) Task
                                          |              |
                                          +-> ToolPermission
                                          +-> AuditLog
                                          +-> Message (from/to Agent)
Task ---> ApprovalRequest
Task ---> CorrectionLog (khi owner reject)

Chi tiet fields:

TABLE Company:
  id          String    @id @default(uuid())
  name        String
  description String?
  config      Json      // company-level settings
  createdAt   DateTime
  updatedAt   DateTime
  departments Department[]

TABLE Department:
  id          String    @id @default(uuid())
  name        String
  description String?
  parentId    String?   // for nested departments
  parent      Department? @relation("DeptHierarchy")
  children    Department[] @relation("DeptHierarchy")
  companyId   String
  company     Company   @relation
  agents      Agent[]

TABLE Agent:
  id          String    @id @default(uuid())
  name        String    // "Marketing Manager"
  role        String    // "marketing", "finance", "ceo"
  sop         String    @db.Text  // Standard Operating Procedure (markdown)
  model       String    // "qwen2.5:7b", "llama3.1:8b"
  tools       String[]  // ["facebook_api", "google_sheets"]
  skills      String[]  // ["content_writing", "data_analysis"]
  status      AgentStatus @default(IDLE)
  isAlwaysOn  Boolean   @default(false) // true for CEO
  cronSchedule String?  // "*/5 * * * *" for CEO polling
  departmentId String
  department   Department @relation
  tasks        Task[]
  toolPermissions ToolPermission[]
  auditLogs    AuditLog[]
  sentMessages Message[] @relation("MessageFrom")
  receivedMessages Message[] @relation("MessageTo")

ENUM AgentStatus:
  IDLE
  RUNNING
  ERROR
  DEPLOYING
  PAUSED_BUDGET

TABLE Task:
  id          String    @id @default(uuid())
  description String    @db.Text
  status      TaskStatus @default(PENDING)
  priority    Int       @default(5) // 1-10
  parentTaskId String?  // for decomposed sub-tasks
  parentTask   Task?    @relation("TaskDecomposition")
  subTasks     Task[]   @relation("TaskDecomposition")
  assignedToId String?
  assignedTo   Agent?   @relation
  result       String?  @db.Text
  errorLog     String?  @db.Text
  retryCount   Int      @default(0)
  tokenUsage   Int      @default(0)
  createdAt    DateTime
  completedAt  DateTime?
  approvalRequest ApprovalRequest?
  correctionLog   CorrectionLog?

ENUM TaskStatus:
  PENDING
  IN_PROGRESS
  WAITING_APPROVAL
  APPROVED
  REJECTED
  COMPLETED
  FAILED

TABLE Message:
  id          String    @id @default(uuid())
  fromAgentId String
  fromAgent   Agent     @relation("MessageFrom")
  toAgentId   String
  toAgent     Agent     @relation("MessageTo")
  content     String    @db.Text
  type        MessageType
  metadata    Json?
  createdAt   DateTime

ENUM MessageType:
  DELEGATE    // CEO -> Agent: "Lam viec nay"
  REPORT      // Agent -> CEO: "Da hoan thanh"
  CHAIN       // Agent A -> Agent B: "Tiep tuc flow"
  GROUP       // Broadcast to multiple
  ALERT       // System alert
  ESCALATION  // Error escalation

TABLE CorrectionLog:
  id          String    @id @default(uuid())
  taskId      String    @unique
  task        Task      @relation
  agentId     String
  context     String    @db.Text  // what was the situation
  wrongOutput String    @db.Text  // what agent produced
  correction  String    @db.Text  // what owner corrected to
  ruleExtracted String  @db.Text  // rule derived from correction
  vectorId    String?   // ID in pgvector after embedding
  createdAt   DateTime

TABLE AuditLog:
  id          String    @id @default(uuid())
  agentId     String
  agent       Agent     @relation
  action      String    // "DEPLOY", "SEND_MESSAGE", "USE_TOOL", "COMPLETE_TASK"
  details     Json
  timestamp   DateTime  @default(now())

TABLE ToolPermission:
  id          String    @id @default(uuid())
  agentId     String
  agent       Agent     @relation
  toolName    String    // "facebook_api", "google_sheets"
  granted     Boolean   @default(true)
  grantedBy   String    // "system" or owner
  createdAt   DateTime

  @@unique([agentId, toolName])

TABLE ApprovalRequest:
  id          String    @id @default(uuid())
  taskId      String    @unique
  task        Task      @relation
  status      ApprovalStatus @default(PENDING)
  policy      String    // which policy triggered this
  reason      String    // why approval needed
  ownerResponse String? // owner's feedback
  telegramMsgId String? // for inline keyboard tracking
  createdAt   DateTime
  resolvedAt  DateTime?

ENUM ApprovalStatus:
  PENDING
  APPROVED
  REJECTED
  MODIFIED

### 2. prisma/seed.ts
Seed data voi 1 company mau:
- Company: "My Enterprise"
- Departments: Executive, Marketing, Finance
- Agents: CEO (always-on), Marketing Manager, Finance Analyst
- Sample tools + permissions

### 3. src/lib/prisma.ts
Prisma client singleton (avoid multiple instances in dev mode).

## Dependencies (phai co truoc)
- PostgreSQL running (docker compose up tu S1)
- Prisma installed (npm install tu S1)

## Kiem tra (Verification)
1. npx prisma migrate dev --name init -> migration thanh cong
2. npx prisma studio -> xem tables trong browser
3. npx prisma db seed -> seed data OK
4. Query test: prisma.company.findFirst({ include: { departments: { include: { agents: true }}}})

## Edge Cases can xu ly
- parentTaskId self-reference (task decomposition)
- Department hierarchy (parentId self-reference)
- Agent cascade delete (khi xoa department)
- Unique constraint [agentId, toolName] cho ToolPermission

## CLI (bo sung vao ae)
Chua co CLI moi o phase nay - schema only.

## Lien quan
- PRD: F1 Company Structure, F5 Memory (CorrectionLog), F11 Audit
- Decisions: D7 Tech Stack (PostgreSQL + Prisma), D12 Memory 3-Tier
- Phases phu thuoc: Phase 6 (Company CRUD), Phase 8 (AuditLogger), Phase 15 (Approval), Phase 26 (Self-Learning)
