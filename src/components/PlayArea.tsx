import React from "react";
import { BabeCard, PlayedBabe, PlayedEffect } from "../types/cards";
import CardShell from "./ui/CardShell";
import BabeBadge from "./BabeBadge";
import PlayedEffectBadge from "./PlayedEffectBadge";

type Limits = { babes: number; effects: number };

export default function PlayArea({
  turnNumber,
  strokesThisTurn,
  pendingNext,
  playedBabes,
  playedEffects,
  babeScores,
  computedLimits,
  pendingEffectName,
  pendingEffectTargetType,
  onClickBabeForTarget,
  onRemovePlayedBabe,
  onRemovePlayedEffect,
  onClearTurn,
  onEndTurn,
  finalScore,
  baseSum,
  mutatedSum,
  resolutionLog,
}: {
  turnNumber: number;
  strokesThisTurn: number;
  pendingNext?: { addNext?: number; multNext?: number };
  playedBabes: PlayedBabe[];
  playedEffects: PlayedEffect[];
  babeScores: Map<string, number>;
  computedLimits: Limits;
  pendingEffectName?: string | null;
  pendingEffectTargetType?: string | null;
  onClickBabeForTarget: (b: PlayedBabe) => void;
  onRemovePlayedBabe: (playId: string) => void;
  onRemovePlayedEffect: (playId: string) => void;
  onClearTurn: () => void;
  onEndTurn: () => void;
  finalScore: number;
  baseSum: number;
  mutatedSum: number;
  resolutionLog: string[];
}) {
  const requiresTarget = !!pendingEffectTargetType;

  return (
    <div className="space-y-6 relative z-20">
      {/* Scoreboard */}
      <CardShell>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-4">
            <h2 className="text-xl font-semibold">Play Area</h2>
            <div className="text-gray-600 text-sm">Turn {turnNumber}</div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-gray-500">Limits:</span>{" "}
              <span>B{computedLimits.babes}</span> / <span>E{computedLimits.effects}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Strokes:</span> {strokesThisTurn}
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Final:</span>{" "}
              <span className="font-semibold">{finalScore}</span>
            </div>
            {pendingNext?.addNext || pendingNext?.multNext ? (
              <div className="text-sm">
                <span className="text-gray-500">Next:</span>{" "}
                {pendingNext.addNext ? `+${pendingNext.addNext} ` : ""}
                {pendingNext.multNext ? `×${pendingNext.multNext}` : ""}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-100"
              onClick={onClearTurn}
              title="Clear played cards this turn"
            >
              Clear Turn
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded-lg border bg-black text-white hover:opacity-90"
              onClick={onEndTurn}
              title="Send played cards to Discard and advance turn"
            >
              End Turn
            </button>
          </div>
        </div>
      </CardShell>

      {/* Babes in Play — two per row */}
      <CardShell>
        {playedBabes.length === 0 ? (
          <div className="text-sm text-gray-500">No Babes played yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {playedBabes.map((b) => {
              const clickable =
                !requiresTarget ||
                (pendingEffectTargetType ? b.type === pendingEffectTargetType : true);
              return (
                <div key={b.playId} className="relative z-20 flex justify-center">
                  <BabeBadge
                    b={b as BabeCard}
                    score={babeScores.get(b.playId)}
                    muted={requiresTarget && !clickable}
                    onClick={() => {
                      if (requiresTarget && !clickable) return;
                      onClickBabeForTarget(b);
                    }}
                  />
                  <button
                    className="absolute top-1 left-1 text-xs px-2 py-0.5 bg-white/90 rounded-md border hover:bg-white"
                    onClick={() => onRemovePlayedBabe(b.playId)}
                    title="Remove from Play"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardShell>

      {/* Effects in Play */}
      <CardShell>
        {playedEffects.length === 0 ? (
          <div className="text-sm text-gray-500">No Effects played yet.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {playedEffects.map((e) => (
              <div key={e.playId} className="relative z-20">
                <PlayedEffectBadge e={e} />
                <button
                  className="absolute top-1 left-1 text-xs px-2 py-0.5 bg-white/90 rounded-md border hover:bg-white"
                  onClick={() => onRemovePlayedEffect(e.playId)}
                  title="Remove Effect"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </CardShell>

      {resolutionLog.length > 0 && (
        <CardShell>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-800">
            {resolutionLog.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ol>
        </CardShell>
      )}
    </div>
  );
}
