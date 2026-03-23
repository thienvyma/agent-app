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

## ✅ BẮT BUỘC

1. **Interface trước, implementation sau** — define contract rồi mới code
2. **Test trước, feature sau** — viết test → code cho đến pass
3. **Mỗi file < 300 dòng** — tách ra nếu quá dài
4. **Mọi function phải có error handling + logging** — không silent fail
5. **Giao tiếp OpenClaw CHỈ qua HTTP API** (port 18789) qua `IAgentEngine`
6. **Đọc PROGRESS.md + architecture_state.json** trước khi bắt đầu mỗi session
7. **Cập nhật PROGRESS.md + architecture_state.json** sau khi kết thúc mỗi session
8. **Commit theo conventional format**: `<type>(<scope>): <description>`

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
│   ├── orchestrator/  # Agent lifecycle
│   ├── messaging/     # Message bus
│   ├── approval/      # HITL approval
│   ├── feedback/      # Self-learning
│   └── channels/      # Telegram, etc.
├── components/   # React UI components
├── lib/          # Shared utilities
└── types/        # Shared TypeScript types
```

### Git Commits
```
Format: <type>(<scope>): <description>

Types: chore, feat, fix, test, docs, refactor
Scopes: foundation, adapter, company, orchestrator,
        messaging, approval, api, telegram, ui, feedback
```

## 🔌 OpenClaw Integration Rules

- OpenClaw chạy như **separate process** (Gateway trên port 18789)
- App giao tiếp qua **HTTP REST API** only
- Adapter pattern: `IAgentEngine` → `OpenClawAdapter`
- Nếu OpenClaw thay đổi API → chỉ sửa `OpenClawAdapter`, KHÔNG sửa business logic
- Config OpenClaw qua **file config riêng**, KHÔNG mix vào app config
