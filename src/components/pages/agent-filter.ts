/**
 * AgentFilter — filter and sort logic for Agents page.
 *
 * Multi-criteria filtering by status, department, role.
 * Extracts available filter options from agent data.
 *
 * @module components/pages/agent-filter
 */

/** Agent data for filtering */
interface AgentData {
  id: string;
  name: string;
  status: string;
  department: string;
  role: string;
}

/** Filter criteria */
interface FilterCriteria {
  status?: string;
  department?: string;
  role?: string;
  search?: string;
}

/** Available filter options */
export interface FilterOptions {
  statuses: string[];
  departments: string[];
  roles: string[];
}

/**
 * Filter agents by multiple criteria.
 * All criteria are ANDed together.
 *
 * @param agents - Full agent list
 * @param filters - Active filter criteria
 * @returns Filtered agent list
 */
export function filterAgents(agents: AgentData[], filters: FilterCriteria): AgentData[] {
  return agents.filter((agent) => {
    if (filters.status && agent.status !== filters.status) return false;
    if (filters.department && agent.department !== filters.department) return false;
    if (filters.role && agent.role !== filters.role) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!agent.name.toLowerCase().includes(search)) return false;
    }
    return true;
  });
}

/**
 * Extract unique filter options from agent list.
 *
 * @param agents - Full agent list
 * @returns Available filter values
 */
export function getFilterOptions(agents: AgentData[]): FilterOptions {
  return {
    statuses: [...new Set(agents.map((a) => a.status))].sort(),
    departments: [...new Set(agents.map((a) => a.department))].sort(),
    roles: [...new Set(agents.map((a) => a.role))].sort(),
  };
}

/**
 * Sort agents by a given field.
 *
 * @param agents - Agent list to sort
 * @param sortBy - Field to sort by
 * @returns New sorted array
 */
export function sortAgents(agents: AgentData[], sortBy: keyof AgentData): AgentData[] {
  return [...agents].sort((a, b) => {
    const va = a[sortBy];
    const vb = b[sortBy];
    return va < vb ? -1 : va > vb ? 1 : 0;
  });
}
