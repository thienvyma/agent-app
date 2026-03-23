# Phase 10: Vector Memory (S10)

## Tru cot 3: Tri nho dai han - Tier 2 + Tier 3

## Muc tieu
pgvector setup + VectorStore CRUD + EmbeddingService (Ollama) + RedisSTM (Tier 3).

## Session 10
- Files: vector-store.ts, embedding-service.ts, redis-stm.ts, types/memory.ts, tests/
- VectorStore: CRUD vectors trong PostgreSQL + pgvector extension
- EmbeddingService: Ollama local (nomic-embed-text / bge-m3)
- RedisSTM (Tier 3): session state, conversation cache, task progress (volatile, auto-expire)
- 3-Tier Memory:
  Tier 1: OpenClaw MEMORY.md + Mem0 (per-agent, tu dong)
  Tier 2: pgvector (company KB, cross-agent search, corrections)
  Tier 3: Redis STM (session cache, real-time state)
- CLI: ae memory status
- Test: embed text -> store -> semantic search + Redis set/get/expire

## Lien quan PRD: F5 Memory 3-Tier, D12 Memory Architecture
