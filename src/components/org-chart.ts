/**
 * OrgChart — company org tree logic.
 *
 * Builds a tree structure from company data for visualization.
 * CEO → Departments → Agents hierarchy.
 *
 * @module components/org-chart
 */

/** Tree node for org chart */
export interface OrgNode {
  id: string;
  name: string;
  type: "ceo" | "department" | "agent";
  status?: string;
  children: OrgNode[];
  depth: number;
  expanded: boolean;
}

/** Company data input */
interface CompanyData {
  name: string;
  ceo: { id: string; name: string; status: string };
  departments: {
    name: string;
    agents: { id: string; name: string; status: string }[];
  }[];
}

/** Flat node for list rendering */
export interface FlatOrgNode {
  id: string;
  name: string;
  type: "ceo" | "department" | "agent";
  status?: string;
  depth: number;
  hasChildren: boolean;
  isLast: boolean;
}

/**
 * Build org tree from company data.
 *
 * @param company - Company data with CEO and departments
 * @returns Root OrgNode (CEO) with department and agent children
 */
export function buildOrgTree(company: CompanyData): OrgNode {
  const root: OrgNode = {
    id: company.ceo.id,
    name: company.ceo.name,
    type: "ceo",
    status: company.ceo.status,
    depth: 0,
    expanded: true,
    children: company.departments.map((dept) => ({
      id: `dept-${dept.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: dept.name,
      type: "department" as const,
      depth: 1,
      expanded: true,
      children: dept.agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        type: "agent" as const,
        status: agent.status,
        depth: 2,
        expanded: false,
        children: [],
      })),
    })),
  };

  return root;
}

/**
 * Flatten tree to list (for rendering).
 * Only includes expanded nodes' children.
 *
 * @param node - Root node
 * @returns Flat array of nodes in display order
 */
export function flattenTree(node: OrgNode): FlatOrgNode[] {
  const result: FlatOrgNode[] = [];

  function walk(n: OrgNode, isLast: boolean): void {
    result.push({
      id: n.id,
      name: n.name,
      type: n.type,
      status: n.status,
      depth: n.depth,
      hasChildren: n.children.length > 0,
      isLast,
    });

    if (n.expanded) {
      n.children.forEach((child, i) => {
        walk(child, i === n.children.length - 1);
      });
    }
  }

  walk(node, true);
  return result;
}
