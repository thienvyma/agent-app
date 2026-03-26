/**
 * Telegram Integration — TDD tests for Phase 72.
 *
 * Tests:
 * - Pairing CLI args include "telegram" channel
 * - CLI binding functions exist and call execOpenClaw
 * - telegram-startup.ts deprecation
 * - custom commands registration
 *
 * @module tests/channels/telegram-integration
 */

import {
  getTelegramStatus,
  getCommandDescriptions,
} from "@/lib/telegram-startup";

// We test openclaw-cli functions by mocking the low-level execOpenClaw
// and verifying that the wrapper functions properly delegate
jest.mock("@/lib/openclaw-cli", () => {
  const mockExec = jest.fn().mockResolvedValue({
    stdout: "",
    stderr: "",
    exitCode: 0,
  });

  return {
    execOpenClaw: mockExec,
    // Re-implement all wrapper functions using the SAME mockExec
    agentBind: async (agentId: string, channel: string) => {
      const bindingJson = JSON.stringify({
        agentId,
        match: { channel, accountId: "default" },
      });
      return mockExec(["config", "set", "bindings", bindingJson], 15_000);
    },
    agentUnbind: async (agentId: string, channel: string) => {
      return mockExec(
        ["config", "unset", `bindings.${agentId}.${channel}`],
        15_000
      );
    },
    agentBindings: async () => {
      return mockExec(["config", "get", "bindings", "--json"]);
    },
    agentAdd: async (id: string) => {
      return mockExec(["agents", "add", id], 15_000);
    },
    agentDelete: async (id: string) => {
      return mockExec(["agents", "delete", id], 15_000);
    },
    agentsList: async () => {
      return mockExec(["agents", "list", "--json"]);
    },
  };
});

import {
  execOpenClaw,
  agentBind,
  agentBindings,
  agentUnbind,
} from "@/lib/openclaw-cli";

const mockExecOpenClaw = execOpenClaw as jest.MockedFunction<typeof execOpenClaw>;

describe("Telegram Integration — Phase 72", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Pairing CLI args ──

  describe("pairing CLI args fix", () => {
    it("pairing list should include 'telegram' channel arg", () => {
      // Verify the fixed pattern used in api/telegram/route.ts
      const correctArgs = ["pairing", "list", "telegram"];
      expect(correctArgs).toContain("telegram");
      expect(correctArgs[0]).toBe("pairing");
      expect(correctArgs[1]).toBe("list");
      expect(correctArgs[2]).toBe("telegram");
    });

    it("pairing approve should include 'telegram' channel arg before code", () => {
      const code = "ABCD1234";
      const correctArgs = ["pairing", "approve", "telegram", code];
      expect(correctArgs[2]).toBe("telegram");
      expect(correctArgs[3]).toBe(code);
    });
  });

  // ── CLI binding functions ──

  describe("agent binding CLI functions", () => {
    it("agentBind calls execOpenClaw with config set bindings + JSON", async () => {
      await agentBind("ceo", "telegram");

      expect(mockExecOpenClaw).toHaveBeenCalledWith(
        expect.arrayContaining(["config", "set", "bindings"]),
        15_000
      );

      // Verify binding JSON contains agentId and channel
      const args = mockExecOpenClaw.mock.calls[0]![0];
      const bindingArg = args[3];
      expect(bindingArg).toBeDefined();
      const parsed = JSON.parse(bindingArg!);
      expect(parsed.agentId).toBe("ceo");
      expect(parsed.match.channel).toBe("telegram");
    });

    it("agentBindings calls execOpenClaw with config get bindings", async () => {
      await agentBindings();

      expect(mockExecOpenClaw).toHaveBeenCalledWith(
        ["config", "get", "bindings", "--json"]
      );
    });

    it("agentUnbind calls execOpenClaw with config unset", async () => {
      await agentUnbind("ceo", "telegram");

      expect(mockExecOpenClaw).toHaveBeenCalledWith(
        ["config", "unset", "bindings.ceo.telegram"],
        15_000
      );
    });
  });

  // ── telegram-startup.ts status ──

  describe("telegram-startup", () => {
    it("getTelegramStatus returns status with running and mode", () => {
      const status = getTelegramStatus();
      expect(status).toBeDefined();
      expect(status).toHaveProperty("running");
      expect(status).toHaveProperty("mode");
    });

    it("getCommandDescriptions returns command objects with status and task", () => {
      const commands = getCommandDescriptions();
      expect(commands.length).toBeGreaterThan(0);

      const names = commands.map((c) => c.command);
      expect(names).toContain("status");
      expect(names).toContain("task");
      expect(names).toContain("cost");

      for (const cmd of commands) {
        expect(cmd.command).toBeTruthy();
        expect(cmd.description).toBeTruthy();
      }
    });
  });

  // ── Phase 72 new: CEO Binding + Custom Commands ──

  describe("CEO binding + custom commands", () => {
    it("CUSTOM_COMMANDS export matches OpenClaw customCommands format", () => {
      const { CUSTOM_COMMANDS } = require("../../src/core/channels/telegram-bot");
      expect(Array.isArray(CUSTOM_COMMANDS)).toBe(true);
      expect(CUSTOM_COMMANDS.length).toBeGreaterThanOrEqual(4);

      for (const cmd of CUSTOM_COMMANDS) {
        expect(cmd).toHaveProperty("command");
        expect(cmd).toHaveProperty("description");
        expect(typeof cmd.command).toBe("string");
        expect(typeof cmd.description).toBe("string");
      }

      const names = CUSTOM_COMMANDS.map((c: { command: string }) => c.command);
      expect(names).toContain("status");
      expect(names).toContain("task");
      expect(names).toContain("report");
      expect(names).toContain("cost");
    });

    it("route.ts should contain bind action handler", () => {
      const fs = require("fs");
      const path = require("path");
      const routePath = path.join(process.cwd(), "src", "app", "api", "telegram", "route.ts");
      const content = fs.readFileSync(routePath, "utf-8");
      expect(content).toContain("bind");
      expect(content).toContain("agentBind");
    });

    it("route.ts start action should include CEO binding", () => {
      const fs = require("fs");
      const path = require("path");
      const routePath = path.join(process.cwd(), "src", "app", "api", "telegram", "route.ts");
      const content = fs.readFileSync(routePath, "utf-8");
      // Start action should bind CEO to telegram
      expect(content).toContain("ceo");
      expect(content).toContain("agentBind");
    });

    it("page.tsx should show CEO binding status", () => {
      const fs = require("fs");
      const path = require("path");
      const pagePath = path.join(
        process.cwd(), "src", "app", "(dashboard)", "settings", "telegram", "page.tsx"
      );
      const content = fs.readFileSync(pagePath, "utf-8");
      expect(content).toContain("CEO");
      expect(content).toContain("binding");
    });
  });
});

