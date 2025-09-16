import { useMemo, useState } from "react";
import type { BabeCard } from "../../types/cards";
import type { EffectScript } from "../../types/effects";
import { useComputedScore } from "../../engine/useComputedScore";
import { checkEligibility } from "../../engine";

export function useTurnHandlers() {
  const [playedBabes, setPlayedBabes] = useState<BabeCard[]>([]);
  const [playedEffects, setPlayedEffects] = useState<EffectScript[]>([]);
  const [discardBabes, setDiscardBabes] = useState<BabeCard[]>([]);
  const [pendingNext, setPendingNext] = useState<{ addNext?: number; multNext?: number }>();

  const { score, limits, nextPending } = useComputedScore({
    playedBabes,
    playedEffects,
    discardPile: discardBabes,
    pendingNext,
  });

  const canPlayBabe   = useMemo(() => playedBabes.length  < limits.babes, [playedBabes.length, limits.babes]);
  const canPlayEffect = useMemo(
    () => limits.ignoreEffectLimit || playedEffects.length < limits.effects,
    [playedEffects.length, limits.ignoreEffectLimit, limits.effects]
  );

  function playBabe(b: BabeCard) {
    if (!canPlayBabe) return;
    setPlayedBabes(prev => (prev.some(x => x.id === b.id) ? prev : [...prev, b]));
  }

  function playEffect(e: EffectScript) {
    if (!canPlayEffect && !e.freeEffect) return;

    const elig = checkEligibility(
      { ...e, playId: "tmp" } as any,
      { playedBabes, playedEffects: [], discardPile: discardBabes, pendingNext }
    );
    if (!elig.ok) { alert(elig.reason); return; }

    setPlayedEffects(prev => (prev.some(x => x.id === e.id) ? prev : [...prev, e]));
  }

  function removeBabe(id: string)   { setPlayedBabes(prev => prev.filter(b => b.id !== id)); }
  function removeEffect(id: string) { setPlayedEffects(prev => prev.filter(e => e.id !== id)); }

  function cancelTurn() {
    setPlayedBabes([]); setPlayedEffects([]);
  }

  function endTurn() {
    setDiscardBabes(prev => [...prev, ...playedBabes]);
    setPlayedBabes([]); setPlayedEffects([]);
    setPendingNext(nextPending);
  }

  function returnDiscardToDeck() { setDiscardBabes([]); }

  return {
    playedBabes, playedEffects, discardBabes, pendingNext,
    finalScore: score.finalAfter, limits,
    canPlayBabe, canPlayEffect,
    playBabe, playEffect, removeBabe, removeEffect,
    cancelTurn, endTurn, returnDiscardToDeck,
  };
}
