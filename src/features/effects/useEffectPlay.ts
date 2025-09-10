import { useMemo } from "react";
import type { EffectCard, PlayedBabe } from "../../types/cards";
import { effectEligibility } from "../../engine/conditions";

function needsPlayedBabeTarget(e: EffectCard) {
  return e.kind === "multiply-babe" && !!e.targetType && !e.targetBabeId && !e.targetName;
}
function needsDeckDiscardsDifferentTypes(e: EffectCard) {
  return e.kind === "discard-different-then-multiply-final";
}

type UseEffectPlayParams = {
  targeting: {
    canStartTargeting: (e: EffectCard) => boolean;
    startPendingPlayedBabe: (e: EffectCard) => void;
    startDeckTargeting: (playId: string) => void;
  };
  playedBabes: PlayedBabe[];
  visibleBabes: { type: string }[];
  discard: { babes: any[] };
  playEffect: (e: EffectCard) => any; // returns PlayedEffect | null
};

export function useEffectPlay({
  targeting,
  playedBabes,
  visibleBabes,
  discard,
  playEffect,
}: UseEffectPlayParams) {
  /** onClickEffect — central place to start correct flow or play immediately */
  function onClickEffect(e: EffectCard) {
    if (!targeting.canStartTargeting(e)) return;

    if (needsPlayedBabeTarget(e)) {
      targeting.startPendingPlayedBabe(e);
      return;
    }

    if (needsDeckDiscardsDifferentTypes(e)) {
      const pe = playEffect(e);
      if (!pe) return;
      targeting.startDeckTargeting(pe.playId);
      return;
    }

    // default: just play it
    playEffect(e);
  }

  return {
    onClickEffect,
  };
}
