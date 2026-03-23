# 📏 RULES.md — Luật Chơi Cho AI (v5)

> ⚠️ **BẮT BUỘC**: Mọi AI assistant làm việc trên dự án này PHẢI đọc file này ĐẦU TIÊN.
> File này là LUẬT — không phải gợi ý. Vi phạm = revert.

---

## 🔴 WORKFLOW BẮT BUỘC MỖI SESSION

### Bước 1: MỞ SESSION — Đọc 5 file (KHÔNG ĐƯỢC BỎ QUA)

```
1. PROGRESS.md           → Biết session trước làm gì, lỗi tồn đọng, bước tiếp
2. architecture_state.json → Biết module nào xong/chưa, known_issues
3. RULES.md (file này)    → Nhớ luật chơi
4. SESSIONS.md            → Xem session hiện tại cần làm gì, bao nhiêu files
5. docs/phases/phase-XX/README.md → Chi tiết + ghi chú thảo luận của phase
```

> Nếu bạn KHÔNG đọc 5 file trên → bạn CHẮC CHẮN sẽ viết code sai, trùng, hoặc thiếu.

### Bước 2: XÁC NHẬN — Liệt kê trước khi code

Trước khi viết dòng code đầu tiên, PHẢI liệt kê:
- Session số mấy? Phase nào?
- Cần tạo mấy file? Tên file gì?
- Tests nào cần viết?
- CLI commands nào cần thêm?
- Có phụ thuộc module nào chưa xong không?

### Bước 3: CODE — Tuân thủ luật bên dưới

### Bước 4: KẾT THÚC SESSION — Cập nhật 3 file (KHÔNG ĐƯỢC BỎ QUA)

```
1. CẬP NHẬT PROGRESS.md:
   - Ghi session vừa làm (files tạo, tests pass/fail)
   - Ghi lỗi tồn đọng (nếu có)
   - Ghi bước tiếp theo rõ ràng
   - Ghi files đã thay đổi

2. CẬP NHẬT architecture_state.json:
   - Module status: "completed" / "in_progress"
   - known_issues[] nếu có bug
   - current_session: tăng lên

3. COMMIT cuối: `docs: update progress session N`
```

### Bước 5: THAY ĐỔI KIẾN TRÚC — Nếu có

```
- CẬP NHẬT ARCHITECTURE.md
- CẬP NHẬT DECISIONS.md — ghi quyết định mới + LÝ DO
- CẬP NHẬT docs/phases/phase-XX/README.md — phase bị ảnh hưởng
```

---

## 🚫 TUYỆT ĐỐI KHÔNG

1. **KHÔNG sửa OpenClaw source code** — OpenClaw là external dependency, cài qua npm
2. **KHÔNG import OpenClaw internal modules** — chỉ giao tiếp qua `IAgentEngine` interface
3. **KHÔNG viết feature ngoài session** — chỉ code module đang focus
4. **KHÔNG sửa file module khác** "tiện tay" — mỗi session = 1 module duy nhất
5. **KHÔNG để code uncommitted** qua session — commit TRƯỚC khi kết thúc
6. **KHÔNG dùng `any` type** — TypeScript strict mode luôn
7. **KHÔNG hardcode credentials** — dùng environment variables
8. **KHÔNG skip cập nhật docs** — vi phạm rule quan trọng nhất
9. **KHÔNG tạo file trống** "để sau" — mỗi file phải có ít nhất interface/type
10. **KHÔNG xóa hoặc sửa tests đang pass** để "fix" code — sửa code cho pass test

## ✅ BẮT BUỘC

1. **Interface trước, implementation sau** — define contract rồi mới code
2. **Test trước, feature sau** — viết test → code cho đến pass
3. **Mỗi file < 300 dòng** — tách ra nếu quá dài
4. **Mọi function phải có error handling + logging** — không silent fail
5. **Giao tiếp OpenClaw CHỈ qua HTTP API** (port 18789) qua `IAgentEngine`
6. **Commit theo conventional format**: `<type>(<scope>): <description>`
7. **CLI command cho mọi feature** — mỗi feature mới → thêm CLI command vào `ae`
8. **Mỗi session tối đa 6 files mới** — nếu nhiều hơn → DỪNG LẠI và hỏi owner

## 🔄 QUY TẮC CHỐNG MẤT CONTEXT

### Giữa các sessions:
- `PROGRESS.md` = **bộ nhớ chính** — AI session mới đọc file này ĐẦU TIÊN
- `architecture_state.json` = **bản đồ** — module nào xong, module nào chưa
- `SESSIONS.md` = **kế hoạch** — session tiếp theo làm gì
- `docs/phases/phase-XX/README.md` = **ghi chú thảo luận** — chi tiết + context của phase

### Khi phát hiện bug:
1. GHI VÀO `PROGRESS.md` mục "Lỗi tồn đọng" — mô tả rõ: file nào, dòng nào, hiện tượng gì
2. GHI VÀO `architecture_state.json` → `known_issues[]`
3. Nếu bug ảnh hưởng session khác → ghi rõ session nào bị ảnh hưởng

### Khi có quyết định thiết kế mới:
1. GHI VÀO `DECISIONS.md` — quyết định + lý do + alternatives considered
2. GHI VÀO phase README mục "Ghi Chú Thảo Luận"

### Khi hoàn thành session thành công:
1. Ghi "✅ Completed" vào PROGRESS.md cho session đó
2. Ghi rõ tests nào đã pass
3. Ghi rõ CLI commands nào đã thêm
4. Ghi bước tiếp theo là session nào, làm gì

---

## 🏗️ Coding Conventions

### TypeScript
- Strict mode: `"strict": true` trong tsconfig.json
- Prefer `interface` over `type` cho object shapes
- Prefer `const` over `let`
- Async/await over raw Promises
- Named exports over default exports
- Mọi function phải có JSDoc comment mô tả purpose

### File & Folder Naming
- Files: `kebab-case.ts` (e.g. `agent-orchestrator.ts`)
- Interfaces: `PascalCase` prefix `I` (e.g. `IAgentEngine`)
- Types: `PascalCase` (e.g. `AgentConfig`)
- Constants: `UPPER_SNAKE_CASE`
- Functions/methods: `camelCase`
- Test files: `*.test.ts` cùng pattern với source

### Project Structure
```
src/
├── app/          # Next.js pages + API routes
├── core/         # Business logic (server-side only)
│   ├── adapter/  # IAgentEngine + implementations
│   ├── company/  # Org structure
│   ├── orchestrator/  # Agent lifecycle + health
│   ├── tools/    # Tool registry + permissions
│   ├── tasks/    # Task decomposer + error recovery
│   ├── memory/   # Vector DB + Knowledge Base
│   ├── messaging/     # Message bus + routing
│   ├── triggers/ # External triggers
│   ├── approval/      # HITL approval
│   ├── feedback/      # Self-learning
│   ├── cost/     # Token/budget tracking
│   └── channels/      # Telegram, etc.
├── cli/          # CLI commands (ae agent, ae task, etc.)
├── components/   # React UI components
├── lib/          # Shared utilities
└── types/        # Shared TypeScript types
tests/            # Mirrors src/ structure
```

### Git Commits
```
Format: <type>(<scope>): <description>

Types: chore, feat, fix, test, docs, refactor
Scopes: foundation, scaffold, cli, adapter, company, orchestrator,
        tools, tasks, memory, messaging, triggers, approval,
        api, cost, telegram, ui, feedback
```

---

## 🔌 OpenClaw Integration Rules

- OpenClaw chạy như **separate process** (Gateway trên port 18789)
- App giao tiếp qua **HTTP REST API** only
- Adapter pattern: `IAgentEngine` → `OpenClawAdapter`
- Nếu OpenClaw thay đổi API → chỉ sửa `OpenClawAdapter`, KHÔNG sửa business logic
- Config OpenClaw qua **file config riêng**, KHÔNG mix vào app config
- **Memory Tier 1**: Tận dụng OpenClaw built-in (MEMORY.md + daily logs + Mem0 plugin)
- **Memory Tier 2**: pgvector cho company KB, cross-agent search (app tự build)
- **Memory Tier 3**: Redis cho session STM (app tự build)

## 🖥️ Deployment Rules

- **Local-first**: App chạy trên localhost (Next.js dev server)
- **$0 cost**: Ollama local + OpenClaw local + PostgreSQL Docker + Redis Docker
- Tất cả services chạy qua `docker-compose.yml`
- Environment variables qua `.env` file
- Khi muốn deploy cloud → chỉ đổi `.env` + deploy

## 📋 Checklist Nhanh (Copy vào đầu mỗi session)

```
□ Đã đọc PROGRESS.md
□ Đã đọc architecture_state.json
□ Đã đọc RULES.md
□ Đã đọc SESSIONS.md → session N
□ Đã đọc docs/phases/phase-XX/README.md
□ Đã liệt kê files cần tạo (≤6)
□ Đã liệt kê tests cần viết
□ Đã liệt kê CLI commands cần thêm
--- SAU KHI CODE ---
□ Tests pass
□ CLI commands hoạt động
□ Đã cập nhật PROGRESS.md
□ Đã cập nhật architecture_state.json
□ Đã commit: docs: update progress session N
```
