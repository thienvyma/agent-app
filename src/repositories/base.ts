/**
 * Base Repository — shared CRUD logic for all repositories.
 * Uses Prisma Client for database operations.
 *
 * @module repositories/base
 */

import { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;

/**
 * Get singleton Prisma client instance.
 * Prevents connection pool exhaustion in dev (Next.js hot reload).
 */
export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}
