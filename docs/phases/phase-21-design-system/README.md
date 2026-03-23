# Phase 21: Design System (S21)

> Visual foundation cho dashboard - Dark mode, premium look

---

## Muc tieu
CSS variables + color palette + typography + sidebar/header layout + theme provider.

## Design Principles
- Dark mode default (professional look cho admin dashboard)
- Glassmorphism elements (subtle transparency)
- Status colors: green (active), amber (warning), red (error), blue (info)
- Micro-animations: hover effects, transitions, loading states

## Files tao moi

### 1. src/app/globals.css
CSS Variables (dark mode):
  --bg-primary: #0f0f23
  --bg-secondary: #1a1a3e
  --bg-card: rgba(30, 30, 60, 0.8)
  --text-primary: #e2e8f0
  --text-secondary: #94a3b8
  --accent: #6366f1 (indigo)
  --success: #22c55e
  --warning: #f59e0b
  --error: #ef4444
  --border: rgba(148, 163, 184, 0.1)
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.3)

Typography: font-family: 'Inter', sans-serif (import tu Google Fonts)
Spacing scale: 4px base (0.25rem increments)
Border radius: 8px default, 12px cards, 16px modals

### 2. src/components/layout/sidebar.tsx
  - Logo + app name
  - Navigation links: Home, Company, Agents, Tasks, Messages, Cost, Audit
  - Active state indicator
  - Collapse/expand toggle
  - System status indicator (bottom)

### 3. src/components/layout/header.tsx
  - Page title (dynamic)
  - Search bar
  - Notification bell (pending approvals count)
  - User avatar + dropdown (settings, logout)
  - Theme toggle (dark/light)

### 4. src/components/theme-provider.tsx
  - React Context for theme
  - localStorage persistence
  - System preference detection

## Kiem tra
1. Layout renders correctly in dark mode
2. Sidebar navigation works
3. Theme toggle switches light/dark
4. Responsive: sidebar collapses on mobile

## Dependencies: Phase 1 (Next.js)
## Lien quan: PRD F7 Dashboard localhost
