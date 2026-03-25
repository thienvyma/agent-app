/**
 * Approvals API routes.
 *
 * GET  /api/approvals — list pending approvals
 * POST /api/approvals — approve/reject/modify action
 *
 * @module app/api/approvals/route
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";
import { ApprovalStatus } from "@prisma/client";

/**
 * GET /api/approvals — List approval requests.
 *
 * Query params:
 * - status (PENDING, APPROVED, REJECTED, MODIFIED)
 * - page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ApprovalStatus | null;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    } else {
      where.status = ApprovalStatus.PENDING;
    }

    const [approvals, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        include: {
          task: {
            select: {
              id: true,
              description: true,
              assignedToId: true,
              result: true,
            },
          },
        },
      }),
      prisma.approvalRequest.count({ where }),
    ]);

    return NextResponse.json(
      apiResponse(approvals, { total, page, limit }),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/approvals — Process an approval action.
 *
 * Body: { id, action: "approve"|"reject"|"modify", response?, feedback?, modifications? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
      action?: "approve" | "reject" | "modify";
      response?: string;
      feedback?: string;
      modifications?: string;
    };

    if (!body.id || !body.action) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Approval ID and action are required"),
        { status: 422 }
      );
    }

    let updatedStatus: ApprovalStatus;
    let ownerResponse: string | null = null;

    switch (body.action) {
      case "approve":
        updatedStatus = ApprovalStatus.APPROVED;
        ownerResponse = body.response ?? null;
        break;
      case "reject":
        if (!body.feedback) {
          return NextResponse.json(
            apiError("VALIDATION_ERROR", "Feedback is required for rejection"),
            { status: 422 }
          );
        }
        updatedStatus = ApprovalStatus.REJECTED;
        ownerResponse = body.feedback;
        break;
      case "modify":
        updatedStatus = ApprovalStatus.MODIFIED;
        ownerResponse = body.modifications ?? null;
        break;
      default:
        return NextResponse.json(
          apiError("VALIDATION_ERROR", "Invalid action. Use: approve, reject, modify"),
          { status: 422 }
        );
    }

    const updated = await prisma.approvalRequest.update({
      where: { id: body.id },
      data: {
        status: updatedStatus,
        ownerResponse,
        resolvedAt: new Date(),
      },
      include: { task: true },
    });

    return NextResponse.json(apiResponse(updated), { status: 200 });
  } catch (error) {
    const { status, body } = handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
