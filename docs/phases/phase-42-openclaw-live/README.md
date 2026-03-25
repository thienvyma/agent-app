# Phase 42: OpenClaw Live Connection (S42)

> Ket noi OpenClawAdapter voi OpenClaw Gateway THAT.
> Sau phase nay, agents CHAY THAT voi AI model.

## Yeu cau
- OpenClaw Gateway chay tren port 18789
- Ollama chay voi model (qwen2.5:7b hoac tuong duong)
- Hoac dung `docker compose up` tu Phase 28

## Tasks
1. Test OpenClawAdapter.deploy() → tao session that
2. Test OpenClawAdapter.sendMessage() → AI tra loi that
3. Test OpenClawAdapter.undeploy() → xoa session
4. Wire Pipeline → OpenClawAdapter that (thay MockAdapter)
5. CEO Agent chay thu: gui "Lap ke hoach tuan" → nhan response
6. Multi-agent: CEO spawn sub-agent Marketing
7. Error handling: OpenClaw down → graceful fallback

## Config
```env
OPENCLAW_GATEWAY_URL=http://localhost:18789
# Hoac Docker: http://openclaw:18789
```

## Files tao moi/sua
1. `src/core/adapter/openclaw-adapter.ts` — verify + fix real connection
2. `src/core/adapter/adapter-factory.ts` — switch mock↔real via env
3. `tests/integration/openclaw-live.test.ts` — live connection tests
4. Environment flag: `USE_MOCK_ADAPTER=true|false`
