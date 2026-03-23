# 🔍 Gap Analysis — Plan vs Ý Tưởng Gốc

> Đánh giá chi tiết plan hiện tại so với 4 trụ cột trong ý tưởng ban đầu.

---

## Trụ 1: Quản Lý Nhân Sự (Agent Persona & Role Management)

| Yêu cầu gốc | Plan hiện tại | Status |
|---|---|---|
| UI/database tạo agent với thông tin cụ thể | ✅ Phase 3 (CompanyManager CRUD) + Phase 6 (Dashboard UI) | ✅ Đủ |
| Mỗi agent là thực thể có bộ kỹ năng riêng | ✅ AgentConfig có skills[], tools[], systemPrompt | ✅ Đủ |
| Agent Marketing dùng API Facebook/TikTok | ⚠️ Có "tools" trong config nhưng | 🔴 **THIẾU** |
| Agent Báo giá truy cập DB vật tư/kho hàng | ⚠️ Chưa có khái niệm "tool permissions" | 🔴 **THIẾU** |

### 🔴 Gap 1: Tool Permission System

**Vấn đề**: Plan nói "mỗi agent có tools[]" nhưng KHÔNG chi tiết:
- Cách đăng ký custom tools (API Facebook, DB kho hàng...)
- Phân quyền: agent nào được dùng tool nào
- Cách tools kết nối với external APIs

**Cần bổ sung**:
```
src/core/tools/tool-registry.ts      — Đăng ký custom tools
src/core/tools/tool-permission.ts    — Agent X chỉ được dùng tool Y
src/core/tools/adapters/             — Facebook, DB kho hàng, Google Sheets...
```

---

## Trụ 2: Giao Tiếp Đa Kênh & HITL

| Yêu cầu gốc | Plan hiện tại | Status |
|---|---|---|
| Webhook Gateway nhận tin từ Telegram/Zalo | ✅ Phase 5 (Telegram Bot) | 🟡 Thiếu Zalo |
| Parse nội dung → chuyển đến đúng Agent | ⚠️ Chưa chi tiết routing logic | 🟡 Chưa rõ |
| Approval Workflow [Duyệt/Sửa/Từ chối] | ✅ Phase 4 (ApprovalEngine) + Phase 5 (Telegram inline) | ✅ Đủ |
| Chủ động báo cáo cuối ngày | ✅ Phase 5 (daily report cron) | ✅ Đủ |

### 🟡 Gap 2: Intelligent Message Routing

**Vấn đề**: Khi owner gửi "Lên kế hoạch marketing tháng 4" qua Telegram, hệ thống cần:
1. Hiểu nội dung → phán đoán đó là task cho agent nào
2. Nếu không rõ → hỏi lại owner
3. Nếu task phức tạp → chuyển cho CEO phân tích trước

**Plan hiện tại chưa chi tiết** phần "intelligent routing" này.

### 🟡 Gap 3: Zalo Channel

**Vấn đề**: Zalo rất phổ biến tại VN. Plan chỉ có Telegram.
**Giải pháp**: Thiết kế channel adapter pattern → thêm Zalo sau.

---

## Trụ 3: Trí Nhớ Dài Hạn & Tự Học ← ⚠️ GAP LỚN NHẤT

| Yêu cầu gốc | Plan hiện tại | Status |
|---|---|---|
| Vector Database (Chroma/Qdrant/pgvector) | ❌ **KHÔNG CÓ** trong bất kỳ phase nào | 🔴 **THIẾU** |
| Embed mọi cuộc trò chuyện vào Vector DB | ❌ Không có pipeline | 🔴 **THIẾU** |
| Embed tài liệu công ty | ❌ Không nhắc đến | 🔴 **THIẾU** |
| Embed corrections vào Vector DB | ⚠️ Phase 7 có CorrectionLog nhưng dùng DB thường | 🟡 Chưa đủ |
| Feedback Loop (tự rút rule từ corrections) | ✅ Phase 7 (FeedbackLoop + PromptInjector) | ✅ Đủ |
| Semantic search khi inject context | ⚠️ Phase 7 nói "semantic search" nhưng KHÔNG có Vector DB | 🔴 **THIẾU** |

### 🔴🔴 Gap 4: Memory System — THIẾU NGHIÊM TRỌNG

**Đây là gap lớn nhất.** Ý tưởng gốc nói rõ: *"Mọi cuộc trò chuyện, tài liệu, và corrections đều phải embed vào Vector DB"* — nhưng plan hiện tại:

1. **KHÔNG có Vector DB** — Chưa chọn tech (pgvector? Chroma? Qdrant?)
2. **KHÔNG có Conversation Logger** — Mọi interaction giữa agent↔agent và agent↔owner cần lưu + embed
3. **KHÔNG có Document Ingestion** — Công ty cần knowledge base (tài liệu sản phẩm, bảng giá vật tư, SOP...)
4. **KHÔNG có Shared Knowledge Base** — Agents cần truy cập kiến thức chung
5. **KHÔNG có Memory Pipeline** — Flow: raw data → chunk → embed → store → retrieve

**Memory bị nhét vào Phase 7 (session cuối)** — nhưng thực tế Memory phải có SỚM hơn, ít nhất từ Phase 3-4!

**Đề xuất solution**:
```
Cần bổ sung Memory Module riêng biệt:

src/core/memory/
├── memory-store.ts          — Abstract memory interface
├── vector-store.ts          — pgvector implementation
├── conversation-logger.ts   — Log + embed mọi interaction
├── document-ingester.ts     — Ingest tài liệu công ty
├── knowledge-base.ts        — Shared KB query interface
├── context-builder.ts       — Build context cho agent từ memories
└── embedding-service.ts     — Text → embedding vector

Tech choice đề xuất: pgvector (extension PostgreSQL)
  → Không cần thêm DB mới
  → Tích hợp sẵn với Prisma
  → Semantic search + keyword search cùng DB
```

---

## Trụ 4: Giao Việc Tự Động & Phối Hợp Nhóm

| Yêu cầu gốc | Plan hiện tại | Status |
|---|---|---|
| Internal Pub/Sub (Redis) | ✅ Phase 4 (BullMQ + Redis) | ✅ Đủ |
| Task Decomposition (chia nhỏ việc tự động) | ⚠️ DECISIONS.md đề cập nhưng KHÔNG có module riêng | 🟡 Chưa rõ |
| Event-Driven triggers (email,市場 biến động) | ⚠️ Nói "event-driven" nhưng KHÔNG chi tiết | 🔴 **THIẾU** |
| Cron jobs tự động | ✅ OpenClaw `cron` tool + Orchestrator | ✅ Đủ |

### 🔴 Gap 5: External Trigger System

**Vấn đề**: Plan chỉ có "owner gửi lệnh" hoặc "cron". Nhưng ý tưởng gốc nói:
- Email khách hàng đến → trigger agent
- Webhook từ Facebook Ads → trigger agent
- Form website submit → trigger agent
- Biến động thị trường → trigger agent

**Cần**:
```
src/core/triggers/
├── trigger-registry.ts      — Đăng ký trigger sources
├── webhook-handler.ts       — Nhận webhook từ bên ngoài
├── email-trigger.ts         — Monitor inbox
├── schedule-trigger.ts      — Cron-based triggers
└── trigger-router.ts        — Trigger → đúng agent
```

### 🟡 Gap 6: Task Decomposer (Module riêng)

**Vấn đề**: CEO "tự chia nhỏ task" — nhưng logic này nằm ở đâu?
- Trong CEO's system prompt? (fragile)
- Trong một module riêng? (structured)

**Đề xuất**: Module `TaskDecomposer` riêng, CEO gọi qua tool.

---

## Gaps Bổ Sung (mình phát hiện thêm)

### 🟡 Gap 7: Cost Management
Chạy 24/7 = tốn token liên tục. Cần:
- Track token usage per agent per day
- Budget limit per agent
- Alert khi gần hết budget
- Auto-pause agent khi vượt ngưỡng

### 🟡 Gap 8: Audit Trail / Logging
Solopreneur cần biết agents đã làm gì. Cần:
- Action log: mọi action agent thực hiện
- Decision log: tại sao agent quyết định X
- Searchable, filterable trên Dashboard

### 🟡 Gap 9: Error Recovery
Agent fail giữa task thì sao? Cần:
- Retry logic (với backoff)
- Escalation: agent fail → báo CEO → báo owner
- Partial result saving: không mất công việc đã làm

### 🟡 Gap 10: Agent Onboarding Flow
Tạo agent mới → agent cần "training period":
- Ingest tài liệu liên quan vào memory
- Test run với sample tasks
- Owner review + approve trước khi deploy

---

## Tóm Tắt Gaps

| # | Gap | Severity | Cần thêm phase? |
|---|---|---|---|
| 1 | Tool Permission System | 🔴 Cao | Bổ sung vào Phase 3 |
| 2 | Intelligent Message Routing | 🟡 Trung bình | Bổ sung vào Phase 5 |
| 3 | Zalo Channel | 🟡 Thấp (MVP) | Phase 8+ |
| **4** | **Memory System (Vector DB)** | **🔴🔴 Rất cao** | **Cần Phase mới!** |
| 5 | External Trigger System | 🔴 Cao | Bổ sung vào Phase 4 |
| 6 | Task Decomposer Module | 🟡 Trung bình | Bổ sung vào Phase 3 |
| 7 | Cost Management | 🟡 Trung bình | Bổ sung vào Phase 5 |
| 8 | Audit Trail | 🟡 Trung bình | Bổ sung vào Phase 3 |
| 9 | Error Recovery | 🟡 Trung bình | Bổ sung vào Phase 3 |
| 10 | Agent Onboarding Flow | 🟡 Thấp (MVP) | Phase 8+ |

---

## 📌 Đề Xuất Cải Tiến Plan

### 1. Thêm Phase mới cho Memory (quan trọng nhất!)

Hiện tại 7 phases → đề xuất **8 phases**, chèn Memory vào giữa:

```
Phase 1: Foundation & Scaffold       (S0-S1)  ← giữ nguyên
Phase 2: Adapter Layer               (S2-S3)  ← giữ nguyên
Phase 3: Company Core + Tools        (S4-S5)  ← bổ sung Tool Permissions, Audit, Error Recovery
Phase 4: Memory & Knowledge Base     (S6-S7)  ← ⭐ MỚI! Vector DB, Conversation Logger, KB
Phase 5: Communication & Approval    (S8-S9)  ← bổ sung Triggers, Message Routing
Phase 6: Interfaces (API + Telegram) (S10-S11)← bổ sung Cost Management
Phase 7: UI & Integration            (S12-S13)← giữ nguyên
Phase 8: Intelligence & Learning     (S14)    ← Feedback Loop (cần Memory từ Phase 4)
```

### 2. Memory Phase chi tiết:
```
Session 6: Vector DB + Embedding Service
  - Setup pgvector extension
  - EmbeddingService (dùng Ollama embedding model)
  - VectorStore CRUD
  - Tests

Session 7: Conversation Logger + Knowledge Base
  - ConversationLogger (auto-log mọi interaction)
  - DocumentIngester (upload + chunk + embed tài liệu)
  - KnowledgeBase (semantic search)
  - ContextBuilder (build relevant context cho agent)
```

### 3. Bổ sung vào Phase 3:
- ToolRegistry + ToolPermission
- AuditLogger (action log)
- ErrorRecovery (retry + escalation)
- TaskDecomposer module
