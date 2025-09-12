import React, { useEffect, useRef, useState } from "react";
import type { Recap, RecapRow } from "./useDeckImport";
import { getTypeEmoji } from "../../utils/typeEmoji";

function Row({ r, url }: { r: RecapRow; url?: string }) {
  const [hover, setHover] = useState<{ url: string; x: number; y: number } | null>(null);
  return (
    <>
      <tr className="border-t align-middle">
        <td className="py-1 pr-2" title={r.status === "BABE" ? r.cardType || "Babe" : r.status === "EFFECT" ? "Effect" : "Missing"}>
          {r.status === "BABE" ? getTypeEmoji(r.cardType) : r.status === "EFFECT" ? "🔮" : "❌"}
        </td>
        <td className="py-1 pr-2">
          {url ? (
            <img
              src={url}
              className="w-10 h-14 object-cover rounded border"
              alt=""
              onMouseEnter={(ev) => setHover({ url, x: ev.clientX, y: ev.clientY })}
              onMouseMove={(ev) =>
                setHover((h) => (h ? { ...h, x: ev.clientX, y: ev.clientY } : { url, x: ev.clientX, y: ev.clientY }))
              }
              onMouseLeave={() => setHover(null)}
            />
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="py-1">{r.cardName ? <span>{r.cardName}</span> : <span className="text-gray-400">—</span>}</td>
      </tr>

      {/* floating preview localized per row */}
      {hover && (
        <tr>
          <td colSpan={3}>
            <div
              className="fixed z-[9999] pointer-events-none"
              style={{ top: hover.y + 12, left: hover.x + 12 }}
            >
              <img
                src={hover.url}
                className="w-48 h-64 object-cover rounded-lg shadow-lg border bg-white"
                alt=""
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function RecapTable({
  recap,
  fileUrlMap,
  onClear,
}: {
  recap: Recap;
  fileUrlMap: Map<string, string>;
  onClear?: () => void;
}) {
  // clean URLs on unmount if requested by parent
  const prevUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    prevUrlsRef.current = Array.from(fileUrlMap.values());
    return () => {
      for (const u of prevUrlsRef.current) {
        try { URL.revokeObjectURL(u); } catch {}
      }
      prevUrlsRef.current = [];
    };
  }, [fileUrlMap]);

  return (
    <div className="p-3 rounded-lg border bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">File Recap</div>
        {onClear && (
          <button className="text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50" onClick={onClear}>
            Clear list
          </button>
        )}
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Duplicates ignored: {recap.duplicates.length > 0 ? recap.duplicates.join(", ") : "none"}
      </div>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="py-1 pr-2">Type</th>
              <th className="py-1 pr-2">GIF</th>
              <th className="py-1">Name</th>
            </tr>
          </thead>
          <tbody>
            {recap.rows.length === 0 ? (
              <tr>
                <td className="py-2 text-gray-500" colSpan={3}>
                  No files yet. Drop or select GIFs to see a recap.
                </td>
              </tr>
            ) : (
              recap.rows.map((r, i) => (
                <Row key={i} r={r} url={fileUrlMap.get(r.filename)} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {recap.missing.length > 0 && (
        <div className="mt-2 text-sm text-red-600">
          Missing ({recap.missing.length}): {recap.missing.join(", ")}
        </div>
      )}
    </div>
  );
}
