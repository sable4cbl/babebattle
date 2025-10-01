import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [cuckedPlayedThisGame, setCuckedPlayedThisGame] = useState(false);
  const [doublePlayConsumedThisTurn, setDoublePlayConsumedThisTurn] = useState(false);
  const [cartoonLogicPlayedThisGame, setCartoonLogicPlayedThisGame] = useState(false);
  // Track names of babes that have been played at least once this game
  const [playedHistoryBabeNames, setPlayedHistoryBabeNames] = useState<string[]>([]);

  // Preserve pristine EffectScript by id when moved from Deck → Play, so we can restore cleanly on cancel/remove
  const [effectOriginalById, setEffectOriginalById] = useState<Record<string, EffectScript>>({});

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
      setPlayedHistoryBabeNames(prev => (prev.includes(b.name) ? prev : [...prev, b.name]));
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
      setPlayedHistoryBabeNames(prev => (prev.includes(b.name) ? prev : [...prev, b.name]));
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
      setPlayedHistoryBabeNames(prev => (prev.includes(b.name) ? prev : [...prev, b.name]));
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

  const [effectSurchargePerPlay, setEffectSurchargePerPlay] = useState(0);

  const playEffect = useCallback(
    (e: EffectScript) => {
      const bound: BoundEffect = { ...e, playId: uid() };
      // Apply any flat stroke cost defined on the card (no immediate total update; recomputed below)
      const baseCost = (e as any).strokeCost as number | undefined;
      if (typeof baseCost === 'number' && baseCost > 0) {
        (bound as any).strokeCost = ((bound as any).strokeCost || 0) + baseCost;
      }
      // Do NOT mutate strokeCost with Executive Orders surcharge here; it is applied centrally in recompute
      // Capture pristine script from deck (before removal) for later restoration
      try {
        const deckList = cfg?.getDeckEffects?.() || [];
        const orig = deckList.find(x => x.id === e.id);
        if (orig) setEffectOriginalById(map => (map[e.id] ? map : { ...map, [e.id]: orig }));
      } catch {}
      if ((e as any).name === 'Cartoon Logic') {
        setCartoonLogicPlayedThisGame(true);
      }
      if (pendingNext?.doublePlayEffectNext) {
        // Special handling: effect "69" should run twice with separate targeting, not auto-duplicate
        if ((e as any).name === '69') {
          setPlayedEffects(prev => [...prev, bound]);
          // Consume the flag so it doesn't auto-duplicate other effects; UI will re-target for the second run
          setPendingNext(p => {
            if (!p?.doublePlayEffectNext) return p;
            const { doublePlayEffectNext, ...rest } = p as any;
            return Object.keys(rest).length ? (rest as any) : undefined;
          });
          setDoublePlayConsumedThisTurn(true);
        } else {
          const dup: BoundEffect = { ...(bound as any), playId: uid(), freeEffect: true } as BoundEffect;
          (dup as any).duplicateOfPlayId = bound.playId;
          (bound as any).linkedDuplicatePlayId = dup.playId;
          setPlayedEffects(prev => [...prev, bound, dup]);
          setPendingNext(p => {
            if (!p?.doublePlayEffectNext) return p;
            const { doublePlayEffectNext, ...rest } = p as any;
            return Object.keys(rest).length ? (rest as any) : undefined;
          });
          setDoublePlayConsumedThisTurn(true);
        }
      } else {
        setPlayedEffects(prev => [...prev, bound]);
      }
      deckRemoveEffect(e.id); // hide from deck immediately
    },
    [deckRemoveEffect, effectSurchargePerPlay, pendingNext]
  );

  const playBoundEffect = useCallback(
    (e: BoundEffect) => {
      // Apply base stroke cost if present on the effect script (total recomputed via effect below)
      const baseCost = (e as any).strokeCost as number | undefined;
      // Do NOT mutate strokeCost with Executive Orders surcharge here; it is applied centrally in recompute
      // Capture pristine script from deck (before removal) for later restoration
      try {
        const deckList = cfg?.getDeckEffects?.() || [];
        const orig = deckList.find(x => x.id === e.id);
        if (orig) setEffectOriginalById(map => (map[e.id] ? map : { ...map, [e.id]: orig as EffectScript }));
      } catch {}
      if ((e as any).name === 'Cartoon Logic') {
        setCartoonLogicPlayedThisGame(true);
      }
      if (pendingNext?.doublePlayEffectNext) {
        if ((e as any).name === '69') {
          // Do not auto-duplicate; let UI re-target a second time; consume the flag now
          setPlayedEffects(prev => [...prev, e]);
          setPendingNext(p => {
            if (!p?.doublePlayEffectNext) return p;
            const { doublePlayEffectNext, ...rest } = p as any;
            return Object.keys(rest).length ? (rest as any) : undefined;
          });
          setDoublePlayConsumedThisTurn(true);
        } else {
          const dup: BoundEffect = { ...(e as any), playId: uid(), freeEffect: true } as BoundEffect;
          (dup as any).duplicateOfPlayId = e.playId;
          (e as any).linkedDuplicatePlayId = dup.playId;
          setPlayedEffects(prev => [...prev, e, dup]);
          setPendingNext(p => {
            if (!p?.doublePlayEffectNext) return p;
            const { doublePlayEffectNext, ...rest } = p as any;
            return Object.keys(rest).length ? (rest as any) : undefined;
          });
          setDoublePlayConsumedThisTurn(true);
        }
      } else {
        setPlayedEffects(prev => [...prev, e]);
      }
      deckRemoveEffect(e.id);
    },
    [deckRemoveEffect, effectSurchargePerPlay, pendingNext]
  );

  const removePlayedEffect = useCallback(
    (id: string) => {
      setPlayedEffects(prev => {
        const ix = prev.findIndex(x => x.playId === id);
        if (ix === -1) return prev;
        const eff = prev[ix];

        // Disallow removing the duplicated copy alone
        if ((eff as any).duplicateOfPlayId) {
          return prev;
        }

        // If this effect has a linked duplicate, remove both together
        const originalPlayId = eff.playId;
        const groupIds = new Set<string>([originalPlayId]);
        prev.forEach(pe => { if ((pe as any)?.duplicateOfPlayId === originalPlayId) groupIds.add(pe.playId); });

        // Helper to revert a single effect's side-effects and restore to deck
        const revertOne = (effToRevert: BoundEffect) => {
          // If effect requests undoing discarded targets, move targeted babes back to discard
          if (effToRevert.onRemove?.undoDiscardedTargets && effToRevert.boundTargetIds?.length) {
            const ids = new Set(effToRevert.boundTargetIds);
            setPlayedBabes(pbs => {
              const stay: BabeCard[] = [];
              const moved: BabeCard[] = [];
              for (const b of pbs) { if (ids.has(b.id)) moved.push(b); else stay.push(b); }
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
          if (effToRevert.onRemove?.undoDiscardedTargets && (effToRevert as any).boundDiscards?.babeIds?.length) {
            const ids = new Set(((effToRevert as any).boundDiscards.babeIds as string[]) || []);
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
          // If effect moved list items between deck and discard (e.g., Babe Swap), revert those moves
          const listSwaps = (effToRevert as any).listSwaps as { deckToDiscardIds?: string[]; discardToDeckIds?: string[] } | undefined;
          if (listSwaps) {
            const toDeck = listSwaps.deckToDiscardIds || [];
            const toDiscard = listSwaps.discardToDeckIds || [];
            if (toDeck.length) {
              setDiscard(d => {
                const keep = d.babes.filter(b => !toDeck.includes(b.id));
                const moved = d.babes.filter(b => toDeck.includes(b.id));
                if (moved.length) {
                  cfg?.setDeckBabes(prevDeck => {
                    const existing = new Set(prevDeck.map(x => x.id));
                    const add = moved.filter(b => !existing.has(b.id));
                    return [...prevDeck, ...add];
                  });
                }
                return { ...d, babes: keep };
              });
            }
            if (toDiscard.length) {
              const deckNow2 = cfg?.getDeckBabes?.() || [];
              const moved2 = deckNow2.filter(b => toDiscard.includes(b.id));
              if (moved2.length) {
                cfg?.setDeckBabes?.(prevDeck => prevDeck.filter(b => !toDiscard.includes(b.id)));
                setDiscard(d => {
                  const existing = new Set(d.babes.map(x => x.id));
                  const add = moved2.filter(b => !existing.has(b.id));
                  return { ...d, babes: [...d.babes, ...add] };
                });
              }
            }
          }
          // Back to deck: restore pristine script if captured; otherwise, strip bound-only fields
          const restore: EffectScript | undefined = effectOriginalById[effToRevert.id];
          if (restore) {
            deckAddEffect(restore);
            setEffectOriginalById(map => { const { [effToRevert.id]: _, ...rest } = map; return rest; });
          } else {
            const { playId: _p, boundTargetIds: _bt, boundTargetType: _btt, boundDiscards: _bd, boundPlayedFromDiscard: _bpfd, strokeCost: _sc, dynamicStrokeTargetId: _dstid, dynamicStrokeKind: _dsk, listSwaps: _ls, ...rest } = effToRevert as any;
            deckAddEffect(rest as EffectScript);
          }
        };

        // Build next by removing all grouped ids
        let next = prev.slice();
        for (const pid of Array.from(groupIds)) {
          const j = next.findIndex(x => x.playId === pid);
          if (j !== -1) {
            const rm = next[j];
            revertOne(rm);
            next.splice(j, 1);
          }
        }

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

        // If removing an effect that contributed a future surcharge (Executive Orders), revert its delta
        try {
          const delta = (eff as any).effectSurchargeDelta as number | undefined;
          if (typeof delta === 'number' && delta > 0) setEffectSurchargePerPlay(v => Math.max(0, v - delta));
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
    // Revert any list moves caused by effects (e.g., Handbra discard->deck, Babe Swap deck<->discard)
    // If Executive Orders was played this turn, revert surcharge since the turn is canceled
    try {
      const toSub = (playedEffects as any[])?.reduce?.((s, pe) => s + ((((pe as any).effectSurchargeDelta as number) || 0)), 0) || 0;
      if (toSub > 0) setEffectSurchargePerPlay(v => Math.max(0, v - toSub));
    } catch {}
    setPlayedEffects(prev => {
      // Undo boundDiscards: move ids from Deck back to Discard
      const boundIds: string[] = [];
      const swapToDeck: string[] = [];
      const swapToDiscard: string[] = [];
      prev.forEach(eff => {
        const bd = (eff as any).boundDiscards?.babeIds as string[] | undefined;
        if (bd && bd.length) boundIds.push(...bd);
        const swaps = (eff as any).listSwaps as { deckToDiscardIds?: string[]; discardToDeckIds?: string[] } | undefined;
        if (swaps?.deckToDiscardIds?.length) swapToDeck.push(...swaps.deckToDiscardIds);
        if (swaps?.discardToDeckIds?.length) swapToDiscard.push(...swaps.discardToDeckIds);
      });
      if (boundIds.length) {
        const deckNow = cfg?.getDeckBabes?.() || [];
        const moved = deckNow.filter(b => boundIds.includes(b.id));
        if (moved.length) {
          cfg?.setDeckBabes?.(prevDeck => prevDeck.filter(b => !boundIds.includes(b.id)));
          setDiscard(d => {
            const existing = new Set(d.babes.map(x => x.id));
            const add = moved.filter(b => !existing.has(b.id));
            return { ...d, babes: [...d.babes, ...add] };
          });
        }
      }
      if (swapToDeck.length) {
        setDiscard(d => {
          const keep = d.babes.filter(b => !swapToDeck.includes(b.id));
          const moved = d.babes.filter(b => swapToDeck.includes(b.id));
          if (moved.length) {
            cfg?.setDeckBabes(prevDeck => {
              const existing = new Set(prevDeck.map(x => x.id));
              const add = moved.filter(b => !existing.has(b.id));
              return [...prevDeck, ...add];
            });
          }
          return { ...d, babes: keep };
        });
      }
      if (swapToDiscard.length) {
        const deckNow = cfg?.getDeckBabes?.() || [];
        const moved = deckNow.filter(b => swapToDiscard.includes(b.id));
        if (moved.length) {
          cfg?.setDeckBabes?.(prevDeck => prevDeck.filter(b => !swapToDiscard.includes(b.id)));
          setDiscard(d => {
            const existing = new Set(d.babes.map(x => x.id));
            const add = moved.filter(b => !existing.has(b.id));
            return { ...d, babes: [...d.babes, ...add] };
          });
        }
      }
      return prev;
    });
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
    // Return all played effects to deck (restore pristine when possible) and clear
    setPlayedEffects(prev => {
      prev.forEach(pe => {
        const restore = effectOriginalById[pe.id];
        if (restore) {
          deckAddEffect(restore);
        } else {
          const { playId, boundTargetIds, boundTargetType, boundDiscards, boundPlayedFromDiscard, strokeCost, dynamicStrokeTargetId, dynamicStrokeKind, listSwaps, ...rest } = pe as any;
          deckAddEffect(rest as EffectScript);
        }
      });
      return []
    });
    setStrokesThisTurn(0);
    setPlayedFromDiscardIds([]);
    setPlayedFromDiscardImmediateIds([]);
    setPlayedFromPendingNextIds([]);
    setPlayedFromPendingNextIds([]);
    // Clear captured originals
    setEffectOriginalById({});
    // If we consumed the double-play flag this turn, restore it so it can be used again
    setPendingNext(p => {
      if (!doublePlayConsumedThisTurn) return p;
      const base: any = p ? { ...p } : {};
      base.doublePlayEffectNext = true;
      return base;
    });
    setDoublePlayConsumedThisTurn(false);
  }, [deckAddBabe, deckAddEffect, playedFromDiscardIds, playedFromDiscardImmediateIds, effectOriginalById]);

  const endTurn = useCallback(() => {
    // compute next-turn carryover (replays, adds/mults) before clearing play
    const next = computeScore({
      playedBabes,
      playedEffects,
      discardPile: [],
      // Include existing pendingNext so turn+2 carry-overs (e.g., addNextNext) shift properly
      pendingNext,
      playedHistoryBabeNames,
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

  // Move a specific babe from Deck to Discard (effects like Babe Swap)
  const moveDeckBabeToDiscard = useCallback((id: string) => {
    if (!cfg) return;
    const deckList = cfg.getDeckBabes();
    const ix = deckList.findIndex(b => b.id === id);
    if (ix === -1) return;
    const b = deckList[ix];
    cfg.setDeckBabes(prev => prev.filter(x => x.id !== id));
    setDiscard(d => {
      const exists = new Set(d.babes.map(x => x.id));
      return exists.has(id) ? d : { ...d, babes: [...d.babes, b] };
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

  // Ensure dynamic stroke costs and total strokes are always consistent
  useEffect(() => {
    // Recompute dynamic stroke costs (currently for Pillow Humping) and total strokes consistently
    let changed = false;
    const totalCards = playedBabes.length + playedEffects.length;
    const nextEffects = playedEffects.map((pe: any) => {
      if (pe?.dynamicStrokeKind === 'per-turn-cards' || pe?.name === 'Pillow Humping') {
        const desired = 30 * totalCards; // base dynamic only; surcharge added globally below
        const current = typeof pe.strokeCost === 'number' ? pe.strokeCost : 0;
        if (current !== desired) {
          changed = true;
          return { ...pe, strokeCost: desired } as BoundEffect;
        }
      }
      return pe;
    });
    const list = (changed ? nextEffects : playedEffects) as any[];
    if (changed) setPlayedEffects(list as BoundEffect[]);
    // Sum base stroke costs and then add Executive Orders surcharge globally per effect (excluding EO itself)
    const baseTotal = list.reduce((sum, e: any) => sum + (typeof e?.strokeCost === 'number' ? e.strokeCost : 0), 0);
    const effectCountForSurcharge = list.filter((e: any) => (e?.name !== 'Executive Orders')).length;
    const surchargeTotal = (effectSurchargePerPlay > 0 ? effectSurchargePerPlay * effectCountForSurcharge : 0);
    setStrokesThisTurn(baseTotal + surchargeTotal);
  }, [playedBabes, playedEffects, effectSurchargePerPlay]);

  return {
    // state
    turnNumber,
    strokesThisTurn,
    pendingNext,
    cuckedPlayedThisGame,
    cartoonLogicPlayedThisGame,
    playedBabes,
    playedEffects,
    discard, // { babes: BabeCard[]; effects: EffectScript[] }
    computedLimits,
    finalScore,
    playedHistoryBabeNames,
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
    moveDeckBabeToDiscard,
    replayBabeFromDiscard,
    playBabeFromDiscardImmediate,
    playBabeFromDiscardCounted,
    addStrokes,
    effectSurchargePerPlay,
    addEffectSurcharge: (n: number) => setEffectSurchargePerPlay(v => Math.max(0, v + n)),
    setCuckedPlayedThisGame,
    setCartoonLogicPlayedThisGame,
  };
}
