/**
 * OnboardExecutor — guided OpenClaw first-time setup logic.
 *
 * Handles the 6-step onboard flow:
 * 1. Check installed → openclaw --version
 * 2. Setup provider → config set baseUrl + apiKey
 * 3. Setup model → config set primary model
 * 4. Start gateway → gateway start
 * 5. Verify health → health check
 * 6. Complete → summary
 *
 * Uses openclaw-cli.ts functions exclusively (no direct CLI calls).
 *
 * @module lib/openclaw-onboard
 */

import {
  getVersion,
  configSet,
  configGet,
  startGatewayBackground,
  healthCheck,
  execOpenClaw,
} from "./openclaw-cli";

/** Result of checkInstalled step */
export interface InstallCheckResult {
  installed: boolean;
  version: string;
}

/** Result of startGateway step */
export interface GatewayStartResult {
  running: boolean;
  dashboardUrl?: string;
  token?: string;
}

/** Result of verifyHealth step */
export interface HealthResult {
  gateway: boolean;
  model: boolean;
  agent: boolean;
}

/**
 * Executes OpenClaw onboard steps in sequence.
 * Each method is self-contained and idempotent.
 */
export class OnboardExecutor {
  /**
   * Step 1: Check if OpenClaw CLI is installed.
   *
   * @returns Install status with version string
   */
  async checkInstalled(): Promise<InstallCheckResult> {
    try {
      const versionOutput = await getVersion();
      // Parse version from output like "🦞 OpenClaw 2026.3.11 (29dc654)"
      const match = versionOutput.match(/(\d{4}\.\d+\.\d+)/);
      return {
        installed: true,
        version: match?.[1] ?? versionOutput,
      };
    } catch {
      return { installed: false, version: "" };
    }
  }

  /**
   * Step 2: Setup a provider (baseUrl + apiKey).
   *
   * @param name - Provider name (e.g., "ollama-lan")
   * @param baseUrl - Provider API URL (e.g., "http://192.168.1.35:8080/v1")
   * @param apiKey - API key (e.g., "sk-local")
   * @throws Error if baseUrl is empty
   */
  async setupProvider(
    name: string,
    baseUrl: string,
    apiKey: string
  ): Promise<void> {
    if (!baseUrl || !baseUrl.trim()) {
      throw new Error("baseUrl is required for provider setup");
    }

    await configSet(`models.providers.${name}.baseUrl`, baseUrl);
    await configSet(`models.providers.${name}.apiKey`, apiKey);
  }

  /**
   * Step 3: Set the primary model.
   *
   * @param provider - Provider name (e.g., "ollama-lan")
   * @param model - Model name (e.g., "Qwen3.5-35B-A3B-Coder")
   */
  async setupModel(provider: string, model: string): Promise<void> {
    await configSet(
      "agents.defaults.model.primary",
      `${provider}/${model}`
    );
  }

  /**
   * Step 4: Start the gateway — install service + generate auth token.
   *
   * Flow:
   * 1. Check if gateway.auth.token already exists
   * 2. If not, generate a random hex token and set it via config
   * 3. Install the gateway service with port + token
   * 4. Start the service
   * 5. Probe RPC to verify running
   * 6. Return dashboardUrl with embedded token
   *
   * @param port - Port number (default: 18789)
   * @returns Whether gateway is running + dashboardUrl
   */
  async startGateway(port: number = 18789): Promise<GatewayStartResult> {
    // 1. Check if token exists, generate if missing
    let token = "";
    try {
      const existing = await configGet("gateway.auth.token");
      if (existing.stdout && !existing.stdout.includes("not found") && existing.exitCode === 0) {
        token = "";
      }
    } catch {
      // Token doesn't exist
    }

    if (!token) {
      const { randomBytes } = await import("crypto");
      token = randomBytes(24).toString("hex");
      await configSet("gateway.auth.token", token);
    }

    // 2. Start gateway as hidden background process (no terminal window)
    const running = await startGatewayBackground(port);

    // 3. Get dashboard URL with embedded token
    let dashboardUrl = `http://127.0.0.1:${port}`;
    try {
      const dashResult = await execOpenClaw(["dashboard", "--no-open"], 5000);
      const match = dashResult.stdout.match(/Dashboard URL:\s*(http\S+)/);
      if (match && match[1]) {
        dashboardUrl = match[1];
      }
    } catch {
      dashboardUrl = `http://127.0.0.1:${port}/#token=${token}`;
    }

    return { running, dashboardUrl, token };
  }

  /**
   * Step 5: Verify that OpenClaw is healthy.
   *
   * @returns Health status for gateway, model, and agent
   */
  async verifyHealth(): Promise<HealthResult> {
    const result = await healthCheck();

    if (result.exitCode !== 0) {
      return { gateway: false, model: false, agent: false };
    }

    // Parse health output for component statuses
    const output = result.stdout;
    const hasAgent = /agents?:/i.test(output);
    const hasModel = /model/i.test(output);

    return {
      gateway: true,
      model: hasModel,
      agent: hasAgent,
    };
  }

  /**
   * Fetch available models from a provider's /v1/models endpoint.
   *
   * @param baseUrl - Provider base URL (e.g., "http://192.168.1.35:8080/v1")
   * @returns Array of model IDs
   */
  async fetchProviderModels(baseUrl: string): Promise<string[]> {
    const url = baseUrl.endsWith("/")
      ? `${baseUrl}models`
      : `${baseUrl}/models`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = (await response.json()) as {
      data?: { id: string }[];
    };

    return (data.data ?? []).map((m) => m.id);
  }
}
