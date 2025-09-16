import type { BabeType } from "../types/cards"; // ✅ from cards
// Effect groups are just string unions like "GENERIC", "SIGNATURE", etc.
// so we don’t need a dedicated type, just accept string | undefined

const EMOJI: Record<string, string> = {
  // Babe types
  BADDIE: "😈",
  BIMBO: "💄",
  BUSTY: "🍒",
  MILF: "🍷",
  PAWG: "🍑",
  TRANS: "🍆",

  // Effect groups
  SIGNATURE: "⭐",
  GENERIC: "✨",
};

export function getTypeEmoji(t: BabeType | string | undefined): string {
  if (!t) return "❔";
  return EMOJI[t] ?? "❔";
}

export function getEffectGroupEmoji(g: string | undefined): string {
  if (!g) return "✨";
  return EMOJI[g] ?? "✨";
}
