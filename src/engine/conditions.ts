import type { BabeCard, EffectCard, PlayedBabe } from "../types/cards";

export type EffectEligibility = {
  ok: boolean;
  reason?: string;
};

export function effectEligibility(
  e: EffectCard,
  ctx: {
    playedBabes: PlayedBabe[];
    discardBabes: BabeCard[];
  }
): EffectEligibility {
  // Only-babe condition (e.g., Delish-Ious / Late Bloomer)
  if (e.onlyBabePlayedName) {
    const only = ctx.playedBabes.length === 1 ? ctx.playedBabes[0].name.toLowerCase() : null;
    if (!only || only !== e.onlyBabePlayedName.toLowerCase()) {
      return { ok: false, reason: `Requires only ${e.onlyBabePlayedName} played this turn` };
    }
  }

  // Requires someone in discard (e.g., Jeanie Wishes needs Elsa in Discard)
  if (e.requiresDiscardName) {
    const found = ctx.discardBabes.some(
      (b) => b.name.toLowerCase() === e.requiresDiscardName!.toLowerCase()
    );
    if (!found) {
      return { ok: false, reason: `Requires ${e.requiresDiscardName} in Discard` };
    }
  }

  // Trifecta selection happens after play; allow playing anytime (we enforce during targeting and engine)

  return { ok: true };
}
