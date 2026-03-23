# Phase 6: UI & Integration Testing (Sessions 10–11)

> **Status**: ⬜ Not Started
> **Sessions**: S10 (Dashboard UI), S11 (Integration Test)
> **Phụ thuộc**: Phase 5 hoàn tất

---

## Mục Tiêu

Web dashboard đẹp, functional + full flow end-to-end test.

## Session 10: Dashboard UI

**Mục tiêu**: Modern SaaS dashboard, dark mode, responsive

**Pages**:
```
src/app/page.tsx                — Dashboard home (overview cards)
src/app/company/page.tsx        — Company management + org chart
src/app/agents/page.tsx         — Agent grid + real-time status
src/app/tasks/page.tsx          — Kanban task board
src/app/messages/page.tsx       — Message log viewer
```

**Components**:
```
src/components/org-chart.tsx    — Visual hierarchy tree
src/components/agent-card.tsx   — Agent status card (name, role, status badge)
src/components/task-board.tsx   — Kanban (PENDING | IN_PROGRESS | COMPLETED | FAILED)
src/components/status-badge.tsx — Color-coded status indicator
src/components/message-log.tsx  — Filterable message list
```

**Design requirements**:
- Dark mode default
- Real-time updates via Socket.IO
- Responsive (desktop first, mobile friendly)
- Org chart với drag-and-drop (stretch goal)

## Session 11: Integration Test

**Mục tiêu**: Chứng minh full flow hoạt động end-to-end

**Test scenario**:
```
1. POST /api/company → Tạo "Nội Thất Nhanh"
2. POST /api/departments → Tạo "Marketing"
3. POST /api/agents → Tạo CEO (reportsTo: null)
4. POST /api/agents → Tạo Marketing Manager (reportsTo: CEO)
5. POST /api/agents/ceo/deploy → Start CEO agent
6. POST /api/agents/marketing/deploy → Start Marketing agent
7. POST /api/agents/ceo/message → "Lên kế hoạch marketing tháng 4"
8. CEO phân tích → tạo Task → delegate cho Marketing
9. Marketing thực hiện → gửi kết quả
10. ApprovalEngine → approval_required → queue
11. Telegram Bot → gửi approval request
12. POST /api/approvals/:id/approve → Owner duyệt
13. Task completed → Dashboard hiện đúng
14. Verify: all statuses correct, messages logged, no errors
```

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
