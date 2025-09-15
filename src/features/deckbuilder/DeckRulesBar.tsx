import React from "react";
import { getTypeEmoji } from "../../utils/typeEmoji";

type Props = {
  total: number;
  babes: number;
  effects: number;
  byType: Map<string, number>;
  duplicateNames: string[];
  duplicatesFromImport: string[]; // from useDeckImport
  isValid: boolean;
  onPlay: () => void;
};

export default function DeckRulesBar({
  total,
  babes,
  effects,
  byType,
  duplicateNames,
  duplicatesFromImport,
  isValid,
  onPlay,
}: Props) {
  const totalOk = total >= 30 && total <= 40;
  const babesOk = babes >= 15;
  const noDupNames = duplicateNames.length === 0;

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge ok={totalOk}>Total: {total} (30–40)</Badge>
        <Badge ok={babesOk}>Babes: {babes} (≥15)</Badge>
        <Badge ok={true}>Effects: {effects}</Badge>

        <div className="flex items-center gap-2 flex-wrap">
          {Array.from(byType.entries()).map(([t, n]) => (
            <span key={t} className="text-xs px-2 py-1 rounded bg-gray-100">
              <span className="mr-1">{getTypeEmoji(t as any)}</span>
              {t}: <b>{n}</b>
            </span>
          ))}
        </div>

        <div className="ml-auto">
          <button
            className={
              "px-3 py-1 rounded-md text-sm " +
              (isValid ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-500 cursor-not-allowed")
            }
            onClick={onPlay}
            disabled={!isValid}
            title={isValid ? "Start playing with this deck" : "Deck is not valid yet"}
          >
            Play
          </button>
        </div>
      </div>

      {/* Warnings */}
      {!noDupNames && (
        <div className="mt-2 text-xs text-red-700">
          ❌ Duplicate babe names in deck (must be unique): {duplicateNames.join(", ")}
        </div>
      )}
      {duplicatesFromImport.length > 0 && (
        <div className="mt-1 text-xs text-amber-700">
          ⚠️ Duplicate files ignored during import: {duplicatesFromImport.length}
        </div>
      )}
      {!totalOk && (
        <div className="mt-1 text-xs text-red-700">
          ❌ Deck must contain between 30 and 40 cards.
        </div>
      )}
      {!babesOk && (
        <div className="mt-1 text-xs text-red-700">
          ❌ Deck must contain at least 15 babes.
        </div>
      )}
    </div>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={
        "px-2 py-1 rounded text-xs " +
        (ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")
      }
    >
      {children}
    </span>
  );
}
