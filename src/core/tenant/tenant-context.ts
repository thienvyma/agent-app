/**
 * TenantContext — data isolation utilities.
 *
 * Provides schema names, Redis prefixes, and access validation
 * to ensure tenants cannot access each other's data.
 *
 * @module core/tenant/tenant-context
 */

/**
 * Static utilities for tenant data isolation.
 */
export class TenantContext {
  /**
   * Generate DB schema name for a tenant.
   * Used for PostgreSQL schema-based isolation.
   *
   * @param tenantId - Tenant ID
   * @returns Schema name (e.g., "t_tenant_001")
   */
  static getSchemaName(tenantId: string): string {
    return `t_${tenantId.replace(/-/g, "_")}`;
  }

  /**
   * Generate Redis key prefix for a tenant.
   * All tenant Redis keys must use this prefix.
   *
   * @param tenantId - Tenant ID
   * @returns Redis prefix (e.g., "t:tenant-001:")
   */
  static getRedisPrefix(tenantId: string): string {
    return `t:${tenantId}:`;
  }

  /**
   * Scope a Redis key with tenant prefix.
   *
   * @param tenantId - Tenant ID
   * @param key - Original key
   * @returns Scoped key (e.g., "t:tenant-001:sessions:ceo")
   */
  static scopeRedisKey(tenantId: string, key: string): string {
    return `${TenantContext.getRedisPrefix(tenantId)}${key}`;
  }

  /**
   * Validate that a request's tenant matches the resource's tenant.
   * Blocks cross-tenant data access.
   *
   * @param requestTenantId - Tenant from the request context
   * @param resourceTenantId - Tenant that owns the resource
   * @returns True if access is allowed
   */
  static validateAccess(requestTenantId: string, resourceTenantId: string): boolean {
    return requestTenantId === resourceTenantId;
  }

  /**
   * Generate file storage path for a tenant.
   *
   * @param tenantId - Tenant ID
   * @returns Storage path (e.g., "/storage/tenant-001/")
   */
  static getStoragePath(tenantId: string): string {
    return `/storage/${tenantId}/`;
  }

  /**
   * Generate OpenClaw session key scoped to tenant.
   *
   * @param tenantId - Tenant ID
   * @param agentId - Agent ID
   * @returns Session key (e.g., "tenant-001_ceo-001")
   */
  static getSessionKey(tenantId: string, agentId: string): string {
    return `${tenantId}_${agentId}`;
  }
}
