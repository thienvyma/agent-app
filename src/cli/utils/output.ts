/**
 * Output formatter for CLI commands.
 * Supports JSON (machine-readable) and table (human-readable) formats.
 *
 * @module cli/utils/output
 */

/** Supported output formats */
export type OutputFormat = "json" | "table";

/**
 * Any object that can be serialized to JSON or rendered as table.
 * Uses index signature for compatibility with structured types like StatusData.
 */
export interface FormattableData {
  [key: string]: unknown;
}

/**
 * Format data as JSON string or ASCII table.
 *
 * @param data - Any serializable data object
 * @param format - Output format: "json" (default) or "table"
 * @returns Formatted string ready for stdout
 */
export function formatOutput(
  data: FormattableData,
  format: OutputFormat = "json"
): string {
  if (format === "table") {
    return formatTable(data);
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Format data as a human-readable ASCII table.
 *
 * @param data - Object to render as table
 * @returns ASCII table string
 */
function formatTable(data: FormattableData): string {
  const lines: string[] = [];
  const width = 50;
  const sep = "─".repeat(width);

  lines.push(`┌${sep}┐`);
  lines.push(`│ ${"🏢 Agentic Enterprise".padEnd(width - 2)} │`);
  lines.push(`├${sep}┤`);

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object" && value !== null) {
      lines.push(`│ ${key.toUpperCase().padEnd(width - 2)} │`);
      for (const [k, v] of Object.entries(value as FormattableData)) {
        const label = `  ${k}:`;
        const val = String(v);
        lines.push(`│ ${label.padEnd(20)}${val.padEnd(width - 22)} │`);
      }
    } else {
      const label = `${key}:`;
      const val = String(value);
      lines.push(`│ ${label.padEnd(20)}${val.padEnd(width - 22)} │`);
    }
  }

  lines.push(`└${sep}┘`);
  return lines.join("\n");
}
