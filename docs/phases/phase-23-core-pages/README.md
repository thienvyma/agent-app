# Phase 23: Core Pages (S23)

> Dashboard pages: Home + Company + Agents + Cost/Budget

---

## Muc tieu
4 main pages connected to API, responsive, dark mode, real data.

## Files tao moi

### 1. src/app/page.tsx - Home/Overview Dashboard

Layout:
  +--------------------------------------------------+
  | Welcome back, [Owner Name]           [date/time]  |
  +------+------+------+------+-----------------------+
  | Agents|Tasks |Pending|Cost  |   Recent Activity    |
  |  5/3  | 12/5 |  2   |1.2k  |   Timeline           |
  +------+------+------+------+   - Agent CEO deployed |
  | Quick Actions                |   - Task completed   |
  | [Deploy] [Create Task]      |   - Approval pending  |
  | [Approve] [View Reports]    |   - Budget warning    |
  +------------------------------+---------------------+
  | Mini Org Chart (collapsed)  | Budget Alert Banner   |
  | CEO -> Marketing -> Finance | (if any agent > 80%)  |
  +------------------------------+---------------------+

Data fetching:
  - GET /api/health -> service status
  - GET /api/agents -> counts
  - GET /api/tasks -> counts by status
  - GET /api/approvals -> pending count
  - GET /api/cost/report?period=day -> today's cost
  - GET /api/audit?limit=10 -> recent activity

Stats cards:
  - Agents: "3/5 Active" (with mini sparkline chart)
  - Tasks: "5 Running / 12 Total"
  - Pending: "2 Approvals" (amber if > 0)
  - Cost: "1,234 tokens today"

### 2. src/app/company/page.tsx - Company Management

Layout:
  - Full OrgChart component (interactive)
  - Sidebar panel: Department details on click
  - Actions:
    Create Department button -> modal
    Rename Department -> inline edit
    Move Agent between departments -> drag
  - Department stats: agent count, task count, cost

### 3. src/app/agents/page.tsx - Agents Grid

Layout:
  +--------------------------------------------------+
  | Agents                    [Filter] [Deploy All]   |
  | [Status: All v] [Dept: All v] [Role: All v]      |
  +--------------------------------------------------+
  | [AgentCard] [AgentCard] [AgentCard]               |
  | [AgentCard] [AgentCard] [AgentCard]               |
  +--------------------------------------------------+

Features:
  - Grid of AgentCard components (responsive: 1-3 columns)
  - Filter: by status, department, role (dropdowns)
  - Bulk: Deploy All, Undeploy All
  - Click card -> detail modal:
    - Full config (SOP, model, tools, skills)
    - Tool permissions list (granted/revoked)
    - Activity log (last 20 audit entries)
    - Cost (tokens today, this week)
    - Deploy/Undeploy/Restart buttons

### 4. src/app/cost/page.tsx - Cost/Budget Dashboard

Layout:
  +--------------------------------------------------+
  | Cost Overview              [Period: Day v]        |
  +--------------------------------------------------+
  | Total: 12,345 tokens (.00)                      |
  +--------------------------------------------------+
  | Per-Agent Usage (bar chart)                       |
  | CEO:       |||||||||||||| 5,000                   |
  | Marketing: ||||||||     3,200                     |
  | Finance:   ||||||       2,100                     |
  +--------------------------------------------------+
  | Trend (line chart, last 7 days)                   |
  +--------------------------------------------------+
  | Budget Management                                 |
  | Agent    | Budget  | Used   | %   | Status       |
  | CEO      | 10,000  | 5,000  | 50% | OK           |
  | Marketing| 5,000   | 4,500  | 90% | WARNING      |
  | Finance  | 3,000   | 3,100  |103% | PAUSED       |
  +--------------------------------------------------+
  | [Set Budget] -> modal per agent                   |
  +--------------------------------------------------+

Charts: use lightweight library (Chart.js or recharts)

## Kiem tra
1. Home page loads with real stats from API < 2s
2. Company org chart interactive (expand/collapse/click)
3. Agents filter works correctly
4. Agent detail modal shows all config
5. Cost chart renders with data
6. Budget table shows correct percentages
7. All pages responsive (mobile layout)
8. Dark mode renders correctly on all pages

## Dependencies: Phase 16-17 (API routes), Phase 21-22 (design + components)
## Lien quan: PRD F7 Dashboard, F11 Cost/budget tracking
