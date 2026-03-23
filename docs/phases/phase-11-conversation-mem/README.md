# Phase 11: Conversation Memory (S11)

> Tru cot 3: Tri nho dai han - Logging + Document Ingestion

---

## Muc tieu
ConversationLogger (tu dong log + embed) + DocumentIngester (upload -> chunk -> embed).

## Tai sao can log moi thu?
- Moi cuoc tro chuyen cua agent = kien thuc cua cong ty
- Tai lieu noi bo (SOP, gia, quy trinh) = company knowledge base
- Khi owner sua sai -> log lam nguon cho Self-Learning (Phase 26)

## Files tao moi

### 1. src/core/memory/conversation-logger.ts
class ConversationLogger:
  - constructor(vectorStore: VectorStore, embedService: EmbeddingService)
  - async logConversation(agentId: string, messages: Message[]): void
    1. Format messages thanh text
    2. Embed text -> vector
    3. Store in VectorStore (type: CONVERSATION, sourceId: agentId)
  - async logTaskResult(task: Task): void
    Log task description + result + agent response
  - async logCorrection(correction: CorrectionLog): void
    1. Embed correction.ruleExtracted -> vector
    2. Store in VectorStore (type: CORRECTION)
    -> Phuc vu Phase 26 Self-Learning

### 2. src/core/memory/document-ingester.ts
class DocumentIngester:
  - constructor(vectorStore: VectorStore, embedService: EmbeddingService)
  - async ingest(filePath: string, metadata?: DocMetadata): IngestResult
    1. Read file (support: .md, .txt, .pdf, .csv)
    2. Chunk: split into 500-token chunks with 50-token overlap
    3. Embed each chunk
    4. Store all chunks in VectorStore (type: DOCUMENT)
    5. Return { chunksCreated, vectorIds }
  - async ingestText(text: string, source: string): IngestResult
    Same flow but from raw text
  - chunkText(text: string, chunkSize: number, overlap: number): string[]
    Split text into overlapping chunks

interface IngestResult:
  source: string
  chunksCreated: number
  vectorIds: string[]

## CLI bo sung:
  ae memory ingest <filePath> -> ingest file into knowledge base
  ae memory ingest --text "..." --source "manual" -> ingest raw text

## Kiem tra
1. Log conversation -> searchable in VectorStore
2. Ingest markdown file -> chunks created
3. Search ingested content -> relevant chunks returned
4. Log correction -> retrievable for Self-Learning

## Dependencies: Phase 10 (VectorStore, EmbeddingService)
## Lien quan: PRD F5 ConversationLogger/DocumentIngester
