# Phase 1: Foundation and Scaffold (S0-S1)

> Nen tang ky thuat cho toan bo he thong doanh nghiep AI tu dong

---

## Muc tieu
Thiet lap du an tu zero: documents, rules, Next.js 15, Docker (PostgreSQL + Redis),
Prisma init, NextAuth.js, folder structure.

## Session 0 (DONE - 20 commits)
- PRD, RULES v6, ARCHITECTURE, SESSIONS (26 phases), DECISIONS (D1-D13), PROGRESS
- 14 obra/superpowers skills tai .agent/skills/
- Anthropic best practices reference tai docs/VIBE_CODING_REFERENCE.md
- Session workflow tai .agent/workflows/session.md

## Session 1 - Project Scaffold

### Files tao moi:

1. package.json
   - Dependencies: next@15, react@19, prisma, @prisma/client, next-auth,
     bullmq, ioredis, socket.io, grammy, commander, axios
   - DevDependencies: typescript, @types/node, jest, @testing-library/react,
     eslint, prettier
   - Scripts: dev, build, start, test, lint, prisma:generate, prisma:migrate, prisma:seed

2. docker-compose.yml
   - PostgreSQL 16 + pgvector extension
     ports: 5432, volume: pgdata
     healthcheck: pg_isready
   - Redis 7
     ports: 6379, volume: redisdata
     healthcheck: redis-cli ping

3. tsconfig.json
   - strict: true, noUncheckedIndexedAccess: true
   - target: ES2022, module: ESNext
   - paths: @/* -> src/*

4. src/lib/auth.ts
   - NextAuth.js Credentials provider (email + password cho MVP)
   - Session strategy: JWT
   - Middleware: protect API routes + dashboard pages
   - Env: NEXTAUTH_SECRET, NEXTAUTH_URL

5. src/ folder structure:
   src/
   +-- app/              # Next.js App Router pages
   |   +-- api/          # API routes (Phase 16-17)
   |   +-- layout.tsx    # Root layout
   |   +-- page.tsx      # Landing/login page
   +-- core/             # Business logic
   |   +-- adapter/      # IAgentEngine + adapters (Phase 3-4)
   |   +-- company/      # Company CRUD (Phase 6)
   |   +-- orchestrator/ # Agent lifecycle (Phase 7)
   |   +-- tools/        # Tool registry (Phase 8)
   |   +-- tasks/        # Task engine (Phase 9)
   |   +-- memory/       # Vector + Redis (Phase 10-12)
   |   +-- messaging/    # Message bus (Phase 13)
   |   +-- triggers/     # External triggers (Phase 14)
   |   +-- approval/     # HITL workflow (Phase 15)
   |   +-- cost/         # Cost tracking (Phase 18)
   |   +-- feedback/     # Self-learning (Phase 26)
   |   +-- channels/     # Telegram bot (Phase 20)
   +-- components/       # React UI components (Phase 21-22)
   +-- lib/              # Shared utilities (prisma, auth, socket)
   +-- types/            # TypeScript type definitions
   +-- cli/              # CLI commands (Phase 2)
   tests/                # Test files mirror src/ structure

6. .env.example
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentic
   REDIS_URL=redis://localhost:6379
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   OPENCLAW_API_URL=http://localhost:18789
   OLLAMA_URL=http://localhost:11434
   TELEGRAM_BOT_TOKEN=
   TELEGRAM_OWNER_CHAT_ID=

## Kiem tra
1. npm run dev -> Next.js chay tai http://localhost:3000
2. docker compose up -d -> PostgreSQL healthy, Redis healthy
3. NextAuth login page renders tai /api/auth/signin
4. npm run test -> jest runs (0 tests is OK at this point)
5. npx prisma init -> prisma/schema.prisma created

## Env Variables
  DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
  OPENCLAW_API_URL, OLLAMA_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_CHAT_ID

## Lien quan PRD: Tech Stack (D7), Local-first (D10), Dollar0 cost
