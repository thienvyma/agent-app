/**
 * Prisma client singleton — prevents multiple instances during Next.js hot-reload.
 *
 * Usage:
 *   import { prisma } from "@/lib/prisma";
 *   const companies = await prisma.company.findMany();
 *
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 * @module lib/prisma
 */

import { PrismaClient } from "@prisma/client";

/**
 * Extend global type to store Prisma client singleton.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client instance.
 * In development, reuses the same instance across hot-reloads.
 * In production, creates a new instance.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
