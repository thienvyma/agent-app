/**
 * Fix — Agent Detail API Route Tests.
 *
 * TDD: Test FIRST for GET /api/agents/[id] route.
 *
 * @module tests/integration/agent-detail-route
 */

import * as fs from "fs";
import * as path from "path";

const routePath = path.join(
  process.cwd(), "src", "app", "api", "agents", "[id]", "route.ts"
);

describe("Agent Detail API Route", () => {
  it("should have /api/agents/[id]/route.ts file", () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("should export GET handler", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("export async function GET");
  });

  it("should use Prisma to find agent by ID", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("prisma.agent.findUnique");
  });

  it("should include department relation", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("department");
  });

  it("should include tasks relation", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("tasks");
  });

  it("should return 404 when agent not found", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("404");
  });

  it("should have JSDoc documentation", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("@module");
  });

  it("should use apiResponse helper", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("apiResponse");
  });

  it("should NOT directly modify OpenClaw", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).not.toContain("writeFileSync");
  });
});
