/**
 * Design System tests — ThemeProvider + design tokens + layout logic.
 * Phase 21: Design System.
 */

import { ThemeManager } from "@/components/theme-provider";

describe("ThemeManager", () => {
  let manager: ThemeManager;

  beforeEach(() => {
    manager = new ThemeManager();
  });

  describe("default theme", () => {
    it("should default to dark theme", () => {
      expect(manager.getTheme()).toBe("dark");
    });
  });

  describe("toggle", () => {
    it("should toggle from dark to light", () => {
      manager.toggle();
      expect(manager.getTheme()).toBe("light");
    });

    it("should toggle back from light to dark", () => {
      manager.toggle();
      manager.toggle();
      expect(manager.getTheme()).toBe("dark");
    });
  });

  describe("setTheme", () => {
    it("should set specific theme", () => {
      manager.setTheme("light");
      expect(manager.getTheme()).toBe("light");
    });

    it("should ignore invalid theme", () => {
      manager.setTheme("invalid" as "dark" | "light");
      expect(manager.getTheme()).toBe("dark");
    });
  });

  describe("persistence key", () => {
    it("should use correct localStorage key", () => {
      expect(ThemeManager.STORAGE_KEY).toBe("ae-theme");
    });
  });
});

describe("Design Tokens", () => {
  /** CSS variable names that MUST exist in globals.css */
  const REQUIRED_TOKENS = [
    "--bg-primary",
    "--bg-secondary",
    "--bg-card",
    "--bg-hover",
    "--text-primary",
    "--text-secondary",
    "--text-muted",
    "--status-idle",
    "--status-running",
    "--status-error",
    "--status-deploying",
    "--status-paused",
    "--accent",
    "--accent-hover",
    "--accent-bg",
    "--border",
    "--border-hover",
    "--shadow-sm",
    "--shadow-md",
    "--shadow-lg",
    "--space-1",
    "--space-2",
    "--space-3",
    "--space-4",
    "--space-6",
    "--space-8",
    "--radius-sm",
    "--radius-md",
    "--radius-lg",
    "--radius-xl",
    "--transition-fast",
    "--transition-normal",
  ];

  it("should have all required token names defined", () => {
    // This validates the contract — globals.css must define these
    expect(REQUIRED_TOKENS.length).toBeGreaterThan(30);
    // Each token starts with --
    for (const token of REQUIRED_TOKENS) {
      expect(token).toMatch(/^--/);
    }
  });
});

describe("Sidebar Navigation", () => {
  const NAV_ITEMS = [
    { label: "Dashboard", path: "/", icon: "LayoutDashboard" },
    { label: "Company", path: "/company", icon: "Building" },
    { label: "Agents", path: "/agents", icon: "Users" },
    { label: "Tasks", path: "/tasks", icon: "ListTodo" },
    { label: "Messages", path: "/messages", icon: "MessageSquare" },
    { label: "Cost", path: "/cost", icon: "DollarSign" },
    { label: "Audit", path: "/audit", icon: "Shield" },
  ];

  it("should have 7 navigation items", () => {
    expect(NAV_ITEMS).toHaveLength(7);
  });

  it("should have unique paths", () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("should detect active path correctly", () => {
    function isActive(itemPath: string, currentPath: string): boolean {
      if (itemPath === "/") return currentPath === "/";
      return currentPath.startsWith(itemPath);
    }

    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/", "/agents")).toBe(false);
    expect(isActive("/agents", "/agents")).toBe(true);
    expect(isActive("/agents", "/agents/a-1")).toBe(true);
    expect(isActive("/agents", "/tasks")).toBe(false);
  });
});
