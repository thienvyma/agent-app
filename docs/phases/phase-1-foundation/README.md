# Phase 1: Foundation & Scaffold (Sessions 0–1)

> **Status**: 🟡 In Progress
> **Sessions**: S0 (Foundation Docs), S1 (Project Scaffold)

---

## Mục Tiêu

Thiết lập nền tảng dự án — tài liệu định vị + project chạy được "hello world".

## Session 0: Foundation Documents ✅

**Đã hoàn thành** — 10 files, 2 commits (`47083fa`, `75e44d5`)

Tạo bộ "Single Source of Truth":
- PRD.md, RULES.md, PROGRESS.md, architecture_state.json
- ARCHITECTURE.md, DECISIONS.md, SESSIONS.md
- docs/openclaw-integration.md
- .gemini/rules.md, .gitignore

## Session 1: Project Scaffold (chưa bắt đầu)

**Mục tiêu**: `npm run dev` → Next.js chạy được

**Việc cần làm**:
1. `npx create-next-app@latest ./` (Next.js 15, TypeScript, App Router)
2. Cài dependencies (prisma, bullmq, grammy, socket.io, vitest...)
3. Docker Compose (PostgreSQL 16 + Redis 7)
4. Prisma init + `.env`
5. Tạo folder structure (`src/core/`, `src/types/`, `tests/`)
6. Placeholder files cho mọi module

**Output mong đợi**:
- `npm run dev` → trang Next.js mặc định
- `docker compose up` → DB + Redis chạy
- Folder structure sẵn sàng cho Session 2

**Dependencies cần cài**:
```
prisma @prisma/client bullmq ioredis
socket.io socket.io-client grammy next-auth
vitest @types/node
```

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
