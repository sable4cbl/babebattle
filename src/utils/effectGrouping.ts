import type { EffectCard } from "../types/cards";

const TYPE_KEYS = ["BUSTY", "BIMBO", "BADDIE", "MILF", "PAWG", "TRANS"];

export type EffectGroup = "GENERIC" | "SIGNATURE" | "BUSTY" | "BIMBO" | "BADDIE" | "MILF" | "PAWG" | "TRANS";

/**
 * Infer the effect group from either explicit fields or the gifName pattern:
 * - EFFECT <TYPE> <Name>.gif    -> that TYPE group
 * - EFFECT <PERFORMER UPPER>... -> SIGNATURE
 * - EFFECT <Name>.gif           -> GENERIC
 */
export function getEffectGroup(e: EffectCard): EffectGroup {
  // If your EffectCard has an explicit field, prefer it:
  // (uncomment if you added it)
  // if ((e as any).group) return (e as any).group;

  const gif = (e as any).gifName as string | undefined;
  if (!gif) return "GENERIC";

  // Expect "EFFECT ..." prefix
  const name = gif.trim();
  if (!name.toUpperCase().startsWith("EFFECT ")) return "GENERIC";

  // Grab the token after "EFFECT "
  const rest = name.substring(7).trim(); // after "EFFECT "
  const firstToken = rest.split(/\s+/)[0].toUpperCase();

  if (TYPE_KEYS.includes(firstToken)) {
    return firstToken as EffectGroup;
  }

  // If the token has a space-separated all-caps performer like "ELSA" "JEAN", we still see only first token here.
  // Heuristic: if first token is ALL CAPS letters/numbers and not a known type -> treat as SIGNATURE
  if (/^[A-Z0-9()\-_.]+$/.test(firstToken)) {
    return "SIGNATURE";
  }

  return "GENERIC";
}

export function groupEffects(effects: EffectCard[]): Map<EffectGroup, EffectCard[]> {
  const m = new Map<EffectGroup, EffectCard[]>();
  for (const e of effects) {
    const g = getEffectGroup(e);
    if (!m.has(g)) m.set(g, []);
    m.get(g)!.push(e);
  }
  return m;
}
