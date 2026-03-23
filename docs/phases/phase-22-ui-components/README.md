# Phase 22: UI Components (S22)

> Shared components dung design system tokens
> Tat ca components = building blocks cho pages (P23-P24)

---

## Muc tieu
StatusBadge, AgentCard, OrgChart, TaskBoard - reusable, responsive.

## Files tao moi

### 1. src/components/status-badge.tsx
StatusBadge component:
  Props: {
    status: "IDLE" | "RUNNING" | "ERROR" | "DEPLOYING" | "PAUSED_BUDGET"
    size?: "sm" | "md" | "lg"
    showLabel?: boolean // default true
  }
  Render:
    - Colored dot (8px circle) + text label
    - Colors from CSS variables:
      IDLE -> var(--status-idle) + "Idle"
      RUNNING -> var(--status-running) + "Running" + pulse animation
      ERROR -> var(--status-error) + "Error" + red glow
      DEPLOYING -> var(--status-deploying) + "Deploying" + spin animation
      PAUSED_BUDGET -> var(--status-paused) + "Paused (Budget)"
  Animation:
    RUNNING: @keyframes pulse { 0% opacity:1; 50% opacity:0.5; 100% opacity:1 }
    DEPLOYING: @keyframes spin { from rotate:0deg; to rotate:360deg }

### 2. src/components/agent-card.tsx
AgentCard component:
  Props: {
    agent: Agent
    onDeploy?: (id: string) => void
    onUndeploy?: (id: string) => void
    onClick?: (id: string) => void
  }
  Render:
    +-----------------------------------------+
    |  [Avatar: role icon]  Agent Name        |
    |  Role: Marketing Manager     [StatusBadge]|
    |  Department: Marketing                    |
    |  Model: qwen2.5:7b                        |
    |  Tools: 3 granted                         |
    |  Today: 1,234 tokens                      |
    |  Last active: 5 min ago                   |
    |  [Deploy/Undeploy button]    [View Detail]|
    +-----------------------------------------+
  Style:
    - var(--bg-card) + glassmorphism
    - Hover: translateY(-2px) + shadow-lg transition
    - Deploy btn: accent color, Undeploy btn: error color
    - Size: auto grid, min 280px, max 400px

### 3. src/components/org-chart.tsx
OrgChart component:
  Props: {
    company: Company (nested departments + agents)
    onAgentClick?: (agentId: string) => void
  }
  Render:
    CEO [Running]
    +-- Marketing Department
    |   +-- Marketing Manager [Running]
    |   +-- Content Writer [Idle]
    +-- Finance Department
    |   +-- Finance Analyst [Running]
    +-- Design Department
        +-- Designer [Idle]
  Style:
    - Tree lines: var(--border)
    - Each node: small card with name + StatusBadge
    - Click node -> highlight + callback
    - Expand/collapse departments
    - Responsive: horizontal on desktop, vertical on mobile

### 4. src/components/task-board.tsx
TaskBoard component (Kanban):
  Props: {
    tasks: Task[]
    onStatusChange?: (taskId: string, newStatus: TaskStatus) => void
    onTaskClick?: (taskId: string) => void
  }
  Render:
    | PENDING | IN_PROGRESS | WAITING_APPROVAL | COMPLETED | FAILED |
    |---------|-------------|------------------|-----------|--------|
    | [Card]  | [Card]      | [Card]           | [Card]    | [Card] |
    | [Card]  | [Card]      |                  |           |        |
  Each card:
    - Description (max 2 lines, truncated)
    - Assigned agent name + avatar
    - Priority badge (1-3: red, 4-6: amber, 7-10: green)
    - Time since created ("2h ago")
    - Sub-task count if parent
  Features:
    - Drag-and-drop between columns (HTML5 DnD API)
    - Drop -> onStatusChange() -> API update
    - Column count badges
    - Empty state: "No tasks" with create button
  Style:
    - Columns: flex, gap var(--space-4)
    - Cards: var(--bg-card), radius-md
    - Dragging: opacity 0.5, shadow-lg

## Kiem tra
1. StatusBadge renders correct color + animation for each status
2. AgentCard shows all fields, hover animation works
3. OrgChart renders CEO -> Departments -> Agents tree
4. TaskBoard drag-drop changes column
5. All components responsive (mobile stacks)
6. All components use design system variables (no hardcoded colors)

## Dependencies: Phase 21 (design system CSS variables)
## Lien quan: PRD F7 Org chart visualization, Task board Kanban
