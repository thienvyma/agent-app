# Phase 11: Conversation Memory (S11)

## Tru cot 3: Tri nho dai han - Logging + Ingestion

## Muc tieu
ConversationLogger (tu dong log + embed conversations) +
DocumentIngester (upload -> chunk -> embed tai lieu).

## Session 11
- Files: conversation-logger.ts, document-ingester.ts, tests/
- ConversationLogger: moi cuoc tro chuyen cua agent duoc log + embed vao VectorStore
- DocumentIngester: upload file (PDF, MD, TXT) -> chunk -> embed -> searchable
- Moi lan owner sua sai agent -> duoc ghi log (cho Self-Learning P26)
- CLI: ae memory ingest file-path
- Test: log conversation -> embed -> semantic search tra ve

## Lien quan PRD: F5 ConversationLogger/DocumentIngester, Moi tai lieu duoc embed
