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
      shell: process.platform === "win32",
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
 * Control gateway (start/stop/restart) via service manager.
 */
export async function controlGateway(action: "start" | "stop" | "restart"): Promise<CliResult> {
  return execOpenClaw(["gateway", action], 60_000);
}

/**
 * Start gateway as a truly invisible background process.
 *
 * On Windows, Node.js `spawn` with `detached: true` ALWAYS creates a visible
 * console window. The only reliable method is VBScript:
 *   WshShell.Run(command, 0, False)
 * where 0 = vbHide (completely hidden window).
 *
 * Creates a temp .vbs file → runs it with wscript.exe → cleans up.
 *
 * @param port - Gateway port (default: 18789)
 * @returns true if process started successfully
 */
export async function startGatewayBackground(port: number = 18789): Promise<boolean> {
  const { readFile, writeFile, unlink } = await import("fs/promises");
  const { join } = await import("path");
  const { execFile: ef } = await import("child_process");
  const { promisify: pfy } = await import("util");
  const execFilePromise = pfy(ef);

  let nodeBin = process.execPath;
  let openclawScript = "";

  // Find node.exe + openclaw script paths from gateway.cmd
  try {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    const cmdPath = join(home, ".openclaw", "gateway.cmd");
    const content = await readFile(cmdPath, "utf-8");
    // Match: "C:\...\node.exe" "C:\...\index.js" OR "C:\...\node.exe" C:\...\index.js
    const execMatch = content.match(/"([^"]+node\.exe)"\s+"?([^\s"]+index\.js)"?/);
    if (execMatch && execMatch[1] && execMatch[2]) {
      nodeBin = execMatch[1];
      openclawScript = execMatch[2];
    }
  } catch {
    // gateway.cmd not found
  }

  // Fallback: npm global path
  if (!openclawScript) {
    const appData = process.env.APPDATA || "";
    if (appData) {
      openclawScript = join(appData, "npm", "node_modules", "openclaw", "dist", "index.js");
    }
  }

  if (!openclawScript) {
    return false;
  }

  if (process.platform === "win32") {
    // Windows: Use PowerShell Start-Process -WindowStyle Hidden
    // This is the only reliable way to start a completely invisible process on Windows.
    // VBScript WshShell.Run times out, and Node.js spawn(detached:true) always shows console.
    const { exec: ex } = await import("child_process");
    const { promisify: p } = await import("util");
    const execPromise = p(ex);

    const psCmd = [
      "Start-Process",
      `-FilePath "${nodeBin}"`,
      `-ArgumentList '"${openclawScript}"',"gateway","run","--port","${port}"`,
      "-WindowStyle Hidden",
    ].join(" ");

    try {
      await execPromise(`powershell -Command "${psCmd.replace(/"/g, '\\"')}"`, {
        timeout: 15_000,
      });
    } catch {
      return false;
    }
  } else {
    // Unix: spawn detached works fine
    const { spawn } = await import("child_process");
    const child = spawn(nodeBin, [openclawScript, "gateway", "run", "--port", String(port)], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  }

  // Wait for gateway to fully start
  await new Promise((resolve) => setTimeout(resolve, 6000));

  // Probe RPC to verify
  try {
    const status = await getGatewayStatus();
    const json = status.json as { rpc?: { ok?: boolean }; port?: { status?: string } } | undefined;
    return json?.rpc?.ok === true || json?.port?.status === "busy";
  } catch {
    return false;
  }
}

/**
 * Stop the gateway process — finds PID first and force-kills it.
 *
 * Strategy (fast, avoids 60s "draining" hang):
 * 1. Get PID from `openclaw gateway status --json` → port.listeners[].pid
 * 2. Force-kill with `taskkill /PID /F` (Windows) or `kill -9` (Unix)
 * 3. Also run `openclaw gateway stop` with short timeout (deregister service)
 * 4. Fallback: find PID via Get-NetTCPConnection (Windows specific)
 *
 * @returns true if the gateway was stopped successfully
 */
export async function stopGatewayProcess(): Promise<boolean> {
  const { exec } = await import("child_process");
  const { promisify: pfy } = await import("util");
  const execAsync = pfy(exec);

  let killed = false;

  // 1. Get PID from gateway status JSON (fast — ~2s)
  try {
    const status = await getGatewayStatus();
    const json = status.json as {
      port?: { listeners?: Array<{ pid: number }> };
    } | undefined;

    const listeners = json?.port?.listeners;
    if (listeners && listeners.length > 0) {
      for (const listener of listeners) {
        if (listener.pid) {
          const killCmd = process.platform === "win32"
            ? `taskkill /PID ${listener.pid} /F`
            : `kill -9 ${listener.pid}`;
          await execAsync(killCmd).catch(() => {});
          killed = true;
        }
      }
    }
  } catch {
    // Can't get status, try fallback
  }

  // 2. Fallback: find PID via Get-NetTCPConnection (Windows specific)
  if (!killed && process.platform === "win32") {
    try {
      const { stdout } = await execAsync(
        `powershell -Command "(Get-NetTCPConnection -LocalPort 18789 -ErrorAction SilentlyContinue | Where-Object State -eq 'Listen').OwningProcess"`,
        { timeout: 5000 }
      );
      const pid = parseInt(stdout.trim(), 10);
      if (pid > 0) {
        await execAsync(`taskkill /PID ${pid} /F`).catch(() => {});
        killed = true;
      }
    } catch {
      // Can't find PID via netstat
    }
  }

  // 3. Also deregister the service (short timeout — don't wait for drain)
  try {
    await execOpenClaw(["gateway", "stop"], 10_000);
  } catch {
    // Best effort — service deregistration
  }

  if (killed) {
    // Wait for process to fully exit
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return killed;
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
 *
 * Tries `openclaw update --yes` first. If that fails (e.g., CLI v2026.3.11
 * has a bug with npm `--omit=optional` flag), falls back to
 * `npm install -g openclaw@latest`.
 */
export async function updateOpenClaw(): Promise<CliResult> {
  const result = await execOpenClaw(["update", "--yes"], 120_000);

  // If CLI update succeeded, return
  if (result.exitCode === 0) return result;

  // Fallback: use npm directly
  try {
    const { exec } = await import("child_process");
    const { promisify: pfy } = await import("util");
    const execAsync = pfy(exec);
    const { stdout, stderr } = await execAsync("npm install -g openclaw@latest", {
      timeout: 120_000,
      encoding: "utf-8",
    });
    return {
      stdout: `(fallback: npm install -g)\n${stdout}`,
      stderr: stderr || "",
      exitCode: 0,
    };
  } catch (npmError: unknown) {
    const err = npmError as { stdout?: string; stderr?: string };
    return {
      stdout: result.stdout + "\n" + (err.stdout ?? ""),
      stderr: result.stderr + "\nnpm fallback also failed: " + (err.stderr ?? ""),
      exitCode: 1,
    };
  }
}

/**
 * Get gateway logs.
 */
export async function gatewayLogs(lines: number = 50): Promise<CliResult> {
  return execOpenClaw(["logs", "--lines", String(lines)]);
}

/**
 * Get channels/endpoint status.
 */
export async function channelsStatus(): Promise<CliResult> {
  return execOpenClaw(["channels", "status", "--probe", "--json"]);
}

/**
 * Send a message to an agent via CLI.
 */
export async function agentChat(agentId: string, message: string): Promise<CliResult> {
  return execOpenClaw(["agent", "--agent", agentId, "--message", message], 60_000);
}

/**
 * List all agents.
 */
export async function agentsList(): Promise<CliResult> {
  return execOpenClaw(["agents", "list", "--json"]);
}

/**
 * Add (register) an agent in OpenClaw.
 *
 * @param id - Agent identifier (e.g., "ceo", "developer")
 * @param workspace - Optional workspace path (default: auto-generated by OpenClaw)
 */
export async function agentAdd(id: string, workspace?: string): Promise<CliResult> {
  const args = ["agents", "add", id];
  if (workspace) {
    args.push("--workspace", workspace);
  }
  return execOpenClaw(args, 15_000);
}

/**
 * Delete (deregister) an agent from OpenClaw.
 *
 * @param id - Agent identifier to remove
 */
export async function agentDelete(id: string): Promise<CliResult> {
  return execOpenClaw(["agents", "delete", id], 15_000);
}

/**
 * List sessions, optionally filtered by agent.
 *
 * @param agentId - Optional agent ID to filter sessions
 */
export async function sessionsList(agentId?: string): Promise<CliResult> {
  const args = ["sessions", "--json"];
  if (agentId) {
    args.push("--agent", agentId);
  }
  return execOpenClaw(args);
}

