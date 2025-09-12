import React, { useMemo, useState } from "react";
import type { BabeCard } from "../types/cards";
import { getTypeEmoji } from "../utils/typeEmoji";
import BabeBadge from "./BabeBadge";

type Props = {
  babes: BabeCard[];
  canPlayBabe: boolean;
  playBabe: (b: BabeCard) => void;
};

type SortKey = "name" | "score";
type SortDir = "asc" | "desc";

export default function BabeDeck({ babes, canPlayBabe, playBabe }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeType, setActiveType] = useState<string | null>(null);

  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of babes) m.set(b.type, (m.get(b.type) || 0) + 1);
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [babes]);

  const visible = useMemo(() => {
    const arr = activeType ? babes.filter(b => b.type === activeType) : babes.slice();
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else cmp = (a.baseScore ?? 0) - (b.baseScore ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [babes, sortKey, sortDir, activeType]);

  const grouped = useMemo(() => {
    const g = new Map<string, BabeCard[]>();
    for (const b of visible) {
      if (!g.has(b.type)) g.set(b.type, []);
      g.get(b.type)!.push(b);
    }
    return Array.from(g.entries());
  }, [visible]);

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Babes</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort</label>
          <select
            className="text-sm border rounded px-2 py-1"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="name">A → Z</option>
            <option value="score">Score</option>
          </select>
          <button
            className="text-sm border rounded px-2 py-1"
            title={sortDir === "asc" ? "Ascending" : "Descending"}
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-sm font-medium mb-1">Available</div>
        <div className="flex flex-wrap gap-2">
          {typeCounts.map(([t, n]) => {
            const active = activeType === t;
            return (
              <button
                key={t}
                className={
                  "text-xs px-2 py-1 rounded border " +
                  (active ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50")
                }
                onClick={() => setActiveType((cur) => (cur === t ? null : t))}
              >
                <span className="mr-1">{getTypeEmoji(t)}</span>
                {t}: {n}
              </button>
            );
          })}
        </div>
      </div>

      {grouped.map(([type, rows]) => (
        <div key={type} className="mb-6">
          {!activeType && (
            <div className="text-2xl font-bold mb-2 mt-4">{type}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {rows.map((b) => (
              <div
                key={b.id}
                className={
                  "cursor-pointer transition-transform active:scale-[0.98] " +
                  (!canPlayBabe ? "opacity-50 pointer-events-none" : "")
                }
                onClick={() => canPlayBabe && playBabe(b)}
              >
                <BabeBadge b={b} size={{ w: 200, h: 280 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
