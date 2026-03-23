# Phase 4: Memory & Knowledge Base (Sessions 6–7) — 3-Tier Architecture

> **Status**: ⬜ Not Started
> **Sessions**: S6 (App-Level Vector DB + Embedding), S7 (Knowledge Base + Context Builder)
> **Phụ thuộc**: Phase 3 hoàn tất

---

## Mục Tiêu

Xây tầng 2 (app-level) của hệ thống memory 3-tier. Tier 1 (OpenClaw) đã có sẵn.

## 3-Tier Memory Architecture

```
Tier 1: OpenClaw Native (PER-AGENT) — ĐÃ CÓ SẴN!
  ├── MEMORY.md — curated long-term facts
  ├── memory/YYYY-MM-DD.md — daily logs
  ├── Hybrid search: BM25 + vector
  └── Mem0 plugin: extract structured facts, chống mất khi compaction

Tier 2: App-Level (COMPANY-WIDE) — TA TỰ BUILD ← PHASE NÀY
  ├── pgvector (PostgreSQL extension)
  ├── ConversationLogger — log tất cả interactions
  ├── DocumentIngester — tài liệu công ty
  ├── KnowledgeBase — unified semantic search
  └── ContextBuilder — build context cho mỗi task

Tier 3: Session STM (REAL-TIME) — DÙNG REDIS ĐÃ CÓ
  └── Volatile session state
```

## Tại Sao Tier 1 Đủ Cho Per-Agent Nhưng Cần Tier 2?

OpenClaw memory chỉ biết per-agent — agent A không thấy MEMORY.md của agent B.

**Cần Tier 2 cho**:
- Cross-agent search: CEO tìm kinh nghiệm của Marketing agent
- Company knowledge base: bảng giá vật tư, SOP, tài liệu
- Owner corrections: CorrectionLog áp dụng cho NHIỀU agents
- Audit trail: toàn bộ actions của tất cả agents

## Session 6: pgvector + Embedding Service

**Mục tiêu**: pgvector setup + embedding pipeline hoạt động

**Files tạo mới**:
```
src/core/memory/vector-store.ts         — pgvector CRUD (store/search/delete)
src/core/memory/embedding-service.ts    — Text → vector (via Ollama local)
src/core/memory/memory-types.ts         — MemoryEntry, SearchResult types
tests/memory/vector-store.test.ts
tests/memory/embedding-service.test.ts
```

**Prisma bổ sung**:
```prisma
model MemoryEntry {
  id        String     @id @default(uuid())
  agentId   String?    // null = shared company memory
  type      MemoryType
  content   String
  embedding Unsupported("vector(1536)")?
  metadata  Json       // { source, taskId, channel, tags }
  createdAt DateTime   @default(now())
}

enum MemoryType {
  CONVERSATION  // agent interactions
  DOCUMENT      // company docs
  CORRECTION    // learned rules
  FACT          // extracted facts
  PROCEDURE     // SOPs, workflows
}
```

**Embedding Service** (Ollama local):
```typescript
class EmbeddingService {
  // Dùng Ollama nomic-embed-text hoặc bge-m3 (local, free)
  async embed(text: string): Promise<number[]>
  async embedBatch(texts: string[]): Promise<number[][]>
}
```

**CLI commands** (song song):
```
ae memory status              — vector DB stats
ae memory search "query"      — semantic search
ae memory ingest <file>       — ingest document
ae memory list --type DOCUMENT
```

## Session 7: Knowledge Base + Context Builder

**Mục tiêu**: Auto-log interactions + ingest documents + build context

**Files**:
```
src/core/memory/conversation-logger.ts  — Hook vào MessageBus → auto-log + embed
src/core/memory/document-ingester.ts    — Upload → chunk → embed → store
src/core/memory/knowledge-base.ts       — Unified search (keyword + vector)
src/core/memory/context-builder.ts      — Build context per agent per task
tests/memory/conversation-logger.test.ts
tests/memory/knowledge-base.test.ts
```

**Context Builder** (quan trọng nhất):
```typescript
class ContextBuilder {
  async buildContext(agentId: string, taskDescription: string): Promise<string> {
    // 1. Tier 2: Search relevant conversations from pgvector
    const conversations = await kb.search(taskDescription, { type: 'CONVERSATION', topK: 5 })
    
    // 2. Tier 2: Search relevant documents
    const docs = await kb.search(taskDescription, { type: 'DOCUMENT', topK: 3 })
    
    // 3. Tier 2: Search relevant corrections/rules
    const rules = await kb.search(taskDescription, { type: 'CORRECTION', agentId, topK: 10 })
    
    // 4. Tier 3: Get current session state from Redis
    const sessionState = await redis.get(`session:${agentId}`)
    
    // 5. Combine + rank by relevance + format
    return formatContext({ conversations, docs, rules, sessionState })
    
    // NOTE: Tier 1 (OpenClaw MEMORY.md) is handled by OpenClaw itself
    // → injected automatically by OpenClaw at session start
  }
}
```

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm — đặc biệt: embedding model choice, chunk strategy, Mem0 plugin config)*
