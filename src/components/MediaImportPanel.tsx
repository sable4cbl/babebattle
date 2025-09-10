import React, { useCallback, useRef, useState } from "react";
import { useMedia } from "../media/MediaContext";

export default function MediaImportPanel() {
  const { ready, putMany, clearAll } = useMedia();
  const [busy, setBusy] = useState(false);
  const [lastCount, setLastCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      await putMany(Array.from(files));
      setLastCount(files.length);
    } finally {
      setBusy(false);
    }
  }, [putMany]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    const items = dt.items;
    // Chrome/Safari allow directory drop via webkitGetAsEntry
    const filePromises: Promise<File[]>[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const entry = (it as any).webkitGetAsEntry?.();
      if (entry && entry.isDirectory) {
        filePromises.push(readDirectory(entry));
      } else {
        const f = it.getAsFile();
        if (f) filePromises.push(Promise.resolve([f]));
      }
    }
    setBusy(true);
    Promise.all(filePromises).then(async (parts) => {
      const all = parts.flat();
      await putMany(all);
      setLastCount(all.length);
      setBusy(false);
    }).catch(() => setBusy(false));
  };

  const handleBrowse = () => {
    inputRef.current?.click();
  };

  return (
    <div className="p-3 rounded-xl border bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Media Library (local)</div>
        {!ready && <span className="text-xs text-red-600">storage not ready</span>}
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-gray-600 hover:bg-gray-50"
        title="Drop files or folders here"
      >
        Drag & drop files or folders here
      </div>

      <div className="flex gap-2 mt-3">
        {/* Folder picker (Chrome/Edge): */}
        <input
          ref={inputRef}
          type="file"
          multiple
          // @ts-ignore – non-standard but widely supported
          webkitdirectory="true"
          style={{ display: "none" }}
          onChange={(e) => onFiles(e.target.files)}
        />
        <button className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-100" onClick={handleBrowse}>
          Select Folder…
        </button>
        <button className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-100" onClick={() => onFiles(promptForFiles())}>
          Select Files…
        </button>
        <button className="text-xs px-3 py-2 rounded-lg border hover:bg-red-50 text-red-600" onClick={() => clearAll()}>
          Clear Library
        </button>
        {busy && <span className="text-xs text-gray-500">Importing…</span>}
        {lastCount != null && !busy && <span className="text-xs text-green-700">{lastCount} file(s) added</span>}
      </div>

      <p className="text-[11px] text-gray-500 mt-2">
        Filenames must match your rules, e.g. <code>BADDIE Elsa Jean.gif</code>, <code>EFFECT Trifecta.webm</code>, or <code>EFFECT ELSA JEAN Jeanie Wishes.mp4</code>.
        Nothing is uploaded; files are stored locally in your browser.
      </p>
    </div>
  );
}

// Helpers
function promptForFiles(): FileList | null {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  return new Promise<FileList | null>((resolve) => {
    input.onchange = () => resolve(input.files);
    input.click();
  }) as unknown as FileList;
}

function readDirectory(dirEntry: any): Promise<File[]> {
  return new Promise((resolve) => {
    const reader = dirEntry.createReader();
    const out: File[] = [];
    const readBatch = () => {
      reader.readEntries(async (entries: any[]) => {
        if (entries.length === 0) return resolve(out);
        for (const entry of entries) {
          if (entry.isFile) {
            await new Promise<void>((res) =>
              entry.file((f: File) => { out.push(f); res(); })
            );
          } else if (entry.isDirectory) {
            const nested = await readDirectory(entry);
            out.push(...nested);
          }
        }
        readBatch();
      });
    };
    readBatch();
  });
}
