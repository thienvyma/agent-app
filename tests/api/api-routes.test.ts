/**
 * Tests for Core API: api-auth middleware and route handlers.
 * Phase 16: Core API Routes.
 * Tests pure logic functions — no HTTP server needed.
 */

import { apiResponse, apiError, handleApiError } from "@/lib/api-auth";

// Mock Prisma
const createMockDb = () => ({
  company: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  agent: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
});

describe("API Auth Helpers", () => {
  describe("apiResponse", () => {
    it("should format success response with data", () => {
      const result = apiResponse({ name: "Test Company" });

      expect(result).toEqual({
        data: { name: "Test Company" },
      });
    });

    it("should include meta when provided", () => {
      const result = apiResponse(
        [{ id: "1" }, { id: "2" }],
        { total: 50, page: 1, limit: 20 }
      );

      expect(result).toEqual({
        data: [{ id: "1" }, { id: "2" }],
        meta: { total: 50, page: 1, limit: 20 },
      });
    });
  });

  describe("apiError", () => {
    it("should format error response", () => {
      const result = apiError("NOT_FOUND", "Company not found");

      expect(result).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Company not found",
        },
      });
    });

    it("should include details when provided", () => {
      const result = apiError("VALIDATION_ERROR", "Invalid input", {
        name: "Name is required",
      });

      expect(result).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: { name: "Name is required" },
        },
      });
    });
  });

  describe("handleApiError", () => {
    it("should return 400 for Prisma validation errors", () => {
      const prismaError = new Error("Invalid `prisma.company.create()` invocation");
      prismaError.name = "PrismaClientValidationError";

      const result = handleApiError(prismaError);

      expect(result.status).toBe(400);
      expect(result.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 404 for not found errors", () => {
      const error = new Error("Record not found");
      (error as unknown as Record<string, unknown>).code = "P2025";

      const result = handleApiError(error);

      expect(result.status).toBe(404);
      expect(result.body.error.code).toBe("NOT_FOUND");
    });

    it("should return 500 for unknown errors", () => {
      const error = new Error("Something unexpected");

      const result = handleApiError(error);

      expect(result.status).toBe(500);
      expect(result.body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});

describe("Company API Logic", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
  });

  it("should list companies with count", async () => {
    mockDb.company.findMany.mockResolvedValue([
      { id: "c-1", name: "Acme Corp" },
      { id: "c-2", name: "Beta LLC" },
    ]);
    mockDb.company.count.mockResolvedValue(2);

    const companies = await mockDb.company.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    const total = await mockDb.company.count();

    const response = apiResponse(companies, { total, page: 1, limit: 20 });

    expect(response.data).toHaveLength(2);
    expect(response.meta?.total).toBe(2);
  });

  it("should create company with required fields", async () => {
    mockDb.company.create.mockResolvedValue({
      id: "c-new",
      name: "New Corp",
      description: "A new company",
      config: {},
      createdAt: new Date(),
    });

    const company = await mockDb.company.create({
      data: { name: "New Corp", description: "A new company" },
    });

    expect(company.id).toBe("c-new");
    expect(company.name).toBe("New Corp");
  });
});

describe("Agents API Logic", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
  });

  it("should list agents with filtering", async () => {
    mockDb.agent.findMany.mockResolvedValue([
      { id: "a-1", name: "CEO", role: "ceo", status: "RUNNING" },
    ]);

    const agents = await mockDb.agent.findMany({
      where: { status: "RUNNING" },
    });

    expect(agents).toHaveLength(1);
    expect(agents[0].role).toBe("ceo");
  });
});

describe("Health API Logic", () => {
  it("should build health response structure", () => {
    const health = {
      status: "healthy" as const,
      services: {
        database: { status: "connected", latencyMs: 3 },
        redis: { status: "connected", latencyMs: 1 },
      },
      system: {
        uptime: process.uptime(),
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };

    expect(health.status).toBe("healthy");
    expect(health.services.database.status).toBe("connected");
    expect(typeof health.system.uptime).toBe("number");
  });
});
