# Phase 59: Fix Config + Verify CLI

> **Session 59** | 0 code files | Verification session
> **Mục đích**: Fix model config sai → verify OpenClaw CLI hoạt động end-to-end

---

## Bối Cảnh (Đã verify bằng live test)
- `openclaw.json` ghi model: `qwen2.5:7b` — **SAI**, server trả về `Qwen3.5-35B-A3B-Coder`
- `openclaw agent --agent main --message "hello"` → LLM timeout (gọi model sai tên)
- `openclaw health` → gateway healthy, 0 sessions
- `openclaw agents list` → agent `main` (default), model `ollama-lan/qwen2.5:7b`
- LAN server: `http://192.168.1.35:8080/v1`, API key: `sk-local`

## Hành Động

### 1. Fix model name trong OpenClaw config
```bash
openclaw config set providers.ollama-lan.models '["Qwen3.5-35B-A3B-Coder"]'
openclaw config set agents.defaults.model.primary "ollama-lan/Qwen3.5-35B-A3B-Coder"
```

### 2. Verify config
```bash
openclaw config validate
openclaw models list
# Expected: Qwen3.5-35B-A3B-Coder thay vì qwen2.5:7b
```

### 3. Test agent chat
```bash
openclaw agent --agent main --message "Say hello in one word"
# Expected: response từ Qwen (không timeout)
```

### 4. Test HTTP endpoints (sau khi model fix)
```powershell
# Test /v1/models
Invoke-RestMethod -Uri "http://127.0.0.1:18789/v1/models" -Headers @{ Authorization = "Bearer <token>" }

# Test /v1/chat/completions
Invoke-RestMethod -Uri "http://127.0.0.1:18789/v1/chat/completions" -Method POST -Body '...'
```

### 5. Document results
- Ghi lại: CLI response → format gì? (JSON? text?)
- Ghi lại: HTTP response → format gì? (JSON? HTML?)
- Ghi lại: latency, token usage, error messages

## Kiểm Tra Cuối Phase
- [ ] `openclaw models list` → hiển thị `Qwen3.5-35B-A3B-Coder`
- [ ] `openclaw agent --message` → response thành công (không timeout)
- [ ] HTTP endpoints → document status (hoạt động hay vẫn 404)
- [ ] PROGRESS.md updated
