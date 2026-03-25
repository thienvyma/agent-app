# Phase 39: Knowledge & Feedback Page (S39)

> /knowledge — Knowledge base search, document viewer.
> Wire: S10-S12 (Memory) + S26 (FeedbackLoop, PromptInjector)

## Tinh nang

### /knowledge
1. Knowledge base browser (documents, embeddings)
2. Semantic search (vector similarity)
3. Document upload → DocumentIngester
4. Knowledge entries table
5. Agent memory viewer (what each agent remembers)

### Feedback section (trong /settings hoac /knowledge)
1. Correction log viewer (S26 CorrectionLogManager)
2. View learned rules
3. Inject rules manually
4. Feedback statistics (total corrections, top keywords)

## Files tao moi
1. `src/app/(dashboard)/knowledge/page.tsx`
2. `src/app/(dashboard)/knowledge/components/search-bar.tsx`
3. `src/app/(dashboard)/knowledge/components/document-viewer.tsx`
4. `src/app/(dashboard)/knowledge/components/correction-list.tsx`
5. `tests/pages/knowledge-page.test.ts`
