/**
 * OpenClaw Auth API — manage provider API keys via CLI.
 *
 * POST /api/openclaw/auth — add provider auth token
 *
 * @module app/api/openclaw/auth/route
 */

import { NextRequest, NextResponse } from "next/server";
import { configSet } from "@/lib/openclaw-cli";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/** Supported providers */
const VALID_PROVIDERS = ["anthropic", "openai", "openrouter", "google", "ollama-lan"] as const;

/**
 * POST /api/openclaw/auth — Set provider API key via config set.
 * Body: { provider: string, apiKey: string, baseUrl?: string }
 *
 * Uses `openclaw config set` to safely write auth without modifying files directly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      provider?: string;
      apiKey?: string;
      baseUrl?: string;
    };

    if (!body.provider?.trim()) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Field 'provider' is required"),
        { status: 422 }
      );
    }

    if (!VALID_PROVIDERS.includes(body.provider as typeof VALID_PROVIDERS[number])) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", `Invalid provider. Valid: ${VALID_PROVIDERS.join(", ")}`),
        { status: 422 }
      );
    }

    const results: Array<{ path: string; success: boolean; error?: string }> = [];

    // Set API key
    if (body.apiKey?.trim()) {
      const keyResult = await configSet(
        `models.providers.${body.provider}.apiKey`,
        body.apiKey.trim()
      );
      results.push({
        path: `models.providers.${body.provider}.apiKey`,
        success: keyResult.exitCode === 0,
        error: keyResult.exitCode !== 0 ? keyResult.stderr : undefined,
      });
    }

    // Set base URL (for custom providers like ollama-lan)
    if (body.baseUrl?.trim()) {
      const urlResult = await configSet(
        `models.providers.${body.provider}.baseUrl`,
        body.baseUrl.trim()
      );
      results.push({
        path: `models.providers.${body.provider}.baseUrl`,
        success: urlResult.exitCode === 0,
        error: urlResult.exitCode !== 0 ? urlResult.stderr : undefined,
      });
    }

    const allSuccess = results.every((r) => r.success);

    return NextResponse.json(
      apiResponse({
        provider: body.provider,
        success: allSuccess,
        results,
      }),
      { status: allSuccess ? 200 : 207 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
