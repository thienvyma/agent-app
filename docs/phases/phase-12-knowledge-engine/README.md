# Phase 12: Knowledge Engine (S12)

## Tru cot 3: Tri nho dai han - Search + Context

## Muc tieu
KnowledgeBase (hybrid search: keyword + semantic) +
ContextBuilder (build context cho moi task tu tat ca nguon).

## Session 12
- Files: knowledge-base.ts, context-builder.ts, tests/
- KnowledgeBase: hybrid search (keyword BM25 + semantic cosine similarity)
  -> tra ve documents lien quan nhat
- ContextBuilder: truoc moi task, tu dong:
  1. Tim conversations lien quan
  2. Tim documents lien quan
  3. Tim corrections/rules lien quan (tu CorrectionLog)
  4. Gop thanh context -> inject vao agent system prompt
- CLI: ae memory search query, ae memory list --type DOCUMENT
- Test: ContextBuilder returns meaningful context for a task

## Lien quan PRD: F5 KnowledgeBase/ContextBuilder
