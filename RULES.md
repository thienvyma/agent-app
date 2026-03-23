# 📏 RULES.md — Luật Chơi Cho AI

> Mọi AI assistant làm việc trên dự án này BẮT BUỘC phải tuân thủ các rule dưới đây.
> Đính kèm file này vào MỌI session mới.

---

## 🚫 TUYỆT ĐỐI KHÔNG

1. **KHÔNG sửa OpenClaw source code** — OpenClaw là external dependency, cài qua npm
2. **KHÔNG import OpenClaw internal modules** — chỉ giao tiếp qua `IAgentEngine` interface
3. **KHÔNG viết feature khi chưa được yêu cầu** — chỉ code module đang focus trong session
4. **KHÔNG sửa file module khác** "tiện tay" — mỗi session = 1 module duy nhất
5. **KHÔNG để code uncommitted** qua session — commit TRƯỚC khi kết thúc
6. **KHÔNG dùng `any` type** — TypeScript strict mode luôn
7. **KHÔNG hardcode credentials** — dùng environment variables
8. **KHÔNG skip cập nhật docs** — mọi thay đổi phải reflect trong docs

## ✅ BẮT BUỘC

1. **Interface trước, implementation sau** — define contract rồi mới code
2. **Test trước, feature sau** — viết test → code cho đến pass
3. **Mỗi file < 300 dòng** — tách ra nếu quá dài
4. **Mọi function phải có error handling + logging** — không silent fail
5. **Giao tiếp OpenClaw CHỈ qua HTTP API** (port 18789) qua `IAgentEngine`
6. **Commit theo conventional format**: `<type>(<scope>): <description>`
7. **CLI command cho mọi feature** — mỗi feature mới → thêm CLI command tương ứng

## 📄 Document Maintenance Rules

### Mở Session (ĐỌC trước khi code):
1. ĐỌC `PROGRESS.md` → biết session trước làm gì, lỗi còn tồn đọng
2. ĐỌC `architecture_state.json` → biết module nào xong/chưa
3. ĐỌC `RULES.md` (file này) → nhớ luật chơi
4. ĐỌC `docs/phases/phase-X/README.md` → chi tiết session cần làm

### Kết Thúc Session (CẬP NHẬT trước khi commit cuối):
1. CẬP NHẬT `PROGRESS.md` → ghi session log, lỗi tồn đọng, bước tiếp theo
2. CẬP NHẬT `architecture_state.json` → module status, files list
3. COMMIT docs update: `docs: update progress session N`

### Khi Thay Đổi Kiến Trúc:
1. CẬP NHẬT `ARCHITECTURE.md` → sơ đồ tầng, data flow
2. CẬP NHẬT `DECISIONS.md` → ghi quyết định mới + lý do
3. CẬP NHẬT `docs/phases/phase-X/README.md` → phase bị ảnh hưởng

### Khi Phát Hiện Bug:
1. GHI VÀO `PROGRESS.md` mục "Lỗi tồn đọng"
2. GHI VÀO `architecture_state.json` → known_issues[]

### Mỗi Commit:
1. Ghi files changed vào `PROGRESS.md`
2. Commit message theo format: `<type>(<scope>): <description>`

## 🏗️ Coding Conventions

### TypeScript
- Strict mode: `"strict": true` trong tsconfig.json
- Prefer `interface` over `type` cho object shapes
- Prefer `const` over `let`
- Async/await over raw Promises
- Named exports over default exports

### File & Folder Naming
- Files: `kebab-case.ts` (e.g. `agent-orchestrator.ts`)
- Interfaces: `PascalCase` prefix `I` (e.g. `IAgentEngine`)
- Types: `PascalCase` (e.g. `AgentConfig`)
- Constants: `UPPER_SNAKE_CASE`
- Functions/methods: `camelCase`

### Project Structure
```
src/
├── app/          # Next.js pages + API routes
├── core/         # Business logic (server-side only)
│   ├── adapter/  # IAgentEngine + implementations
│   ├── company/  # Org structure
│   ├── orchestrator/  # Agent lifecycle + tools + audit
│   ├── memory/   # Vector DB + Knowledge Base
│   ├── messaging/     # Message bus + triggers
│   ├── approval/      # HITL approval
│   ├── feedback/      # Self-learning
│   ├── cost/     # Token/budget tracking
│   └── channels/      # Telegram, etc.
├── cli/          # CLI commands (ae agent, ae task, etc.)
├── components/   # React UI components
├── lib/          # Shared utilities
└── types/        # Shared TypeScript types
```

### Git Commits
```
Format: <type>(<scope>): <description>

Types: chore, feat, fix, test, docs, refactor
Scopes: foundation, adapter, company, orchestrator, memory,
        messaging, approval, api, telegram, ui, feedback,
        cli, cost, tools
```

## 🔌 OpenClaw Integration Rules

- OpenClaw chạy như **separate process** (Gateway trên port 18789)
- App giao tiếp qua **HTTP REST API** only
- Adapter pattern: `IAgentEngine` → `OpenClawAdapter`
- Nếu OpenClaw thay đổi API → chỉ sửa `OpenClawAdapter`, KHÔNG sửa business logic
- Config OpenClaw qua **file config riêng**, KHÔNG mix vào app config
- **Memory**: Tận dụng OpenClaw built-in memory (MEMORY.md + daily logs) + Mem0 plugin
- **App-level memory**: pgvector cho company KB, cross-agent search

## 🖥️ Deployment Rules

- **Local-first**: App chạy trên localhost (Next.js dev server)
- **$0 cost**: Ollama local + OpenClaw local + PostgreSQL Docker + Redis Docker
- Tất cả services chạy qua `docker-compose.yml`
- Environment variables qua `.env` file
- Khi muốn deploy cloud → chỉ đổi `.env` + deploy
