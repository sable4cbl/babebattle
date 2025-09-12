import React from "react";
import type { Recap } from "./useDeckImport";
import { getTypeEmoji } from "../../utils/typeEmoji";

export default function SummaryCard({
  recap,
  error,
  busy,
  onImport,
}: {
  recap: Recap;
  error: string | null;
  busy: boolean;
  onImport: () => void;
}) {
  return (
    <div className="p-3 rounded-lg border bg-white space-y-3">
      <div>
        <div className="font-semibold">Deck Summary</div>
        <div className="text-sm text-gray-700">
          Total: <b>{recap.total}</b> cards<br />
          Babes: <b>{recap.babes}</b> • Effects: <b>{recap.effects}</b>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Babes by Type</div>
        <div className="text-sm text-gray-700">
          {Object.keys(recap.byType).length === 0 ? (
            <span className="text-gray-500">—</span>
          ) : (
            Object.entries(recap.byType).map(([t, n]) => (
              <span key={t} className="mr-3">
                {getTypeEmoji(t)} {t}: {n}
              </span>
            ))
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red-600 whitespace-pre-wrap">{error}</div>}

      <div className="flex gap-2">
        <button
          className="px-3 py-1.5 rounded-lg border bg-black text-white disabled:opacity-50"
          onClick={onImport}
          disabled={busy || recap.rows.length === 0 || recap.missing.length > 0}
          title={
            recap.missing.length > 0 ? "Fix missing card filenames before importing." : undefined
          }
        >
          Import Deck
        </button>
        <div className="text-xs text-gray-500 self-center">
          Rules: 30–40 cards, at least 15 Babes.
        </div>
      </div>
    </div>
  );
}
