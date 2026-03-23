# 📝 DECISIONS.md — Architecture Decisions Log

> Tất cả quyết định kiến trúc đã thảo luận, kèm lý do.
> AI đọc file này để hiểu TẠI SAO chứ không chỉ CÁI GÌ.

---

## D1: Engine — Dùng OpenClaw chính chủ, KHÔNG embed

**Quyết định**: OpenClaw cài qua npm, giao tiếp qua HTTP Gateway API (port 18789).

**Lý do**:
- Dự án cũ (agent-desktop) embed OpenClaw 47 thư mục → không update được
- NemoClaw (NVIDIA) cũng dùng pattern wrapper — chứng minh hướng đi đúng
- Khi OpenClaw cập nhật: `npm update -g openclaw` — không ảnh hưởng app

**Ranh giới**: Interface `IAgentEngine` — toàn bộ app chỉ biết interface, không biết OpenClaw.

---

## D2: 24/7 Operation — Hybrid Model

**Quyết định**: CEO always-on + nhân viên event-driven

**Các phương án đã xem xét**:
| Phương án | Ưu | Nhược | Chọn? |
|---|---|---|---|
| A. All Always-On | Phản hồi nhanh | Tốn token cực kỳ | ❌ |
| B. All Event-Driven | Tiết kiệm | Cần event bus chắc chắn | ❌ |
| C. Hybrid | Cân bằng | Phức tạp hơn chút | ✅ |

**Chi tiết**:
- CEO Agent: cron poll mỗi 5 phút (check email, Telegram, tasks)
- Nhân viên: "ngủ" cho đến khi CEO assign task hoặc trigger kích hoạt
- OpenClaw hỗ trợ: `cron` tool cho CEO, `sessions_spawn` khi delegate

---

## D3: Communication — Mix 3 Patterns

**Quyết định**: Delegate (default) + Chain (workflows) + Group (meetings)

**Khi nào dùng pattern nào**:
| Pattern | Khi nào | Ví dụ | OpenClaw tool |
|---|---|---|---|
| Delegate | CEO phân task cho 1 agent | "Marketing, lên kế hoạch tháng 4" | `sessions_spawn` + `message` |
| Chain | Quy trình cố định A→B→C | Research → Write → Review → Publish | `sessions_spawn` nối tiếp |
| Group | Brainstorm, quyết định nhóm | CEO + Marketing + Sales họp tuần | `sessions_send` broadcast |

---

## D4: Approval Workflow (HITL)

**Quyết định**: Tasks nhạy cảm PHẢI owner duyệt trước khi execute.

**Cơ chế**:
1. PolicyEngine phân loại task: `auto` vs `approval-required`
2. Tiêu chí cần approval: budget > ngưỡng, gửi cho khách, chi tiền, quyết định lớn
3. Agent làm 99% → gửi Telegram với inline buttons [Duyệt] [Sửa] [Từ chối]
4. Owner approve → task tiếp tục execute
5. Owner reject → agent nhận feedback + ghi vào CorrectionLog

**Nguồn**: Gemini research — "tính năng sống còn cho solopreneur"

---

## D5: Self-Learning — Feedback Loop

**Quyết định**: Agent tự học từ corrections của owner.

**Cơ chế**:
1. Owner sửa/reject output → hệ thống ghi `CorrectionLog`
2. CorrectionLog chứa: context, output sai, correction, rule rút ra
3. Trước mỗi task, inject relevant corrections vào agent's system prompt
4. Agent ngày càng giỏi hơn — không chỉ nhớ mà còn HỌC

**Ví dụ**:
```
Owner reject báo giá: "Thiếu chi phí nhân công"
→ Rule #47: "Luôn cộng chi phí nhân công vào báo giá"
→ Lần sau agent lập báo giá → system prompt có thêm rule #47
```

---

## D6: Task Decomposition

**Quyết định**: CEO agent tự chia nhỏ task phức tạp.

**Flow**:
```
Owner: "Triển khai chiến dịch khuyến mãi tháng 4"
CEO phân tích:
  → Task 1: Viết content (→ Marketing Agent)
  → Task 2: Tính lợi nhuận (→ Finance Agent)
  → Task 3: Thiết kế banner (→ Design Agent)
  → Tổng hợp kết quả → Report cho Owner
```

---

## D7: Tech Stack

**Quyết định**: Next.js 15 + PostgreSQL + BullMQ + OpenClaw npm

**Lý do lựa chọn**:
| Tech | Lý do chọn | Alternatives considered |
|---|---|---|
| Next.js 15 | Full-stack, SSR, API routes | Express (không có UI) |
| PostgreSQL | Relational cho org chart, SaaS-ready | SQLite (không scale) |
| Prisma | Type-safe ORM, migrations | Drizzle (newer, less ecosystem) |
| BullMQ + Redis | Queue cho agent tasks | RabbitMQ (too heavy) |
| Socket.IO | Realtime dashboard updates | WebSocket raw (no fallback) |
| grammY | Telegram bot, lightweight | Telegraf (bigger) |

---

## D8: Phân Pha — 12 Sessions

**Quyết định**: Chia thành 12 sessions, mỗi session = 1 module.

**Thứ tự dựa trên dependency**:
```
Foundation (S0) → Scaffold (S1) → Interface (S2) → Adapter (S3)
→ Company DB (S4) → Orchestrator (S5) → MessageBus (S6)
→ Approval (S7) → Dashboard API (S8) → Telegram (S9)
→ Dashboard UI (S10) → Integration Test (S11) → Feedback (S12)
```

**Lý do thứ tự**: Mỗi module chỉ phụ thuộc vào modules trước nó.

---

## D9: Dự Án Tương Tự Đã Nghiên Cứu

| Dự án | Lấy gì | Không lấy gì |
|---|---|---|
| MetaGPT | SOP per role, message filtering | Chỉ software dev, batch mode |
| ChatDev v2 | Config-driven agents, peer review | Chat chain 1-1 only |
| CrewAI | Hierarchical delegation, Memory, Flows | Python only |
| AutoGen | Group discussion, human-in-the-loop | Flat structure |
| Lindy AI | Always-on employees, SaaS model, dashboard | Closed source |
| NemoClaw | Loose-coupling with OpenClaw, adapter pattern | NVIDIA lock-in |
