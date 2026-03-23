# Phase 1: Foundation & Scaffold (Sessions 0–1)

> **Status**: 🟡 In Progress
> **Sessions**: S0 (Foundation Docs ✅), S1 (Project Scaffold)

---

## Mục Tiêu

Thiết lập nền tảng dự án — tài liệu định vị + project chạy được "hello world".

## Session 0: Foundation Documents ✅

**Đã hoàn thành** — 20 files, 7 commits

Tạo bộ "Single Source of Truth":
- PRD.md, RULES.md, PROGRESS.md, ARCHITECTURE.md, architecture_state.json
- DECISIONS.md (13 decisions), SESSIONS.md (15 sessions)
- docs/openclaw-integration.md, docs/GAP_ANALYSIS.md, docs/MEMORY_RESEARCH.md
- 8 phase directories (docs/phases/phase-1 → phase-8)
- .gemini/rules.md (v2), .gitignore

## Session 1: Project Scaffold (chưa bắt đầu)

**Mục tiêu**: `npm run dev` → Next.js chạy được

**Việc cần làm**:
1. `npx create-next-app@latest ./` (Next.js 15, TypeScript, App Router)
2. Cài dependencies (prisma, bullmq, grammy, socket.io, vitest...)
3. Docker Compose (PostgreSQL 16 **+ pgvector extension** + Redis 7)
4. Prisma init + `.env`
5. Tạo folder structure (`src/core/`, `src/cli/`, `src/types/`, `tests/`)
6. Placeholder files cho mọi module
7. **CLI-Anything setup** (nếu available)

**Output mong đợi**:
- `npm run dev` → trang Next.js mặc định
- `docker compose up` → DB (pgvector) + Redis chạy
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
