import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Simple IDB via dynamic import (so we don’t add a new dep). You can replace with idb-keyval later if you want.
const DB_NAME = "cardtool-media";
const STORE = "files";

type FileEntry = { key: string; name: string; type: string; blob: Blob };

type MediaContextValue = {
  ready: boolean;
  putMany: (files: File[]) => Promise<void>;
  clearAll: () => Promise<void>;
  // lookup helpers
  getURLByKey: (key: string) => Promise<string | null>;
  getURLForBabe: (type: string, name: string, filename?: string) => Promise<string | null>;
  getURLForEffect: (title: string, performerUpper?: string, filename?: string) => Promise<string | null>;
};

const MediaCtx = createContext<MediaContextValue | null>(null);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => setDb(req.result);
    req.onerror = () => console.error("IDB open error", req.error);
  }, []);

  const txPut = (entries: FileEntry[]) =>
    new Promise<void>((resolve, reject) => {
      if (!db) return reject(new Error("DB not ready"));
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      entries.forEach((e) => store.put(e, e.key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

  const txGet = (key: string) =>
    new Promise<FileEntry | undefined>((resolve, reject) => {
      if (!db) return resolve(undefined);
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as FileEntry | undefined);
      req.onerror = () => reject(req.error);
    });

  const txClear = () =>
    new Promise<void>((resolve, reject) => {
      if (!db) return resolve();
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

  const value = useMemo<MediaContextValue>(
    () => ({
      ready: !!db,
      putMany: async (files: File[]) => {
        if (!db || files.length === 0) return;
        // Normalize to our lookup keys
        const entries: FileEntry[] = await Promise.all(
          files.map(async (f) => {
            const blob = f.slice(0, f.size, f.type || "application/octet-stream");
            const name = f.name.trim();
            const key = name.toUpperCase(); // simple case-insensitive key
            return { key, name, type: f.type || "application/octet-stream", blob };
          })
        );
        await txPut(entries);
      },
      clearAll: async () => { await txClear(); },
      getURLByKey: async (key: string) => {
        const entry = await txGet(key.toUpperCase());
        if (!entry) return null;
        return URL.createObjectURL(entry.blob);
      },
      // Babe: prefer explicit filename; else fall back to "TYPE Name.ext" unknown extension matching
      getURLForBabe: async (type: string, name: string, filename?: string) => {
        if (filename) {
          const direct = await txGet(filename.toUpperCase());
          if (direct) return URL.createObjectURL(direct.blob);
        }
        // try any media extension with "TYPE Name"
        const base = `${type.trim().toUpperCase()} ${name.trim().toUpperCase()}`;
        const exts = [".MP4",".WEBM",".GIF",".WEBP",".JPG",".JPEG",".PNG"];
        for (const ext of exts) {
          const url = await (async () => {
            const e = await txGet(base + ext);
            return e ? URL.createObjectURL(e.blob) : null;
          })();
          if (url) return url;
        }
        return null;
      },
      // Effect: patterns: "EFFECT Trifecta.ext" or "EFFECT ELSA JEAN Jeanie Wishes.ext"
      getURLForEffect: async (title: string, performerUpper?: string, filename?: string) => {
        if (filename) {
          const direct = await txGet(filename.toUpperCase());
          if (direct) return URL.createObjectURL(direct.blob);
        }
        const cleanTitle = title.trim().toUpperCase();
        const bases = performerUpper
          ? [`EFFECT ${performerUpper} ${cleanTitle}`, `EFFECT ${cleanTitle}`]
          : [`EFFECT ${cleanTitle}`];
        const exts = [".MP4",".WEBM",".GIF",".WEBP",".JPG",".JPEG",".PNG"];
        for (const base of bases) {
          for (const ext of exts) {
            const e = await txGet(base + ext);
            if (e) return URL.createObjectURL(e.blob);
          }
        }
        return null;
      },
    }),
    [db]
  );

  return <MediaCtx.Provider value={value}>{children}</MediaCtx.Provider>;
}

export function useMedia() {
  const ctx = useContext(MediaCtx);
  if (!ctx) throw new Error("useMedia must be used within MediaProvider");
  return ctx;
}
