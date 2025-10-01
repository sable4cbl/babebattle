import type { BabeType } from "../types/cards"; // ✅ from cards
// Effect groups are just string unions like "GENERIC", "SIGNATURE", etc.
// so we don’t need a dedicated type, just accept string | undefined

const EMOJI: Record<string, string> = {
  // IRL
  BADDIE: "😈",
  BIMBO: "💄",
  BUSTY: "🍒",
  MILF: "🍷",
  PAWG: "🍑",

  // TRANS
  TRANS: "🍆",

  // HENTAI
  ANIME: "🌸",
  COMICS: "💥",
  GAME: "🎮",
  WESTERN: "🎬",

  // EFFECTS
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
