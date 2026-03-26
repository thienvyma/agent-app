/**
 * Provider Management API.
 *
 * GET  /api/openclaw/providers — list registered providers
 * POST /api/openclaw/providers — register or update a provider
 *
 * @module app/api/openclaw/providers/route
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import { execOpenClaw, configSet } from "@/lib/openclaw-cli";

/**
 * GET /api/openclaw/providers — List all registered providers.
 */
export async function GET() {
  try {
    const result = await execOpenClaw(
      ["config", "get", "models.providers", "--json"],
      5_000
    );

    if (result.exitCode !== 0) {
      return NextResponse.json(
        apiError("CLI_ERROR", result.stderr || "Failed to get providers"),
        { status: 500 }
      );
    }

    const providers = result.stdout.trim()
      ? JSON.parse(result.stdout)
      : {};

    // Transform to array for easier UI consumption
    const list = Object.entries(providers).map(([name, config]) => ({
      name,
      ...(config as Record<string, unknown>),
    }));

    return NextResponse.json(apiResponse(list));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/openclaw/providers — Register or update a provider.
 *
 * Body: { name, baseUrl, apiKey }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      baseUrl?: string;
      apiKey?: string;
    };

    // Validate
    const errors: Record<string, string> = {};
    if (!body.name?.trim()) errors.name = "Provider name is required";
    if (!body.baseUrl?.trim()) errors.baseUrl = "Base URL is required";
    if (!body.apiKey?.trim()) errors.apiKey = "API key is required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Missing required fields", errors),
        { status: 422 }
      );
    }

    const name = body.name!.trim();
    const baseUrl = body.baseUrl!.trim();
    const apiKey = body.apiKey!.trim();

    // Register provider via configSet
    await configSet(`models.providers.${name}.baseUrl`, baseUrl);
    await configSet(`models.providers.${name}.apiKey`, apiKey);

    return NextResponse.json(
      apiResponse({ name, baseUrl, registered: true }),
      { status: 201 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
