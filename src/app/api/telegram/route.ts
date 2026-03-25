/**
 * Telegram Bot API — status/start/stop/configure via wrapper.
 *
 * GET  /api/telegram — bot status
 * POST /api/telegram — start/stop/configure bot
 *
 * @module app/api/telegram/route
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/** In-memory bot state (persisted via env vars at startup) */
let botState = {
  running: false,
  token: process.env.TELEGRAM_BOT_TOKEN ?? "",
  startedAt: null as string | null,
  lastError: null as string | null,
  commandsRegistered: [
    "/start", "/status", "/agents", "/tasks",
    "/budget", "/help", "/stop",
  ],
};

/**
 * GET /api/telegram — Get bot status.
 */
export async function GET() {
  try {
    return NextResponse.json(
      apiResponse({
        running: botState.running,
        configured: !!botState.token,
        tokenPreview: botState.token
          ? `${botState.token.slice(0, 6)}...${botState.token.slice(-4)}`
          : null,
        startedAt: botState.startedAt,
        lastError: botState.lastError,
        commands: botState.commandsRegistered,
        envVar: "TELEGRAM_BOT_TOKEN",
      })
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/telegram — Control bot.
 * Body: { action: "start" | "stop" | "configure", token?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: string;
      token?: string;
    };

    const { action, token } = body;

    if (!action || !["start", "stop", "configure"].includes(action)) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "action must be 'start', 'stop', or 'configure'"),
        { status: 422 }
      );
    }

    if (action === "configure") {
      if (!token?.trim()) {
        return NextResponse.json(
          apiError("VALIDATION_ERROR", "Token is required for configure action"),
          { status: 422 }
        );
      }
      botState.token = token.trim();
      botState.lastError = null;
      return NextResponse.json(
        apiResponse({
          action: "configure",
          success: true,
          message: "Token saved. Use 'start' to activate the bot.",
          tokenPreview: `${botState.token.slice(0, 6)}...${botState.token.slice(-4)}`,
        })
      );
    }

    if (action === "start") {
      if (!botState.token) {
        return NextResponse.json(
          apiError("VALIDATION_ERROR", "Bot token not configured. Use 'configure' first."),
          { status: 422 }
        );
      }

      try {
        // Set env var for initTelegram (it reads from process.env)
        process.env.TELEGRAM_BOT_TOKEN = botState.token;
        const { initTelegram } = await import("@/lib/telegram-startup");
        const initResult = initTelegram();
        botState.running = true;
        botState.startedAt = new Date().toISOString();
        botState.lastError = null;
        return NextResponse.json(
          apiResponse({
            action: "start",
            success: true,
            message: "Telegram bot started successfully.",
            startedAt: botState.startedAt,
          })
        );
      } catch (err) {
        botState.lastError = String(err);
        botState.running = false;
        return NextResponse.json(
          apiResponse({
            action: "start",
            success: false,
            error: String(err),
          }),
          { status: 500 }
        );
      }
    }

    if (action === "stop") {
      botState.running = false;
      botState.startedAt = null;
      return NextResponse.json(
        apiResponse({
          action: "stop",
          success: true,
          message: "Telegram bot stopped.",
        })
      );
    }

    return NextResponse.json(apiError("VALIDATION_ERROR", "Unknown action"), { status: 422 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
