/**
 * S51 — Dashboard Live Data Tests.
 *
 * Verifies dashboard page fetches real data from APIs, not mock/hardcoded.
 *
 * @module tests/pages/dashboard-live
 */

import * as fs from "fs";
import * as path from "path";

const dashboardPath = path.join(
  process.cwd(), "src", "app", "(dashboard)", "page.tsx"
);

describe("S51 Dashboard Live Data", () => {
  it("should have dashboard page", () => {
    expect(fs.existsSync(dashboardPath)).toBe(true);
  });

  it("should fetch from /api/agents", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("/api/agents");
  });

  it("should fetch from /api/tasks", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("/api/tasks");
  });

  it("should fetch from /api/health", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("/api/health");
  });

  it("should NOT contain hardcoded mock arrays", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    // Should use fetch, not inline mock data
    expect(content).toContain("fetch(");
    // Should not have large hardcoded data arrays
    expect(content).not.toMatch(/const\s+agents\s*=\s*\[[\s\S]{200,}\]/);
  });

  it("should use useState for data storage", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("useState");
  });

  it("should use useEffect for data fetching", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("useEffect");
  });

  it("should be a client component", () => {
    const content = fs.readFileSync(dashboardPath, "utf-8");
    expect(content).toContain("\"use client\"");
  });
});
