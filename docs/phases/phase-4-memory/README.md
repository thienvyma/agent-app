# Phase 4: Memory & Knowledge Base (Sessions 6–7) ⭐ NEW

> **Status**: ⬜ Not Started
> **Sessions**: S6 (Vector DB + Embedding), S7 (Conversation Logger + Knowledge Base)
> **Phụ thuộc**: Phase 3 hoàn tất

---

## Mục Tiêu

Hệ thống trí nhớ cho toàn bộ công ty — agents nhớ mọi thứ, học từ kinh nghiệm, chia sẻ kiến thức.

## Tại Sao Phase Này Phải Sớm (Không Phải Cuối)

Ý tưởng gốc nói rõ: *"Mọi cuộc trò chuyện, tài liệu, và corrections đều phải embed vào Vector DB"*

- Agents CẦN memory TRƯỚC khi giao tiếp hiệu quả (Phase 5)
- Approval/Feedback cần memory để tìm relevant context (Phase 5, 8)
- Không có memory → agents bị "mất trí nhớ" mỗi session mới

## Session 6: Vector DB + Embedding Service

**Mục tiêu**: pgvector setup + embedding pipeline hoạt động

**Files tạo mới**:
```
src/core/memory/vector-store.ts         — pgvector CRUD (store/search/delete)
src/core/memory/embedding-service.ts    — Text → embedding vector (via Ollama)
src/core/memory/memory-types.ts         — MemoryEntry, SearchResult types
tests/memory/vector-store.test.ts
tests/memory/embedding-service.test.ts
```

**Tech choice: pgvector**
- Extension cho PostgreSQL → không cần DB mới
- Tích hợp với Prisma (via `@prisma/client` + raw SQL for vector ops)
- Semantic search + keyword search cùng 1 DB
- Production-ready, used by OpenAI, Supabase

**Prisma schema bổ sung**:
```prisma
model MemoryEntry {
  id          String   @id @default(uuid())
  agentId     String?  // null = shared company memory
  type        MemoryType // CONVERSATION, DOCUMENT, CORRECTION, FACT
  content     String   // raw text
  embedding   Unsupported("vector(1536)")?  // pgvector
  metadata    Json     // { source, taskId, channel, tags }
  createdAt   DateTime @default(now())
}

enum MemoryType {
  CONVERSATION
  DOCUMENT
  CORRECTION
  FACT
  PROCEDURE
}
```

**Embedding Service**:
```typescript
// Dùng Ollama embedding model (local, free)
class EmbeddingService {
  async embed(text: string): Promise<number[]>
  async embedBatch(texts: string[]): Promise<number[][]>
  async search(query: string, topK: number): Promise<SearchResult[]>
}
```

## Session 7: Conversation Logger + Knowledge Base

**Mục tiêu**: Auto-log mọi interaction + ingest tài liệu + semantic search

**Files tạo mới**:
```
src/core/memory/conversation-logger.ts  — Auto-log agent interactions
src/core/memory/document-ingester.ts    — Upload + chunk + embed tài liệu
src/core/memory/knowledge-base.ts       — Unified query interface
src/core/memory/context-builder.ts      — Build relevant context cho agent
tests/memory/conversation-logger.test.ts
tests/memory/knowledge-base.test.ts
```

**Conversation Logger**:
```typescript
// Tự động hook vào MessageBus — log MỌI interaction
class ConversationLogger {
  // Gọi sau mỗi message send/receive
  async log(interaction: {
    fromAgentId: string,
    toAgentId: string,
    message: string,
    response: string,
    taskId?: string,
    channel: 'internal' | 'telegram' | 'dashboard'
  }): Promise<void>
  // → Embed + store vào VectorStore
}
```

**Document Ingester**:
```typescript
// Owner upload tài liệu → chunk → embed → store
class DocumentIngester {
  async ingest(file: File, metadata: DocMetadata): Promise<void>
  // 1. Detect type (PDF, MD, DOCX, CSV)
  // 2. Extract text
  // 3. Chunk (500 tokens, 100 overlap)
  // 4. Embed each chunk
  // 5. Store in VectorStore with metadata

  async ingestText(text: string, metadata: DocMetadata): Promise<void>
  // Direct text ingestion (for web content, API data, etc.)
}
```

**Knowledge Base** (unified search):
```typescript
class KnowledgeBase {
  // Search across all memory types
  async search(query: string, filters?: {
    agentId?: string,       // agent-specific or shared
    type?: MemoryType[],    // CONVERSATION, DOCUMENT, etc.
    dateRange?: DateRange,
    topK?: number
  }): Promise<SearchResult[]>
}
```

**Context Builder** (quan trọng nhất):
```typescript
class ContextBuilder {
  // Trước mỗi task, build context from memories
  async buildContext(agentId: string, taskDescription: string): Promise<string>
  // 1. Search relevant conversations (last N + semantic match)
  // 2. Search relevant documents
  // 3. Search relevant corrections/rules
  // 4. Combine + rank by relevance
  // 5. Return formatted context string for injection vào system prompt
}
```

**Flow tích hợp**:
```
Owner hoặc Agent tạo message
  → MessageBus phát message
  → ConversationLogger hook: embed + store

Owner upload tài liệu
  → API upload → DocumentIngester: chunk + embed + store

Agent nhận task mới
  → ContextBuilder.buildContext(agentId, taskDescription)
  → Inject relevant memories vào system prompt
  → Agent thực hiện task VỚI context đầy đủ
```

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm — đặc biệt về embedding model choice, chunk strategy, retrieval method)*
