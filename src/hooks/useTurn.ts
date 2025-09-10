import { useMemo, useState } from "react";
import type {
  PlayedBabe,
  PlayedEffect,
  BabeCard,
  EffectCard,
} from "../types/cards";
import { DEFAULT_LIMITS } from "../data/constants";
import { uid } from "../lib/uid";

export type DiscardState = { babes: BabeCard[]; effects: EffectCard[] };

export type TurnSchedule = {
  addNext?: number;
  addTurn2?: number;
  multNext?: number;
};

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

export function useTurn() {
  const [turnNumber, setTurnNumber] = useState(1);
  const [playedBabes, setPlayedBabes] = useState<PlayedBabe[]>([]);
  const [playedEffects, setPlayedEffects] = useState<PlayedEffect[]>([]);
  const [discard, setDiscard] = useState<DiscardState>({ babes: [], effects: [] });
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  const [pendingNext, setPendingNext] = useState<TurnSchedule>({});
  const [pendingTurn2, setPendingTurn2] = useState<TurnSchedule>({});

  const computedLimits = useMemo(() => {
    const base = { ...DEFAULT_LIMITS };
    let b: number = base.babes;
    let e: number = base.effects;

    for (const x of playedEffects) {
      if (x.kind === "extra-plays") {
        b += x.extraBabes ?? 0;
        e += x.extraEffects ?? 0;
      }
      if (x.kind === "set-babe-limit" && x.setBabeLimitTo != null) {
        b = Math.max(b, x.setBabeLimitTo);
      }
    }
    return { babes: b, effects: e };
  }, [playedEffects]);

  const strokesThisTurn = useMemo(
    () =>
      (playedBabes.reduce((a, b) => a + (b.strokesCost ?? 0), 0) +
        playedEffects.reduce((a, e) => a + (e.strokesCost ?? 0), 0)),
    [playedBabes, playedEffects]
  );

  const canPlayBabe = playedBabes.length < computedLimits.babes;

  const playBabe = (b: BabeCard) => {
    if (playedBabes.length >= computedLimits.babes) return;
    setPlayedBabes((p) => [...p, { ...b, playId: uid() }]);
  };
  const playBabeLimited = (b: BabeCard) => {
    if (playedBabes.length >= computedLimits.babes) return null;
    const pb: PlayedBabe = { ...b, playId: uid() };
    setPlayedBabes((p) => [...p, pb]);
    return pb;
  };
  const addPlayedBabeDirect = (b: BabeCard) => {
    const pb: PlayedBabe = { ...b, playId: uid() };
    setPlayedBabes((p) => [...p, pb]);
    return pb;
  };

  /** RETURN the newly played effect so caller can set selection immediately. */
  const playEffect = (e: EffectCard): PlayedEffect | null => {
    if (playedEffects.length >= computedLimits.effects && !e.ignoreEffectLimit) return null;
    const pe: PlayedEffect = { ...e, playId: uid() };
    setPlayedEffects((p) => [...p, pe]);
    return pe;
  };

  const removePlayedBabe = (playId: string) =>
    setPlayedBabes((p) => p.filter((x) => x.playId !== playId));
  const removePlayedEffect = (playId: string) =>
    setPlayedEffects((p) => p.filter((x) => x.playId !== playId));

  const bindEffect = (playId: string, updates: Partial<PlayedEffect>) =>
    setPlayedEffects((p) => p.map((x) => (x.playId === playId ? { ...x, ...updates } : x)));

  const reorderPlayedEffects = (fromIndex: number, toIndex: number) =>
    setPlayedEffects((p) => reorder(p, fromIndex, toIndex));

  const resetTurn = () => {
    setPlayedBabes([]);
    setPlayedEffects([]);
    setSelectedEffectId(null);
  };

  function computeSchedulesAtEnd() {
    let addNext = 0, addTurn2 = 0, multNext = 0;
    const onlyBabe = playedBabes.length === 1 ? playedBabes[0].name.toLowerCase() : null;

    for (const e of playedEffects) {
      const sch = e.schedule ?? {};
      if (e.kind === "next-turn-modifier") {
        let ok = true;
        if (e.onlyBabePlayedName) ok = ok && !!onlyBabe && onlyBabe === e.onlyBabePlayedName.toLowerCase();
        if (ok) {
          if (sch.addNext) addNext += sch.addNext;
          if (sch.multNext) multNext = (multNext || 1) * sch.multNext;
        }
      }
      if (e.kind === "multi-turn-modifier") {
        let ok = true;
        if (e.onlyBabePlayedName) ok = ok && !!onlyBabe && onlyBabe === e.onlyBabePlayedName.toLowerCase();
        if (ok) {
          if (sch.addNext) addNext += sch.addNext;
          if (sch.addTurn2) addTurn2 += sch.addTurn2;
          if (sch.multNext) multNext = (multNext || 1) * sch.multNext;
        }
      }
    }
    return {
      next: {
        addNext: addNext || undefined,
        multNext: multNext || undefined,
      },
      turn2: { addTurn2: addTurn2 || undefined },
    };
  }

  const endTurn = () => {
    const sched = computeSchedulesAtEnd();
    const carryDown = pendingTurn2.addTurn2 ? { addNext: pendingTurn2.addTurn2 } : {};

    setPendingNext((prev) => {
      const combinedAdd = (carryDown.addNext ?? 0) + (sched.next.addNext ?? 0) + (prev.addNext ?? 0);
      const combinedMult = (prev.multNext ? prev.multNext : 1) * (sched.next.multNext ?? 1);
      return {
        addNext: combinedAdd || undefined,
        multNext: combinedMult !== 1 ? combinedMult : undefined,
      };
    });
    setPendingTurn2(sched.turn2);

    setDiscard((d) => ({
      babes: [...d.babes, ...playedBabes.map(({ playId, ...rest }) => rest)],
      effects: [...d.effects, ...playedEffects.map(({ playId, ...rest }) => rest)],
    }));
    resetTurn();
    setTurnNumber((n) => n + 1);
  };

  const returnDiscardToDeck = () => {
    const ret = { ...discard };
    setDiscard({ babes: [], effects: [] });
    return ret;
  };

  return {
    turnNumber,
    pendingNext, pendingTurn2,
    playedBabes, setPlayedBabes,
    playedEffects, setPlayedEffects,
    selectedEffectId, setSelectedEffectId,
    computedLimits, canPlayBabe,
    strokesThisTurn,
    playBabe, playEffect, bindEffect,
    playBabeLimited, addPlayedBabeDirect,
    reorderPlayedEffects,
    resetTurn, endTurn,
    discard, setDiscard, returnDiscardToDeck,
    removePlayedBabe, removePlayedEffect,
  };
}
