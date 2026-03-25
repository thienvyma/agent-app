/**
 * Tests for Telegram Real Startup (Session 49).
 * TDD: Written BEFORE implementation.
 *
 * @module tests/integration/telegram-startup
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// FILE EXISTENCE
// ══════════════════════════════════════════════

describe("Telegram Startup — File Existence (S49)", () => {
  it("should have src/lib/telegram-startup.ts", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src", "lib", "telegram-startup.ts"))).toBe(true);
  });
});

// ══════════════════════════════════════════════
// STARTUP LOGIC
// ══════════════════════════════════════════════

describe("Telegram Startup — Init Logic", () => {
  it("should export initTelegram function", () => {
    const mod = require("../../src/lib/telegram-startup");
    expect(typeof mod.initTelegram).toBe("function");
  });

  it("should export getTelegramStatus function", () => {
    const mod = require("../../src/lib/telegram-startup");
    expect(typeof mod.getTelegramStatus).toBe("function");
  });

  it("should skip startup when no TELEGRAM_BOT_TOKEN", () => {
    jest.resetModules();
    delete process.env.TELEGRAM_BOT_TOKEN;
    const { initTelegram } = require("../../src/lib/telegram-startup");
    const result = initTelegram();
    expect(result.started).toBe(false);
    expect(result.reason).toContain("token");
  });

  it("should report status correctly when not started", () => {
    jest.resetModules();
    delete process.env.TELEGRAM_BOT_TOKEN;
    const { getTelegramStatus } = require("../../src/lib/telegram-startup");
    const status = getTelegramStatus();
    expect(status.running).toBe(false);
  });

  it("should export TELEGRAM_COMMANDS constant", () => {
    const mod = require("../../src/lib/telegram-startup");
    expect(Array.isArray(mod.TELEGRAM_COMMANDS)).toBe(true);
    expect(mod.TELEGRAM_COMMANDS.length).toBeGreaterThanOrEqual(7);
  });
});

// ══════════════════════════════════════════════
// COMMAND WIRING VERIFICATION
// ══════════════════════════════════════════════

describe("Telegram Startup — Command Wiring", () => {
  it("should wire all 7 commands", () => {
    const { TELEGRAM_COMMANDS } = require("../../src/lib/telegram-startup");
    const expectedCommands = ["/status", "/agents", "/task", "/approve", "/reject", "/report", "/cost"];

    for (const cmd of expectedCommands) {
      expect(TELEGRAM_COMMANDS).toContain(cmd);
    }
  });
});
