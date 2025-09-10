import type { BabeCard } from "../types/cards";

/** Returns a map of Babe type -> count */
export function countBabeTypes(babes: BabeCard[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of babes) {
    const t = b.type || "Unknown";
    out[t] = (out[t] ?? 0) + 1;
  }
  return out;
}

/** A sorted array of [type, count] pairs. Types sorted A→Z, "Any" last if present. */
export function sortedTypeEntries(counts: Record<string, number>): Array<[string, number]> {
  const entries = Object.entries(counts);
  entries.sort(([a], [b]) => {
    if (a === "Any" && b !== "Any") return 1;
    if (b === "Any" && a !== "Any") return -1;
    return a.localeCompare(b);
  });
  return entries;
}
