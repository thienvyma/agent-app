/**
 * Telegram Bot API — integrated with OpenClaw channels system.
 *
 * GET  /api/telegram — channel status from `openclaw channels status`
 * POST /api/telegram — configure/start/stop/pair via OpenClaw CLI
 *
 * Token is stored in ~/.openclaw/telegram-token.txt (simple local file)
 * because `openclaw config set channels.telegram.token` is not a valid path.
 * The real channel setup is done via `openclaw channels add --channel telegram --token`.
 *
 * @module app/api/telegram/route
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import {
  execOpenClaw,
  startGatewayBackground,
  stopGatewayProcess,
} from "@/lib/openclaw-cli";

/** Path to store Telegram bot token locally */
function getTokenFilePath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return `${home}/.openclaw/telegram-token.txt`;
}

/** Read saved token from local file */
async function readSavedToken(): Promise<string | null> {
  try {
    const { readFile } = await import("fs/promises");
    const token = await readFile(getTokenFilePath(), "utf-8");
    return token.trim() || null;
  } catch {
    return null;
  }
}

/** Save token to local file */
async function saveToken(token: string): Promise<void> {
  const { writeFile, mkdir } = await import("fs/promises");
  const { dirname } = await import("path");
  const filePath = getTokenFilePath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, token.trim(), "utf-8");
}

/**
 * GET /api/telegram — Get real channel status from OpenClaw.
 */
export async function GET() {
  try {
    let channelActive = false;
    let tokenPreview: string | null = null;

    // Check locally saved token
    const savedToken = await readSavedToken();
    if (savedToken) {
      tokenPreview = `${savedToken.slice(0, 6)}...${savedToken.slice(-4)}`;
    }

    // Check real channel status from OpenClaw
    try {
      const statusResult = await execOpenClaw(["channels", "status"], 10000);
      if (statusResult.exitCode === 0) {
        const lower = statusResult.stdout.toLowerCase();
        channelActive =
          lower.includes("telegram") &&
          (lower.includes("connected") ||
            lower.includes("polling") ||
            lower.includes("active") ||
            lower.includes("running"));
      }
    } catch {
      // Gateway might be offline
    }

    // List pending pairing requests
    let pendingPairings: Array<{ code: string; sender: string; channel: string }> = [];
    try {
      const pairingResult = await execOpenClaw(["pairing", "list"], 5000);
      if (pairingResult.exitCode === 0 && pairingResult.stdout.trim()) {
        const lines = pairingResult.stdout
          .split("\n")
          .filter((l) => l.trim() && !l.includes("No pending") && !l.includes("──"));
        for (const line of lines) {
          const parts = line.trim().split(/\s{2,}/);
          if (parts.length >= 2) {
            pendingPairings.push({
              code: parts[0] ?? "",
              sender: parts[1] ?? "",
              channel: parts[2] ?? "telegram",
            });
          }
        }
      }
    } catch {
      // Pairing not available
    }

    return NextResponse.json(
      apiResponse({
        running: channelActive,
        configured: !!savedToken,
        tokenPreview,
        pendingPairings,
      })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/telegram — Control Telegram channel via OpenClaw CLI.
 * Body: { action, token?, code? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: string;
      token?: string;
      code?: string;
    };

    const { action, token, code } = body;

    if (
      !action ||
      !["configure", "start", "stop", "pair", "pairing-list"].includes(action)
    ) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "action must be 'configure', 'start', 'stop', 'pair', or 'pairing-list'"),
        { status: 422 }
      );
    }

    // ── configure: save token to local file ──
    if (action === "configure") {
      if (!token?.trim()) {
        return NextResponse.json(
          apiError("VALIDATION_ERROR", "Token is required"),
          { status: 422 }
        );
      }
      await saveToken(token.trim());
      return NextResponse.json(
        apiResponse({
          action: "configure",
          success: true,
          message: "Token saved. Click 'Start Bot' to activate.",
          tokenPreview: `${token.slice(0, 6)}...${token.slice(-4)}`,
        })
      );
    }

    // ── start: channels add + restart gateway ──
    if (action === "start") {
      // Get token from request or saved file
      let botToken = token?.trim() ?? "";
      if (!botToken) {
        botToken = (await readSavedToken()) ?? "";
      }
      if (!botToken) {
        return NextResponse.json(
          apiError("VALIDATION_ERROR", "No Telegram bot token. Save token first."),
          { status: 422 }
        );
      }

      // Add channel via OpenClaw CLI
      const addResult = await execOpenClaw(
        ["channels", "add", "--channel", "telegram", "--token", botToken],
        15000
      );

      // Restart gateway to pick up new channel config
      await stopGatewayProcess();
      await new Promise((r) => setTimeout(r, 2000));
      const started = await startGatewayBackground();

      return NextResponse.json(
        apiResponse({
          action: "start",
          success: addResult.exitCode === 0 || started,
          message: addResult.exitCode === 0
            ? "Telegram channel added. Gateway restarted. Send /start to your bot on Telegram to get a pairing code."
            : `Output: ${addResult.stdout || addResult.stderr}. Gateway ${started ? "restarted" : "restart failed"}.`,
          gatewayRestarted: started,
        })
      );
    }

    // ── stop: remove channel + restart gateway ──
    if (action === "stop") {
      const removeResult = await execOpenClaw(
        ["channels", "remove", "--channel", "telegram", "--delete"],
        10000
      );
      await stopGatewayProcess();
      await new Promise((r) => setTimeout(r, 2000));
      const started = await startGatewayBackground();

      return NextResponse.json(
        apiResponse({
          action: "stop",
          success: true,
          message: "Telegram channel removed. Gateway restarted.",
          gatewayRestarted: started,
        })
      );
    }

    // ── pair: approve a pairing code ──
    if (action === "pair") {
      if (!code?.trim()) {
        return NextResponse.json(
          apiError("VALIDATION_ERROR", "Pairing code is required"),
          { status: 422 }
        );
      }
      const pairResult = await execOpenClaw(
        ["pairing", "approve", code.trim()],
        10000
      );
      return NextResponse.json(
        apiResponse({
          action: "pair",
          success: pairResult.exitCode === 0,
          message: pairResult.exitCode === 0
            ? `Pairing approved for code: ${code.trim()}`
            : `Pairing failed: ${pairResult.stderr || pairResult.stdout}`,
        })
      );
    }

    // ── pairing-list: list pending requests ──
    if (action === "pairing-list") {
      const listResult = await execOpenClaw(["pairing", "list"], 5000);
      return NextResponse.json(
        apiResponse({
          action: "pairing-list",
          success: listResult.exitCode === 0,
          output: listResult.stdout,
        })
      );
    }

    return NextResponse.json(apiError("VALIDATION_ERROR", "Unknown action"), { status: 422 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
