# Phase 23: Core Pages (S23)

> Dashboard pages: Home, Company, Agents, Cost/Budget

---

## Muc tieu
4 main dashboard pages connected to API, responsive, dark mode.

## Files tao moi

### 1. src/app/page.tsx - Home/Overview
  - Stats cards: Total Agents (active/idle), Active Tasks, Pending Approvals, Cost Today
  - Recent activity timeline (last 10 events)
  - Quick actions: Deploy agent, Create task, View approvals
  - Mini org chart (collapsed view)
  - Budget alert banner (if any agent over 80%)

### 2. src/app/company/page.tsx - Company Management
  - Full OrgChart component (interactive)
  - Department CRUD (create, rename, delete)
  - Agent count per department
  - Company settings

### 3. src/app/agents/page.tsx - Agents Grid
  - Grid of AgentCard components
  - Filter: by status, department, role
  - Bulk actions: deploy all, undeploy all
  - Agent detail modal: config, SOP, tools, permissions, activity log
  - Deploy/Undeploy buttons per agent

### 4. src/app/cost/page.tsx - Cost Dashboard
  - Per-agent token usage chart (bar chart)
  - Daily/weekly/monthly trend (line chart)
  - Budget limits table (agent, limit, usage, percentage)
  - Alert history (budget exceeded events)
  - Set budget modal

## Kiem tra
1. Home page loads with real stats from API
2. Company page shows org chart
3. Agents page shows all agents with correct status
4. Cost page shows usage data
5. All pages responsive (mobile sidebar collapses)

## Dependencies: Phase 16-17 (API routes), Phase 21-22 (design + components)
## Lien quan: PRD F7 Dashboard, F11 Cost/budget tracking
