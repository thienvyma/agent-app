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

**Quyết định**: Next.js 15 + PostgreSQL + pgvector + BullMQ + OpenClaw npm + Ollama local

**Lý do lựa chọn**:
| Tech | Lý do chọn | Alternatives considered |
|---|---|---|
| Next.js 15 | Full-stack, SSR, API routes | Express (không có UI) |
| PostgreSQL + pgvector | Relational + vector cùng DB | Qdrant (thêm service), Chroma (chỉ prototyping) |
| Prisma | Type-safe ORM, migrations | Drizzle (newer, less ecosystem) |
| BullMQ + Redis | Queue + STM memory | RabbitMQ (too heavy) |
| Ollama | AI model + embedding local, $0 | OpenAI API (tốn tiền) |
| Socket.IO | Realtime dashboard updates | WebSocket raw (no fallback) |
| grammY | Telegram bot, lightweight | Telegraf (bigger) |
| CLI-Anything | Agent-native CLI, hỗ trợ OpenClaw | Tự build from scratch |

---

## D8: Phân Pha — 26 Phases, 27 Sessions

**Quyết định**: Chia thành 26 phases, 27 sessions. Mỗi session ≤ 4 files. CLI dựng nền Phase 2.

**8 giai đoạn**:
```
A. Nền Tảng (P1-2) → B. Engine (P3-4) → C. Nhân Sự (P5-9)
→ D. Trí Nhớ (P10-12) → E. Giao Tiếp (P13-15) → F. Kết Nối (P16-20)
→ G. Dashboard (P21-24) → H. Hoàn Thiện (P25-26)
```

**Lịch sử**: 8→19→20→26 phases. Tách 6 sessions quá tải (Company DB, Knowledge, REST API, Cost+Realtime, UI Components, Dashboard Pages).

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

---

## D10: Deployment — Local-First Web App

**Quyết định**: Next.js chạy trên localhost, tất cả services local.

**Lý do**:
- $0 chi phí — Ollama local, OpenClaw local, PostgreSQL Docker, Redis Docker
- Tận dụng tối đa PC resources (GPU cho Ollama, CPU/RAM cho agents)
- Kiến trúc sẵn sàng deploy cloud — chỉ cần đổi `.env`
- Không cần domain, SSL, hosting cho MVP

**Phương án đã loại**:
- Cloud SaaS: tốn hosting, không dùng được Ollama local
- Electron app: phải rewrite khi muốn SaaS, heavier stack

---

## D11: CLI Strategy — CLI-Anything + Custom `ae` Commands

**Quyết định**: Xây CLI song song với mọi phase, dùng CLI-Anything + custom commands.

**Lý do**:
- CLI-Anything (13k+ ⭐) — hỗ trợ chính OpenClaw, tự tạo CLI cho bất kỳ app
- Agent nội bộ cần CLI environment để self-manage (deploy/undeploy agents, query status)
- JSON output cho agent consumption
- CLI = testable, scriptable, automatable

**Commands planned**:
```
ae agent create/deploy/undeploy/status/list
ae task assign/list/approve/reject
ae company info/create
ae memory search/ingest
ae cost report
```

---

## D12: Memory Architecture — 3-Tier (Học từ OpenClaw)

**Quyết định**: Tận dụng OpenClaw built-in memory + pgvector app-level + Redis STM.

**Lý do**:
- OpenClaw đã có memory system rất tốt (MEMORY.md + daily logs + hybrid search)
- Không cần rebuild cái đã có — chỉ cần bổ sung phần company-level
- Mem0 plugin cho OpenClaw chống mất context khi compaction
- pgvector cho cross-agent search (company KB, corrections — OpenClaw không có)

**3-Tier Architecture**:
| Tier | Storage | Scope | Quản lý bởi |
|---|---|---|---|
| 1. Per-Agent | OpenClaw MEMORY.md + Mem0 | Individual agent | OpenClaw (tự động) |
| 2. Company | pgvector (PostgreSQL) | Cross-agent | App (tự build) |
| 3. Session | Redis | Real-time, volatile | App (tự build) |

**Khác biệt so với plan cũ**: Không tự build TẤT CẢ memory — tận dụng OpenClaw cho tier 1.

---

## D13: Document Maintenance — Bắt buộc mọi session

**Quyết định**: Mọi AI session phải đọc + cập nhật docs theo workflow chuẩn.

**Lý do**:
- Dự án lớn → context dễ mất giữa các sessions
- JSON (architecture_state.json) ít bị AI phá hơn Markdown
- Anthropic engineers khuyến nghị "Single Source of Truth" — docs trong project

**Workflow**: Xem chi tiết tại RULES.md → "Document Maintenance Rules"
