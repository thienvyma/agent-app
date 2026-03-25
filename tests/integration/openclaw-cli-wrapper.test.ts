/**
 * Tests for OpenClaw CLI Wrapper (S54).
 * Verifies CLI executor, API routes, and UI page structure.
 *
 * @module tests/integration/openclaw-cli-wrapper
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// CLI EXECUTOR
// ══════════════════════════════════════════════

describe("OpenClaw CLI Wrapper — CLI Executor (S54)", () => {
  it("should export execOpenClaw function", () => {
    const cli = require("../../src/lib/openclaw-cli");
    expect(typeof cli.execOpenClaw).toBe("function");
  });

  it("should export all helper functions", () => {
    const cli = require("../../src/lib/openclaw-cli");
    expect(typeof cli.getVersion).toBe("function");
    expect(typeof cli.getGatewayStatus).toBe("function");
    expect(typeof cli.controlGateway).toBe("function");
    expect(typeof cli.configGet).toBe("function");
    expect(typeof cli.configSet).toBe("function");
    expect(typeof cli.configUnset).toBe("function");
    expect(typeof cli.configValidate).toBe("function");
    expect(typeof cli.modelsList).toBe("function");
    expect(typeof cli.modelsStatus).toBe("function");
    expect(typeof cli.modelsSet).toBe("function");
    expect(typeof cli.doctorFix).toBe("function");
    expect(typeof cli.healthCheck).toBe("function");
    expect(typeof cli.systemStatus).toBe("function");
    expect(typeof cli.updateOpenClaw).toBe("function");
  });

  it("should return CliResult shape from execOpenClaw", async () => {
    const { execOpenClaw } = require("../../src/lib/openclaw-cli");
    // Test with --version (fast, safe)
    const result = await execOpenClaw(["--version"], 5000);
    expect(result).toHaveProperty("stdout");
    expect(result).toHaveProperty("stderr");
    expect(result).toHaveProperty("exitCode");
    expect(typeof result.exitCode).toBe("number");
  });
});

// ══════════════════════════════════════════════
// API ROUTES — FILE EXISTENCE
// ══════════════════════════════════════════════

describe("OpenClaw CLI Wrapper — API Routes (S54)", () => {
  const apiBase = path.join(process.cwd(), "src", "app", "api", "openclaw");

  it("should have /api/openclaw/config route", () => {
    expect(fs.existsSync(path.join(apiBase, "config", "route.ts"))).toBe(true);
  });

  it("should have /api/openclaw/gateway route", () => {
    expect(fs.existsSync(path.join(apiBase, "gateway", "route.ts"))).toBe(true);
  });

  it("should have /api/openclaw/models route", () => {
    expect(fs.existsSync(path.join(apiBase, "models", "route.ts"))).toBe(true);
  });

  it("should have /api/openclaw/auth route", () => {
    expect(fs.existsSync(path.join(apiBase, "auth", "route.ts"))).toBe(true);
  });

  it("should have /api/openclaw/doctor route", () => {
    expect(fs.existsSync(path.join(apiBase, "doctor", "route.ts"))).toBe(true);
  });

  it("should have /api/openclaw/update route", () => {
    expect(fs.existsSync(path.join(apiBase, "update", "route.ts"))).toBe(true);
  });
});

// ══════════════════════════════════════════════
// API ROUTES — CODE CORRECTNESS
// ══════════════════════════════════════════════

describe("OpenClaw CLI Wrapper — Route Code (S54)", () => {
  const apiBase = path.join(process.cwd(), "src", "app", "api", "openclaw");

  it("config route should use configGet/configSet from openclaw-cli", () => {
    const content = fs.readFileSync(path.join(apiBase, "config", "route.ts"), "utf-8");
    expect(content).toContain("configGet");
    expect(content).toContain("configSet");
    expect(content).toContain("configUnset");
    expect(content).toContain("@/lib/openclaw-cli");
  });

  it("gateway route should use getGatewayStatus/controlGateway", () => {
    const content = fs.readFileSync(path.join(apiBase, "gateway", "route.ts"), "utf-8");
    expect(content).toContain("getGatewayStatus");
    expect(content).toContain("controlGateway");
  });

  it("models route should use modelsList/modelsSet", () => {
    const content = fs.readFileSync(path.join(apiBase, "models", "route.ts"), "utf-8");
    expect(content).toContain("modelsList");
    expect(content).toContain("modelsSet");
  });

  it("auth route should use configSet for provider keys", () => {
    const content = fs.readFileSync(path.join(apiBase, "auth", "route.ts"), "utf-8");
    expect(content).toContain("configSet");
    expect(content).toContain("models.providers");
  });

  it("doctor route should use doctorFix", () => {
    const content = fs.readFileSync(path.join(apiBase, "doctor", "route.ts"), "utf-8");
    expect(content).toContain("doctorFix");
  });

  it("update route should use getVersion/updateOpenClaw", () => {
    const content = fs.readFileSync(path.join(apiBase, "update", "route.ts"), "utf-8");
    expect(content).toContain("getVersion");
    expect(content).toContain("updateOpenClaw");
  });
});

// ══════════════════════════════════════════════
// SETTINGS UI — NO DIRECT CONFIG MODIFICATION
// ══════════════════════════════════════════════

describe("OpenClaw CLI Wrapper — Settings UI (S54)", () => {
  it("should NOT import fs or path (no direct file access)", () => {
    const pagePath = path.join(process.cwd(), "src", "app", "(dashboard)", "settings", "openclaw", "page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).not.toContain("import * as fs");
    expect(content).not.toContain("import { readFileSync");
    expect(content).not.toContain("writeFileSync");
  });

  it("should only use API fetch calls for OpenClaw operations", () => {
    const pagePath = path.join(process.cwd(), "src", "app", "(dashboard)", "settings", "openclaw", "page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain('fetch("/api/openclaw/');
    expect(content).toContain("/api/openclaw/gateway");
    expect(content).toContain("/api/openclaw/models");
    expect(content).toContain("/api/openclaw/update");
    expect(content).toContain("/api/openclaw/doctor");
    expect(content).toContain("/api/openclaw/config");
    expect(content).toContain("/api/openclaw/auth");
  });

  it("should have 5 configuration sections", () => {
    const pagePath = path.join(process.cwd(), "src", "app", "(dashboard)", "settings", "openclaw", "page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("System Info");
    expect(content).toContain("Gateway Control");
    expect(content).toContain("Model Management");
    expect(content).toContain("Provider Authentication");
    expect(content).toContain("Config Editor");
  });
});
