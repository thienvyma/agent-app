/**
 * OpenClawClient — HTTP client for OpenClaw Gateway (OpenAI-compatible).
 *
 * Provides:
 * - chatCompletion() → POST /v1/chat/completions
 * - healthCheck()    → GET /v1/models
 *
 * Auth: Bearer token from OPENCLAW_GATEWAY_TOKEN env or constructor param.
 * Includes retry with exponential backoff and error normalization.
 *
 * @module core/adapter/openclaw-client
 */

import axios, { AxiosInstance, AxiosError } from "axios";

/** Default timeout for chat requests (60 seconds — LLM can be slow) */
const DEFAULT_TIMEOUT = 60_000;

/** Timeout for health checks (5 seconds) */
const HEALTH_TIMEOUT = 5_000;

/** Maximum retry attempts for failed requests */
const MAX_RETRIES = 2;

/** Base delay for exponential backoff (ms) */
const BASE_BACKOFF_MS = 500;

/** OpenAI-compatible chat message */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Request payload for /v1/chat/completions */
export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/** Simplified response from chatCompletion */
export interface ChatCompletionResponse {
  message: string;
  tokenUsed: number;
  /** Raw tool_calls from OpenAI response, if any */
  rawToolCalls?: Array<Record<string, unknown>>;
}

/**
 * HTTP client for OpenClaw Gateway (OpenAI-compatible API).
 *
 * Constructor signature is compatible with service-container.ts:
 *   new OpenClawClient(baseUrl?)
 */
export class OpenClawClient {
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;

  /**
   * Create a new OpenClaw HTTP client.
   *
   * @param baseUrl - Gateway URL (default: OPENCLAW_API_URL env or http://localhost:18789)
   * @param token - Bearer token (default: OPENCLAW_GATEWAY_TOKEN env)
   */
  constructor(baseUrl?: string, token?: string) {
    this.baseUrl =
      baseUrl ?? process.env.OPENCLAW_API_URL ?? "http://localhost:18789";
    const authToken =
      token ?? process.env.OPENCLAW_GATEWAY_TOKEN ?? undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: DEFAULT_TIMEOUT,
      headers,
    });
  }

  /**
   * Send a chat completion request (OpenAI-compatible).
   *
   * When sessionKey is provided, routes to a specific OpenClaw agent session
   * via `?session=agent:<id>:main` query parameter.
   *
   * @param request - Chat completion payload
   * @param sessionKey - Optional session key for per-agent routing (e.g., "agent:ceo:main")
   * @returns Simplified response with message and token usage
   * @throws Error on network/API errors (normalized)
   */
  async chatCompletion(
    request: ChatCompletionRequest,
    sessionKey?: string
  ): Promise<ChatCompletionResponse> {
    // Build URL with optional session query parameter
    const url = sessionKey
      ? `/v1/chat/completions?session=${encodeURIComponent(sessionKey)}`
      : "/v1/chat/completions";

    const data = await this.withRetry(async () => {
      const response = await this.http.post(
        url,
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.max_tokens,
          stream: request.stream ?? false,
        }
      );
      return response.data;
    });

    // Parse OpenAI response format
    const choices = data?.choices ?? [];
    const message =
      choices.length > 0 ? (choices[0]?.message?.content ?? "") : "";
    const tokenUsed = data?.usage?.total_tokens ?? 0;
    const rawCalls = choices.length > 0
      ? (choices[0]?.message?.tool_calls as Array<Record<string, unknown>> | undefined)
      : undefined;

    return { message, tokenUsed, rawToolCalls: rawCalls ?? undefined };
  }

  /**
   * Check if the gateway is healthy by calling /v1/models.
   *
   * @returns true if gateway responds, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.http.get("/v1/models", { timeout: HEALTH_TIMEOUT });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute a request with exponential backoff retry.
   *
   * @param fn - Async function to retry
   * @returns Result of the function
   * @throws Last error after all retries exhausted
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = this.normalizeError(error);

        // Don't retry client errors (4xx)
        if (this.isAxiosError(error) && error.response) {
          const status = error.response.status;
          if (status >= 400 && status < 500) {
            throw lastError;
          }
        }

        // Exponential backoff for retryable errors
        if (attempt < MAX_RETRIES - 1) {
          const delay = BASE_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error("Request failed after retries");
  }

  /**
   * Type guard for AxiosError.
   */
  private isAxiosError(error: unknown): error is AxiosError {
    return (
      error instanceof AxiosError ||
      (error instanceof Error && "isAxiosError" in error)
    );
  }

  /**
   * Normalize various error types into a clean Error.
   *
   * @param error - Raw error from axios
   * @returns Normalized Error with descriptive message
   */
  private normalizeError(error: unknown): Error {
    if (this.isAxiosError(error)) {
      if (error.code === "ECONNREFUSED") {
        return new Error(
          `OpenClaw not reachable at ${this.baseUrl}. Is it running?`
        );
      }
      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        return new Error(
          `OpenClaw request timed out (${DEFAULT_TIMEOUT}ms). Check server load.`
        );
      }
      if (error.response) {
        return new Error(
          `OpenClaw API error ${error.response.status}: ${JSON.stringify(error.response.data)}`
        );
      }
      return new Error(`OpenClaw network error: ${error.message}`);
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(`Unknown OpenClaw error: ${String(error)}`);
  }
}
