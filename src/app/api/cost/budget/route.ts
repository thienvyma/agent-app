/**
 * Budget API — manage daily budget limits.
 *
 * GET  /api/cost/budget — fetch current budget
 * POST /api/cost/budget — upsert daily budget
 *
 * @module app/api/cost/budget/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/**
 * Get today's date string in YYYY-MM-DD format.
 */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * GET /api/cost/budget — Fetch budget (today or specific date).
 *
 * Query params:
 * - date: YYYY-MM-DD (default: today)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? todayStr();

    const budget = await prisma.budget.findUnique({ where: { date } });

    // Also get today's total spent from cost_entries
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const spent = await prisma.costEntry.aggregate({
      where: {
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
      _sum: { costUsd: true, tokens: true },
    });

    return NextResponse.json(
      apiResponse({
        budget: budget ?? { dailyLimit: 0, warningPct: 80, currentSpent: 0, date },
        todaySpent: {
          costUsd: spent._sum.costUsd ?? 0,
          tokens: spent._sum.tokens ?? 0,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/cost/budget — Upsert daily budget.
 *
 * Body: { dailyLimit, warningPct? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      dailyLimit?: number;
      warningPct?: number;
      date?: string;
    };

    if (!body.dailyLimit || body.dailyLimit <= 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "dailyLimit must be a positive number"),
        { status: 422 }
      );
    }

    const date = body.date ?? todayStr();

    const budget = await prisma.budget.upsert({
      where: { date },
      update: {
        dailyLimit: body.dailyLimit,
        warningPct: body.warningPct ?? 80,
      },
      create: {
        date,
        dailyLimit: body.dailyLimit,
        warningPct: body.warningPct ?? 80,
        currentSpent: 0,
      },
    });

    return NextResponse.json(apiResponse(budget), { status: 200 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
