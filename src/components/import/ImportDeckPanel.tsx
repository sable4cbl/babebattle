import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDeckImport } from "./useDeckImport";
import type { BabeCard } from "../../types/cards";
import type { EffectScript } from "../../types/effects";
import { getTypeEmoji } from "../../utils/typeEmoji";
import { useGifLibrary } from "../../media/GifLibrary";

type Props = {
  onImported: (deck: { babes: BabeCard[]; effects: EffectScript[] }) => void;
};

const PREVIEW_W = 400;
const PREVIEW_H = 560;
const PREVIEW_MARGIN = 12;

export default function ImportDeckPanel({ onImported }: Props) {
  // ---- hooks at top level only ----
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const gifLib = useGifLibrary();
  const { recap, duplicates } = useDeckImport(files);

  // hover preview state (portal)
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ---- derived flags ----
  const hasSelection = files.length > 0;
  const tooManyFiles = files.length > 40;
  const hasMissing = (recap?.missing?.length ?? 0) > 0;

  const countOK =
    (recap?.total ?? 0) >= 30 &&
    (recap?.total ?? 0) <= 40 &&
    (recap?.babes ?? 0) >= 15;

  const canImport = hasSelection && !hasMissing && countOK && !tooManyFiles;

  // right panel: ONLY matched rows, up to 40
  const matchedRows = useMemo(() => {
    if (!recap) return [];
    return recap.rows.filter((r) => r.status === "BABE" || r.status === "EFFECT").slice(0, 40);
  }, [recap]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selected);
    gifLib.clearAll();
    if (selected.length) gifLib.addFiles(selected);
  }

  function handleImport() {
    try {
      if (!canImport || !recap) return;
      onImported({ babes: recap.listBabes, effects: recap.listEffects });
    } catch (err: any) {
      setError(err?.message || "Could not import deck.");
    }
  }

  // position the preview near cursor, clamped to viewport
  function updatePreviewPosition(ev: React.MouseEvent) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = ev.clientX + PREVIEW_MARGIN;
    let y = ev.clientY + PREVIEW_MARGIN;
    if (x + PREVIEW_W > vw) x = ev.clientX - PREVIEW_W - PREVIEW_MARGIN;
    if (y + PREVIEW_H > vh) y = Math.max(PREVIEW_MARGIN, vh - PREVIEW_H - PREVIEW_MARGIN);
    setHoverPos({ x, y });
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <div className="font-medium mb-2">Import deck GIFs</div>
        <input
          type="file"
          accept=".gif"
          multiple
          onChange={handleFileChange}
          className="block text-sm"
        />
        {/* removed helper paragraph by request */}
        <div className="mt-1 text-xs text-gray-500">
          Loaded into GIF library: <b>{gifLib.knownCount}</b>
        </div>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-800 text-sm rounded-md p-2">
          {error}
        </div>
      )}

      {hasSelection && recap && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT: Summary */}
          <div className="border rounded-lg p-3 space-y-3">
            <div>
              <div className="font-semibold mb-2">Summary</div>
              <ul className="text-sm space-y-1">
                <li>Total files selected: <b>{files.length}</b></li>
                <li>Total files matched: <b>{recap.total}</b></li>
                <li>Babes: <b>{recap.babes}</b></li>
                <li>Effects: <b>{recap.effects}</b></li>
              </ul>
            </div>

            <div>
              <div className="font-medium mb-1 text-sm">By type</div>
              <ul className="space-y-0.5 text-sm">
                {Object.entries(recap.byType).map(([t, n]) => (
                  <li key={t}>
                    <span className="mr-1">{getTypeEmoji(t)}</span>
                    {t}: <b>{n}</b>
                  </li>
                ))}
              </ul>
            </div>

            {duplicates.length > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded p-2">
                Duplicates ignored: {duplicates.length}
              </div>
            )}

            <div>
              <div className="font-medium text-sm">Rules</div>
              <ul className="list-disc pl-5 text-xs text-gray-600 space-y-0.5">
                <li>30–40 total cards</li>
                <li>At least 15 Babe cards</li>
                <li>No Babe duplicates with different <b>Types</b> for the same <b>Name</b></li>
              </ul>

              <div className="mt-2 space-y-1">
                {!tooManyFiles && countOK ? (
                  <div className="text-green-700 text-xs">Counts look good ✅</div>
                ) : (
                  <div className="text-red-700 text-xs">
                    {tooManyFiles ? "Too many files selected (> 40) ❌" : "Counts invalid ❌"}
                  </div>
                )}
                {hasMissing && (
                  <div className="text-xs text-red-700">
                    {recap.missing.length} file{recap.missing.length === 1 ? "" : "s"} didn’t match known cards.
                  </div>
                )}
              </div>
            </div>

            {/* NEW: Unmatched files list */}
            {hasMissing && (
              <div className="border rounded-md p-2">
                <div className="font-medium text-sm mb-1">Unmatched files</div>
                <div className="max-h-48 overflow-auto text-xs font-mono text-gray-700 leading-relaxed">
                  {recap.missing.map((name: string, i: number) => (
                    <div key={i} className="truncate">{name}</div>
                  ))}
                </div>
              </div>
            )}

            <button
              className={
                "text-sm px-3 py-1 rounded-md " +
                (canImport
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed")
              }
              onClick={handleImport}
              disabled={!canImport}
            >
              Import Deck
            </button>
          </div>

          {/* RIGHT: Matched cards (hidden if >40 files selected) */}
          {!tooManyFiles && (
            <div className="border rounded-lg p-3">
              <div className="font-semibold mb-2">Matched cards</div>
              <div className="text-xs text-gray-500 mb-2">Showing up to 40 matched rows</div>

              <div className="max-h-[32rem] overflow-auto space-y-2">
                {matchedRows.map((r, i) => {
                  const url = gifLib.getUrl(r.filename);
                  const icon = r.status === "BABE" ? getTypeEmoji(r.cardType) : "🔮";

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm"
                      title={r.filename}
                      onMouseEnter={(e) => {
                        if (url) {
                          updatePreviewPosition(e);
                          setHoverUrl(url);
                        }
                      }}
                      onMouseMove={updatePreviewPosition}
                      onMouseLeave={() => setHoverUrl(null)}
                    >
                      {/* Thumb */}
                      <div
                        className="flex-shrink-0 rounded overflow-hidden border bg-white"
                        style={{ width: 80, height: 112 }}
                      >
                        {url ? (
                          <img
                            src={url}
                            width={80}
                            height={112}
                            style={{ width: 80, height: 112, objectFit: "cover", display: "block" }}
                            alt={r.cardName || r.filename}
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-lg text-gray-400">
                            {icon}
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          <span className="mr-1">{icon}</span>
                          {r.cardName}
                        </div>
                        {r.status === "BABE" && r.cardType && (
                          <div className="text-xs text-gray-500">{r.cardType}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {matchedRows.length === 0 && (
                  <div className="text-xs text-gray-500">No matched cards yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
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
