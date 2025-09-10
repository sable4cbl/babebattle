import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const DB_NAME = "cardtool-gifs";
const STORE = "gifs";

/**
 * Robust normalization:
 * - Unicode NFKC (compatibility normalization)
 * - Replace any whitespace (Unicode), dashes (ASCII/en/em), underscores with a single space
 * - Collapse spaces
 * - Trim
 * - Uppercase
 * - Keep extension, but normalize it to ".GIF"
 */
function normalizeFilenameV2(name: string): string {
  const trimmed = name.normalize("NFKC").trim();

  // split extension once (last dot). if none, treat as ".GIF"
  const lastDot = trimmed.lastIndexOf(".");
  const base = (lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed)
    // replace Unicode spaces, dash punctuation, and underscores with spaces
    // \p{Z} = any separator, \p{Pd} = dash punctuation (en dash, em dash, etc.)
    .replace(/[\p{Z}\p{Pd}_]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const ext = ".GIF";
  return base ? `${base}${ext}` : `UNKNOWN${ext}`;
}

/** Legacy normalization we used earlier (kept for backward-compat lookups). */
function normalizeFilenameLegacy(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

type GifEntry = { key: string; originalKey: string; name: string; blob: Blob };

type GifLibraryValue = {
  ready: boolean;
  version: number;
  putManyGifs: (files: File[]) => Promise<void>;
  clearAll: () => Promise<void>;
  getGifURLByName: (filename: string) => Promise<string | null>;
  // helpers for badges
  makeBabeGifName: (type: string, name: string, override?: string) => string;
  getEffectGifURL: (
    title: string,
    opts?: { performerUpper?: string; typeUpper?: string; override?: string }
  ) => Promise<string | null>;
};

const Ctx = createContext<GifLibraryValue | null>(null);

export function GifLibraryProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // bump version to 3 for schema evolution (still same store, we just change normalization)
    const req = indexedDB.open(DB_NAME, 3);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => setDb(req.result);
    req.onerror = () => console.error("IDB open error", req.error);
  }, []);

  const txPutMany = (entries: GifEntry[]) =>
    new Promise<void>((resolve, reject) => {
      if (!db) return reject(new Error("DB not ready"));
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const e of entries) store.put(e, e.key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

  const txGet = (key: string) =>
    new Promise<GifEntry | undefined>((resolve, reject) => {
      if (!db) return resolve(undefined);
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as GifEntry | undefined);
      req.onerror = () => reject(req.error);
    });

  const value = useMemo<GifLibraryValue>(
    () => ({
      ready: !!db,
      version,

      async putManyGifs(files: File[]) {
        if (!db || files.length === 0) return;
        const gifs = files.filter((f) => /\.gif$/i.test(f.name));
        if (gifs.length === 0) return;

        const entries: GifEntry[] = gifs.map((f) => {
          const original = f.name.trim();
          const keyV2 = normalizeFilenameV2(original);
          return {
            key: keyV2,
            originalKey: original,
            name: original,
            blob: f.slice(0, f.size, "image/gif"),
          };
        });

        await txPutMany(entries);
        setVersion((v) => v + 1);
      },

      async clearAll() {
        if (!db) return;
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE, "readwrite");
          const store = tx.objectStore(STORE);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        setVersion((v) => v + 1);
      },

      async getGifURLByName(filename: string) {
        if (!filename) return null;

        // try V2 normalization first
        const v2 = normalizeFilenameV2(filename);
        let entry = await txGet(v2);

        // fallback to legacy normalization if not found (so old imports still work)
        if (!entry) {
          const legacy = normalizeFilenameLegacy(filename);
          entry = await txGet(legacy);
        }

        if (!entry) return null;
        return URL.createObjectURL(entry.blob);
      },

      makeBabeGifName(type: string, name: string, override?: string) {
        return override || `${type} ${name}.gif`;
      },

      async getEffectGifURL(
        title: string,
        opts?: { performerUpper?: string; typeUpper?: string; override?: string }
      ) {
        // 1) exact override
        if (opts?.override) {
          const hit =
            (await txGet(normalizeFilenameV2(opts.override))) ||
            (await txGet(normalizeFilenameLegacy(opts.override)));
          if (hit) return URL.createObjectURL(hit.blob);
        }

        // Build candidates (we'll normalize each with V2 and legacy when looking up)
        const titleClean = title.trim();
        const candidates: string[] = [];
        if (opts?.performerUpper)
          candidates.push(`EFFECT ${opts.performerUpper.trim()} ${titleClean}.gif`);
        if (opts?.typeUpper) candidates.push(`EFFECT ${opts.typeUpper.trim()} ${titleClean}.gif`);
        candidates.push(`EFFECT ${titleClean}.gif`);

        for (const name of candidates) {
          const hit =
            (await txGet(normalizeFilenameV2(name))) ||
            (await txGet(normalizeFilenameLegacy(name)));
          if (hit) return URL.createObjectURL(hit.blob);
        }
        return null;
      },
    }),
    [db, version]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGifLibrary() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGifLibrary must be used within GifLibraryProvider");
  return ctx;
}
