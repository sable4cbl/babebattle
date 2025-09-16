import React, { useState } from "react";
import type { BabeCard, PlayedBabe } from "../types/cards";
import type { EffectScript, TargetDecl, BoundEffect, ScoreBreakdown, OverallOp, PendingNext, Limits } from "../types/effects";
import BabeBadge from "./BabeBadge";
import EffectBadge from "./EffectBadge";
import { createPortal } from "react-dom";
import { computeLimits } from "../engine";
import { getTypeEmoji } from "../utils/typeEmoji";

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
  targeting?: TargetDecl;
  selectedTargetIds?: string[];
  scoreBreakdown?: ScoreBreakdown;
  overallOps?: OverallOp[];
  limits?: Limits;
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

      {/* Babes in play */}
      <section>
        <div className="mb-2 text-sm font-semibold text-gray-700">
          Babes in play ({playedBabes.length})
          {limits && (
            <span className="ml-2 text-xs text-gray-500">
              Limit {limits.babes}
              {limits.extraBabesByType && Object.entries(limits.extraBabesByType).map(([t, n]) => (
                (n as number) > 0 ? <span key={t} className="ml-1">+{n as number} {getTypeEmoji(t as any)}</span> : null
              ))}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 justify-items-center">
          {playedBabes.map((b) => {
            const locking = playedEffects.filter(pe => (pe.boundTargetIds || []).includes(b.id));
            const isLocked = locking.length > 0;
            const lockReason = isLocked ? `Locked by ${locking.map(pe => pe.name).join(", ")}` : undefined;
            const isPlayTargeting = !!targeting && (targeting.kind === "one-babe" || targeting.kind === "many-babes") && ((targeting as any).from ?? "play") === "play";
            const matches = !isPlayTargeting || !targeting?.ofType || b.type === targeting.ofType;
            const selIdx = selectedTargetIds ? selectedTargetIds.indexOf(b.id) : -1;
            const cls =
              "relative " +
              (isPlayTargeting && !matches ? "opacity-30 pointer-events-none " : "") +
              (isPlayTargeting && matches ? "z-50 ring-2 ring-blue-500 rounded pointer-events-auto " : "") +
              (selIdx >= 0 ? "ring-4 ring-green-500 " : "");
            return (
              <div key={b.id} className={cls}>
                {isLocked ? (
                  <div
                    className="absolute left-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-gray-800/80 text-white shadow max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={lockReason}
                  >
                    {lockReason}
                  </div>
                ) : (
                  <button
                    className="absolute left-1 top-1 z-10 text-xs px-1.5 py-0.5 bg-white/90 rounded border shadow-sm hover:bg-white"
                    onClick={() => onRemoveBabe(b.id)}
                    title="Send back to deck"
                    disabled={!!targeting}
                  >
                    ×
                  </button>
                )}
                <BabeBadge
                  b={b as unknown as BabeCard}
                  onClick={() => onBindEffect(b.id)}
                  size={{ w: 200, h: 280 }}
                />
                {/* top-left badge already shows lock reason when locked */}
                {selIdx >= 0 && (
                  <div className="absolute -top-2 -right-2 z-50 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center shadow">
                    {selIdx + 1}
                  </div>
                )}
              </div>
            );
          })}
          {playedBabes.length === 0 && (
            <div className="text-xs text-gray-500 col-span-2">No babes played yet.</div>
          )}
        </div>
      </section>

      {/* Effects in play — same grid/size as Babes */}
      <section>
        <div className="mb-2 text-sm font-semibold text-gray-700">
          Effects in play ({playedEffects.length})
        </div>
        <div className="grid grid-cols-2 gap-3 justify-items-center">
          {playedEffects.map((pe) => {
            const remaining = (playedEffects as BoundEffect[]).filter((e) => e.playId !== pe.playId);
            const lim = computeLimits(remaining);
            const overflow = Math.max(0, playedBabes.length - lim.babes);
            let capacity = 0;
            if (overflow > 0 && (lim as any).extraBabesByType) {
              const counts: Record<string, number> = {};
              for (const b of playedBabes) counts[b.type] = (counts[b.type] || 0) + 1;
              for (const [t, extra] of Object.entries((lim as any).extraBabesByType as Record<string, number>)) {
                const avail = typeof extra === 'number' ? extra : 0;
                capacity += Math.min(avail, counts[t] || 0);
              }
            }
            const locked = overflow > capacity;
            const lockReason = locked ? "Locked by babe limit" : "Send back to deck";
            return (
              <div key={pe.playId} className="relative">
                {locked ? (
                  <div
                    className="absolute left-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-gray-800/80 text-white shadow max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap"
                    title={lockReason}
                  >
                    {lockReason}
                  </div>
                ) : (
                  <button
                    className={
                      "absolute left-1 top-1 z-10 text-xs px-1.5 py-0.5 bg-white/90 rounded border shadow-sm hover:bg-white"
                    }
                    onClick={() => onRemoveEffect(pe.playId)}
                    title={lockReason}
                    disabled={!!targeting}
                  >
                    ×
                  </button>
                )}
                <EffectBadge e={pe} size={{ w: 200, h: 280 }} />
              </div>
            );
          })}
          {playedEffects.length === 0 && (
            <div className="text-xs text-gray-500 col-span-2">No effects played yet.</div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <button
            className={
              "text-xs px-2 py-1 rounded-md border " +
              (recycleDisabled ? "bg-gray-100 text-gray-400 opacity-50 pointer-events-none" : "bg-white hover:bg-gray-50")
            }
            onClick={onReturnDiscardToDeck}
            title="Return all discard to the deck lists"
            disabled={recycleDisabled}
          >
            Recycle Discard
          </button>
          <button
            className={
              "text-xs px-2 py-1 rounded-md border " +
              (targeting ? "bg-gray-100 text-gray-400 opacity-50 pointer-events-none" : "bg-white hover:bg-gray-50")
            }
            onClick={onReset}
            title="Return all cards in play to their lists"
            disabled={!!targeting}
          >
            Cancel Turn
          </button>
          <button
            className={
              "text-xs px-3 py-1 rounded-md " +
              (targeting ? "bg-blue-300 text-white opacity-50 pointer-events-none" : "bg-blue-600 text-white hover:bg-blue-700")
            }
            onClick={onEndTurn}
            title="Move all cards in play to the Discard pile"
            disabled={!!targeting}
          >
            End Turn
          </button>
        </div>
      </div>

      {/* Discard pile with hover preview */}
      <section>
        <div className="mb-2 text-sm font-semibold text-gray-700">
          Discard pile — Babes {discard.babes.length} · Effects {discard.effects.length}
        </div>

        {/* Babes */}
        {discard.babes.length > 0 ? (
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[...discard.babes].slice().reverse().map((b) => {
              const isDiscardTargeting = !!targeting && (targeting.kind === "one-babe" || targeting.kind === "many-babes") && ((targeting as any).from ?? "play") === "discard";
              const matches = !isDiscardTargeting || !targeting?.ofType || b.type === targeting.ofType;
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






