# Phase 8: Intelligence — Feedback & Self-Learning (Session 14)

> **Status**: ⬜ Not Started
> **Sessions**: S14 (Feedback Loop + Self-Learning)
> **Phụ thuộc**: Phase 7 hoàn tất + Phase 4 (Memory)

---

## Mục Tiêu

Agent tự học từ corrections của owner — dùng Memory system (Phase 4) để store + retrieve rules.

## Session 14: Feedback Loop

**Files**:
```
src/core/feedback/feedback-loop.ts     — Process corrections → extract rules
src/core/feedback/correction-log.ts    — CorrectionLog CRUD (uses VectorStore)
src/core/feedback/prompt-injector.ts   — Inject rules vào system prompt (uses ContextBuilder)
tests/feedback/feedback-loop.test.ts
```

**Flow**: (tận dụng Memory system từ Phase 4)
```
Owner reject → FeedbackLoop.logCorrection()
  → CorrectionLog lưu vào DB + embed vào VectorStore (Phase 4)
  → Lần sau: ContextBuilder.buildContext() tự include relevant corrections
  → Agent nhận context đầy đủ VỚI rules từ kinh nghiệm
```

**Khác biệt so với plan cũ**: Giờ Feedback Loop **tích hợp với VectorStore** thay vì DB thường → semantic search chính xác hơn.

---

## Tương Lai (Phase 9+)

- Analytics dashboard (agent performance, cost trends)
- Visual workflow builder
- Multi-tenant SaaS
- Zalo integration (channel adapter)
- Agent marketplace
- Knowledge graphs (Cognee)
- Agent onboarding flow (training + test → deploy)

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
