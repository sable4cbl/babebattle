import { useCallback, useMemo, useState } from "react";
import type { BabeCard } from "../types/cards";
import type { EffectScript, BoundEffect } from "../types/effects";
import { uid } from "../utils/uid";
import { computeScore, computeLimits } from "../engine";
import type { PendingNext } from "../types/effects";

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
  const [playedEffects, setPlayedEffects] = useState<BoundEffect[]>([]);
  const [discard, setDiscard] = useState<{ babes: BabeCard[]; effects: EffectScript[] }>({
    babes: [],
    effects: [],
  });
  // Track which played babes came from discard this turn
  const [playedFromDiscardIds, setPlayedFromDiscardIds] = useState<string[]>([]);
  // Subset: pulled immediately by effects (not pendingNext replays)
  const [playedFromDiscardImmediateIds, setPlayedFromDiscardImmediateIds] = useState<string[]>([]);
  // Subset: pulled via pendingNext.replayBabeIds (carry-over replays this turn)
  const [playedFromPendingNextIds, setPlayedFromPendingNextIds] = useState<string[]>([]);

  const [turnNumber, setTurnNumber] = useState(1);
  const [strokesThisTurn, setStrokesThisTurn] = useState(0);
  const computedLimits = DEFAULT_LIMITS;
  const [pendingNext, setPendingNext] = useState<PendingNext | undefined>(undefined);

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

  // Bring a babe from discard directly into play (ignores limits, no pendingNext consumption)
  const playBabeFromDiscardImmediate = useCallback((id: string) => {
    setDiscard(prev => {
      const ix = prev.babes.findIndex(b => b.id === id);
      if (ix === -1) return prev;
      const b = prev.babes[ix];
      setPlayedBabes(pb => (pb.some(x => x.id === id) ? pb : [...pb, b]));
      const nextBabes = prev.babes.slice();
      nextBabes.splice(ix, 1);
      return { ...prev, babes: nextBabes };
    });
    setPlayedFromDiscardIds(list => (list.includes(id) ? list : [...list, id]));
    setPlayedFromDiscardImmediateIds(list => (list.includes(id) ? list : [...list, id]));
  }, []);

  // Bring a babe from discard into play and count toward babe limit (not free)
  const playBabeFromDiscardCounted = useCallback((id: string) => {
    setDiscard(prev => {
      const ix = prev.babes.findIndex(b => b.id === id);
      if (ix === -1) return prev;
      const b = prev.babes[ix];
      setPlayedBabes(pb => (pb.some(x => x.id === id) ? pb : [...pb, b]));
      const nextBabes = prev.babes.slice();
      nextBabes.splice(ix, 1);
      return { ...prev, babes: nextBabes };
    });
    // Track that this babe came from discard (for reset handling), but do NOT mark as free
    setPlayedFromDiscardIds(list => (list.includes(id) ? list : [...list, id]));
  }, []);

  const removePlayedBabe = useCallback(
    (id: string) => {
      setPlayedBabes(prev => {
        // Prevent removing babes that are targets of any played effect
        if (playedEffects.some(pe => (pe.boundTargetIds || []).includes(id))) {
          return prev;
        }
        const ix = prev.findIndex(x => x.id === id);
        if (ix === -1) return prev;
        const b = prev[ix];
        deckAddBabe(b); // back to deck
        const next = prev.slice();
        next.splice(ix, 1);
        return next;
      });
    },
    [deckAddBabe, playedEffects]
  );

  const playEffect = useCallback(
    (e: EffectScript) => {
      const bound: BoundEffect = { ...e, playId: uid() };
      setPlayedEffects(prev => [...prev, bound]);
      deckRemoveEffect(e.id); // hide from deck immediately
    },
    [deckRemoveEffect]
  );

  const playBoundEffect = useCallback(
    (e: BoundEffect) => {
      setPlayedEffects(prev => [...prev, e]);
      deckRemoveEffect(e.id);
    },
    [deckRemoveEffect]
  );

  const removePlayedEffect = useCallback(
    (id: string) => {
      setPlayedEffects(prev => {
        const ix = prev.findIndex(x => x.playId === id);
        if (ix === -1) return prev;
        const eff = prev[ix];

        // Prevent removal if doing so would break current babe limit (e.g., removing type-scoped extra slots)
        try {
          const remaining = prev.filter((_, i) => i !== ix);
          const limits = computeLimits(remaining);
          const n = playedBabes.length;
          let overflow = Math.max(0, n - limits.babes);
          if (overflow > 0) {
            // Count per-type and sum capacity from extraBabesByType, capped by count of that type
            const counts: Record<string, number> = {};
            for (const b of playedBabes) counts[b.type] = (counts[b.type] || 0) + 1;
            let cap = 0;
            const extraMap = (limits as any).extraBabesByType as Record<string, number> | undefined;
            if (extraMap) {
              for (const [t, extra] of Object.entries(extraMap)) {
                cap += Math.min(extra, counts[t] || 0);
              }
            }
            if (overflow > cap) {
              return prev; // disallow removal
            }
          }
        } catch {}
        // If effect requests undoing discarded targets, move targeted babes back to discard
        if (eff.onRemove?.undoDiscardedTargets && eff.boundTargetIds?.length) {
          const ids = new Set(eff.boundTargetIds);
          setPlayedBabes(pbs => {
            const stay: BabeCard[] = [];
            const moved: BabeCard[] = [];
            for (const b of pbs) {
              if (ids.has(b.id)) moved.push(b); else stay.push(b);
            }
            if (moved.length) {
              setDiscard(d => {
                const existing = new Set(d.babes.map(x => x.id));
                const add = moved.filter(b => !existing.has(b.id));
                return { ...d, babes: [...d.babes, ...add] };
              });
            }
            return stay;
          });
        }
        // If effect moved targets from discard to deck, move them back to discard
        if (eff.onRemove?.undoDiscardedTargets && (eff as any).boundDiscards?.babeIds?.length) {
          const ids = new Set((eff as any).boundDiscards.babeIds as string[]);
          const deckNow = cfg?.getDeckBabes?.() || [];
          const moved = deckNow.filter(b => ids.has(b.id));
          if (moved.length) {
            cfg?.setDeckBabes?.(prevDeck => prevDeck.filter(b => !ids.has(b.id)));
            setDiscard(d => {
              const existing = new Set(d.babes.map(x => x.id));
              const add = moved.filter(b => !existing.has(b.id));
              return { ...d, babes: [...d.babes, ...add] };
            });
          }
        }
        deckAddEffect(eff); // back to deck (effect script fields are in the bound object)
        const next = prev.slice();
        next.splice(ix, 1);

        // Recompute dynamic stroke costs (e.g., Sun Dress) for remaining effects
        try {
          const dynIdxs: number[] = [];
          for (let i = 0; i < next.length; i++) {
            const e: any = next[i] as any;
            if (e && e.dynamicStrokeTargetId && e.dynamicStrokeKind === 'per-babe-total') {
              dynIdxs.push(i);
            }
          }
          if (dynIdxs.length > 0) {
            const simulated = computeScore({
              playedBabes,
              playedEffects: next,
              discardPile: discard.babes,
              pendingNext,
            });
            for (const i of dynIdxs) {
              const e: any = next[i] as any;
              const targetId = e.dynamicStrokeTargetId as string;
              const pb = simulated.score.perBabe.find(b => b.id === targetId);
              const newCost = pb ? pb.total : 0;
              next[i] = { ...(next[i] as any), strokeCost: newCost } as BoundEffect;
            }
          }
        } catch {}

        // After removals and dynamic recompute, set strokes to the sum of remaining stroke costs
        const totalCharges = next.reduce((sum, e: any) => sum + (typeof e?.strokeCost === 'number' ? e.strokeCost : 0), 0);
        setStrokesThisTurn(_ => totalCharges);

        return next;
      });
    },
    [deckAddEffect, playedBabes, discard.babes, pendingNext]
  );

  const addStrokes = useCallback((n: number) => setStrokesThisTurn(s => s + n), []);

  // --- Turn lifecycle ---
const resetTurn = useCallback(() => {
    // Play -> Deck
    setPlayedBabes(prev => {
      // Cancel turn: send babes that came from discard back to Discard, others back to Deck
      const toDiscard = prev.filter(b => playedFromDiscardIds.includes(b.id));
      const toDeck = prev.filter(b => !playedFromDiscardIds.includes(b.id));
      if (toDiscard.length > 0) {
        setDiscard(d => {
          const existing = new Set(d.babes.map(x => x.id));
          const add = toDiscard.filter(b => !existing.has(b.id));
          return { ...d, babes: [...d.babes, ...add] };
        });
        // Restore replayable flags for these babes (we consumed them when replaying)
        setPendingNext(p => {
          if (!p) return p;
          const curr = new Set(p.replayBabeIds || []);
          playedFromDiscardIds
            .filter(id => !playedFromDiscardImmediateIds.includes(id))
            .forEach(id => curr.add(id));
          return { ...p, replayBabeIds: Array.from(curr) } as PendingNext;
        });
      }
      toDeck.forEach(deckAddBabe);
      return [];
    });
    // Return all played effects to deck and clear
    setPlayedEffects(prev => { prev.forEach(pe => deckAddEffect(pe)); return [] });
    setStrokesThisTurn(0);
    setPlayedFromDiscardIds([]);
    setPlayedFromDiscardImmediateIds([]);
    setPlayedFromPendingNextIds([]);
    setPlayedFromPendingNextIds([]);
  }, [deckAddBabe, deckAddEffect, playedFromDiscardIds, playedFromDiscardImmediateIds]);

const endTurn = useCallback(() => {
    // compute next-turn carryover (replays, adds/mults) before clearing play
    const next = computeScore({
      playedBabes,
      playedEffects,
      discardPile: [],
      pendingNext: undefined,
    }).nextPending;
    // Determine if any played babes should go to Deck instead of Discard (e.g., Side Boob)
    const endMoveToDeckIds = new Set<string>();
    playedEffects.forEach(eff => {
      const ids = (eff as any).endMoveToDeckIds as string[] | undefined;
      if (ids && ids.length) ids.forEach(id => endMoveToDeckIds.add(id));
    });
    const toDeck = playedBabes.filter(b => endMoveToDeckIds.has(b.id));
    const toDiscard = playedBabes.filter(b => !endMoveToDeckIds.has(b.id));
    // Play -> Discard
    setDiscard(prev => ({
      babes: [...prev.babes, ...toDiscard],
      effects: [...prev.effects, ...playedEffects],
    }));
    // Move some to deck at end of turn
    toDeck.forEach(deckAddBabe);
    // clear play
    setPlayedBabes([]);
    setPlayedEffects([]);
    setStrokesThisTurn(0);
    setTurnNumber(n => n + 1);
    setPendingNext(next);
    setPlayedFromDiscardIds([]);
    setPlayedFromDiscardImmediateIds([]);
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

  // Move a specific babe from Discard back to Deck
  const moveDiscardBabeToDeck = useCallback((id: string) => {
    setDiscard(prev => {
      const ix = prev.babes.findIndex(b => b.id === id);
      if (ix === -1) return prev;
      const b = prev.babes[ix];
      cfg?.setDeckBabes(prevDeck => {
        const exists = prevDeck.some(x => x.id === b.id);
        return exists ? prevDeck : [...prevDeck, b];
      });
      const nextBabes = prev.babes.slice();
      nextBabes.splice(ix, 1);
      return { ...prev, babes: nextBabes };
    });
  }, [cfg]);

  const bindEffect = useCallback((_babeId: string) => {}, []);
  const confirmTargets = useCallback(() => {}, []);
  const cancelTargets = useCallback(() => {}, []);

  const replayBabeFromDiscard = useCallback((id: string) => {
    setDiscard(prev => {
      const ix = prev.babes.findIndex(b => b.id === id);
      if (ix === -1) return prev;
      const b = prev.babes[ix];
      setPlayedBabes(pb => (pb.some(x => x.id === id) ? pb : [...pb, b]));
      setPlayedFromDiscardIds(list => (list.includes(id) ? list : [...list, id]));
      setPlayedFromPendingNextIds(list => (list.includes(id) ? list : [...list, id]));
      // remove from discard babes
      const nextBabes = prev.babes.slice();
      nextBabes.splice(ix, 1);
      return { ...prev, babes: nextBabes };
    });
    // consume replay id
    setPendingNext(p => {
      if (!p?.replayBabeIds) return p;
      const rest = p.replayBabeIds.filter(x => x !== id);
      return { ...p, replayBabeIds: rest } as PendingNext;
    });
  }, []);

  return {
    // state
    turnNumber,
    strokesThisTurn,
    pendingNext,
    playedBabes,
    playedEffects,
    discard, // { babes: BabeCard[]; effects: EffectScript[] }
    computedLimits,
    finalScore,
    freeBabeIdsThisTurn: Array.from(new Set([
      ...playedFromDiscardImmediateIds,
      ...playedFromPendingNextIds,
    ])),

    // actions
    playBabe,
    playEffect,
    playBoundEffect,
    removePlayedBabe,
    removePlayedEffect,
    bindEffect,
    confirmTargets,
    cancelTargets,
    resetTurn,
    endTurn,
    returnDiscardToDeck,
    moveDiscardBabeToDeck,
    replayBabeFromDiscard,
    playBabeFromDiscardImmediate,
    playBabeFromDiscardCounted,
    addStrokes,
  };
}
