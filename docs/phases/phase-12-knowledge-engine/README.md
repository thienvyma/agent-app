# Phase 12: Knowledge Engine (S12)

> Tru cot 3: Tri nho dai han - Hybrid Search + Context Building

---

## Muc tieu
KnowledgeBase (hybrid search) + ContextBuilder (build context cho moi task).

## Tai sao ContextBuilder la then chot?
TRUOC moi task, ContextBuilder tu dong:
1. Tim conversations lien quan -> inject
2. Tim documents lien quan -> inject
3. Tim corrections/rules lien quan -> inject
4. Gop thanh context -> them vao agent system prompt

-> Agent lam viec voi DAY DU context, khong bi "quen"

## Files tao moi

### 1. src/core/memory/knowledge-base.ts
class KnowledgeBase:
  - constructor(vectorStore: VectorStore, db: PrismaClient)
  - async search(query: string, options?: SearchOptions): KBResult[]
    Hybrid search:
    1. Semantic search: vectorStore.search(query) -> cosine similarity
    2. Keyword search: full-text search trong PostgreSQL
    3. Combine + re-rank: merge results, sort by combined score
    4. Filter by type, date, agent if specified
  - async getRelatedDocuments(taskDescription: string, limit: number): KBResult[]
  - async getAgentHistory(agentId: string, limit: number): KBResult[]
  - async getRelevantCorrections(taskDescription: string): CorrectionLog[]

interface SearchOptions:
  types?: VectorType[]
  agentId?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  minScore?: number  // threshold for relevance

### 2. src/core/memory/context-builder.ts
class ContextBuilder:
  - constructor(kb: KnowledgeBase, db: PrismaClient)
  - async buildContext(task: Task, agent: Agent): TaskContext
    1. Get agent SOP from DB
    2. Get relevant documents: kb.getRelatedDocuments(task.description)
    3. Get agent history: kb.getAgentHistory(agent.id)
    4. Get corrections: kb.getRelevantCorrections(task.description)
    5. Get tool descriptions for granted tools
    6. Compose into structured context string
  - formatContext(ctx: TaskContext): string
    Return formatted string ready for system prompt injection:
    === ROLE ===
    [agent SOP]
    === RELEVANT KNOWLEDGE ===
    [related documents]
    === PAST EXPERIENCE ===
    [relevant history]
    === RULES FROM PAST CORRECTIONS ===
    [corrections/rules]
    === AVAILABLE TOOLS ===
    [tool descriptions]

## CLI bo sung:
  ae memory search "query" [--type doc|conv|correction] [--limit 10]
  ae memory list --type DOCUMENT -> list all ingested documents

## Kiem tra
1. Hybrid search returns relevant results
2. ContextBuilder produces meaningful context for a task
3. Corrections are included when relevant
4. Context format is clean and readable

## Dependencies: Phase 10 (VectorStore), Phase 11 (data populated)
## Lien quan: PRD F5 KnowledgeBase/ContextBuilder
