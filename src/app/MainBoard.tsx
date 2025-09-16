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

  const canPlayEffect = useMemo(
    () => limits.ignoreEffectLimit || turn.playedEffects.length < limits.effects,
    [turn.playedEffects.length, limits.ignoreEffectLimit, limits.effects]
  );

  // Keep your previous mapping for PlayArea visual keys
  const playedBabesForPlayArea = useMemo(
    () => turn.playedBabes.map((b) => ({ ...b, playId: b.id } as any)),
    [turn.playedBabes]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* LEFT: Babes (deck zone) — reuse DeckPool for identical UI */}
      <div className="min-h-screen overflow-y-auto">
        <DeckPool
          title="Babes"
          kind="babe"
          poolBabes={deck.babes}
          poolEffects={[]}
          pendingNext={turn.pendingNext}
          search={babeQuery}
          setSearch={setBabeQuery}
          compact={babeCompact}
          setCompact={setBabeCompact}
          sortKey={babeSortKey}
          setSortKey={setBabeSortKey}
          sortDir={babeSortDir}
          setSortDir={setBabeSortDir}
          getDisabled={(x) => {
            // Check base babe limit first; allow extra type-scoped slots when at cap
            const b = x as BabeCard;
            const atBaseCap = countingBabePlays >= limits.babes;
            if (atBaseCap) {
              const extraMap = (limits as any).extraBabesByType as Record<string, number> | undefined;
              const extraForType = extraMap?.[b.type] ?? 0;
              const wouldBeCount = countingBabePlays + 1;
              const allowWithTypeExtra = extraForType > 0 && wouldBeCount <= (limits.babes + extraForType);
              if (!allowWithTypeExtra) return { disabled: true, reason: "Babe limit reached" };
            }
            const onlyType = (limits as any).restrictBabeTypeTo as BabeCard["type"] | undefined;
            if (onlyType && b.type !== onlyType) return { disabled: true, reason: `Only ${onlyType} babes this turn` };
            return { disabled: false };
          }}
          onAddBabe={(b) => { turn.playBabe(b); }}
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
              onRemoveBabe={(id: string) => turn.removePlayedBabe(id)}
              onRemoveEffect={(id: string) => turn.removePlayedEffect(id)}
              onBindEffect={(babeId: string) => {
  if (!targetingEffect) return;
  const t: any = targetingEffect.target;
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
  const need = t.kind === "one-babe" ? 1 : t.min;
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
            });
            if (!canPlayEffect) return { disabled: true, reason: "Effect limit reached" };
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
            });
            if (!canPlayEffect || !elig.ok) return;
            if (e.target.kind === "none") return turn.playEffect(e);
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
          <span>{buildTargetInstruction(targetingEffect.target as TargetDecl)}</span>
          <span className="ml-2 px-2 py-0.5 rounded bg-blue-700/60 text-xs">
            {selectedTargets.length}/{((targetingEffect.target as any)?.kind === 'one-babe' ? 1 : (targetingEffect.target as any)?.min ?? 0)}
          </span>
          {selectedTargets.length > 0 && (
            <span className="flex items-center gap-1">
              {selectedTargets.map((id) => {
                const babe = turn.playedBabes.find(b => b.id === id) || (turn.discard?.babes || []).find(b => b.id === id);
                return babe ? (
                  <span key={id} className="px-1.5 py-0.5 rounded bg-white/20 text-white text-xs">{babe.name}</span>
                ) : null;
              })}
            </span>
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






