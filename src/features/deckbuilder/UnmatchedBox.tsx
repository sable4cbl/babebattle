import React, { useState } from "react";

type Item = { filename: string; url?: string | null };

type Props = {
  items: Item[];
};

/**
 * Unmatched files panel — styled like the deck (small 120x168 thumbs).
 * Collapsed by default. Read-only.
 */
export default function UnmatchedBox({ items }: Props) {
  // collapsed by default
  const [collapsed, setCollapsed] = useState(true);
  if (!items || items.length === 0) return null;

  return (
    <section className="w-full bg-white/80 backdrop-blur border rounded-xl p-3 shadow sticky top-2 self-start min-w-0">
      <div
        className="flex items-center gap-2 cursor-pointer select-none mb-2"
        onClick={() => setCollapsed(v => !v)}
        title="Toggle unmatched list"
      >
        <span className="opacity-70">{collapsed ? "▸" : "▾"}</span>
        <h3 className="text-sm font-semibold text-red-600">Unmatched files</h3>
        <span className="text-[11px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
          {items.length}
        </span>
      </div>

      {!collapsed && (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))] gap-3 justify-items-center">
          {items.map((it, i) => (
            <div key={i} className="relative">
              <div
                className="rounded overflow-hidden shadow border border-red-200 bg-white"
                style={{ width: 120, height: 168 }}
                title={it.filename}
              >
                {it.url ? (
                  <img
                    src={it.url}
                    alt={it.filename}
                    className="object-cover w-full h-full block"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[11px] text-gray-500">
                    (no preview)
                  </div>
                )}
              </div>
              <div
                className="absolute left-1 right-1 bottom-1 text-[10px] text-white/90 bg-black/50 rounded px-1 py-0.5 truncate"
                title={it.filename}
              >
                {it.filename}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
