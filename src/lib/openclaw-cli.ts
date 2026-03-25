/**
 * OpenClaw CLI Executor — runs OpenClaw CLI commands indirectly.
 *
 * This module provides a safe wrapper around the `openclaw` CLI binary,
 * allowing the app to configure OpenClaw without modifying its files directly.
 *
 * @module lib/openclaw-cli
 */

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/** Result of an OpenClaw CLI command execution */
export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  /** Parsed JSON output (if --json flag was used) */
  json?: unknown;
}

/** Default timeout for CLI commands (30 seconds) */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Execute an OpenClaw CLI command.
 *
 * @param args - CLI arguments (e.g., ["gateway", "status", "--json"])
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @returns CliResult with stdout, stderr, exitCode, and optional parsed JSON
 *
 * @example
 * ```ts
 * const result = await execOpenClaw(["gateway", "status", "--json"]);
 * if (result.exitCode === 0 && result.json) {
 *   console.log("Gateway status:", result.json);
 * }
 * ```
 */
export async function execOpenClaw(
  args: string[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<CliResult> {
  try {
    const { stdout, stderr } = await execFileAsync("openclaw", args, {
      timeout: timeoutMs,
      encoding: "utf-8",
      env: { ...process.env },
      windowsHide: true,
    });

    const result: CliResult = {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };

    // Try to parse JSON if --json flag was used
    if (args.includes("--json") && result.stdout) {
      try {
        result.json = JSON.parse(result.stdout);
      } catch {
        // Not valid JSON, leave as string
      }
    }

    return result;
  } catch (error: unknown) {
    const err = error as {
      stdout?: string;
      stderr?: string;
      code?: number | string;
      killed?: boolean;
    };

    // Command failed but still has output
    return {
      stdout: (err.stdout ?? "").toString().trim(),
      stderr: (err.stderr ?? "").toString().trim(),
      exitCode: typeof err.code === "number" ? err.code : 1,
    };
  }
}

/**
 * Get OpenClaw version.
 */
export async function getVersion(): Promise<string> {
  const result = await execOpenClaw(["--version"], 5000);
  return result.stdout || "unknown";
}

/**
 * Get gateway status as JSON.
 */
export async function getGatewayStatus(): Promise<CliResult> {
  return execOpenClaw(["gateway", "status", "--json"]);
}

/**
 * Control gateway (start/stop/restart).
 */
export async function controlGateway(action: "start" | "stop" | "restart"): Promise<CliResult> {
  return execOpenClaw(["gateway", action], 60_000);
}

/**
 * Get config value by path.
 */
export async function configGet(path: string): Promise<CliResult> {
  return execOpenClaw(["config", "get", path]);
}

/**
 * Set config value by path.
 */
export async function configSet(path: string, value: string): Promise<CliResult> {
  return execOpenClaw(["config", "set", path, value]);
}

/**
 * Unset config value by path.
 */
export async function configUnset(path: string): Promise<CliResult> {
  return execOpenClaw(["config", "unset", path]);
}

/**
 * Validate config against schema.
 */
export async function configValidate(): Promise<CliResult> {
  return execOpenClaw(["config", "validate", "--json"]);
}

/**
 * List available models.
 */
export async function modelsList(): Promise<CliResult> {
  return execOpenClaw(["models", "list", "--json"]);
}

/**
 * Get model status (auth, primary, fallbacks).
 */
export async function modelsStatus(): Promise<CliResult> {
  return execOpenClaw(["models", "status", "--json"]);
}

/**
 * Set primary model.
 */
export async function modelsSet(model: string): Promise<CliResult> {
  return execOpenClaw(["models", "set", model]);
}

/**
 * Add auth token for a provider.
 */
export async function modelsAuthPasteToken(
  provider: string,
  token: string
): Promise<CliResult> {
  // Use stdin pipe for security — but paste-token reads from tty
  // Use config set as fallback for non-interactive mode
  return execOpenClaw([
    "models", "auth", "paste-token",
    "--provider", provider,
    "--yes",
  ]);
}

/**
 * Run doctor fix (non-interactive).
 */
export async function doctorFix(): Promise<CliResult> {
  return execOpenClaw(["doctor", "--fix", "--non-interactive"], 60_000);
}

/**
 * Run health check.
 */
export async function healthCheck(): Promise<CliResult> {
  return execOpenClaw(["health", "--json"]);
}

/**
 * Get full system status.
 */
export async function systemStatus(): Promise<CliResult> {
  return execOpenClaw(["status", "--json"]);
}

/**
 * Update OpenClaw to latest version.
 */
export async function updateOpenClaw(): Promise<CliResult> {
  return execOpenClaw(["update", "--yes"], 120_000);
}
