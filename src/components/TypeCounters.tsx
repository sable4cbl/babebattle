import React from "react";
import type { BabeCard } from "../types/cards";
import { countBabeTypes, sortedTypeEntries } from "../lib/count";

export default function TypeCounters({
  babes,
  size = "sm",
  emptyLabel = "No babes",
  className = "",
}: {
  babes: BabeCard[];
  size?: "sm" | "md";
  emptyLabel?: string;
  className?: string;
}) {
  const counts = countBabeTypes(babes);
  const entries = sortedTypeEntries(counts);
  if (entries.length === 0) {
    return <div className={`text-xs text-gray-500 ${className}`}>{emptyLabel}</div>;
  }

  const sizeCls =
    size === "md"
      ? "text-xs px-2 py-1"
      : "text-[11px] px-1.5 py-0.5";

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {entries.map(([type, n]) => (
        <span
          key={type}
          className={`${sizeCls} rounded-md bg-gray-100 border border-gray-200 text-gray-800`}
          title={`${type}: ${n}`}
        >
          {type}: {n}
        </span>
      ))}
    </div>
  );
}
