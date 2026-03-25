/**
 * Skeleton — loading placeholder components.
 *
 * Provides skeleton screens for dashboard widgets while data loads.
 * Uses CSS animation for shimmer effect.
 *
 * @module components/ui/skeleton
 */

import React from "react";

/** Skeleton line props */
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: "text" | "card" | "avatar" | "chart";
}

/**
 * Single skeleton element with shimmer animation.
 *
 * @param props - Skeleton configuration
 * @returns Animated placeholder element
 */
export function Skeleton({
  width = "100%",
  height = "1rem",
  className = "",
  variant = "text",
}: SkeletonProps): React.ReactElement {
  const variantStyles: Record<string, { borderRadius: string; height: string }> = {
    text: { borderRadius: "4px", height },
    card: { borderRadius: "12px", height: "120px" },
    avatar: { borderRadius: "50%", height: "40px" },
    chart: { borderRadius: "8px", height: "200px" },
  };

  const style = variantStyles[variant] ?? variantStyles.text!;

  return React.createElement("div", {
    className: `skeleton ${className}`.trim(),
    style: {
      width: variant === "avatar" ? "40px" : width,
      height: style.height,
      borderRadius: style.borderRadius,
      background: "linear-gradient(90deg, var(--bg-secondary, #1a1a2e) 25%, var(--bg-tertiary, #252540) 50%, var(--bg-secondary, #1a1a2e) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    },
  });
}

/**
 * Skeleton group for card-like loading state.
 *
 * @param props - count: number of skeleton rows
 * @returns Multiple skeleton lines
 */
export function SkeletonCard({ count = 3 }: { count?: number }): React.ReactElement {
  return React.createElement("div", {
    style: { display: "flex", flexDirection: "column" as const, gap: "0.75rem", padding: "1rem" },
  }, ...Array.from({ length: count }, (_, i) =>
    React.createElement(Skeleton, {
      key: i,
      width: i === 0 ? "60%" : "100%",
      height: i === 0 ? "1.25rem" : "0.875rem",
    })
  ));
}
