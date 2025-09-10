import { useMemo, useState } from "react";
import type { PlayedBabe, PlayedEffect, BabeCard, EffectCard } from "../types/cards";
import { DEFAULT_LIMITS } from "../data/constants";
import { uid } from "../lib/uid";

export type DiscardState = { babes: BabeCard[]; effects: EffectCard[] };

export function useTurn() {
  const [playedBabes, setPlayedBabes] = useState<PlayedBabe[]>([]);
  const [playedEffects, setPlayedEffects] = useState<PlayedEffect[]>([]);
  const [discard, setDiscard] = useState<DiscardState>({ babes: [], effects: [] });
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  const computedLimits = useMemo(() => {
    const base = { ...DEFAULT_LIMITS };
    let b = base.babes, e = base.effects;
    for (const x of playedEffects) {
      if (x.kind === "extra-plays") {
        b += x.extraBabes ?? 0;
        e += x.extraEffects ?? 0;
      }
    }
    return { babes: b, effects: e };
  }, [playedEffects]);

  const canPlayBabe = playedBabes.length < computedLimits.babes;
  const canPlayEffect = playedEffects.length < computedLimits.effects;

  const playBabe = (b: BabeCard) => {
    if (!canPlayBabe) return;
    setPlayedBabes((p) => [...p, { ...b, playId: uid() }]);
  };
  const playEffect = (e: EffectCard) => {
    if (!canPlayEffect) return;
    setPlayedEffects((p) => [...p, { ...e, playId: uid() }]);
  };

  const removePlayedBabe = (playId: string) =>
    setPlayedBabes((p) => p.filter((x) => x.playId !== playId));
  const removePlayedEffect = (playId: string) =>
    setPlayedEffects((p) => p.filter((x) => x.playId !== playId));

  const bindEffect = (playId: string, updates: Partial<PlayedEffect>) =>
    setPlayedEffects((p) => p.map((x) => (x.playId === playId ? { ...x, ...updates } : x)));

  const resetTurn = () => {
    setPlayedBabes([]);
    setPlayedEffects([]);
    setSelectedEffectId(null);
  };

  const endTurn = () => {
    setDiscard((d) => ({
      babes: [...d.babes, ...playedBabes.map(({ playId, ...rest }) => rest)],
      effects: [
        ...d.effects,
        ...playedEffects.map(({ playId, boundTargetBabeId, boundTargetType, ...rest }) => rest),
      ],
    }));
    resetTurn();
  };

  const returnDiscardToDeck = () => {
    const ret = { ...discard };
    setDiscard({ babes: [], effects: [] });
    return ret;
  };

  return {
    playedBabes, playedEffects, selectedEffectId, setSelectedEffectId,
    computedLimits, canPlayBabe, canPlayEffect,
    playBabe, playEffect, bindEffect, resetTurn, endTurn,
    discard, setDiscard, returnDiscardToDeck,
    removePlayedBabe, removePlayedEffect
  };
}
