/**
 * E2E Dashboard Flow Tests (Session 45).
 * Scenario 1: Owner creates task via Dashboard → pipeline → result.
 *
 * @module tests/e2e/dashboard-flow
 */

import * as fs from "fs";
import * as path from "path";

describe("E2E Dashboard Flow — File Existence (S45)", () => {
  it("should have src/components/ui/skeleton.tsx", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src", "components", "ui", "skeleton.tsx"))).toBe(true);
  });

  it("should have src/components/ui/error-boundary.tsx", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src", "components", "ui", "error-boundary.tsx"))).toBe(true);
  });

  it("should have src/components/ui/empty-state.tsx", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src", "components", "ui", "empty-state.tsx"))).toBe(true);
  });
});

describe("E2E Dashboard Flow — Task Creation", () => {
  function createPipeline() {
    const { createServiceContainer, createPipelineFromContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({ useMock: true });
    return { container, pipeline: createPipelineFromContainer(container) };
  }

  it("should deploy agent and execute task through pipeline", async () => {
    const { container, pipeline } = createPipeline();
    await container.engine.deploy({
      id: "marketing-agent", name: "Marketing", role: "marketing",
      sop: "Viết content", model: "test-model", tools: ["web_search"], skills: [],
    });

    const result = await pipeline.execute("marketing-agent", "Viết content marketing Q2");
    expect(result.agentId).toBe("marketing-agent");
    expect(result.message.length).toBeGreaterThan(0);
    expect(result.budgetStatus).toBeDefined();
    expect(result.contextInjected).toBeDefined();
  });

  it("should track cost after task execution", async () => {
    const { container, pipeline } = createPipeline();
    await container.engine.deploy({
      id: "finance-agent", name: "Finance", role: "finance",
      sop: "Tính ROI", model: "test-model", tools: [], skills: [],
    });

    await pipeline.execute("finance-agent", "Tính ROI dự án ABC");
    const usage = container.costTracker.getAgentUsage("finance-agent");
    expect(usage.totalTokens).toBeGreaterThan(0);
  });

  it("should update budget status after execution", async () => {
    const { container, pipeline } = createPipeline();
    await container.engine.deploy({
      id: "budget-test", name: "BudgetTest", role: "tester",
      sop: "test", model: "test-model", tools: [], skills: [],
    });

    const result = await pipeline.execute("budget-test", "Check budget");
    expect(["ok", "warning", "exceeded"]).toContain(result.budgetStatus);
  });
});
