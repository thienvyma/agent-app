# Phase 21: Design System (S21)

> Visual foundation cho dashboard - Dark mode, premium, professional

---

## Muc tieu
CSS variables + color palette + typography + sidebar/header layout + theme provider.
Toan bo component o Phase 22-24 dung design system nay.

## Design Philosophy
- Dark mode DEFAULT (admin dashboards look better dark)
- Glassmorphism elements (subtle transparency + backdrop blur)
- Status colors consistent toan he thong
- Micro-animations = premium feel (hover, transitions, loading)
- Responsive: sidebar collapse on < 768px

## Files tao moi

### 1. src/app/globals.css
Root CSS variables:

:root {
  /* Background */
  --bg-primary: #0f172a;     /* slate-900 */
  --bg-secondary: #1e293b;   /* slate-800 */
  --bg-card: rgba(30, 41, 59, 0.8);  /* glass effect */
  --bg-hover: rgba(51, 65, 85, 0.5);

  /* Text */
  --text-primary: #f1f5f9;   /* slate-100 */
  --text-secondary: #94a3b8; /* slate-400 */
  --text-muted: #64748b;     /* slate-500 */

  /* Agent Status Colors */
  --status-idle: #94a3b8;    /* gray */
  --status-running: #22c55e; /* green */
  --status-error: #ef4444;   /* red */
  --status-deploying: #3b82f6; /* blue */
  --status-paused: #f59e0b;  /* amber */

  /* Accent */
  --accent: #6366f1;         /* indigo-500 */
  --accent-hover: #818cf8;   /* indigo-400 */
  --accent-bg: rgba(99, 102, 241, 0.1);

  /* Borders & Shadows */
  --border: rgba(148, 163, 184, 0.1);
  --border-hover: rgba(148, 163, 184, 0.2);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
  --glass: backdrop-filter: blur(12px);

  /* Spacing Scale (4px base) */
  --space-1: 0.25rem;  --space-2: 0.5rem;
  --space-3: 0.75rem;  --space-4: 1rem;
  --space-6: 1.5rem;   --space-8: 2rem;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}

[data-theme="light"] {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: rgba(255, 255, 255, 0.9);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border: rgba(0, 0, 0, 0.1);
}

Typography:
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  Base size: 14px, line-height: 1.6

### 2. src/components/layout/sidebar.tsx
Sidebar navigation:
  - Logo: "AE" icon + "Agentic Enterprise" text
  - Nav links (icon + label):
    Home (LayoutDashboard icon)
    Company (Building icon)
    Agents (Users icon)
    Tasks (ListTodo icon)
    Messages (MessageSquare icon)
    Cost (DollarSign icon)
    Audit (Shield icon)
  - Active state: accent background + white text
  - Collapse: < 768px -> icon only, > 768px -> full
  - Bottom: system status indicator (green dot = healthy)
  - Hover: tooltip on collapsed mode

### 3. src/components/layout/header.tsx
Header bar:
  - Left: page title (dynamic, e.g. "Dashboard", "Agents")
  - Center: search bar (future: global search)
  - Right:
    Notification bell (pending approvals count badge)
    Theme toggle (sun/moon icon)
    User avatar + dropdown (Settings, Logout)

### 4. src/components/theme-provider.tsx
  ThemeContext: { theme: 'dark' | 'light', toggle() }
  - Default: dark
  - Persist to localStorage
  - Detect system preference: prefers-color-scheme
  - Apply [data-theme] attribute to document.documentElement

## Kiem tra
1. Dark mode renders correctly (no white flash)
2. Light mode toggle works
3. Sidebar navigation highlights active page
4. Sidebar collapses on mobile (< 768px)
5. Theme persists across page refreshes
6. Google Fonts loads correctly (Inter)

## Dependencies: Phase 1 (Next.js)
## Lien quan: PRD F7 Dashboard localhost
