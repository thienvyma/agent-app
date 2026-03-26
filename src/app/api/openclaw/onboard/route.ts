/**
 * POST /api/openclaw/onboard — API route for OpenClaw onboard wizard.
 *
 * Handles step-by-step onboard flow via OnboardExecutor.
 * Each step is executed independently (idempotent).
 *
 * @module app/api/openclaw/onboard/route
 */

import { NextRequest, NextResponse } from "next/server";
import { OnboardExecutor } from "@/lib/openclaw-onboard";

/** Valid onboard step names */
type OnboardStep = "check" | "provider" | "model" | "gateway" | "health" | "models";

/** Request body shape */
interface OnboardRequest {
  step: OnboardStep;
  params?: Record<string, string>;
}

const executor = new OnboardExecutor();

/**
 * POST /api/openclaw/onboard
 *
 * Body: { step: "check"|"provider"|"model"|"gateway"|"health"|"models", params: {...} }
 * Response: { success: boolean, data: {...}, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OnboardRequest;
    const { step, params = {} } = body;

    let data: unknown;

    switch (step) {
      case "check":
        data = await executor.checkInstalled();
        break;

      case "provider":
        await executor.setupProvider(
          params.name ?? "ollama-lan",
          params.baseUrl ?? "",
          params.apiKey ?? "sk-local"
        );
        data = { configured: true };
        break;

      case "model":
        await executor.setupModel(
          params.provider ?? "ollama-lan",
          params.model ?? ""
        );
        data = { configured: true };
        break;

      case "gateway":
        data = await executor.startGateway(
          params.port ? parseInt(params.port, 10) : undefined
        );
        break;

      case "health":
        data = await executor.verifyHealth();
        break;

      case "models":
        data = await executor.fetchProviderModels(
          params.baseUrl ?? "http://localhost:8080/v1"
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown step: ${step}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
