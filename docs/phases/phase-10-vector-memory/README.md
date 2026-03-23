# Phase 10: Vector Memory (S10)

> Tru cot 3: Tri nho dai han - Tier 2 (pgvector) + Tier 3 (Redis STM)
> Moi cuoc tro chuyen, tai lieu, va nhung lan owner chinh sua deu phai duoc embed.

---

## Muc tieu

Setup pgvector extension + VectorStore CRUD + EmbeddingService (Ollama local)
+ RedisSTM (session short-term memory).

## Kien truc Tri nho 3-Tier

Tier 1 (Per-Agent): OpenClaw MEMORY.md + Mem0 plugin
  -> Tu dong boi OpenClaw, KHONG can build
  -> Moi agent co memory rieng, luu trong OpenClaw

Tier 2 (Company-wide): pgvector trong PostgreSQL
  -> Build o Phase 10-12
  -> Cross-agent search, company KB, corrections
  -> Persistent, dung cho long-term knowledge

Tier 3 (Session): Redis
  -> Build o Phase 10 (RedisSTM)
  -> Session state, conversation cache, task progress
  -> Volatile, auto-expire, dung cho real-time

## Files tao moi

### 1. src/core/memory/vector-store.ts

class VectorStore:
  - constructor(db: PrismaClient)
  - async store(content: string, embedding: number[], metadata: VectorMetadata): string
    1. INSERT vao vectors table (voi pgvector extension)
    2. Return vector ID
  - async search(queryEmbedding: number[], limit: number, filter?: VectorFilter): VectorResult[]
    1. SELECT * FROM vectors ORDER BY embedding <=> queryEmbedding LIMIT limit
    2. Filter by type, agentId, dateRange
  - async delete(vectorId: string): void
  - async update(vectorId: string, metadata: Partial<VectorMetadata>): void

Prisma schema bo sung (them vao schema.prisma):
  model Vector:
    id        String   @id @default(uuid())
    content   String   @db.Text
    embedding Unsupported("vector(1536)")  // or 768 tuy model
    type      VectorType  // CONVERSATION, DOCUMENT, CORRECTION, RULE
    sourceId  String?     // taskId, agentId, etc.
    metadata  Json
    createdAt DateTime

  SQL raw cho pgvector:
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE INDEX ON vectors USING ivfflat (embedding vector_cosine_ops);

### 2. src/core/memory/embedding-service.ts

class EmbeddingService:
  - constructor(ollamaUrl: string = "http://localhost:11434")
  - async embed(text: string): number[]
    1. POST http://localhost:11434/api/embeddings
       body: { model: "nomic-embed-text", prompt: text }
    2. Return embedding vector
  - async embedBatch(texts: string[]): number[][]
    1. Map texts -> embed each (with rate limiting)
  - getModelDimension(): number
    nomic-embed-text: 768
    bge-m3: 1024

### 3. src/core/memory/redis-stm.ts

class RedisSTM:
  - constructor(redis: Redis)
  - async setSessionState(agentId: string, state: SessionState): void
    1. SET agent:session:{agentId} JSON TTL 3600
  - async getSessionState(agentId: string): SessionState | null
  - async cacheConversation(agentId: string, messages: Message[]): void
    1. LPUSH agent:conv:{agentId} JSON TTL 7200
  - async getRecentConversation(agentId: string, limit: number): Message[]
  - async setTaskProgress(taskId: string, progress: TaskProgress): void
    1. SET task:progress:{taskId} JSON TTL 86400
  - async getTaskProgress(taskId: string): TaskProgress | null
  - async clearAgent(agentId: string): void
    1. DEL all keys matching agent:*:{agentId}

### 4. src/types/memory.ts

interface VectorMetadata:
  type: VectorType
  agentId?: string
  taskId?: string
  source: string      // "conversation", "document", "correction"
  timestamp: Date

interface VectorResult:
  id: string
  content: string
  score: number        // cosine similarity 0-1
  metadata: VectorMetadata

interface SessionState:
  currentTaskId?: string
  conversationHistory: string[]
  lastActivity: Date
  tokenCount: number

interface TaskProgress:
  taskId: string
  status: string
  percentComplete: number
  lastUpdate: Date

enum VectorType:
  CONVERSATION
  DOCUMENT
  CORRECTION
  RULE
  KNOWLEDGE

## Dependencies
- Phase 1: PostgreSQL + Redis running (Docker)
- Phase 5: Prisma schema (them Vector table)
- Ollama running locally (cho embedding)

## Kiem tra
1. pgvector extension enabled: SELECT * FROM pg_extension WHERE extname = 'vector'
2. Embed text: EmbeddingService.embed("test") -> 768-dim vector
3. Store + search: store "hello world" -> search "hi" -> returns "hello world" (score > 0.7)
4. Redis STM: set session state -> get -> matches
5. Redis TTL: set with TTL -> wait -> expired

## Edge Cases
- Ollama khong chay -> EmbeddingService throws clear error
- pgvector dimension mismatch (768 vs 1024) -> config validation
- Redis connection lost -> graceful fallback
- Large document embedding -> chunking (Phase 11)
- Batch embedding rate limiting

## CLI
  ae memory status -> {vectorCount: N, redisKeys: M, ollamaStatus: "connected"}

## Lien quan
- PRD: F5 Memory 3-Tier
- Decisions: D12 Memory Architecture, D7 pgvector
- Phase truoc: P5 (schema), P1 (Docker)
- Phase sau: P11 (ConversationLogger), P12 (KnowledgeBase), P26 (Self-Learning)
