/**
 * S56 — Pipeline Execution Viewer Tests.
 *
 * Verifies pipeline viewer component, agent detail integration, and pipeline module.
 *
 * @module tests/integration/pipeline-viewer-ui
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// 1. PIPELINE VIEWER COMPONENT
// ══════════════════════════════════════════════

describe("S56 Pipeline Viewer — Component", () => {
  const viewerPath = path.join(
    process.cwd(), "src", "app", "(dashboard)", "agents", "components", "pipeline-viewer.tsx"
  );

  it("should have pipeline-viewer component", () => {
    expect(fs.existsSync(viewerPath)).toBe(true);
  });

  it("should define all 7 pipeline steps", () => {
    const content = fs.readFileSync(viewerPath, "utf-8");
    expect(content).toContain("Approval");
    expect(content).toContain("Context");
    expect(content).toContain("Execute");
    expect(content).toContain("Cost");
    expect(content).toContain("Budget");
    expect(content).toContain("Log");
    expect(content).toContain("Publish");
  });

  it("should call /api/agents/[id]/chat for execution", () => {
    const content = fs.readFileSync(viewerPath, "utf-8");
    expect(content).toContain("/api/agents/");
    expect(content).toContain("/chat");
  });

  it("should track step status (pending/running/done/error)", () => {
    const content = fs.readFileSync(viewerPath, "utf-8");
    expect(content).toContain("pending");
    expect(content).toContain("running");
    expect(content).toContain("done");
    expect(content).toContain("error");
  });

  it("should export PipelineViewer", () => {
    const content = fs.readFileSync(viewerPath, "utf-8");
    expect(content).toContain("export function PipelineViewer");
  });

  it("should accept agentId and agentName props", () => {
    const content = fs.readFileSync(viewerPath, "utf-8");
    expect(content).toContain("agentId");
    expect(content).toContain("agentName");
  });
});

// ══════════════════════════════════════════════
// 2. AGENT DETAIL PAGE — PIPELINE TAB
// ══════════════════════════════════════════════

describe("S56 Pipeline Viewer — Agent Detail Integration", () => {
  const agentDetailPath = path.join(
    process.cwd(), "src", "app", "(dashboard)", "agents", "[id]", "page.tsx"
  );

  it("should import PipelineViewer", () => {
    const content = fs.readFileSync(agentDetailPath, "utf-8");
    expect(content).toContain("pipeline-viewer");
  });

  it("should have 'pipeline' in tab options", () => {
    const content = fs.readFileSync(agentDetailPath, "utf-8");
    expect(content).toContain("pipeline");
  });

  it("should render PipelineViewer when pipeline tab active", () => {
    const content = fs.readFileSync(agentDetailPath, "utf-8");
    expect(content).toContain("PipelineViewer");
  });
});

// ══════════════════════════════════════════════
// 3. AGENT PIPELINE CORE MODULE
// ══════════════════════════════════════════════

describe("S56 Pipeline Viewer — AgentPipeline Core", () => {
  const pipelinePath = path.join(
    process.cwd(), "src", "core", "orchestrator", "agent-pipeline.ts"
  );

  it("should have agent-pipeline module", () => {
    expect(fs.existsSync(pipelinePath)).toBe(true);
  });

  it("should export AgentPipeline class", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    expect(content).toContain("export class AgentPipeline");
  });

  it("should define pipeline flow in JSDoc", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    // Pipeline should document its flow
    expect(content).toContain("Check approval");
    expect(content).toContain("Build context");
    expect(content).toContain("Send message");
  });

  it("should accept all pipeline dependencies", () => {
    const content = fs.readFileSync(pipelinePath, "utf-8");
    expect(content).toContain("PipelineDeps");
    expect(content).toContain("engine");
    expect(content).toContain("contextBuilder");
    expect(content).toContain("costTracker");
    expect(content).toContain("budgetManager");
    expect(content).toContain("messageBus");
  });
});
