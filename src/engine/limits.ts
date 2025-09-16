import type { BabeCard } from "../types/cards";
import type { BoundEffect, Limits } from "../types/effects";

export function computeLimits(effects: BoundEffect[]): Limits {
  let babes = 2, eff = 2, ignoreEffectLimit = false;
  let restrictBabeTypeTo: Limits["restrictBabeTypeTo"] = undefined;
  const extraBabesByType: Partial<Record<BabeCard["type"], number>> = {};

  for (const e of effects) {
    if (!e.limits) continue;
    for (const m of e.limits) {
      if ("extraPlays" in m && m.extraPlays) {
        if (typeof m.extraPlays.extraBabes === "number") babes += m.extraPlays.extraBabes;
        if (typeof m.extraPlays.extraEffects === "number") eff += m.extraPlays.extraEffects;
      }
      if ("setBabeLimitTo" in m && typeof m.setBabeLimitTo === "number") {
        babes = Math.max(babes, m.setBabeLimitTo);
      }
      if ("capEffectLimitTo" in m && typeof (m as any).capEffectLimitTo === "number") {
        const cap = (m as any).capEffectLimitTo as number;
        eff = Math.min(eff, cap);
      }
      if ("ignoreEffectLimit" in m && m.ignoreEffectLimit) {
        ignoreEffectLimit = true;
      }
      if ("restrictBabeTypeTo" in m && m.restrictBabeTypeTo) {
        restrictBabeTypeTo = m.restrictBabeTypeTo;
      }
      if ("extraTypePlays" in m && (m as any).extraTypePlays) {
        const et = (m as any).extraTypePlays as { type: BabeCard["type"]; extraBabes: number };
        const prev = extraBabesByType[et.type] ?? 0;
        if (typeof et.extraBabes === "number") extraBabesByType[et.type] = prev + et.extraBabes;
      }
    }
  }
  const payload: Limits = { babes, effects: eff, ignoreEffectLimit, restrictBabeTypeTo };
  if (Object.keys(extraBabesByType).length) payload.extraBabesByType = extraBabesByType;
  return payload;
}
