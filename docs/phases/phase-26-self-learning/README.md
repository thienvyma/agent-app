# Phase 26: Self-Learning (S26)

## Tru cot 3: Kha nang Tu hoc (Feedback Loop)

## Muc tieu
FeedbackLoop + CorrectionLog + PromptInjector.
Agent ngay cang gioi hon sau moi lan owner sua sai.

## Session 26
- Files: feedback-loop.ts, correction-log.ts, prompt-injector.ts, tests/
- FeedbackLoop: owner reject/sua output -> he thong tu dong:
  1. Ghi CorrectionLog (context, output sai, correction, rule rut ra)
  2. Embed correction vao VectorStore
- PromptInjector: truoc moi task, tu dong:
  1. Tim corrections lien quan bang semantic search
  2. Inject relevant rules vao agent system prompt
- VD: Owner reject bao gia "Thieu chi phi nhan cong"
  -> Rule #47: "Luon cong them chi phi nhan cong vao bao gia"
  -> Lan sau agent lap bao gia -> system prompt co rule #47
- Test: owner reject -> rule created -> next time agent applies rule

## Lien quan PRD: F10 Feedback Loop, D5 Self-Learning
