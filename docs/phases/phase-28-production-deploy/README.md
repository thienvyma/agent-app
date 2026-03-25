# Phase 28: Production Deploy (S28)

> Tu dev environment sang production-ready: Docker, monitoring, health checks.
> BAO GOM: Huong dan setup day du tren PC moi.

---

## Muc tieu
1. Docker Compose cho TOAN BO services
2. Health monitoring + auto-restart
3. **TAI LIEU SETUP: 1 nguoi moi co the cai trong 30 phut**
4. Logging + error tracking

---

## HUONG DAN CAI DAT TREN PC MOI (Step-by-step)

### Yeu cau phan cung toi thieu
```
CPU:  4 cores (khuyien dung 8+)
RAM:  16GB (khuyien dung 32GB cho Ollama)
Disk: 50GB free (models Ollama ~5GB/model)
GPU:  Optional (co thi nhanh hon, khong co van chay CPU)
OS:   Windows 10/11, Ubuntu 22.04+, macOS 13+
```

### Buoc 1: Cai phan mem can thiet (1 lan duy nhat)

#### Windows:
```powershell
# 1. Node.js 20+
winget install OpenJS.NodeJS.LTS

# 2. Docker Desktop
winget install Docker.DockerDesktop
# Sau khi cai -> Mo Docker Desktop -> Settings -> Enable WSL2

# 3. Git
winget install Git.Git

# 4. PostgreSQL client (optional, de debug)
winget install PostgreSQL.PostgreSQL

# Khoi dong lai PC sau khi cai Docker Desktop
```

#### Ubuntu/Linux:
```bash
# 1. Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out va log in lai

# 3. Git
sudo apt install -y git
```

#### macOS:
```bash
brew install node@20 git
brew install --cask docker
```

### Buoc 2: Clone du an
```bash
git clone <repo-url> agentic-enterprise
cd agentic-enterprise
```

### Buoc 3: Cai dependencies
```bash
npm install
```

### Buoc 4: Tao file .env
```bash
# Copy template
cp .env.production.template .env

# Chinh sua cac gia tri:
# - DATABASE_URL (se duoc Docker tu tao)
# - TELEGRAM_BOT_TOKEN (lay tu @BotFather)
# - TELEGRAM_OWNER_CHAT_ID (lay tu @userinfobot)
# - NEXTAUTH_SECRET (chay: openssl rand -base64 32)
```

### Buoc 5: Khoi dong tat ca services
```bash
# Lan dau: build + start (mat 5-10 phut)
docker compose up -d --build

# Kiem tra tat ca services da chay:
docker compose ps
# Ket qua phai hien 5 services: app, postgres, redis, ollama, openclaw
```

### Buoc 6: Chay database migration
```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

### Buoc 7: Download AI model (1 lan duy nhat)
```bash
# Model nho (3GB, nhanh)
docker compose exec ollama ollama pull qwen2.5:7b

# Hoac model lon (7GB, chinh xac hon)
docker compose exec ollama ollama pull qwen2.5:14b
```

### Buoc 8: Kiem tra he thong
```bash
# Kiem tra health
curl http://localhost:3000/api/health

# Ket qua mong doi:
# { "status": "healthy", "services": { ... } }

# Mo dashboard
# Truy cap: http://localhost:3000
```

### Buoc 9: Kiem tra CLI
```bash
npx tsx src/cli/index.ts status
npx tsx src/cli/index.ts agent list
npx tsx src/cli/index.ts pipeline status
```

---

## XU LY LOI THUONG GAP

### Loi 1: Docker Desktop khong start
```
Nguyen nhan: WSL2 chua bat
Fix Windows: 
  wsl --install
  # Khoi dong lai PC
```

### Loi 2: Port 3000 bi chiem
```
Fix: Doi port trong docker-compose.yml
  ports: ["3001:3000"]
  # Truy cap: http://localhost:3001
```

### Loi 3: Ollama khong pull duoc model
```
Nguyen nhan: Disk full hoac mang cham
Fix: 
  docker compose exec ollama df -h
  # Can it nhat 10GB free
```

### Loi 4: Database connection refused
```
Fix:
  docker compose logs postgres
  # Doi 30s cho postgres khoi dong xong
  docker compose restart app
```

### Loi 5: GPU khong duoc nhan dien
```
Fix: Chay CPU mode (cham hon nhung van duoc)
  # Xoa phan deploy.resources trong docker-compose.yml
  # Ollama tu dong dung CPU
```

### Loi 6: npm install loi
```
Fix:
  rm -rf node_modules package-lock.json
  npm install
```

---

## FILES CAN TAO

### 1. docker-compose.yml (ROOT)

```yaml
services:
  # === Core App ===
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # === Database ===
  postgres:
    image: pgvector/pgvector:pg16
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: agentic_enterprise
      POSTGRES_USER: ae_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-ae_pass_2026}
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ae_user -d agentic_enterprise"]
      interval: 10s
      timeout: 5s
      retries: 5

  # === Cache ===
  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]
    command: redis-server --appendonly yes
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # === AI Engine ===
  ollama:
    image: ollama/ollama:latest
    volumes: [ollamadata:/root/.ollama]
    ports: ["11434:11434"]
    restart: always
    # Neu co GPU, uncomment:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - capabilities: [gpu]

  # === OpenClaw Gateway ===
  openclaw:
    image: node:20-alpine
    working_dir: /app
    volumes: ["../openclaw:/app"]
    command: npm start
    ports: ["18789:18789"]
    depends_on: [ollama]
    environment:
      OLLAMA_URL: http://ollama:11434
    restart: always

volumes:
  pgdata:
  redisdata:
  ollamadata:
```

### 2. Dockerfile

```dockerfile
# === Build Stage ===
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npx prisma generate
RUN npm run build

# === Production Stage ===
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy chi nhung thu can thiet
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

### 3. .env.production.template

```env
# ==========================================
# AGENTIC ENTERPRISE - Environment Variables
# Copy file nay thanh .env va dien gia tri
# ==========================================

# --- Database ---
DATABASE_URL=postgresql://ae_user:ae_pass_2026@postgres:5432/agentic_enterprise
DB_PASSWORD=ae_pass_2026

# --- Redis ---
REDIS_URL=redis://redis:6379

# --- AI Engine ---
OLLAMA_URL=http://ollama:11434
OPENCLAW_GATEWAY_URL=http://openclaw:18789

# --- Authentication ---
# Tao bang: openssl rand -base64 32
NEXTAUTH_SECRET=THAY_BANG_RANDOM_STRING
NEXTAUTH_URL=http://localhost:3000

# --- Telegram Bot ---
# Lay token tu @BotFather tren Telegram
TELEGRAM_BOT_TOKEN=
# Lay chat ID tu @userinfobot tren Telegram
TELEGRAM_OWNER_CHAT_ID=

# --- Budget ---
DEFAULT_DAILY_BUDGET=100000
BUDGET_WARNING_PERCENT=80
```

### 4. src/app/api/health/route.ts

```typescript
GET /api/health -> {
  status: "healthy" | "degraded" | "unhealthy",
  services: {
    database: { status, latency },
    redis: { status, latency },
    ollama: { status, latency },
    openclaw: { status, latency }
  },
  agents: { total, running, idle },
  uptime: number,
  version: string,
  timestamp: string
}
```

### 5. src/lib/monitoring.ts

```
class HealthMonitor:
  - checkDatabase(): Promise<ServiceHealth>
  - checkRedis(): Promise<ServiceHealth>
  - checkOllama(): Promise<ServiceHealth>
  - checkOpenClaw(): Promise<ServiceHealth>
  - getOverallHealth(): Promise<HealthReport>
  - startPeriodicCheck(intervalMs: number): void
  - getHistory(minutes: number): HealthEntry[]
```

### 6. scripts/deploy.sh

```bash
#!/bin/bash
set -e

echo "=== Agentic Enterprise Deploy ==="
echo "Thoi gian: $(date)"

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
git pull origin main

# 2. Build + start services
echo "[2/5] Building and starting services..."
docker compose up -d --build

# 3. Wait for services
echo "[3/5] Waiting for services to be healthy..."
sleep 15

# 4. Run migrations
echo "[4/5] Running database migrations..."
docker compose exec -T app npx prisma migrate deploy

# 5. Health check
echo "[5/5] Running health check..."
HEALTH=$(curl -s http://localhost:3000/api/health)
echo "$HEALTH" | jq .

echo ""
echo "=== Deploy Complete! ==="
echo "Dashboard: http://localhost:3000"
echo "API Health: http://localhost:3000/api/health"
```

## CLI moi

```
ae health              # Kiem tra tat ca services
ae deploy              # Docker compose up
ae deploy --rebuild    # Rebuild + restart
ae logs <service>      # Xem logs cua service
ae restart <service>   # Restart 1 service
```

## CHECKLIST SETUP PC MOI (In ra giay)

```
[ ] 1. Cai Node.js 20+
[ ] 2. Cai Docker Desktop (+ bat WSL2 tren Windows)
[ ] 3. Cai Git
[ ] 4. Clone repo
[ ] 5. npm install
[ ] 6. Copy .env.production.template -> .env
[ ] 7. Dien TELEGRAM_BOT_TOKEN + OWNER_CHAT_ID
[ ] 8. Tao NEXTAUTH_SECRET
[ ] 9. docker compose up -d --build
[ ] 10. docker compose exec app npx prisma migrate deploy
[ ] 11. docker compose exec ollama ollama pull qwen2.5:7b
[ ] 12. Truy cap http://localhost:3000
[ ] 13. Chay: ae status (kiem tra CLI)
```

## Kiem tra
1. `docker compose up` -> all services healthy
2. `curl /api/health` -> status "healthy"
3. Ollama down -> status "degraded"
4. Postgres down -> status "unhealthy"
5. Auto-restart after crash
6. Setup tren PC moi < 30 phut

## Dependencies: ALL previous phases
## Lien quan: PRD F11 Production, D9 Deployment
