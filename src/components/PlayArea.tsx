import React from "react";
import { PlayedBabe, PlayedEffect } from "../types/cards";
import CardShell from "./ui/CardShell";
import Pill from "./ui/Pill";
import BabeBadge from "./BabeBadge";
import EffectBadge from "./EffectBadge";

export default function PlayArea({
  playedBabes,
  playedEffects,
  babeScores,
  computedLimits,
  selectedEffectId,
  onRemovePlayedBabe,
  onRemovePlayedEffect,
  onBindEffect,
  onToggleSelectEffect,
  onClickBabeForTarget,
  onClearTurn,
  onEndTurn,
  finalScore,
  baseSum,
  mutatedSum,
  resolutionLog,
}: {
  playedBabes: PlayedBabe[];
  playedEffects: PlayedEffect[];
  babeScores: Map<string, number>;
  computedLimits: { babes: number; effects: number };
  selectedEffectId: string | null;
  onRemovePlayedBabe: (playId: string) => void;
  onRemovePlayedEffect: (playId: string) => void;
  onBindEffect: (playId: string, updates: Partial<PlayedEffect>) => void;
  onToggleSelectEffect: (e: PlayedEffect) => void;
  onClickBabeForTarget: (b: PlayedBabe) => void;
  onClearTurn: () => void;
  onEndTurn: () => void;
  finalScore: number;
  baseSum: number;
  mutatedSum: number;
  resolutionLog: string[];
}) {
  const effectById = (id: string | null) =>
    playedEffects.find((e) => e.playId === id) || null;

  const isBabeEligible = (b: PlayedBabe, e: PlayedEffect | null): boolean => {
    if (!e) return true;
    if (e.kind === "multiply-babe") return true;
    if (e.kind === "multiply-type") {
      const t = e.boundTargetType || e.targetType;
      if (!t) return true;
      return b.type === t;
    }
    return false;
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-3">Play Area (This Turn)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardShell highlight={!!selectedEffectId}>
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Played Babes</div>
              <Pill>
                {playedBabes.length} / {computedLimits.babes}
              </Pill>
            </div>
            {selectedEffectId && (
              <div className="mb-2 text-xs text-blue-700">
                Targeting: click a highlighted Babe to bind.
              </div>
            )}
            <div className="space-y-2">
              {playedBabes.length === 0 && (
                <div className="text-sm text-gray-500">No babes played yet.</div>
              )}
              {playedBabes.map((b) => {
                const e = effectById(selectedEffectId);
                const eligible = isBabeEligible(b, e);
                return (
                  <div
                    key={b.playId}
                    className={`flex items-center justify-between rounded-xl ${
                      selectedEffectId && eligible ? "ring-2 ring-blue-200" : ""
                    }`}
                  >
                    <BabeBadge
                      b={b}
                      score={babeScores.get(b.playId)}
                      muted={!!selectedEffectId && !eligible}
                      onClick={selectedEffectId && eligible ? () => onClickBabeForTarget(b) : undefined}
                    />
                    <button
                      className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-100"
                      onClick={() => onRemovePlayedBabe(b.playId)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </CardShell>

        <CardShell>
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Played Effects</div>
              <Pill>
                {playedEffects.length} / {computedLimits.effects}
              </Pill>
            </div>
            <div className="space-y-2">
              {playedEffects.length === 0 && (
                <div className="text-sm text-gray-500">No effects played yet.</div>
              )}
              {playedEffects.map((e) => (
                <div key={e.playId} className={`flex items-center justify-between ${selectedEffectId === e.playId ? "bg-blue-50" : ""}`}>
                  <EffectBadge
                    e={e}
                    onBind={(u) => onBindEffect(e.playId, u)}
                    selected={selectedEffectId === e.playId}
                    onSelect={() => onToggleSelectEffect(e)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-100"
                      onClick={() => onRemovePlayedEffect(e.playId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardShell>
      </div>

      <div className="mt-4">
        <CardShell>
          <div className="w-full">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-3xl font-bold">Final Score: {finalScore}</div>
              <div className="text-sm text-gray-600">(Base Sum {baseSum} → After Babe Effects {mutatedSum})</div>
              <div className="ml-auto flex gap-2">
                <button className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-100" onClick={onClearTurn}>Clear Turn</button>
                <button className="text-xs px-3 py-2 rounded-lg border hover:bg-blue-50 text-blue-700" onClick={onEndTurn}>End Turn → Discard</button>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-sm font-medium mb-1">Resolution Log</div>
              <ol className="list-decimal pl-6 text-sm text-gray-700 space-y-1">
                {resolutionLog.length === 0 && <li>—</li>}
                {resolutionLog.map((l, i) => (<li key={i}>{l}</li>))}
              </ol>
            </div>
          </div>
        </CardShell>
      </div>
    </>
  );
}
