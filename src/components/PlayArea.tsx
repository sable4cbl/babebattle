import React, { useState } from "react";
import type { BabeCard, PlayedBabe, PlayedEffect } from "../types/cards";
import type { EffectScript } from "../types/effects";
import BabeBadge from "./BabeBadge";
import EffectBadge from "./EffectBadge";
import { createPortal } from "react-dom";

type Props = {
  turnNumber: number;
  strokesThisTurn: number;
  pendingNext?: { addNext?: number; multNext?: number };
  finalScore: number;

  playedBabes: PlayedBabe[];
  playedEffects: PlayedEffect[];

  onRemoveBabe: (id: string) => void;
  onRemoveEffect: (id: string) => void;
  onBindEffect: (babeId: string) => void;

  discard: { babes: BabeCard[]; effects: EffectScript[] };
  onReturnDiscardToDeck: () => void;

  onReset: () => void;   // cancel turn
  onEndTurn: () => void; // end turn

  resolutionLog: string[];
};

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

  onRemoveBabe,
  onRemoveEffect,
  onBindEffect,

  discard,
  onReturnDiscardToDeck,

  onReset,
  onEndTurn,

  resolutionLog,
}: Props) {
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

      {/* Babes in play */}
      <section>
        <div className="mb-2 text-sm font-semibold text-gray-700">
          Babes in play ({playedBabes.length})
        </div>
        <div className="grid grid-cols-2 gap-3 justify-items-center">
          {playedBabes.map((b) => (
            <div key={b.id} className="relative">
              <button
                className="absolute left-1 top-1 z-10 text-xs px-1.5 py-0.5 bg-white/90 rounded border shadow-sm hover:bg-white"
                onClick={() => onRemoveBabe(b.id)}
                title="Send back to deck"
              >
                ×
              </button>
              <BabeBadge
                b={b as unknown as BabeCard}
                onClick={() => onBindEffect(b.id)}
                size={{ w: 200, h: 280 }}
              />
            </div>
          ))}
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
          {playedEffects.map((pe) => (
            <div key={pe.id} className="relative">
              <button
                className="absolute left-1 top-1 z-10 text-xs px-1.5 py-0.5 bg-white/90 rounded border shadow-sm hover:bg-white"
                onClick={() => onRemoveEffect(pe.id)}
                title="Send back to deck"
              >
                ×
              </button>
              <EffectBadge e={pe.script} size={{ w: 200, h: 280 }} />
            </div>
          ))}
          {playedEffects.length === 0 && (
            <div className="text-xs text-gray-500 col-span-2">No effects played yet.</div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <button
            className="text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
            onClick={onReset}
            title="Return all cards in play to their lists"
          >
            Cancel Turn
          </button>
          <button
            className="text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={onEndTurn}
            title="Move all cards in play to the Discard pile"
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
            {discard.babes.map((b) => (
              <div
                key={b.id}
                className="rounded overflow-hidden border bg-white"
                style={{ width: 80, height: 112 }}
                onMouseEnter={(e) => {
                  const img = e.currentTarget.querySelector("img") as HTMLImageElement | null;
                  if (img) setHoverUrl(img.src);
                }}
                onMouseMove={updatePreviewPosition}
                onMouseLeave={() => setHoverUrl(null)}
              >
                <BabeBadge b={b} size={{ w: 80, h: 112 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mb-2">No babes in discard.</div>
        )}

        {/* Effects */}
        {discard.effects.length > 0 ? (
          <div className="grid grid-cols-6 gap-2 mb-2">
            {discard.effects.map((e) => (
              <div
                key={e.id}
                className="rounded overflow-hidden border bg-white"
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

        <div className="mt-1">
          <button
            className="text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
            onClick={onReturnDiscardToDeck}
            title="Return all discard to the deck lists"
          >
            Return Discard to Deck
          </button>
        </div>
      </section>

      {resolutionLog.length > 0 && (
        <section>
          <div className="mb-1 text-xs font-semibold text-gray-600">Resolution Log</div>
          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-0.5">
            {resolutionLog.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      )}

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
