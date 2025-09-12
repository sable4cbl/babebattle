import type { EffectGroup, BabeType } from "../types/effects";

const EMOJI: Record<string, string> = {
  // types
  BADDIE: "💋",
  BIMBO: "💄",
  BUSTY: "🍒",
  MILF: "🧁",
  PAWG: "🍑",
  TRANS: "🍆",
  // meta groups
  SIGNATURE: "⭐",
  GENERIC: "✨",
};

export function getTypeEmoji(t: BabeType | string | undefined): string {
  if (!t) return "❔";
  return EMOJI[t] ?? "❔";
}

export function getEffectGroupEmoji(g: EffectGroup | string | undefined): string {
  if (!g) return "✨";
  return EMOJI[g] ?? "✨";
}
