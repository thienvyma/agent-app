/**
 * Departments API — CRUD for Department entries.
 *
 * GET  /api/departments — list departments (optional ?company= filter)
 * POST /api/departments — create new department
 *
 * @module app/api/departments/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

/**
 * GET /api/departments — List all departments.
 *
 * Query: company (filter by companyId), parent (filter by parentId)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company");
    const parent = searchParams.get("parent");

    const where: { companyId?: string; parentId?: string | null } = {};
    if (company) where.companyId = company;
    if (parent === "null") {
      where.parentId = null;
    } else if (parent) {
      where.parentId = parent;
    }

    const departments = await prisma.department.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        children: { select: { id: true, name: true } },
        agents: { select: { id: true, name: true, status: true } },
      },
    });

    return NextResponse.json(apiResponse(departments), { status: 200 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/departments — Create a new department.
 *
 * Body: { name, companyId, parentId?, description? }
 */
export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as {
      name?: string;
      companyId?: string;
      parentId?: string | null;
      description?: string;
    };

    const errors: Record<string, string> = {};
    if (!data.name?.trim()) errors.name = "Department name is required";
    if (data.name && data.name.length > 100) errors.name = "Max 100 characters";
    if (!data.companyId) errors.companyId = "Company ID is required";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Missing required fields", errors),
        { status: 422 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name: data.name!.trim(),
        companyId: data.companyId!,
        parentId: data.parentId ?? null,
        description: data.description ?? null,
      },
    });

    return NextResponse.json(apiResponse(department), { status: 201 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
