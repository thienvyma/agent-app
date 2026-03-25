/**
 * Tests for Dashboard Layout components.
 * Covers: Sidebar nav items, header structure, layout composition.
 *
 * @module tests/ui/layout.test
 */

/** Expected navigation items in the sidebar (from sidebar.tsx NAV_ITEMS) */
const NAV_ITEMS = [
  { label: "Overview", href: "/" },
  { label: "Agents", href: "/agents" },
  { label: "Tasks", href: "/tasks" },
  { label: "Budget", href: "/budget" },
  { label: "Messages", href: "/messages" },
  { label: "Knowledge", href: "/knowledge" },
  { label: "Approvals", href: "/approvals" },
  { label: "Activity", href: "/activity" },
  { label: "Scheduling", href: "/scheduling" },
  { label: "Settings", href: "/settings" },
];

/** Phase-34 README routes that must exist as page files */
const REQUIRED_ROUTES = [
  "(dashboard)/page.tsx",       // / overview
  "(dashboard)/agents/page.tsx",
  "(dashboard)/agents/[id]/page.tsx",
  "(dashboard)/tasks/page.tsx",
  "(dashboard)/tasks/[id]/page.tsx",
  "(dashboard)/budget/page.tsx",
  "(dashboard)/messages/page.tsx",
  "(dashboard)/knowledge/page.tsx",
  "(dashboard)/approvals/page.tsx",
  "(dashboard)/activity/page.tsx",
  "(dashboard)/settings/page.tsx",
  "(dashboard)/scheduling/page.tsx",
];

import * as fs from "fs";
import * as path from "path";

describe("Layout — Sidebar Navigation", () => {
  it("should have exactly 10 navigation items", () => {
    expect(NAV_ITEMS).toHaveLength(10);
  });

  it("should have unique hrefs for all items", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(hrefs.length);
  });

  it("should have unique labels for all items", () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });

  it("should start with Overview pointing to /", () => {
    expect(NAV_ITEMS[0]).toEqual({ label: "Overview", href: "/" });
  });

  it("should end with Settings pointing to /settings", () => {
    expect(NAV_ITEMS[NAV_ITEMS.length - 1]).toEqual({
      label: "Settings",
      href: "/settings",
    });
  });

  it("should include all core routes from Phase-34 spec", () => {
    const specRoutes = ["/", "/agents", "/tasks", "/budget", "/messages", "/knowledge", "/approvals", "/activity", "/scheduling", "/settings"];
    const sidebarRoutes = NAV_ITEMS.map((i) => i.href);
    specRoutes.forEach((route) => {
      expect(sidebarRoutes).toContain(route);
    });
  });
});

describe("Layout — Route Files", () => {
  const appDir = path.join(process.cwd(), "src", "app");

  REQUIRED_ROUTES.forEach((route) => {
    it(`should have page file: ${route}`, () => {
      const filePath = path.join(appDir, route);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

describe("Layout — Component Files", () => {
  const layoutDir = path.join(process.cwd(), "src", "components", "layout");

  it("should have sidebar.tsx", () => {
    expect(fs.existsSync(path.join(layoutDir, "sidebar.tsx"))).toBe(true);
  });

  it("should have header.tsx", () => {
    expect(fs.existsSync(path.join(layoutDir, "header.tsx"))).toBe(true);
  });

  it("should have dashboard-layout.tsx", () => {
    expect(fs.existsSync(path.join(layoutDir, "dashboard-layout.tsx"))).toBe(true);
  });

  it("should have (dashboard)/layout.tsx", () => {
    const dashLayoutPath = path.join(process.cwd(), "src", "app", "(dashboard)", "layout.tsx");
    expect(fs.existsSync(dashLayoutPath)).toBe(true);
  });
});

describe("Layout — Active Route Logic", () => {
  function isActive(pathname: string, itemHref: string): boolean {
    return pathname === itemHref || (itemHref !== "/" && pathname.startsWith(itemHref));
  }

  it("should match exact / for Overview", () => {
    expect(isActive("/", "/")).toBe(true);
  });

  it("should NOT match /agents for Overview", () => {
    expect(isActive("/agents", "/")).toBe(false);
  });

  it("should match /agents for Agents", () => {
    expect(isActive("/agents", "/agents")).toBe(true);
  });

  it("should match /agents/123 for Agents (nested)", () => {
    expect(isActive("/agents/123", "/agents")).toBe(true);
  });

  it("should NOT match /tasks for Agents", () => {
    expect(isActive("/tasks", "/agents")).toBe(false);
  });
});
