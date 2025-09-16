import { useMemo } from "react";
import type { BabeCard } from "../types/cards";
import type { EffectScript, BoundEffect } from "../types/effects";
import { computeScore } from "../engine";
import { uid } from "../utils/uid";

/**
 * No auto-binding at all.
 * We only lift EffectScript -> BoundEffect (adds playId) without targets.
 * Any effect that needs targets will be a no-op until you bind manually.
 */
export function useComputedScore(params: {
  playedBabes: BabeCard[];
  playedEffects: Array<EffectScript | BoundEffect>;
  discardPile: BabeCard[];
  pendingNext?: { addNext?: number; multNext?: number };
}) {
  const { playedBabes, playedEffects, discardPile, pendingNext } = params;

  const boundEffects = useMemo<BoundEffect[]>(() => {
    return playedEffects.map((e) =>
      ("playId" in (e as any) ? (e as BoundEffect) : ({ ...(e as EffectScript), playId: uid() } as BoundEffect))
    );
  }, [playedEffects]);

  const state = useMemo(
    () => ({
      playedBabes,
      playedEffects: boundEffects,
      discardPile,
      pendingNext,
    }),
    [playedBabes, boundEffects, discardPile, pendingNext]
  );

  return useMemo(() => computeScore(state), [state]);
}

/**
 * Helper you can call from your future targeting UI:
 * take an existing BoundEffect and attach chosen target ids and/or a type hint.
 */
export function manualBindForPlay(
  e: BoundEffect,
  targetIds: string[] | undefined,
  targetType?: BabeCard["type"]
): BoundEffect {
  return { ...e, boundTargetIds: targetIds, boundTargetType: targetType };
}
