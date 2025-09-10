import React, { useRef, useState } from "react";
import { useGifLibrary } from "../media/GifLibrary";

export default function GifImportPanel() {
  const { ready, putManyGifs, clearAll } = useGifLibrary();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<number | null>(null);

  const importFiles = async (files: File[]) => {
    setBusy(true);
    try {
      await putManyGifs(files);
      setLast(files.filter((f) => /\.gif$/i.test(f.name)).length);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    await importFiles(files);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    importFiles(Array.from(list));
    e.currentTarget.value = "";
  };

  return (
    <div className="p-3 rounded-xl border bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">GIF Library (local)</div>
        {!ready && <span className="text-xs text-red-600">storage not ready</span>}
      </div>

      <div
        className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-gray-600 hover:bg-gray-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        title="Drop .gif files here"
      >
        Drag & drop <b>.gif</b> files here
      </div>

      <div className="flex gap-2 mt-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".gif"
          style={{ display: "none" }}
          onChange={onFileInput}
        />
        <button
          className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-100"
          onClick={() => inputRef.current?.click()}
        >
          Select GIFs…
        </button>
        <button
          className="text-xs px-3 py-2 rounded-lg border hover:bg-red-50 text-red-600"
          onClick={() => clearAll()}
        >
          Clear Library
        </button>
        {busy && <span className="text-xs text-gray-500">Importing…</span>}
        {!busy && last != null && (
          <span className="text-xs text-green-700">{last} GIF(s) added</span>
        )}
      </div>

      <p className="text-[11px] text-gray-500 mt-2">
        Filenames must match exactly, e.g.{" "}
        <code>BUSTY Lucie Wilde.gif</code>, <code>EFFECT Trifecta.gif</code>, or{" "}
        <code>EFFECT BADDIE Baddie Brigade.gif</code>. Files never leave your device.
      </p>
    </div>
  );
}
