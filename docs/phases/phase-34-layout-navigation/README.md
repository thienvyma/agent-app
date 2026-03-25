# Phase 34: Dashboard Layout & Navigation (S34)

> Sidebar + Header + Routing cho TAT CA pages.

## Pages map (S21-S24 logic → React pages)

```
/ (Dashboard)          → Overview (da co page.tsx)
/agents                → Agent team management
/agents/[id]           → Agent detail + chat
/tasks                 → Task board (kanban-like)  
/tasks/[id]            → Task detail + approval
/budget                → Cost tracking + charts
/messages              → Message history + threads
/knowledge             → Knowledge base + search
/approvals             → Approval queue
/activity              → Activity log (audit)
/settings              → Company + tenant config
/scheduling            → Cron jobs + always-on
```

## Layout structure

```
┌──────────────────────────────────────────┐
│ Header (logo, search, user avatar)       │
├──────────┬───────────────────────────────┤
│ Sidebar  │ Main Content                  │
│          │                               │
│ Overview │  (page content here)          │
│ Agents   │                               │
│ Tasks    │                               │
│ Budget   │                               │
│ Messages │                               │
│ Knowledge│                               │
│ Approvals│                               │
│ Activity │                               │
│ Schedule │                               │
│ Settings │                               │
│          │                               │
│ ──────── │                               │
│ v0.1.0   │                               │
└──────────┴───────────────────────────────┘
```

## Files tao moi
1. `src/components/layout/sidebar.tsx` — Navigation sidebar
2. `src/components/layout/header.tsx` — Top header bar
3. `src/components/layout/dashboard-layout.tsx` — Wrapper layout
4. `src/app/layout.tsx` — Update root layout
5. `src/app/(dashboard)/layout.tsx` — Dashboard group layout
6. Tao tat ca page folders (empty page.tsx cho moi route)
7. `tests/ui/layout.test.ts`

## Design
- Sidebar: 250px, collapsible, dark glassmorphism
- Header: 60px, search bar, notifications bell, user avatar
- Active page: accent highlight trong sidebar
- Mobile: sidebar an, hamburger menu
- Animations: slide transitions giua pages
