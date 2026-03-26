/**
 * OnboardExecutor — unit tests for OpenClaw onboard flow.
 *
 * Tests 6-step onboard: check → provider → model → gateway → health → complete.
 * Mocks openclaw-cli functions.
 *
 * @module tests/lib/openclaw-onboard
 */

import { OnboardExecutor } from "@/lib/openclaw-onboard";
import * as cli from "@/lib/openclaw-cli";

// Mock entire openclaw-cli module
jest.mock("@/lib/openclaw-cli");
const mockedCli = cli as jest.Mocked<typeof cli>;

// Mock global fetch for fetchProviderModels
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("OnboardExecutor", () => {
  let executor: OnboardExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    executor = new OnboardExecutor();
  });

  // ── Step 1: checkInstalled ──

  describe("checkInstalled", () => {
    it("returns installed=true with parsed version", async () => {
      mockedCli.getVersion.mockResolvedValue(
        "🦞 OpenClaw 2026.3.11 (29dc654)"
      );

      const result = await executor.checkInstalled();
      expect(result.installed).toBe(true);
      expect(result.version).toContain("2026.3.11");
    });

    it("returns installed=false when CLI not found", async () => {
      mockedCli.getVersion.mockRejectedValue(new Error("ENOENT"));

      const result = await executor.checkInstalled();
      expect(result.installed).toBe(false);
      expect(result.version).toBe("");
    });
  });

  // ── Step 2: setupProvider ──

  describe("setupProvider", () => {
    it("calls configSet for baseUrl and apiKey", async () => {
      mockedCli.configSet.mockResolvedValue({
        stdout: "Updated",
        stderr: "",
        exitCode: 0,
      });

      await executor.setupProvider(
        "ollama-lan",
        "http://192.168.1.35:8080/v1",
        "sk-local"
      );

      expect(mockedCli.configSet).toHaveBeenCalledTimes(2);
      expect(mockedCli.configSet).toHaveBeenCalledWith(
        "models.providers.ollama-lan.baseUrl",
        "http://192.168.1.35:8080/v1"
      );
      expect(mockedCli.configSet).toHaveBeenCalledWith(
        "models.providers.ollama-lan.apiKey",
        "sk-local"
      );
    });

    it("throws validation error on empty baseUrl", async () => {
      await expect(
        executor.setupProvider("ollama-lan", "", "sk-local")
      ).rejects.toThrow(/baseUrl/i);
    });
  });

  // ── Step 3: setupModel ──

  describe("setupModel", () => {
    it("calls configSet for primary model", async () => {
      mockedCli.configSet.mockResolvedValue({
        stdout: "Updated",
        stderr: "",
        exitCode: 0,
      });

      await executor.setupModel("ollama-lan", "Qwen3.5-35B-A3B-Coder");

      expect(mockedCli.configSet).toHaveBeenCalledWith(
        "agents.defaults.model.primary",
        "ollama-lan/Qwen3.5-35B-A3B-Coder"
      );
    });
  });

  // ── Step 4: startGateway ──

  describe("startGateway", () => {
    it("calls startGatewayBackground and returns running=true", async () => {
      mockedCli.startGatewayBackground.mockResolvedValue(true);
      mockedCli.configGet.mockResolvedValue({ stdout: "existing-token", stderr: "", exitCode: 0 });
      mockedCli.configSet.mockResolvedValue({ stdout: "Updated", stderr: "", exitCode: 0 });
      mockedCli.execOpenClaw.mockResolvedValue({ stdout: "", stderr: "", exitCode: 1 });

      const result = await executor.startGateway(18789);
      expect(result.running).toBe(true);
      expect(mockedCli.startGatewayBackground).toHaveBeenCalledWith(18789);
    });

    it("returns running=true if already running (not error)", async () => {
      mockedCli.startGatewayBackground.mockResolvedValue(true);
      mockedCli.configGet.mockResolvedValue({ stdout: "my-token", stderr: "", exitCode: 0 });
      mockedCli.configSet.mockResolvedValue({ stdout: "Updated", stderr: "", exitCode: 0 });
      mockedCli.execOpenClaw.mockResolvedValue({ stdout: "", stderr: "", exitCode: 1 });

      const result = await executor.startGateway();
      expect(result.running).toBe(true);
    });
  });

  // ── Step 5: verifyHealth ──

  describe("verifyHealth", () => {
    it("parses health output → all healthy", async () => {
      mockedCli.healthCheck.mockResolvedValue({
        stdout: "Agents: main (default)\nHeartbeat interval: 30m",
        stderr: "",
        exitCode: 0,
      });

      const result = await executor.verifyHealth();
      expect(result.gateway).toBe(true);
      expect(result.agent).toBe(true);
    });

    it("returns gateway=false on CLI error", async () => {
      mockedCli.healthCheck.mockResolvedValue({
        stdout: "",
        stderr: "Connection refused",
        exitCode: 1,
      });

      const result = await executor.verifyHealth();
      expect(result.gateway).toBe(false);
    });
  });

  // ── fetchProviderModels ──

  describe("fetchProviderModels", () => {
    it("fetches models from OpenAI-compatible /v1/models endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: "Qwen3.5-35B-A3B-Coder" },
            { id: "another-model" },
          ],
        }),
      });

      const models = await executor.fetchProviderModels(
        "http://192.168.1.35:8080/v1"
      );

      expect(models).toEqual(["Qwen3.5-35B-A3B-Coder", "another-model"]);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://192.168.1.35:8080/v1/models",
        expect.any(Object)
      );
    });
  });
});
