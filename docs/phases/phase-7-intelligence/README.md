# Phase 7: Intelligence — Feedback & Self-Learning (Session 12)

> **Status**: ⬜ Not Started
> **Sessions**: S12 (Feedback Loop)
> **Phụ thuộc**: Phase 6 hoàn tất

---

## Mục Tiêu

Agent tự học từ corrections của owner — ngày càng giỏi hơn.

## Session 12: Feedback Loop

**Files**:
```
src/core/feedback/feedback-loop.ts     — Process corrections → extract rules
src/core/feedback/correction-log.ts    — CorrectionLog CRUD (DB)
src/core/feedback/prompt-injector.ts   — Inject rules vào system prompt
tests/feedback/feedback-loop.test.ts
```

**Flow chi tiết**:
```
1. Owner reject task output (qua Telegram hoặc Dashboard)
2. FeedbackLoop.logCorrection({
     agentId: "marketing-001",
     taskId: "task-abc",
     originalOutput: "Báo giá: 100 triệu",
     correction: "Thiếu chi phí nhân công",
     ruleExtracted: "Luôn cộng chi phí nhân công vào báo giá"
   })
3. CorrectionLog lưu vào DB
4. Lần sau agent marketing nhận task báo giá:
   - PromptInjector.getRelevantRules("marketing-001", "báo giá")
   - Tìm trong CorrectionLog (semantic search)
   - Inject vào system prompt: "RULES từ kinh nghiệm: #47: Luôn cộng nhân công"
5. Agent output lần này đã bao gồm chi phí nhân công ✅
```

**CorrectionLog schema**:
```
id, agentId, taskId, 
originalOutput, 
ownerCorrection, 
ruleExtracted,     ← AI tự rút ra rule từ correction
ruleCategory,      ← phân loại: pricing, content, process...
createdAt
```

**PromptInjector logic**:
```typescript
// Trước mỗi task:
const rules = await correctionLog.findRelevant(agentId, taskContext)
const injectedPrompt = `
${agent.systemPrompt}

## IMPORTANT RULES (learned from past corrections):
${rules.map(r => `- ${r.ruleExtracted}`).join('\n')}
`
```

---

## Tương Lai (Phase 8+)

Các tính năng mở rộng sau khi MVP hoàn thành:
- Analytics dashboard (agent performance metrics)
- Visual workflow builder
- Multi-tenant (SaaS cho nhiều công ty)
- Zalo integration
- Advanced memory (knowledge graphs)
- Agent marketplace (share skills/agents)

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
