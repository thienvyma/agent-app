/**
 * OpenClawClient — unit tests for OpenAI-compatible HTTP client.
 *
 * Tests chatCompletion() and healthCheck() methods.
 * Mocks axios to avoid real HTTP calls.
 *
 * @module tests/adapter/openclaw-client
 */

import axios from "axios";
import { OpenClawClient } from "@/core/adapter/openclaw-client";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

/** Helper: create mocked axios instance */
function mockAxiosInstance() {
  const instance = {
    post: jest.fn(),
    get: jest.fn(),
    defaults: { headers: { common: {} } },
  };
  mockedAxios.create.mockReturnValue(instance as never);
  return instance;
}

describe("OpenClawClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENCLAW_API_URL;
    delete process.env.OPENCLAW_GATEWAY_TOKEN;
  });

  // ── Constructor ──

  describe("constructor", () => {
    it("uses default URL http://localhost:18789", () => {
      mockAxiosInstance();
      new OpenClawClient();
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "http://localhost:18789",
        })
      );
    });

    it("accepts custom baseUrl as first param", () => {
      mockAxiosInstance();
      new OpenClawClient("http://custom:9999");
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "http://custom:9999",
        })
      );
    });

    it("reads OPENCLAW_API_URL from env when no param given", () => {
      process.env.OPENCLAW_API_URL = "http://env-url:1234";
      mockAxiosInstance();
      new OpenClawClient();
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "http://env-url:1234",
        })
      );
    });

    it("reads OPENCLAW_GATEWAY_TOKEN from env for auth", () => {
      process.env.OPENCLAW_GATEWAY_TOKEN = "test-token-123";
      mockAxiosInstance();
      new OpenClawClient();
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
        })
      );
    });

    it("accepts token as second constructor param", () => {
      mockAxiosInstance();
      new OpenClawClient("http://localhost:18789", "my-token");
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-token",
          }),
        })
      );
    });
  });

  // ── chatCompletion ──

  describe("chatCompletion", () => {
    it("sends POST /v1/chat/completions with correct payload", async () => {
      const instance = mockAxiosInstance();
      instance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: "Hello!" } }],
          usage: { total_tokens: 42 },
        },
      });

      const client = new OpenClawClient();
      const result = await client.chatCompletion({
        messages: [{ role: "user", content: "hi" }],
      });

      expect(instance.post).toHaveBeenCalledWith(
        "/v1/chat/completions",
        expect.objectContaining({
          messages: [{ role: "user", content: "hi" }],
        })
      );
      expect(result.message).toBe("Hello!");
      expect(result.tokenUsed).toBe(42);
    });

    it("includes model in request if provided", async () => {
      const instance = mockAxiosInstance();
      instance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: "ok" } }],
          usage: { total_tokens: 10 },
        },
      });

      const client = new OpenClawClient();
      await client.chatCompletion({
        model: "ollama-lan/Qwen3.5-35B-A3B-Coder",
        messages: [{ role: "user", content: "test" }],
      });

      expect(instance.post).toHaveBeenCalledWith(
        "/v1/chat/completions",
        expect.objectContaining({
          model: "ollama-lan/Qwen3.5-35B-A3B-Coder",
        })
      );
    });

    it("routes to per-agent session via ?session= query param", async () => {
      const instance = mockAxiosInstance();
      instance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: "response" } }],
          usage: { total_tokens: 5 },
        },
      });

      const client = new OpenClawClient();
      await client.chatCompletion(
        { messages: [{ role: "user", content: "hello" }] },
        "agent:ceo:main"
      );

      expect(instance.post).toHaveBeenCalledWith(
        "/v1/chat/completions?session=agent%3Aceo%3Amain",
        expect.any(Object)
      );
    });

    it("handles empty choices array gracefully", async () => {
      const instance = mockAxiosInstance();
      instance.post.mockResolvedValue({
        data: { choices: [], usage: { total_tokens: 0 } },
      });

      const client = new OpenClawClient();
      const result = await client.chatCompletion({
        messages: [{ role: "user", content: "hi" }],
      });

      expect(result.message).toBe("");
      expect(result.tokenUsed).toBe(0);
    });

    it("throws normalized error on ECONNREFUSED", async () => {
      const instance = mockAxiosInstance();
      const axiosErr = new Error("connect ECONNREFUSED") as Error & {
        code: string;
        isAxiosError: boolean;
      };
      axiosErr.code = "ECONNREFUSED";
      axiosErr.isAxiosError = true;
      instance.post.mockRejectedValue(axiosErr);

      const client = new OpenClawClient();
      await expect(
        client.chatCompletion({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow(/not reachable/i);
    });

    it("throws normalized error on ETIMEDOUT", async () => {
      const instance = mockAxiosInstance();
      const axiosErr = new Error("timeout") as Error & {
        code: string;
        isAxiosError: boolean;
      };
      axiosErr.code = "ETIMEDOUT";
      axiosErr.isAxiosError = true;
      instance.post.mockRejectedValue(axiosErr);

      const client = new OpenClawClient();
      await expect(
        client.chatCompletion({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow(/timed out/i);
    });
  });

  // ── healthCheck ──

  describe("healthCheck", () => {
    it("returns true when /v1/models responds", async () => {
      const instance = mockAxiosInstance();
      instance.get.mockResolvedValue({
        data: { data: [{ id: "qwen" }] },
      });

      const client = new OpenClawClient();
      const result = await client.healthCheck();
      expect(result).toBe(true);
      expect(instance.get).toHaveBeenCalledWith("/v1/models");
    });

    it("returns false on connection error", async () => {
      const instance = mockAxiosInstance();
      instance.get.mockRejectedValue(new Error("ECONNREFUSED"));

      const client = new OpenClawClient();
      const result = await client.healthCheck();
      expect(result).toBe(false);
    });

    it("returns false on timeout", async () => {
      const instance = mockAxiosInstance();
      instance.get.mockRejectedValue(new Error("ETIMEDOUT"));

      const client = new OpenClawClient();
      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });
});
