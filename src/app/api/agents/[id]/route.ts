/**
 * Agent Detail API route.
 *
 * GET   /api/agents/[id] — Get a single agent by ID with relations.
 * PATCH /api/agents/[id] — Update agent config (model, sop, tools, skills).
 *
 * Phase 74: Added PATCH for per-agent model configuration.
 *
 * @module app/api/agents/[id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import { configSet, execOpenClaw } from "@/lib/openclaw-cli";

/**
 * GET /api/agents/[id] — Get agent detail.
 *
 * Includes department, tasks (latest 20), and basic stats.
 *
 * @param request - Next.js request
 * @param context - Route context with id parameter
 * @returns Agent detail with relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true },
        },
        tasks: {
          select: {
            id: true,
            description: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        apiError("NOT_FOUND", `Agent with id '${id}' not found`),
        { status: 404 }
      );
    }

    return NextResponse.json(apiResponse(agent));
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * PATCH /api/agents/[id] — Update agent configuration.
 *
 * Body: { model?, sop?, tools?, skills?, isAlwaysOn? }
 * Syncs model change to OpenClaw config.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      model?: string;
      sop?: string;
      tools?: string[];
      skills?: string[];
      isAlwaysOn?: boolean;
    };

    // Verify agent exists
    const existing = await prisma.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        apiError("NOT_FOUND", `Agent with id '${id}' not found`),
        { status: 404 }
      );
    }

    // Build update data (only provided fields)
    const updateData: Record<string, unknown> = {};
    if (body.model !== undefined) updateData.model = body.model;
    if (body.sop !== undefined) updateData.sop = body.sop;
    if (body.tools !== undefined) updateData.tools = body.tools;
    if (body.skills !== undefined) updateData.skills = body.skills;
    if (body.isAlwaysOn !== undefined) updateData.isAlwaysOn = body.isAlwaysOn;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "No fields to update"),
        { status: 422 }
      );
    }

    // Update Prisma record
    const updated = await prisma.agent.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    // Sync model to OpenClaw config (best-effort)
    let openclawSynced = false;
    if (body.model) {
      try {
        // Sync model to OpenClaw using agents model command
        // Format: provider/model-name (e.g. ollama-lan/qwen2.5:7b)
        const slug = existing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        // Try to set model for the specific agent via config set
        // OpenClaw agents.list is an array, so we need the index
        const listResult = await execOpenClaw(["agents", "list", "--json"], 5_000);
        if (listResult.exitCode === 0 && listResult.stdout.trim()) {
          const agents = JSON.parse(listResult.stdout) as Array<{ id: string }>;
          const idx = agents.findIndex((a) => a.id === slug || a.id === "main");
          if (idx >= 0) {
            await configSet(`agents.list[${idx}].model`, body.model);
            openclawSynced = true;
          }
        }
      } catch {
        // Best-effort: DB is source of truth
      }
    }

    return NextResponse.json(
      apiResponse({ ...updated, openclawSynced }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

