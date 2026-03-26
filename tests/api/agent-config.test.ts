/**
 * Agent Config — TDD tests for per-agent model configuration.
 *
 * Tests:
 * - PATCH route exists in agents/[id]/route.ts
 * - Route handles model update
 * - Route syncs with OpenClaw config
 * - Detail page has model edit UI
 * - Detail page has save functionality
 *
 * @module tests/api/agent-config
 */

import * as fs from "fs";
import * as path from "path";

const agentRouteIdPath = path.join(
  process.cwd(), "src", "app", "api", "agents", "[id]", "route.ts"
);
const agentDetailPagePath = path.join(
  process.cwd(), "src", "app", "(dashboard)", "agents", "[id]", "page.tsx"
);

describe("Per-Agent Model Configuration", () => {
  describe("PATCH /api/agents/[id]", () => {
    const routeContent = fs.readFileSync(agentRouteIdPath, "utf-8");

    it("should export a PATCH handler", () => {
      expect(routeContent).toContain("export async function PATCH");
    });

    it("should accept model field for update", () => {
      expect(routeContent).toContain("model");
      expect(routeContent).toContain("prisma.agent.update");
    });

    it("should sync model to OpenClaw config", () => {
      expect(routeContent).toContain("configSet");
      expect(routeContent).toContain("openclaw");
    });

    it("should accept sop, tools, skills fields", () => {
      expect(routeContent).toContain("sop");
      expect(routeContent).toContain("tools");
      expect(routeContent).toContain("skills");
    });
  });

  describe("Agent Detail Page — Edit UI", () => {
    const pageContent = fs.readFileSync(agentDetailPagePath, "utf-8");

    it("should have model edit input or select", () => {
      expect(pageContent).toContain("PATCH");
      expect(pageContent).toContain("model");
    });

    it("should have a save button for config changes", () => {
      // Look for save functionality
      expect(pageContent).toContain("Save");
    });
  });
});
