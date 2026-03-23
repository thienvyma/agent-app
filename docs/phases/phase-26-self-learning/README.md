# Phase 26: Self-Learning (S26)

> Tru cot 3: Kha nang Tu hoc - Agent ngay cang gioi hon
> Owner reject -> system hoc -> next time agent lam dung

---

## Muc tieu
FeedbackLoop + CorrectionLog processing + PromptInjector.

## Vi du cu the

Lan 1:
  Owner: "Lap bao gia du an website"
  Agent Finance: { tong: 50,000,000 VND } (THIEU chi phi nhan cong)
  Owner: REJECT "Thieu chi phi nhan cong"
  System: Ghi CorrectionLog:
    context: "lap bao gia du an website"
    wrongOutput: "tong 50tr, khong co nhan cong"
    correction: "can cong them chi phi nhan cong"
    ruleExtracted: "Rule #47: Luon cong them chi phi nhan cong vao tong gia bao gia"
  System: Embed rule #47 vao VectorStore

Lan 2:
  Owner: "Lap bao gia du an mobile app"
  ContextBuilder: search "bao gia" -> tim thay Rule #47
  PromptInjector: inject Rule #47 vao system prompt
  Agent Finance prompt gom:
    [SOP goc]
    === RULES TU KINH NGHIEM ===
    Rule #47: Luon cong them chi phi nhan cong vao tong gia bao gia
  Agent Finance: { tong: 120,000,000 VND, bao gom 40tr nhan cong } (DUNG)
  Owner: APPROVE

## Files tao moi

### 1. src/core/feedback/feedback-loop.ts
class FeedbackLoop:
  - constructor(db: PrismaClient, vectorStore: VectorStore, embedService: EmbeddingService)
  - async processRejection(approvalId: string, ownerFeedback: string): void
    1. Load ApprovalRequest + Task
    2. Extract rule tu feedback (dung LLM: "Tu feedback nay, rut ra rule gi?")
    3. Create CorrectionLog record
    4. Embed rule -> store in VectorStore (type: CORRECTION)
    5. Log to AuditLog
  - async processModification(approvalId: string, modifications: string): void
    Similar but for modifications
  - async extractRule(context: string, wrongOutput: string, correction: string): string
    Goi LLM (qua IAgentEngine):
    "Given context: [context]
     Wrong output: [wrongOutput]
     Correction: [correction]
     Extract a clear, actionable rule:"
    -> Return rule text

### 2. src/core/feedback/correction-log.ts
class CorrectionLogManager:
  - constructor(db: PrismaClient)
  - async create(data: CreateCorrectionInput): CorrectionLog
  - async getByAgent(agentId: string): CorrectionLog[]
  - async getRelevant(query: string, limit: number): CorrectionLog[]
    Search by semantic similarity to query
  - async getStats(): { total, byAgent, mostCommonErrors }

### 3. src/core/feedback/prompt-injector.ts
class PromptInjector:
  - constructor(kb: KnowledgeBase, correctionManager: CorrectionLogManager)
  - async inject(agent: Agent, task: Task): string
    1. Get agent SOP (base prompt)
    2. Get relevant corrections: kb.getRelevantCorrections(task.description)
    3. Get relevant documents: kb.getRelatedDocuments(task.description)
    4. Format injected prompt:
       [Agent SOP]
       === RULES FROM PAST CORRECTIONS ===
       Rule #47: Luon cong them chi phi nhan cong...
       Rule #23: Kiem tra gia vat tu truoc khi bao gia...
       === RELEVANT KNOWLEDGE ===
       [related documents]
    5. Return complete system prompt

Integration point:
  AgentOrchestrator.sendMessage() MUST call PromptInjector.inject()
  BEFORE every task execution. This is the core learning loop.

## Kiem tra
1. Owner reject bao gia -> CorrectionLog created
2. Rule extracted by LLM matches feedback intent
3. Rule embedded in VectorStore -> searchable
4. Next similar task -> PromptInjector includes rule
5. Agent produces correct output with injected rule

## Edge Cases
- Owner feedback vague ("khong tot") -> ask for specific correction
- Too many rules (>50) -> prioritize by relevance score
- Conflicting rules -> newer rule takes precedence
- Rule no longer relevant -> decay mechanism (future improvement)

## Dependencies: Phase 10-12 (VectorStore, KnowledgeBase), Phase 15 (Approval -> rejection)
## Lien quan: PRD F10 Feedback Loop, D5 Self-Learning
