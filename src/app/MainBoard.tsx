import React, { useMemo, useState } from "react";
import DeckPool from "../features/deckbuilder/DeckPool";
import PlayArea from "../components/PlayArea";
import { useTurn } from "../hooks/useTurn";
import type { BabeCard } from "../types/cards";
import type { EffectScript, TargetDecl, BoundEffect } from "../types/effects";

// ⬇️ Engine hook (no auto-targeting)
import { useComputedScore } from "../engine/useComputedScore";
import { checkEligibility, computeScore } from "../engine";
import { uid } from "../utils/uid";
import Modal from "../components/Modal";
import ThemeSwitcher from "../components/ThemeSwitcher";

type DeckState = { babes: BabeCard[]; effects: EffectScript[] };

type Props = {
  deck: DeckState;
  setDeck: React.Dispatch<React.SetStateAction<DeckState | null>>;
};

export default function MainBoard({ deck, setDeck }: Props) {
  const [targetingEffect, setTargetingEffect] = useState<EffectScript | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [babeQuery, setBabeQuery] = useState("");
  const [effectQuery, setEffectQuery] = useState("");
  const [babeCompact, setBabeCompact] = useState(false);
  const [effectCompact, setEffectCompact] = useState(false);
  const [babeSortKey, setBabeSortKey] = useState<"name"|"score">("name");
  const [babeSortDir, setBabeSortDir] = useState<"asc"|"desc">("asc");
  const [effectSortDir, setEffectSortDir] = useState<"asc"|"desc">("asc");
  const turn = useTurn({
    getDeckBabes: () => deck.babes,
    setDeckBabes: (updater) =>
      setDeck((prev) => (prev ? { ...prev, babes: updater(prev.babes) } : prev)),

    getDeckEffects: () => deck.effects,
    setDeckEffects: (updater) =>
      setDeck((prev) => (prev ? { ...prev, effects: updater(prev.effects) } : prev)),
  });

  // Choice modal state for special effects (e.g., Wilde Card)
  const [choiceEffect, setChoiceEffect] = useState<EffectScript | null>(null);

  // Engine compute (final score + limits) — no auto targeting
  const { score, limits, log, overallOps } = useComputedScore({
    playedBabes: turn.playedBabes,
    playedEffects: (turn.playedEffects as unknown as BoundEffect[]) || [],
    discardPile: (turn.discard?.babes as BabeCard[]) || [],
    pendingNext: turn.pendingNext,
  });

  // Use engine limits instead of turn.computedLimits*
  const countingBabePlays = useMemo(
    () => turn.playedBabes.filter(b => !(turn as any).freeBabeIdsThisTurn?.includes?.(b.id)).length,
    [turn.playedBabes, (turn as any).freeBabeIdsThisTurn]
  );
  const canPlayBabe = useMemo(
    () => countingBabePlays < limits.babes,
    [countingBabePlays, limits.babes]
  );

  const countingEffectPlays = useMemo(
    () => (turn.playedEffects as any[]).filter(pe => !pe?.freeEffect).length,
    [turn.playedEffects]
  );
  const canPlayEffect = useMemo(
    () => limits.ignoreEffectLimit || countingEffectPlays < limits.effects,
    [countingEffectPlays, limits.ignoreEffectLimit, limits.effects]
  );

  // Helper: finalize current selection for effect "69"
  const finalize69 = (selIds: string[]) => {
    if (!targetingEffect || targetingEffect.name !== "69" || selIds.length === 0) return;
    const bound = { ...(targetingEffect as any), playId: uid(), boundTargetIds: selIds } as unknown as BoundEffect;
    // Record list move so reset/remove can revert deck<->discard transitions
    (bound as any).listSwaps = { deckToDiscardIds: selIds.slice() };
    // Move selected from deck to discard
    selIds.forEach(id => (turn as any).moveDeckBabeToDiscard?.(id));
    // Add +9 per selected
    const addAmt = selIds.length * 9;
    (bound as any).score = [
      ...(((targetingEffect as any).score || []) as any[]),
      { scope: "final", op: "add", amount: addAmt },
    ];
    // Optional pay to triple
    const pay = typeof window !== 'undefined' && window.confirm("Pay 69 Strokes to triple the Final Score?");
    if (pay) {
      (turn as any).addStrokes?.(69);
      (bound as any).strokeCost = ((bound as any).strokeCost || 0) + 69;
      (bound as any).score = [
        ...((bound as any).score || []),
        { scope: "final", op: "mult", amount: 3 },
      ];
    }
    (turn as any).playBoundEffect(bound);
    setTargetingEffect(null);
    setSelectedTargets([]);
  };

  // Keep your previous mapping for PlayArea visual keys
  const playedBabesForPlayArea = useMemo(
    () => turn.playedBabes.map((b) => ({ ...b, playId: b.id } as any)),
    [turn.playedBabes]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      <div className="fixed bottom-3 right-3 z-50">
        <ThemeSwitcher />
      </div>
      {/* LEFT: Babes (deck zone) — reuse DeckPool for identical UI */}
      <div className="min-h-screen overflow-y-auto">
          <DeckPool
            title="Babes"
            kind="babe"
            poolBabes={deck.babes}
            poolEffects={[]}
            pendingNext={turn.pendingNext}
            targetingEffectName={targetingEffect?.name || undefined}
            selectedTargetIds={selectedTargets}
            search={babeQuery}
            setSearch={setBabeQuery}
            compact={babeCompact}
            setCompact={setBabeCompact}
            sortKey={babeSortKey}
          setSortKey={setBabeSortKey}
          sortDir={babeSortDir}
          setSortDir={setBabeSortDir}
          getDisabled={(x) => {
            // During targeting, allow only specific deck selections
            if (targetingEffect) {
              const allowBabeSwapDeckPick = targetingEffect.name === "Babe Swap" && selectedTargets.length === 0;
              const allow69Pick = targetingEffect.name === "69" && selectedTargets.length < 3 && (x as BabeCard).baseScore === 6;
              // If the current card is a valid target for the active effect, enable it regardless of play limits
              if (allowBabeSwapDeckPick || allow69Pick) return { disabled: false };
              return { disabled: true, reason: "Selecting target" };
            }
            // Check base babe limit first; allow extra type-scoped slots when at cap
            const b = x as BabeCard;
            const wouldBeCount = countingBabePlays + 1;
            if (wouldBeCount > limits.babes) {
              const extraMap = (limits as any).extraBabesByType as Record<string, number> | undefined;
              if (!extraMap) return { disabled: true, reason: "Babe limit reached" };
              // Compute capacity contributed by extra slots given current babes AND the candidate
              const counts: Record<string, number> = {};
              for (const pb of turn.playedBabes) counts[pb.type] = (counts[pb.type] || 0) + 1;
              counts[b.type] = (counts[b.type] || 0) + 1; // include the candidate
              let capacity = 0;
              for (const [t, extra] of Object.entries(extraMap)) {
                const avail = typeof extra === 'number' ? extra : 0;
                capacity += Math.min(avail, counts[t] || 0);
              }
              if (wouldBeCount > limits.babes + capacity) {
                return { disabled: true, reason: "Babe limit reached" };
              }
            }
            const onlyType = (limits as any).restrictBabeTypeTo as BabeCard["type"] | undefined;
            if (onlyType && b.type !== onlyType) return { disabled: true, reason: `Only ${onlyType} babes this turn` };
            return { disabled: false };
          }}
          onAddBabe={(b) => {
            // If targeting, hijack click for specific deck selections
            if (targetingEffect) {
              if (targetingEffect.name === "Babe Swap" && selectedTargets.length === 0) {
                setSelectedTargets((prev) => (prev.includes(b.id) ? prev : [...prev, b.id]));
                return;
              }
              if (targetingEffect.name === "69") {
                if (b.baseScore !== 6 || selectedTargets.includes(b.id) || selectedTargets.length >= 3) return;
                const nextSel = [...selectedTargets, b.id];
                setSelectedTargets(nextSel);
                if (nextSel.length >= 3) {
                  finalize69(nextSel);
                }
                return;
              }
              return;
            }
            turn.playBabe(b);
          }}
          onAddEffect={undefined}
          onAddAll={undefined}
        />
      </div>

      {/* CENTER: Play Area */}
      <div className="lg:col-span-1">
        <div className="sticky top-0 z-30">
          <div className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border rounded-xl p-3 shadow">
            <PlayArea
              turnNumber={turn.turnNumber}
              strokesThisTurn={turn.strokesThisTurn}
              pendingNext={turn.pendingNext}
              playedBabes={playedBabesForPlayArea}
              playedEffects={turn.playedEffects as any}
              limits={limits}
              targetingEffectName={targetingEffect?.name || undefined}
              onRemoveBabe={(id: string) => turn.removePlayedBabe(id)}
              onRemoveEffect={(id: string) => turn.removePlayedEffect(id)}
              onBindEffect={(babeId: string) => {
  if (!targetingEffect) return;
  const t: any = targetingEffect.target;
  // Do not allow binding from PlayArea when the effect expects selection from Deck (Babe List)
  if ((t.from ?? "play") === "deck") return;
  const inPlay = turn.playedBabes.find(b => b.id === babeId);
  const inDiscard = (turn.discard?.babes || []).find(b => b.id === babeId);
  const babe = inPlay || inDiscard;
  if (!babe) return;
  const from = t.from ?? "play";
  if (from === "play" && !inPlay) return;
  if (from === "discard" && !inDiscard) return;
  if (t.ofType && babe.type !== t.ofType) return;
  if (t.distinctTypes) {
    const types = new Set(selectedTargets.map(id => {
      const bb = turn.playedBabes.find(b => b.id === id) || (turn.discard?.babes || []).find(b => b.id === id);
      return (bb as any)?.type;
    }));
    if (types.has((babe as any).type)) return;
  }
  if (selectedTargets.includes(babeId)) return;
  const next = [...selectedTargets, babeId];
  setSelectedTargets(next);
  const need = targetingEffect.name === "Babe Swap" ? 2 : (t.kind === "one-babe" ? 1 : t.min);
  if (next.length >= need) {
    const bound = { ...targetingEffect, playId: uid(), boundTargetIds: next, boundTargetType: t.ofType } as unknown as BoundEffect;

    // Special handling for Measuring Time: optional strokes to double base, and bring babe from discard to play now
    if (targetingEffect.name === "Measuring Time") {
      // Ask if user wants to pay 20 Strokes to double base score
      const pay = typeof window !== 'undefined' && window.confirm("Double her Base Score for 20 Strokes?");
      if (pay) {
        bound.score = [
          ...((targetingEffect as any).score || []),
          { scope: "babe", appliesTo: "targets", op: "mult", amount: 2 },
        ] as any;
        (turn as any).addStrokes?.(20);
        (bound as any).strokeCost = 20;
      }
      // Move chosen babe from discard into play immediately (ignores babe limit)
      const chosen = next[0];
      (turn as any).playBabeFromDiscardImmediate?.(chosen);
    }

    // Cheer Me Up: pay 15 strokes, bring BUSTY from discard into play now (counts toward babe limit)
    if (targetingEffect.name === "Cheer Me Up") {
      (turn as any).addStrokes?.(15);
      const chosen = next[0];
      (bound as any).strokeCost = 15;
      (turn as any).playBabeFromDiscardCounted?.(chosen);
    }

    // Handbra: move chosen BUSTY from Discard back to Deck (no play this turn)
    if (targetingEffect.name === "Handbra") {
      const chosen = next[0];
      (bound as any).boundDiscards = { source: "discard", babeIds: next };
      (turn as any).moveDiscardBabeToDeck?.(chosen);
    }

    // Side Boob: play from discard ignoring babe limit, and mark to move to deck at end of turn
    if (targetingEffect.name === "Side Boob") {
      const chosen = next[0];
      (bound as any).endMoveToDeckIds = next;
      (turn as any).playBabeFromDiscardImmediate?.(chosen);
    }

    // Babe Swap: discard 1 deck babe (selected first), and take 1 from Discard into Deck (selected second)
    if (targetingEffect.name === "Babe Swap") {
      const deckId = next[0];
      const discardId = next[1];
      (turn as any).moveDeckBabeToDiscard?.(deckId);
      (turn as any).moveDiscardBabeToDeck?.(discardId);
      // Store swaps so we can undo on remove/cancel
      (bound as any).listSwaps = {
        deckToDiscardIds: [deckId],
        discardToDeckIds: [discardId],
      };
    }

    // Sun Dress: triple target's base (handled by score op) and pay new base in strokes now
    if (targetingEffect.name === "Sun Dress") {
      const chosen = next[0];
      (bound as any).dynamicStrokeTargetId = chosen;
      (bound as any).dynamicStrokeKind = 'per-babe-total';
      const simulatedEffects = [
        ...((turn.playedEffects as unknown as BoundEffect[]) || []),
        (bound as unknown as BoundEffect),
      ];
      const simulated = computeScore({
        playedBabes: turn.playedBabes,
        playedEffects: simulatedEffects,
        discardPile: (turn.discard?.babes as BabeCard[]) || [],
        pendingNext: turn.pendingNext,
      });
      const pb = simulated.score.perBabe.find(b => b.id === chosen);
      const cost = pb ? pb.total : 0;
      if (cost > 0) {
        (turn as any).addStrokes?.(cost);
        (bound as any).strokeCost = cost;
      }
    }

    (turn as any).playBoundEffect(bound);
    setTargetingEffect(null);
    setSelectedTargets([]);
  }
}}
              discard={turn.discard}
              onReturnDiscardToDeck={turn.returnDiscardToDeck}
              onReset={turn.resetTurn}
              onEndTurn={turn.endTurn}
              // ⬇️ feed engine score
              finalScore={score.finalAfter}
              resolutionLog={log}
              scoreBreakdown={score}
              overallOps={overallOps}
              onReplayBabeFromDiscard={(id: string) => (turn as any).replayBabeFromDiscard?.(id)}
              targeting={targetingEffect?.target as TargetDecl | undefined}
              selectedTargetIds={selectedTargets}
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Effects (deck zone) — reuse DeckPool for identical UI */}
      <div className="min-h-screen overflow-y-auto">
        <DeckPool
          title="Effects"
          kind="effect"
          poolBabes={[]}
          poolEffects={deck.effects}
          search={effectQuery}
          setSearch={setEffectQuery}
          compact={effectCompact}
          setCompact={setEffectCompact}
          sortKey={"name"}
          setSortKey={undefined as any}
          sortDir={effectSortDir}
          setSortDir={setEffectSortDir}
          getDisabled={(e) => {
            const elig = checkEligibility({ ...(e as any), playId: "tmp" }, {
              playedBabes: turn.playedBabes,
              playedEffects: (turn.playedEffects as unknown as BoundEffect[]) || [],
              discardPile: (turn.discard?.babes as BabeCard[]) || [],
              pendingNext: turn.pendingNext,
              playedHistoryBabeNames: (turn as any).playedHistoryBabeNames,
            });
            const ignoreLimitForThisCard = (e as any)?.name === 'Jeanie Wishes';
            if (!canPlayEffect && !ignoreLimitForThisCard) return { disabled: true, reason: "Effect limit reached" };
            if (!elig.ok) return { disabled: true, reason: elig.reason };
            return { disabled: false };
          }}
          onAddBabe={undefined}
          onAddEffect={(e) => {
            const elig = checkEligibility({ ...(e as any), playId: "tmp" }, {
              playedBabes: turn.playedBabes,
              playedEffects: (turn.playedEffects as unknown as BoundEffect[]) || [],
              discardPile: (turn.discard?.babes as BabeCard[]) || [],
              pendingNext: turn.pendingNext,
              playedHistoryBabeNames: (turn as any).playedHistoryBabeNames,
            });
            const ignoreLimitForThisCard = (e as any)?.name === 'Jeanie Wishes';
            if ((!canPlayEffect && !ignoreLimitForThisCard) || !elig.ok) return;
            if (e.target.kind === "none") {
              if (e.name === "Wilde Card") {
                setChoiceEffect(e);
                return;
              }
              return turn.playEffect(e);
            }
            setTargetingEffect(e);
          }}
          onAddAll={undefined}
        />
      </div>

      {/* Targeting dim overlay */}
      {targetingEffect && <div className="fixed inset-0 bg-black/40 z-40 pointer-events-none" />}

      {/* Targeting instruction toast + progress */}
      {targetingEffect && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white text-sm px-3 py-1.5 rounded shadow flex items-center gap-2">
          <span>{targetingEffect.name === 'Babe Swap' ? 'Select 1 Babe from the Babe List, then 1 Babe from the Discard Pile.' : buildTargetInstruction(targetingEffect.target as TargetDecl)}</span>
          <span className="ml-2 px-2 py-0.5 rounded bg-blue-700/60 text-xs">
            {selectedTargets.length}/{targetingEffect.name === 'Babe Swap' ? 2 : (((targetingEffect.target as any)?.kind === 'one-babe' ? 1 : (targetingEffect.target as any)?.min ?? 0))}
          </span>
          {selectedTargets.length > 0 && (
            <span className="flex items-center gap-1">
              {selectedTargets.map((id) => {
                const babe = turn.playedBabes.find(b => b.id === id) || (turn.discard?.babes || []).find(b => b.id === id) || deck.babes.find(b => b.id === id);
                return babe ? (
                  <span key={id} className="px-1.5 py-0.5 rounded bg-white/20 text-white text-xs">{babe.name}</span>
                ) : null;
              })}
            </span>
          )}
          {targetingEffect?.name === '69' && selectedTargets.length > 0 && (
            <button
              className="ml-2 text-xs underline text-white/90 hover:text-white"
              onClick={() => finalize69(selectedTargets)}
              title="Finish selection"
            >
              Finish
            </button>
          )}
          <button
            className="ml-2 text-xs underline text-white/90 hover:text-white"
            onClick={() => { setTargetingEffect(null); setSelectedTargets([]); }}
            title="Cancel targeting"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Choice modal for Wilde Card */}
      <Modal open={!!choiceEffect} onClose={() => setChoiceEffect(null)} title={choiceEffect?.name || ''}>
        <div className="flex items-stretch gap-3">
          <button
            className="flex-1 border rounded-md px-3 py-2 bg-white hover:bg-gray-50 text-left"
            onClick={() => {
              if (!choiceEffect) return;
              turn.playEffect(choiceEffect);
              setChoiceEffect(null);
            }}
          >
            Double the next turn's Final Score
          </button>
          <button
            className="flex-1 border rounded-md px-3 py-2 bg-white hover:bg-gray-50 text-left"
            onClick={() => {
              if (!choiceEffect) return;
              const noOwnEffect = { ...(choiceEffect as any), future: undefined } as EffectScript;
              turn.playEffect(noOwnEffect);
              setChoiceEffect(null);
            }}
          >
            Halve the Final Score of your Opponent's next turn.
          </button>
        </div>
      </Modal>
    </div>
  );
}

function buildTargetInstruction(t: TargetDecl): string {
  const from = (t as any).from;
  const where = from === "discard" ? "from the Discard Pile" : from === "deck" ? "from the Babe List" : "from the PlayArea";
  if (t.kind === "none") return "No targets needed.";
  if (t.kind === "one-babe") {
    return `Select 1${t.ofType ? ` ${t.ofType}` : ""} Babe ${where}.`;
  }
  if (t.kind === "many-babes") {
    const count = t.min === t.max ? t.min : `${t.min} to ${t.max}`;
    const type = t.ofType ? ` ${t.ofType}` : "";
    const distinct = t.distinctTypes ? " with distinct types" : "";
    return `Select ${count}${type} Babes ${where}${distinct}.`;
  }
  return "Select targets.";
}






