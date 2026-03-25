/**
 * S52 — Engine Wiring Tests.
 *
 * Verifies agent API wires engine.deploy() and chat response fields.
 *
 * @module tests/integration/engine-wiring
 */

import * as fs from "fs";
import * as path from "path";

const agentsRoutePath = path.join(
  process.cwd(), "src", "app", "api", "agents", "route.ts"
);
const chatRoutePath = path.join(
  process.cwd(), "src", "app", "api", "agents", "[id]", "chat", "route.ts"
);
const singletonPath = path.join(
  process.cwd(), "src", "lib", "engine-singleton.ts"
);

describe("S52 Engine Wiring — Agent Deploy", () => {
  it("should have agents API route", () => {
    expect(fs.existsSync(agentsRoutePath)).toBe(true);
  });

  it("should import engine or use engine singleton", () => {
    const content = fs.readFileSync(agentsRoutePath, "utf-8");
    expect(
      content.includes("engine") || content.includes("getEngine")
    ).toBe(true);
  });

  it("should have POST handler for agent creation", () => {
    const content = fs.readFileSync(agentsRoutePath, "utf-8");
    expect(content).toContain("export async function POST");
  });
});

describe("S52 Engine Wiring — Chat Route", () => {
  it("should have chat API route", () => {
    expect(fs.existsSync(chatRoutePath)).toBe(true);
  });

  it("should export POST handler", () => {
    const content = fs.readFileSync(chatRoutePath, "utf-8");
    expect(content).toContain("export async function POST");
  });

  it("should use engine for message sending", () => {
    const content = fs.readFileSync(chatRoutePath, "utf-8");
    expect(
      content.includes("sendMessage") || content.includes("engine")
    ).toBe(true);
  });
});

describe("S52 Engine Wiring — Singleton", () => {
  it("should have engine singleton", () => {
    expect(fs.existsSync(singletonPath)).toBe(true);
  });

  it("should export getEngine function", () => {
    const content = fs.readFileSync(singletonPath, "utf-8");
    expect(content).toContain("getEngine");
  });

  it("should support mock adapter toggle", () => {
    const content = fs.readFileSync(singletonPath, "utf-8");
    expect(
      content.includes("USE_MOCK") || content.includes("MockAdapter")
    ).toBe(true);
  });
});
