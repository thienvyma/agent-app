# 🔌 OpenClaw Integration Guide

> Tất cả thông tin cần biết về OpenClaw để wrap hiệu quả.
> AI đọc file này TRƯỚC khi code adapter hoặc bất kỳ tính năng nào liên quan đến OpenClaw.

---

## 1. OpenClaw Là Gì?

- **Loại**: Open-source AI agent runtime (Node.js)
- **Tác giả**: Community (MIT license)
- **Cài đặt**: `npm install -g openclaw`
- **Chạy**: `openclaw` → Gateway start trên port 18789
- **Phiên bản dùng**: latest npm

## 2. Gateway Architecture

```
OpenClaw Gateway (port 18789)
├── WebSocket Server (client connections)
├── HTTP REST API (tool invocation, session management)
├── Agent Runtime (AI loop: context → model → tools → persist)
├── Session Manager (long-lived sessions)
├── Channel Manager (Telegram, Discord, Slack, WhatsApp...)
├── Plugin System (4-layer: discovery → enable → validate → load)
└── Cron Scheduler
```

**Quan trọng**: Gateway là single process, quản lý TẤT CẢ sessions.

## 3. Built-in Tools (26+)

| Category | Tools | Cách app dùng |
|---|---|---|
| **File System** | `read`, `write`, `edit`, `apply_patch` | Agent đọc/ghi workspace files |
| **Execution** | `exec`, `process` | Agent chạy shell commands |
| **Browser** | `browser` | Agent duyệt web (Playwright) |
| **Web** | `web_search`, `web_fetch` | Agent search + fetch content |
| **Communication** | `message` (agent_send) | **Agent gửi message cho agent khác** |
| **Sub-agents** | `sessions_spawn`, `sessions_list`, `sessions_history`, `sessions_send` | **Multi-agent delegation** |
| **Agent listing** | `agents_list` | Liệt kê agents đang chạy |
| **Scheduling** | `cron` | **Cron jobs cho CEO always-on** |
| **Visual** | `canvas`, `nodes` | Output đồ họa |
| **Image** | `image`, `image_generate` | Tạo/xử lý ảnh |
| **Gateway** | `gateway` | Control Gateway từ bên trong agent |

### Tools CHÚNG TA SẼ DÙNG NHIỀU NHẤT:
- ✅ `sessions_spawn` — CEO delegate task bằng cách spawn sub-agent
- ✅ `message` / `sessions_send` — Agent-to-agent communication
- ✅ `cron` — CEO poll mỗi 5 phút
- ✅ `web_search` / `web_fetch` — Research tasks
- ✅ `exec` — Agent chạy scripts

## 4. Session System

```
Session formats:
  agent:<agentType>:<sessionId>           — Main agent session
  agent:<agentType>:subagent:<uuid>       — Sub-agent session

Sessions_spawn behavior:
  - NON-BLOCKING: trả về ngay runId + childSessionKey
  - ISOLATED: mỗi sub-agent có session riêng
  - SHARED WORKSPACE: sub-agent truy cập parent's workspace files
  - AUTO-REPORT: kết quả tự gửi về parent chat channel
  - MAX DEPTH: default 1, max 5 (nested sub-agents)
```

## 5. Skills System (SKILL.md)

```markdown
# Ví dụ SKILL.md cho Marketing Agent
---
name: marketing-campaign
description: Hướng dẫn agent lên kế hoạch marketing
---

## Khi được yêu cầu lên kế hoạch marketing:
1. Phân tích target audience
2. Chọn kênh phù hợp (Facebook, TikTok, Google Ads)
3. Viết content cho từng kênh
4. Ước tính budget
5. Tạo timeline
6. Báo cáo kết quả cho CEO
```

- Skills cài từ **ClawHub** (community) hoặc viết custom
- Chúng ta sẽ viết skills riêng cho từng role trong công ty

## 6. Memory System

```
Cơ chế mặc định:
  MEMORY.md          — Long-term knowledge (agent ghi nhớ)
  daily-logs/        — Session-level context per day
  SQLite vector      — Semantic search across memories

Plugins nâng cao:
  Supermemory        — Auto-recall across channels
  Mem0               — Persistent facts outside agent lifecycle
  QMD                — Hybrid retrieval (keyword + semantic)
```

## 7. Config Structure

```json
// ~/.config/openclaw/openclaw.json
{
  "models": {
    "providers": {
      "ollama-lan": {
        "type": "openai-compatible",
        "baseUrl": "http://192.168.1.35:8080/v1",
        "apiKey": "none",
        "models": {
          "qwen3.5-35b": {
            "id": "Qwen_Qwen3.5-35B-A3B-Q4_K_M.gguf"
          }
        }
      }
    },
    "default": "ollama-lan/qwen3.5-35b"
  },
  "agents": {
    "ceo": {
      "model": "ollama-lan/qwen3.5-35b",
      "systemPrompt": "You are the CEO..."
    }
  }
}
```

## 8. Gateway API Endpoints (Adapter sẽ wrap)

> [!IMPORTANT]
> Đây là API surface chúng ta giao tiếp. Cần verify lại khi bắt đầu Session 3.

```
# Sessions
GET    /api/sessions              → List all sessions
POST   /api/sessions              → Create new session
GET    /api/sessions/:key         → Get session details
DELETE /api/sessions/:key         → Destroy session

# Chat
POST   /api/sessions/:key/chat   → Send message to session
GET    /api/sessions/:key/history → Get chat history

# Agents
GET    /api/agents                → List agent configs
POST   /api/agents                → Add agent config

# Tools
POST   /api/tools/invoke          → Invoke tool directly
GET    /api/tools/catalog         → List available tools

# Status
GET    /api/status                → Gateway health check

# Models
GET    /api/models                → List available models
```

## 9. Feature Mapping: Wrap vs Build

| Feature | OpenClaw có? | Chúng ta wrap | Chúng ta build |
|---|---|---|---|
| Agent sessions | ✅ | ✅ Wrap | |
| Multi-agent spawn | ✅ `sessions_spawn` | ✅ Wrap | |
| Agent communication | ✅ `message` | ✅ Wrap | |
| Tool execution | ✅ 26+ built-in | ✅ Wrap | |
| Skill system | ✅ SKILL.md | ✅ Wrap + custom skills | |
| Cron scheduling | ✅ `cron` | ✅ Wrap | |
| Memory | ✅ file-based + vector | ✅ Wrap | |
| **Company org chart** | ❌ | | ✅ Build |
| **Department hierarchy** | ❌ | | ✅ Build |
| **Role SOP enforcement** | ❌ | | ✅ Build |
| **Task management** | ❌ | | ✅ Build |
| **Approval workflow** | ❌ | | ✅ Build |
| **Feedback / self-learn** | ❌ | | ✅ Build |
| **Owner dashboard** | ❌ | | ✅ Build |
| **Analytics** | ❌ | | ✅ Build (Phase 2) |
| Telegram channel | ✅ Plugin | Evaluate | Maybe build custom |

> **~60% wrap từ OpenClaw, ~40% tự build** (phần Company Intelligence)
