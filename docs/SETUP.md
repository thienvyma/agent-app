# 🚀 Setup Guide — Agentic Enterprise

Hướng dẫn cài đặt đầy đủ trên PC mới. Thời gian ước tính: **~30 phút**.

---

## 1. Yêu cầu hệ thống

| Phần mềm | Version tối thiểu | Download |
|-----------|-------------------|----------|
| **Node.js** | 20+ | https://nodejs.org |
| **Docker Desktop** | 4.0+ | https://docker.com/products/docker-desktop |
| **Git** | 2.0+ | https://git-scm.com |

## 2. Clone dự án

```bash
git clone <your-repo-url> agentic-enterprise
cd agentic-enterprise
```

## 3. Cài dependencies

```bash
npm install
```

## 4. Cấu hình .env

Copy template:
```bash
cp .env.example .env
```

File `.env` cần có:
```env
# === Database (Docker PostgreSQL) ===
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentic

# === Redis (Docker) ===
REDIS_URL=redis://localhost:6379

# === NextAuth ===
NEXTAUTH_SECRET=<random-string-32-ky-tu>
NEXTAUTH_URL=http://localhost:4000

# === OpenClaw ===
OPENCLAW_API_URL=http://localhost:18789

# === Ollama ===
OLLAMA_URL=http://localhost:11434

# === Telegram (tùy chọn) ===
TELEGRAM_BOT_TOKEN=<tu-BotFather>
TELEGRAM_OWNER_CHAT_ID=<tu-userinfobot>
```

## 5. Khởi động Database + Redis

```bash
# Khởi động PostgreSQL + Redis
docker compose up -d postgres redis

# Kiểm tra services đã chạy
docker compose ps
```

Kết quả mong đợi:
```
NAME          STATUS
ae-postgres   running (healthy)
ae-redis      running (healthy)
```

## 6. Chạy Migration + Seed

```bash
# Tạo database schema
npx prisma migrate dev --name init

# Thêm dữ liệu mẫu
npx prisma db seed

# (Tuỳ chọn) Xem dữ liệu qua GUI
npx prisma studio
```

## 7. Chạy dự án

```bash
# Development mode
npm run dev

# Mở browser: http://localhost:4000
```

## 8. Kiểm tra

```bash
# TypeScript check
npx tsc --noEmit

# Chạy tests
npx jest

# Kiểm tra database
npx prisma studio
```

---

## Khởi động nhanh (sau lần đầu)

```bash
# 1. Bật Docker Desktop
# 2. Start services
docker compose up -d postgres redis
# 3. Start app
npm run dev
```

## Dừng dự án

```bash
# Dừng app: Ctrl+C
# Dừng Docker services
docker compose down

# Dừng và xóa data (CẢNH BÁO: mất hết dữ liệu!)
docker compose down -v
```

---

## Troubleshooting

| Lỗi | Giải pháp |
|-----|-----------|
| `docker: Cannot connect` | Mở Docker Desktop trước |
| `ECONNREFUSED 5432` | `docker compose up -d postgres` |
| `Prisma migrate: already exists` | `npx prisma migrate reset` |
| `Port 4000 in use` | Đổi port trong `package.json` scripts |
| `NEXTAUTH_SECRET missing` | Thêm vào `.env` |

## Cấu trúc Docker Services

```
docker compose up -d postgres redis       ← Chỉ DB (dev)
docker compose up -d                      ← Tất cả services (production)
docker compose up -d postgres redis ollama ← DB + AI (nếu test agent)
```

| Service | Port | Mô tả |
|---------|------|-------|
| postgres | 5432 | PostgreSQL + pgvector |
| redis | 6379 | Cache + session |
| ollama | 11434 | AI models (Ollama) |
| openclaw | 18789 | Agent gateway |
| lightrag | 9621 | Vector search |
| app | 3000 | Production app |
