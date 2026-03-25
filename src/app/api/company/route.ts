/**
 * Company API routes.
 *
 * GET  /api/company — list companies
 * POST /api/company — create company
 *
 * @module app/api/company/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";

/**
 * GET /api/company — List all companies.
 *
 * Query params:
 * - page (default: 1)
 * - limit (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          departments: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.company.count(),
    ]);

    return NextResponse.json(
      apiResponse(companies, { total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/company — Create a new company.
 *
 * Body: { name: string, description?: string, config?: object }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      config?: Record<string, unknown>;
    };

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Company name is required", {
          name: "Name cannot be empty",
        }),
        { status: 422 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: body.name.trim(),
        description: body.description ?? null,
        config: (body.config ?? {}) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(apiResponse(company), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
