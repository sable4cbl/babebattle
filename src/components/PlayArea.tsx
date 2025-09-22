import React, { useState } from "react";
import type { BabeCard, PlayedBabe } from "../types/cards";
import type { EffectScript, TargetDeck, BoundEffect, ScoreBreakdown, OverallOp, PendingNext, Limits } from "../types/effects";
import { createPortal } from "react-dom";
import BabeBadge from "./BabeBadge";
import EffectBadge from "./EffectBadge";
import { computeLimits } from "../engine";
import { getTypeEmoji } from "../utils/typeEmoji";
import BabesInPlay from "./playarea/BabesInPlay";
import EffectsInPlay from "./playarea/EffectsInPlay";
import ActionsBar from "./playarea/ActionsBar";

export type PlayAreaProps = {
  turnNumber: number;
  strokesThisTurn: number;
  pendingNext?: PendingNext;
  finalScore: number;

  playedBabes: PlayedBabe[];
  playedEffects: BoundEffect[]; // ⬅️ now EffectScript[]

  onRemoveBabe: (id: string) => void;
  onRemoveEffect: (id: string) => void;
  onBindEffect: (babeId: string) => void;

  discard: { babes: BabeCard[]; effects: EffectScript[] };
  onReturnDiscardToDeck: () => void;
  onReplayBabeFromDiscard?: (id: string) => void;

  onReset: () => void;   // cancel turn
  onEndTurn: () => void; // end turn

  resolutionLog: string[];
  targeting?: TargetDeck;
  selectedTargetIds?: string[];
  scoreBreakdown?: ScoreBreakdown;
  overallOps?: OverallOp[];
  limits?: Limits;
  targetingEffectName?: string;
};

// Legacy alias for editor tooling that may still refer to `Props`
export type Props = PlayAreaProps;

const PREVIEW_W = 400;
const PREVIEW_H = 560;
const PREVIEW_MARGIN = 12;

export default function PlayArea({
  turnNumber,
  strokesThisTurn,
  pendingNext,
  finalScore,

  playedBabes,
  playedEffects,
  limits,
  targetingEffectName,

  onRemoveBabe,
  onRemoveEffect,
  onBindEffect,

  discard,
  onReturnDiscardToDeck,
  onReplayBabeFromDiscard,

  onReset,
  onEndTurn,

  resolutionLog,
  targeting,
  selectedTargetIds,
  scoreBreakdown,
  overallOps,
}: PlayAreaProps) {
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasInPlay = playedBabes.length > 0 || playedEffects.length > 0;
  const hasDiscard = discard.babes.length > 0 || discard.effects.length > 0;
  const recycleDisabled = !!targeting || hasInPlay || !hasDiscard;

  function updatePreviewPosition(ev: React.MouseEvent) {
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = ev.clientX + PREVIEW_MARGIN;
    let y = ev.clientY + PREVIEW_MARGIN;
    if (x + PREVIEW_W > vw) x = ev.clientX - PREVIEW_W - PREVIEW_MARGIN;
    if (y + PREVIEW_H > vh) y = Math.max(PREVIEW_MARGIN, vh - PREVIEW_H - PREVIEW_MARGIN);
    setHoverPos({ x, y });
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm px-2 py-1 rounded-md bg-gray-100">Turn #{turnNumber}</div>
        <div className="text-sm px-2 py-1 rounded-md bg-gray-100">Strokes: {strokesThisTurn}</div>
        <div className="text-sm px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold">
          Final Score: {finalScore}
        </div>
        {pendingNext && (pendingNext.addNext || pendingNext.multNext) ? (
          <div className="ml-auto text-xs text-gray-500">
            Next: {pendingNext.addNext ? `+${pendingNext.addNext}` : ""}
            {pendingNext.addNext && pendingNext.multNext ? " & " : ""}
            {pendingNext.multNext ? `×${pendingNext.multNext}` : ""}
          </div>
        ) : null}
      </div>
      {scoreBreakdown && (
        <div className="bg-gray-50 border rounded-md p-2 text-xs text-gray-700">
          <div className="font-semibold mb-1">Score Breakdown</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left align-middle">
              <thead>
                <tr className="text-gray-500">
                  <th className="pr-2 py-1">Babe</th>
                  <th className="pr-2 py-1">Base</th>
                  <th className="pr-2 py-1">Delta</th>
                  <th className="pr-2 py-1">x</th>
                  <th className="pr-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {scoreBreakdown.perBabe.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="pr-2 py-1 whitespace-nowrap">{b.name}</td>
                    <td className="pr-2 py-1">{b.base}</td>
                    <td className="pr-2 py-1">{b.delta >= 0 ? `+${b.delta}` : b.delta}</td>
                    <td className="pr-2 py-1">{b.mult}</td>
                    <td className="pr-2 py-1 font-semibold">{b.total}</td>
                  </tr>
                ))}
                <tr className="border-t font-semibold">
                  <td className="pr-2 py-1 text-gray-700">Sum</td>
                  <td />
                  <td />
                  <td />
                  <td className="pr-2 py-1 font-semibold">{scoreBreakdown.finalBefore}</td>
                </tr>
                {overallOps && overallOps.length > 0 && (() => {
                  let acc = scoreBreakdown.finalBefore;
                  return overallOps.map((op, i) => {
                    acc = op.op.includes('add') ? acc + op.amount : acc * op.amount;
                    const deltaStr = (op.op === 'add' || op.op === 'carry-add') ? `+${op.amount}` : '';
                    const multStr = (op.op === 'mult' || op.op === 'carry-mult') ? `${op.amount}` : '';
                    return (
                      <tr key={`ov-${i}`} className="border-t text-gray-700">
                        <td className="pr-2 py-1 whitespace-nowrap">{op.name}</td>
                        <td className="pr-2 py-1" />
                        <td className="pr-2 py-1">{deltaStr}</td>
                        <td className="pr-2 py-1">{multStr}</td>
                        <td className="pr-2 py-1 font-semibold">{Math.round(acc)}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          {/* Removed extra blocks: effects are listed inline in the table above */}
          <div className="mt-2 text-gray-700">
            <span className="font-medium">Final:</span> {scoreBreakdown.finalAfter}
          </div>
        </div>
      )}

      <BabesInPlay
        playedBabes={playedBabes}
        playedEffects={playedEffects}
        limits={limits}
        targeting={targeting}
        targetingEffectName={targetingEffectName}
        selectedTargetIds={selectedTargetIds}
        onRemoveBabe={onRemoveBabe}
        onBindEffect={onBindEffect}
      />

      {/* Effects in play — same grid/size as Babes */}
      <EffectsInPlay
        playedEffects={playedEffects}
        playedBabes={playedBabes}
        targeting={targeting}
        onRemoveEffect={onRemoveEffect}
      />

      <ActionsBar
        recycleDisabled={recycleDisabled}
        targeting={targeting}
        onReturnDiscardToDeck={onReturnDiscardToDeck}
        onReset={onReset}
        onEndTurn={onEndTurn}
      />

      {/* Discard pile with hover preview */}
      <section>
        <div className="mb-2 text-sm font-semibold text-gray-700">
          Discard pile — Babes {discard.babes.length} · Effects {discard.effects.length}
        </div>

        {/* Babes */}
        {discard.babes.length > 0 ? (
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[...discard.babes].slice().reverse().map((b) => {
              let isDiscardTargeting = !!targeting && (targeting.kind === "one-babe" || targeting.kind === "many-babes") && ((targeting as any).from ?? "play") === "discard";
              // Safety: "69" targets the deck only, never discard
              if (targetingEffectName === '69') isDiscardTargeting = false;
              if (targetingEffectName === 'Babe Swap') {
                isDiscardTargeting = isDiscardTargeting && (selectedTargetIds?.length === 1);
              }
              const tAny: any = targeting as any;
              const baseOk = targetingEffectName === '7 Sins Lust' ? (b.baseScore === 7) : true;
              const matches = (!isDiscardTargeting || !tAny?.ofType || b.type === tAny.ofType) && baseOk;
              const selIdx = selectedTargetIds ? selectedTargetIds.indexOf(b.id) : -1;
              const canReplayNext = !!pendingNext?.replayBabeIds?.includes(b.id);
              const nextMult = pendingNext?.babeMultNext?.[b.id] ?? undefined;
              const clsBase = "rounded overflow-hidden border bg-white relative ";
              // When targeting from discard: existing targeting highlight/disable behavior.
              // Otherwise: gray out by default, but highlight replayable babes.
              const cls = isDiscardTargeting
                ? clsBase +
                  (!matches ? "opacity-30 pointer-events-none " : "z-50 ring-2 ring-blue-500 pointer-events-auto ") +
                  (selIdx >= 0 ? "ring-4 ring-green-500 " : "")
                : clsBase + (canReplayNext ? "ring-2 ring-green-600 pointer-events-auto " : "opacity-40 pointer-events-none ");
              return (
                <div
                  key={b.id}
                  className={cls}
                  style={{ width: 80, height: 112 }}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector("img") as HTMLImageElement | null;
                    if (img) setHoverUrl(img.src);
                  }}
                  onMouseMove={updatePreviewPosition}
                  onMouseLeave={() => setHoverUrl(null)}
                >
                  <div
                    onClick={() => {
                      if (isDiscardTargeting) {
                        setHoverUrl(null);
                        onBindEffect(b.id);
                      } else if (canReplayNext && onReplayBabeFromDiscard) {
                        setHoverUrl(null);
                        onReplayBabeFromDiscard(b.id);
                      }
                    }}
                  >
                    <BabeBadge b={b} size={{ w: 80, h: 112 }} />
                  </div>
                  {canReplayNext && !isDiscardTargeting && (
                    <div className="absolute left-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white shadow" title="Playable for free next turn">
                      Playable
                    </div>
                  )}
                  {nextMult && nextMult > 1 && !isDiscardTargeting && (
                    <div className="absolute right-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white shadow" title={`Multiplied x${nextMult} if played this turn`}>
                      x{nextMult}
                    </div>
                  )}
                  {selIdx >= 0 && (
                    <div className="absolute -top-2 -right-2 z-50 w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center shadow">
                      {selIdx + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mb-2">No babes in discard.</div>
        )}

        {/* Effects */}
        {discard.effects.length > 0 ? (
          <div className="grid grid-cols-6 gap-2 mb-2">
            {[...discard.effects].slice().reverse().map((e) => (
              <div
                key={e.id}
                className="rounded overflow-hidden border bg-white opacity-40"
                style={{ width: 80, height: 112 }}
                onMouseEnter={(ev) => {
                  const img = ev.currentTarget.querySelector("img") as HTMLImageElement | null;
                  if (img) setHoverUrl(img.src);
                }}
                onMouseMove={updatePreviewPosition}
                onMouseLeave={() => setHoverUrl(null)}
              >
                <EffectBadge e={e} size={{ w: 80, h: 112 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mb-2">No effects in discard.</div>
        )}

        {/* Recycle Discard button moved up into Actions */}
      </section>

      {/* Moved log to under Final Score */}

      {/* Hover preview portal */}
      {hoverUrl &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: hoverPos.x,
              top: hoverPos.y,
              width: PREVIEW_W,
              height: PREVIEW_H,
              zIndex: 10000,
              pointerEvents: "none",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
          >
            <img
              src={hoverUrl}
              alt="preview"
              style={{
                width: PREVIEW_W,
                height: PREVIEW_H,
                objectFit: "contain",
                display: "block",
                borderRadius: "8px",
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}






