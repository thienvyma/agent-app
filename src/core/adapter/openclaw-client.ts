/**
 * OpenClawClient — HTTP client for OpenClaw Gateway API.
 *
 * Wraps axios with timeout, retry, and error handling.
 * All OpenClaw communication goes through this single client.
 *
 * @see docs/openclaw-integration.md Section 8 (API endpoints)
 * @module core/adapter/openclaw-client
 */

import axios, { AxiosInstance, AxiosError } from "axios";

/** Default timeout for HTTP requests (30 seconds) */
const DEFAULT_TIMEOUT = 30_000;

/** Maximum retry attempts for failed requests */
const MAX_RETRIES = 3;

/** Base delay for exponential backoff (ms) */
const BASE_BACKOFF_MS = 1000;

/**
 * HTTP client for communicating with OpenClaw Gateway.
 * Handles retries, timeouts, and error normalization.
 */
export class OpenClawClient {
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;

  /**
   * Create a new OpenClaw HTTP client.
   *
   * @param baseUrl - OpenClaw Gateway URL (default from OPENCLAW_API_URL env)
   */
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env.OPENCLAW_API_URL ?? "http://localhost:18789";
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
  }

  /**
   * Send a GET request.
   *
   * @param path - API path (e.g., "/api/sessions")
   * @returns Response data
   */
  async get(path: string): Promise<unknown> {
    return this.withRetry(async () => {
      const response = await this.http.get(path);
      return response.data;
    });
  }

  /**
   * Send a POST request.
   *
   * @param path - API path (e.g., "/api/sessions")
   * @param body - Request body
   * @returns Response data
   */
  async post(path: string, body: unknown): Promise<unknown> {
    return this.withRetry(async () => {
      const response = await this.http.post(path, body);
      return response.data;
    });
  }

  /**
   * Send a DELETE request.
   *
   * @param path - API path (e.g., "/api/sessions/:key")
   */
  async delete(path: string): Promise<void> {
    await this.withRetry(async () => {
      await this.http.delete(path);
    });
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
        if (error instanceof AxiosError && error.response) {
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
   * Normalize various error types into a clean Error.
   *
   * @param error - Raw error from axios
   * @returns Normalized Error with descriptive message
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof AxiosError) {
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
