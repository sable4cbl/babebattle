import React, { useMemo, useState } from "react";
import type { BabeCard } from "../../types/cards";
import type { EffectScript } from "../../types/effects";
import BabeBadge from "../../components/BabeBadge";
import EffectBadge from "../../components/EffectBadge";
import { getTypeEmoji } from "../../utils/typeEmoji";

type Props = {
  title: string;
  kind: "babe" | "effect";

  poolBabes: BabeCard[];
  poolEffects: EffectScript[];

  search: string;
  setSearch: (v: string) => void;

  compact: boolean;
  setCompact: React.Dispatch<React.SetStateAction<boolean>>;

  onAddBabe?: (b: BabeCard) => void;
  onAddEffect?: (e: EffectScript) => void;

  onAddAll: (groupKey: string, visibleList: (BabeCard | EffectScript)[]) => void;
};

export default function DeckPool({
  title,
  kind,
  poolBabes,
  poolEffects,
  search,
  setSearch,
  compact,
  setCompact,
  onAddBabe,
  onAddEffect,
  onAddAll,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, (BabeCard | EffectScript)[]>();
    const src: (BabeCard | EffectScript)[] = kind === "babe" ? poolBabes : poolEffects;
    for (const x of src) {
      const key = kind === "babe" ? (x as BabeCard).type : String((x as EffectScript).group || "");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(x);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [kind, poolBabes, poolEffects]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <section className="border rounded-xl p-3 bg-white/80 backdrop-blur min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <input
            className="text-sm border rounded px-2 py-1 w-56"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="text-xs border rounded px-2 py-1"
            onClick={() => setCompact(v => !v)}
            title="Toggle compact view"
          >
            {compact ? "Card view" : "Compact"}
          </button>
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="text-sm text-gray-500">No {title.toLowerCase()} loaded.</div>
      )}

      <div className="space-y-4">
        {grouped.map(([key, list]) => {
          const isCollapsed = !!collapsed[key];
          const icon = getTypeEmoji(key as any);

          return (
            <div key={key}>
              <div className="flex items-center justify-between">
                <div
                  className="text-2xl font-bold mb-2 mt-2 flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))}
                >
                  <span className="opacity-80">{isCollapsed ? "▸" : "▾"}</span>
                  <span>{icon}</span>
                  <span>{key}</span>
                  <span className="text-sm text-gray-500">({list.length})</span>
                </div>
                <button
                  className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
                  onClick={() => onAddAll(key, list)}
                >
                  Add all
                </button>
              </div>

              {!isCollapsed && (
                compact ? (
                  <div className="space-y-1">
                    {list.map((x) => (
                      <div
                        key={(x as any).id}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5"
                        onClick={() =>
                          kind === "babe" ? onAddBabe?.(x as BabeCard) : onAddEffect?.(x as EffectScript)
                        }
                        title={(x as any).name}
                      >
                        <span>{icon}</span>
                        {kind === "babe" ? (
                          <span className="truncate">
                            {(x as BabeCard).name}{" "}
                            <span className="text-gray-500">({(x as BabeCard).baseScore})</span>
                          </span>
                        ) : (
                          <span className="truncate">{(x as EffectScript).name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // <- auto-fill grid: uses all available width with min 200px
                  <div className="grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-3">
                    {list.map((x) => (
                      <div
                        key={(x as any).id}
                        className="cursor-pointer transition-transform active:scale-[0.98]"
                        onClick={() =>
                          kind === "babe" ? onAddBabe?.(x as BabeCard) : onAddEffect?.(x as EffectScript)
                        }
                      >
                        {kind === "babe" ? (
                          <BabeBadge b={x as BabeCard} size={{ w: 200, h: 280 }} />
                        ) : (
                          <EffectBadge e={x as EffectScript} size={{ w: 200, h: 280 }} />
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
