import { useCallback, useMemo, useState } from "react";
import type { BabeCard } from "../types/cards";
import type { EffectScript } from "../types/effects";
import { uid } from "../utils/uid";

type PlayedEffect = { id: string; script: EffectScript };

type TurnApiConfig =
  | {
      getDeckBabes: () => BabeCard[];
      setDeckBabes: (updater: (prev: BabeCard[]) => BabeCard[]) => void;
      getDeckEffects: () => EffectScript[];
      setDeckEffects: (updater: (prev: EffectScript[]) => EffectScript[]) => void;
    }
  | undefined;

const DEFAULT_LIMITS = { babes: 2, effects: 2 };

export function useTurn(cfg?: TurnApiConfig) {
  // zones (this component owns Play + Discard; parent owns Deck)
  const [playedBabes, setPlayedBabes] = useState<BabeCard[]>([]);
  const [playedEffects, setPlayedEffects] = useState<PlayedEffect[]>([]);
  const [discard, setDiscard] = useState<{ babes: BabeCard[]; effects: EffectScript[] }>({
    babes: [],
    effects: [],
  });

  const [turnNumber, setTurnNumber] = useState(1);
  const [strokesThisTurn, setStrokesThisTurn] = useState(0);
  const computedLimits = DEFAULT_LIMITS;

  // score (base only for now)
  const finalScore = useMemo(
    () => playedBabes.reduce((s, b) => s + (b.baseScore || 0), 0),
    [playedBabes]
  );

  // --- Deck helpers ---
  const deckRemoveBabe = useCallback(
    (id: string) => cfg?.setDeckBabes(prev => prev.filter(b => b.id !== id)),
    [cfg]
  );
  const deckAddBabe = useCallback(
    (card: BabeCard) =>
      cfg?.setDeckBabes(prev => (prev.some(b => b.id === card.id) ? prev : [...prev, card])),
    [cfg]
  );

  const deckRemoveEffect = useCallback(
    (id: string) => cfg?.setDeckEffects(prev => prev.filter(e => e.id !== id)),
    [cfg]
  );
  const deckAddEffect = useCallback(
    (card: EffectScript) =>
      cfg?.setDeckEffects(prev => (prev.some(e => e.id === card.id) ? prev : [...prev, card])),
    [cfg]
  );

  // --- Actions: play/remove ---
  const playBabe = useCallback(
    (b: BabeCard) => {
      setPlayedBabes(prev => (prev.some(x => x.id === b.id) ? prev : [...prev, b]));
      deckRemoveBabe(b.id); // hide from deck immediately
    },
    [deckRemoveBabe]
  );

  const removePlayedBabe = useCallback(
    (id: string) => {
      setPlayedBabes(prev => {
        const ix = prev.findIndex(x => x.id === id);
        if (ix === -1) return prev;
        const b = prev[ix];
        deckAddBabe(b); // back to deck
        const next = prev.slice();
        next.splice(ix, 1);
        return next;
      });
    },
    [deckAddBabe]
  );

  const playEffect = useCallback(
    (e: EffectScript) => {
      setPlayedEffects(prev => [...prev, { id: uid(), script: e }]);
      deckRemoveEffect(e.id); // hide from deck immediately
    },
    [deckRemoveEffect]
  );

  const removePlayedEffect = useCallback(
    (id: string) => {
      setPlayedEffects(prev => {
        const ix = prev.findIndex(x => x.id === id);
        if (ix === -1) return prev;
        deckAddEffect(prev[ix].script); // back to deck
        const next = prev.slice();
        next.splice(ix, 1);
        return next;
      });
    },
    [deckAddEffect]
  );

  // --- Turn lifecycle ---
  const resetTurn = useCallback(() => {
    // Play -> Deck
    setPlayedBabes(prev => {
      prev.forEach(deckAddBabe);
      return [];
    });
    setPlayedEffects(prev => {
      prev.forEach(pe => deckAddEffect(pe.script));
      return [];
    });
    setStrokesThisTurn(0);
  }, [deckAddBabe, deckAddEffect]);

  const endTurn = useCallback(() => {
    // Play -> Discard
    setDiscard(prev => ({
      babes: [...prev.babes, ...playedBabes],
      effects: [...prev.effects, ...playedEffects.map(pe => pe.script)],
    }));
    // clear play
    setPlayedBabes([]);
    setPlayedEffects([]);
    setStrokesThisTurn(0);
    setTurnNumber(n => n + 1);
  }, [playedBabes, playedEffects]);

  const returnDiscardToDeck = useCallback(() => {
    // Discard -> Deck
    if (discard.babes.length === 0 && discard.effects.length === 0) return;
    cfg?.setDeckBabes(prev => {
      const ids = new Set(prev.map(b => b.id));
      const add = discard.babes.filter(b => !ids.has(b.id));
      return [...prev, ...add];
    });
    cfg?.setDeckEffects(prev => {
      const ids = new Set(prev.map(e => e.id));
      const add = discard.effects.filter(e => !ids.has(e.id));
      return [...prev, ...add];
    });
    setDiscard({ babes: [], effects: [] });
  }, [cfg, discard.babes, discard.effects]);

  // Targeting placeholders (not used right now)
  const bindEffect = useCallback((_babeId: string) => {}, []);
  const confirmTargets = useCallback(() => {}, []);
  const cancelTargets = useCallback(() => {}, []);

  return {
    // state
    turnNumber,
    strokesThisTurn,
    pendingNext: undefined as { addNext?: number; multNext?: number } | undefined,
    playedBabes,
    playedEffects,
    discard, // { babes: BabeCard[]; effects: EffectScript[] }
    computedLimits,
    finalScore,

    // actions
    playBabe,
    playEffect,
    removePlayedBabe,
    removePlayedEffect,
    bindEffect,
    confirmTargets,
    cancelTargets,
    resetTurn,
    endTurn,
    returnDiscardToDeck,
  };
}
