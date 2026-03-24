# Phase 12: Knowledge Engine (S12)

> Tru cot 3: Tri nho dai han - LightRAG Graph Search + Context Building
> **D15**: Dùng LightRAG thay vì KnowledgeBase tự build (xem DECISIONS.md)

---

## Muc tieu
LightRAGClient (HTTP bridge đến LightRAG Python service)
+ ContextBuilder (build context cho moi task dùng LightRAG search).

## Tai sao LightRAG?
- **Graph-enhanced RAG**: Tự extract entities + relationships từ documents
- **Dual-level retrieval**: Granular (entity-level) + Thematic (topic-level)
- **Multi-agent**: "Agent Marketing hỏi kết quả Agent Finance" → graph traversal, chính xác hơn cosine search
- **Lightweight**: < 100 tokens per query, ~$0.15/document (vs GraphRAG $4-7)
- **PostgreSQL backend**: Dùng chung 1 DB, không cần Neo4j

## Kien truc

```
App (TypeScript)
  ├── DocumentIngester (Phase 11)
  │     ├── VectorStore (pgvector) ← basic search (giữ nguyên)
  │     └── LightRAGClient.insert() ← graph indexing (mới)
  │
  ├── LightRAGClient (Phase 12) ← HTTP bridge
  │     ├── insert(text, metadata) → LightRAG service
  │     ├── query(question, mode) → dual-level results
  │     └── deleteDocument(docId) → cleanup
  │
  ├── ContextBuilder (Phase 12) ← dùng LightRAG thay KnowledgeBase
  │     ├── LightRAG query (relationships + entities)
  │     ├── VectorStore search (basic cosine fallback)
  │     └── Compose → system prompt injection
  │
  └── LightRAG Service (Python, chạy riêng Docker)
        ├── LightRAG library
        ├── PostgreSQL backend (chung DB)
        └── Ollama (embedding + entity extraction)
```

## Files tao moi

### 1. src/core/memory/lightrag-client.ts
class LightRAGClient:
  - constructor(baseUrl: string = "http://localhost:9621")
  - async insert(text: string, metadata?: Record<string, unknown>): void
    POST /documents/text → LightRAG service
  - async query(question: string, mode: "naive" | "local" | "global" | "hybrid"): LightRAGResult[]
    POST /query → dual-level search
  - async deleteDocument(docId: string): void
    DELETE /documents/{docId}
  - async healthCheck(): boolean
    GET /health

### 2. src/core/memory/context-builder.ts
class ContextBuilder:
  - constructor(lightrag: LightRAGClient, vectorStore: VectorStore, db: PrismaClient)
  - async buildContext(task: Task, agent: Agent): TaskContext
    1. Get agent SOP from DB
    2. LightRAG query: task.description (mode: "hybrid") → relationships + entities
    3. VectorStore fallback: cosine search for recent conversations
    4. Get corrections: VectorStore search (type: CORRECTION)
    5. Get tool descriptions for granted tools
    6. Compose into structured context string
  - formatContext(ctx: TaskContext): string
    Return formatted string:
    === ROLE ===
    [agent SOP]
    === RELEVANT KNOWLEDGE (LightRAG) ===
    [graph-enhanced results]
    === PAST EXPERIENCE ===
    [vector search results]
    === RULES FROM PAST CORRECTIONS ===
    [corrections/rules]
    === AVAILABLE TOOLS ===
    [tool descriptions]

### 3. docker/lightrag/Dockerfile + docker-compose update
  - Python LightRAG service container
  - Port: 9621
  - PostgreSQL backend (chung DB)
  - Ollama URL: 192.168.1.35:8080

## CLI bo sung:
  ae memory search "query" [--mode naive|local|global|hybrid] [--limit 10]
  ae memory graph-status → show LightRAG service status, entity count

## Kiem tra
1. LightRAG service healthy: healthCheck() → true
2. Insert document → query related → returns graph-enhanced results
3. ContextBuilder produces context with LightRAG knowledge
4. Corrections included when relevant
5. Fallback to VectorStore if LightRAG service down

## Dependencies: Phase 10 (VectorStore), Phase 11 (data ingestion)
## Lien quan: PRD F5 KnowledgeBase/ContextBuilder, DECISIONS.md D15
