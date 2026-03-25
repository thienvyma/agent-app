/**
 * AuditProvider — data logic for Audit Trail page.
 *
 * Handles pagination, filtering, and CSV export of audit entries.
 *
 * @module components/pages/audit-provider
 */

/** Audit entry data */
interface AuditEntry {
  id: string;
  agent: string;
  action: string;
  details: string;
  timestamp: Date;
}

/** Paginated result */
export interface PaginatedResult {
  items: AuditEntry[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

/** Audit filter criteria */
interface AuditFilter {
  agent?: string;
  action?: string;
}

/**
 * Paginate audit entries.
 *
 * @param entries - Full entry list
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page (default: 50)
 * @returns Paginated result with metadata
 */
export function paginateAudit(entries: AuditEntry[], page: number, pageSize = 50): PaginatedResult {
  const totalPages = Math.ceil(entries.length / pageSize);
  const start = (page - 1) * pageSize;
  const items = entries.slice(start, start + pageSize);

  return {
    items,
    totalPages,
    currentPage: page,
    totalItems: entries.length,
  };
}

/**
 * Filter audit entries by criteria.
 *
 * @param entries - Full entry list
 * @param filters - Active filter criteria
 * @returns Filtered entries
 */
export function filterAudit(entries: AuditEntry[], filters: AuditFilter): AuditEntry[] {
  return entries.filter((entry) => {
    if (filters.agent && entry.agent !== filters.agent) return false;
    if (filters.action && entry.action !== filters.action) return false;
    return true;
  });
}

/**
 * Format audit entries as CSV string for export.
 *
 * @param entries - Entries to export
 * @returns CSV string with header row
 */
export function formatCSVExport(entries: AuditEntry[]): string {
  const header = "id,agent,action,details,timestamp";
  const rows = entries.map(
    (e) => `${e.id},${e.agent},${e.action},${e.details},${e.timestamp.toISOString()}`
  );

  return [header, ...rows].join("\n");
}
