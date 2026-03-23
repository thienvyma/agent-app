# Phase 22: UI Components (S22)

> Shared components dung design system tokens

---

## Muc tieu
StatusBadge, AgentCard, OrgChart, TaskBoard - reusable components.

## Files tao moi

### 1. src/components/status-badge.tsx
StatusBadge component:
  Props: status (IDLE|RUNNING|ERROR|DEPLOYING|PAUSED_BUDGET), size (sm|md|lg)
  Display: colored dot + text + subtle animation (pulse for RUNNING)
  Colors: IDLE=gray, RUNNING=green+pulse, ERROR=red, DEPLOYING=blue+spin, PAUSED=amber

### 2. src/components/agent-card.tsx
AgentCard component:
  Props: agent (Agent), onDeploy, onUndeploy, onClick
  Display: avatar (generated from role), name, role, department,
           StatusBadge, last activity time, token usage today
  Actions: Deploy/Undeploy button, view detail
  Hover: subtle lift + shadow animation

### 3. src/components/org-chart.tsx
OrgChart component:
  Props: company (Company with nested departments + agents)
  Display: hierarchical tree visualization
  CEO at top -> Departments -> Agents
  Each node shows: name, role, StatusBadge
  Interactive: click node -> expand/collapse, click agent -> detail modal

### 4. src/components/task-board.tsx
TaskBoard component (Kanban):
  Props: tasks (Task[]), onStatusChange, onAssign
  Columns: PENDING, IN_PROGRESS, WAITING_APPROVAL, COMPLETED, FAILED
  Each card: description (truncated), assigned agent, priority badge, time since created
  Drag-drop: move between columns -> update status via API
  Color coding: priority 1-3 red, 4-6 amber, 7-10 green

## Kiem tra
1. StatusBadge renders correct color for each status
2. AgentCard shows all agent info
3. OrgChart renders hierarchy correctly
4. TaskBoard drag-drop changes status

## Dependencies: Phase 21 (design system)
## Lien quan: PRD F7 Org chart, Task board Kanban
