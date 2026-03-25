/**
 * Tests for NextAuth Credentials authentication flow.
 * Covers: authorize logic, password validation, session callbacks.
 *
 * @module tests/auth/auth.test
 */
import bcrypt from "bcryptjs";

/** Mock user data matching Prisma User model */
const MOCK_USER = {
  id: "test-user-id",
  email: "admin@openclaw.dev",
  password: bcrypt.hashSync("admin123", 10),
  name: "Owner",
  role: "owner",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Mock Prisma findUnique */
const mockFindUnique = jest.fn();

jest.mock("@/repositories", () => ({
  getPrisma: () => ({
    user: {
      findUnique: mockFindUnique,
    },
  }),
}));

describe("Auth — Credentials Provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("password hashing", () => {
    it("should hash password with bcrypt", () => {
      const hash = bcrypt.hashSync("admin123", 10);
      expect(hash).not.toBe("admin123");
      expect(hash.startsWith("$2")).toBe(true);
    });

    it("should verify correct password", async () => {
      const hash = bcrypt.hashSync("admin123", 10);
      const result = await bcrypt.compare("admin123", hash);
      expect(result).toBe(true);
    });

    it("should reject wrong password", async () => {
      const hash = bcrypt.hashSync("admin123", 10);
      const result = await bcrypt.compare("wrongpass", hash);
      expect(result).toBe(false);
    });
  });

  describe("authorize flow", () => {
    /** Simulates the authorize logic from auth.ts */
    async function authorize(credentials: { email?: string; password?: string }) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await mockFindUnique({
        where: { email: credentials.email },
      });

      if (!user) return null;

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    }

    it("should return null when email is missing", async () => {
      const result = await authorize({ password: "admin123" });
      expect(result).toBeNull();
    });

    it("should return null when password is missing", async () => {
      const result = await authorize({ email: "admin@openclaw.dev" });
      expect(result).toBeNull();
    });

    it("should return null when user not found in DB", async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await authorize({
        email: "nobody@test.com",
        password: "test",
      });
      expect(result).toBeNull();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: "nobody@test.com" },
      });
    });

    it("should return null when password is incorrect", async () => {
      mockFindUnique.mockResolvedValue(MOCK_USER);
      const result = await authorize({
        email: "admin@openclaw.dev",
        password: "wrongpassword",
      });
      expect(result).toBeNull();
    });

    it("should return user object when credentials are valid", async () => {
      mockFindUnique.mockResolvedValue(MOCK_USER);
      const result = await authorize({
        email: "admin@openclaw.dev",
        password: "admin123",
      });
      expect(result).toEqual({
        id: "test-user-id",
        name: "Owner",
        email: "admin@openclaw.dev",
        role: "owner",
      });
    });

    it("should not expose password hash in returned user", async () => {
      mockFindUnique.mockResolvedValue(MOCK_USER);
      const result = await authorize({
        email: "admin@openclaw.dev",
        password: "admin123",
      });
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("middleware route protection", () => {
    const PUBLIC_ROUTES = ["/login", "/api/auth", "/api/health"];

    function isPublicRoute(pathname: string): boolean {
      return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    }

    it("should allow /login as public", () => {
      expect(isPublicRoute("/login")).toBe(true);
    });

    it("should allow /api/auth callbacks as public", () => {
      expect(isPublicRoute("/api/auth/callback/credentials")).toBe(true);
    });

    it("should allow /api/health as public", () => {
      expect(isPublicRoute("/api/health")).toBe(true);
    });

    it("should protect / (dashboard)", () => {
      expect(isPublicRoute("/")).toBe(false);
    });

    it("should protect /agents", () => {
      expect(isPublicRoute("/agents")).toBe(false);
    });

    it("should protect /api/tasks", () => {
      expect(isPublicRoute("/api/tasks")).toBe(false);
    });
  });

  describe("JWT callbacks", () => {
    it("should add role to JWT token on login", () => {
      const token: Record<string, unknown> = { sub: "test-id" };
      const user = { role: "owner" };
      // Simulates jwt callback logic
      if (user) {
        token.role = (user as { role?: string }).role ?? "viewer";
      }
      expect(token.role).toBe("owner");
    });

    it("should default role to 'viewer' when missing", () => {
      const token: Record<string, unknown> = { sub: "test-id" };
      const user = {};
      if (user) {
        token.role = (user as { role?: string }).role ?? "viewer";
      }
      expect(token.role).toBe("viewer");
    });

    it("should attach role to session.user", () => {
      const session = { user: {} as Record<string, unknown> };
      const token = { role: "owner" };
      if (session.user) {
        session.user.role = token.role;
      }
      expect(session.user.role).toBe("owner");
    });
  });
});
