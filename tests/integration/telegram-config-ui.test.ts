/**
 * S55 — Telegram Config UI Tests.
 *
 * Verifies Telegram API route, settings page, and integration with startup module.
 *
 * @module tests/integration/telegram-config-ui
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// 1. TELEGRAM API ROUTE
// ══════════════════════════════════════════════

describe("S55 Telegram Config — API Route", () => {
  const routePath = path.join(
    process.cwd(), "src", "app", "api", "telegram", "route.ts"
  );

  it("should have /api/telegram route file", () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("should export GET handler for status", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("export async function GET");
  });

  it("should export POST handler for control", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("export async function POST");
  });

  it("should support start/stop/configure actions", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("start");
    expect(content).toContain("stop");
    expect(content).toContain("configure");
  });

  it("should import initTelegram from startup module", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("initTelegram");
    expect(content).toContain("telegram-startup");
  });

  it("should track bot state (running/token)", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).toContain("botState");
    expect(content).toContain("running");
  });

  it("should NOT directly modify OpenClaw files", () => {
    const content = fs.readFileSync(routePath, "utf-8");
    expect(content).not.toContain("writeFileSync");
    expect(content).not.toContain("fs.write");
  });
});

// ══════════════════════════════════════════════
// 2. TELEGRAM SETTINGS PAGE
// ══════════════════════════════════════════════

describe("S55 Telegram Config — UI Page", () => {
  const pagePath = path.join(
    process.cwd(), "src", "app", "(dashboard)", "settings", "telegram", "page.tsx"
  );

  it("should have telegram settings page", () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it("should fetch from /api/telegram", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("/api/telegram");
  });

  it("should have Start/Stop buttons", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Start");
    expect(content).toContain("Stop");
  });

  it("should have token input", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("BotFather");
    expect(content).toContain("password"); // input type password for token
  });

  it("should display registered commands", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("commands");
  });

  it("should be a client component", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("\"use client\"");
  });
});

// ══════════════════════════════════════════════
// 3. SETTINGS PAGE INTEGRATION
// ══════════════════════════════════════════════

describe("S55 Telegram Config — Settings Tab", () => {
  const settingsPath = path.join(
    process.cwd(), "src", "app", "(dashboard)", "settings", "page.tsx"
  );

  it("should have Telegram in tab type", () => {
    const content = fs.readFileSync(settingsPath, "utf-8");
    expect(content).toContain("telegram");
  });

  it("should dynamically import telegram page", () => {
    const content = fs.readFileSync(settingsPath, "utf-8");
    expect(content).toContain("telegram/page");
  });

  it("should have Telegram label in TABS", () => {
    const content = fs.readFileSync(settingsPath, "utf-8");
    expect(content).toContain("Telegram");
  });
});

// ══════════════════════════════════════════════
// 4. TELEGRAM STARTUP MODULE
// ══════════════════════════════════════════════

describe("S55 Telegram Config — Startup Module Integration", () => {
  it("should have telegram-startup module", () => {
    const startupPath = path.join(process.cwd(), "src", "lib", "telegram-startup.ts");
    expect(fs.existsSync(startupPath)).toBe(true);
  });

  it("should export initTelegram function", () => {
    const { initTelegram } = require("../../src/lib/telegram-startup");
    expect(typeof initTelegram).toBe("function");
  });

  it("should export getTelegramStatus function", () => {
    const { getTelegramStatus } = require("../../src/lib/telegram-startup");
    expect(typeof getTelegramStatus).toBe("function");
  });

  it("should export stopTelegram function", () => {
    const { stopTelegram } = require("../../src/lib/telegram-startup");
    expect(typeof stopTelegram).toBe("function");
  });

  it("should gracefully skip when no token", () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const { initTelegram } = require("../../src/lib/telegram-startup");
    const result = initTelegram();
    expect(result.started).toBe(false);
    expect(result.reason).toBeDefined();
  });
});
