import type { BabeCard } from "../types/cards";
import type { BoundEffect, EngineState } from "../types/effects";
import { computeLimits } from "./limits";

export type Eligibility = { ok: true; reason?: undefined } | { ok: false; reason: string };

export function checkEligibility(effect: BoundEffect | Omit<BoundEffect,"playId">, state: EngineState): Eligibility {
  // Special signature gating: Wilde Card requires that a Lucie Wilde variant
  // has been played this game (in play or in discard). Opponent clause ignored.
  if ((effect as any).name === "Wilde Card") {
    const hasLucie = state.playedBabes.some(b => (b.name || "").toUpperCase().startsWith("LUCIE WILDE"))
      || state.discardPile.some(b => (b.name || "").toUpperCase().startsWith("LUCIE WILDE"))
      || (state as any).playedHistoryBabeNames?.some?.((n: string) => (n || "").toUpperCase().startsWith("LUCIE WILDE"));
    if (!hasLucie) {
      return { ok: false, reason: "Requires having played Lucie Wilde this game." };
    }
  }

  // Generic: 7 Sins Lust requires at least one discard babe with base score 7
  if ((effect as any).name === "7 Sins Lust") {
    const hasBase7 = state.discardPile.some(b => (b.baseScore ?? 0) === 7);
    if (!hasBase7) {
      return { ok: false, reason: "Requires a Base 7 Babe in discard." };
    }
  }

  if (effect.requires) {
    for (const r of effect.requires) {
      if (r.kind === "only-babe-played") {
        if (state.playedBabes.length !== 1 || state.playedBabes[0].name !== r.name) {
          return { ok: false, reason: `Requires only ${r.name} played this turn.` };
        }
      }
      if (r.kind === "discard-has-babe") {
        const has = state.discardPile.some(b => b.name === r.name);
        if (!has) return { ok: false, reason: `Requires ${r.name} in discard.` };
      }
      if (r.kind === "discard-has-type-at-least") {
        const cnt = state.discardPile.filter(b => b.type === r.type).length;
        if (cnt < r.count) {
          return {
            ok: false,
            reason: `Requires at least ${r.count} ${r.type} in discard (you have ${cnt}).`,
          };
        }
      }
    }
  }

  // If an effect caps the number of effects to N (e.g., 1), disallow playing
  // it when there are already >= N effects in play.
  const cap = (effect as any).limits?.find?.((m: any) => typeof m?.capEffectLimitTo === 'number')?.capEffectLimitTo as number | undefined;
  if (typeof cap === 'number') {
    if (state.playedEffects.length >= cap) {
      return { ok: false, reason: `Effect limit this turn is ${cap}.` };
    }
  }

  // If an effect restricts babe type for the turn, it cannot be played
  // after babes of other types have already been played this turn.
  const restrictTo = (effect as any).limits?.find?.((m: any) => m && m.restrictBabeTypeTo)?.restrictBabeTypeTo as BabeCard["type"] | undefined;
  if (restrictTo) {
    const hasMismatch = state.playedBabes.some(b => b.type !== restrictTo);
    if (hasMismatch) {
      return { ok: false, reason: `Only ${restrictTo} babes this turn.` };
    }
  }

  // If an effect consumes a babe slot, disallow when babe limit is reached
  const consumesBabeSlot = !!(effect as any).limits?.some?.((m: any) => m && m.consumesBabeSlot);
  if (consumesBabeSlot) {
    const limits = computeLimits(state.playedEffects);
    if (state.playedBabes.length >= limits.babes) {
      return { ok: false, reason: "Babe limit reached" };
    }
  }

  const t = effect.target;
  if (t.kind === "none") return { ok: true };

  const from = t.from || "play";
  // We don't have deck contents in EngineState; deck targeting is handled by the UI.
  // So don't block effects that target from 'deck' here.
  if (from === "deck") return { ok: true };
  const candidates = from === "play" ? state.playedBabes : from === "discard" ? state.discardPile : [];
  const filtered = t.ofType ? candidates.filter(b => b.type === t.ofType) : candidates;

  if (t.kind === "one-babe" && filtered.length < 1) return { ok: false, reason: "No valid target." };

  if (t.kind === "many-babes") {
    if (t.distinctTypes) {
      const types = new Set(filtered.map(b => b.type));
      if (types.size < t.min) return { ok: false, reason: "Not enough distinct types." };
    } else if (filtered.length < t.min) return { ok: false, reason: "Not enough targets." };
  }

  return { ok: true };
}

export function respectsDistinctTypes(selected: BabeCard[], distinct: boolean) {
  if (!distinct) return true;
  const s = new Set(selected.map(b => b.type));
  return s.size === selected.length;
}
