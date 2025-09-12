import React, { createContext, useContext, useMemo, useRef, useState } from "react";

/**
 * GIF Library
 * - Stores selected files as object URLs.
 * - Provides tolerant lookups by exact filename and a normalized key.
 * - Exposes both the new API (getBabeURL / getEffectURL) and
 *   compatibility shims used by older components (clearAll, knownCount, getUrl).
 */

type Url = string;

type ExactMap = Map<string, Url>;
type NormMap = Map<string, Url>;

export type GifLibraryValue = {
  // Core API
  addFiles: (files: FileList | File[]) => Promise<void>;
  getGifURLByName: (name: string) => string | null;

  makeBabeGifName: (type: string, name: string) => string;
  makeEffectGifName: (group: string, name: string, signatureOf?: string) => string;

  getBabeURL: (b: { type: string; name: string; gifName?: string }) => string | null;
  getEffectURL: (e: { group: string; name: string; gifName?: string; signatureOf?: string }) => string | null;

  // State
  count: number;

  // --- Compatibility shims (so existing components keep working) ---
  clearAll: () => void;               // old: reset the library when a new selection is made
  knownCount: number;                 // old alias for 'count'
  getUrl: (name: string) => string | null; // old alias for getGifURLByName
};

const GifLibraryCtx = createContext<GifLibraryValue | null>(null);

export function useGifLibrary() {
  const ctx = useContext(GifLibraryCtx);
  if (!ctx) throw new Error("GifLibraryProvider missing in tree");
  return ctx;
}

// ---------------- helpers ----------------

function normKey(s: string): string {
  // drop common extensions, lowercase, collapse spaces, strip some punctuation
  const noExt = s.replace(/\.(gif|webp|png|jpg|jpeg)$/i, "");
  return noExt
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/[:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------- provider ----------------

export function GifLibraryProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const exactMapRef = useRef<ExactMap>(new Map());
  const normMapRef = useRef<NormMap>(new Map());
  const urlsRef = useRef<string[]>([]); // keep to revoke on clear

  const clearAll = () => {
    // Revoke previous object URLs to avoid leaks
    for (const u of urlsRef.current) {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    }
    urlsRef.current = [];
    exactMapRef.current.clear();
    normMapRef.current.clear();
    setCount(0);
  };

  const addFiles = async (filesLike: FileList | File[]) => {
    const files: File[] = Array.from(filesLike as any);
    for (const f of files) {
      const url = URL.createObjectURL(f);
      urlsRef.current.push(url);

      const exactKey = f.name;
      const nkey = normKey(f.name);

      exactMapRef.current.set(exactKey, url);
      if (!normMapRef.current.has(nkey)) normMapRef.current.set(nkey, url);
    }
    setCount(exactMapRef.current.size);
  };

  const getGifURLByName = (name: string): string | null => {
    if (!name) return null;
    const ex = exactMapRef.current.get(name);
    if (ex) return ex;
    const n = normMapRef.current.get(normKey(name));
    return n ?? null;
  };

  const makeBabeGifName = (type: string, name: string) => `${type} ${name}.gif`;

  const makeEffectGifName = (group: string, name: string, signatureOf?: string) => {
    if (group?.toUpperCase() === "SIGNATURE" && signatureOf) {
      return `EFFECT ${signatureOf} ${name}.gif`;
    }
    return group ? `EFFECT ${group} ${name}.gif` : `EFFECT ${name}.gif`;
  };

  const getBabeURL = (b: { type: string; name: string; gifName?: string }) => {
    const candidates: string[] = [];
    if (b.gifName) candidates.push(b.gifName);
    candidates.push(makeBabeGifName(b.type, b.name));

    const clean = b.name.replace(/[:]/g, "").replace(/\s+/g, " ").trim();
    candidates.push(`${b.type} ${clean}.gif`);

    for (const c of candidates) {
      const url = getGifURLByName(c);
      if (url) return url;
    }
    return null;
  };

  const getEffectURL = (e: { group: string; name: string; gifName?: string; signatureOf?: string }) => {
    const candidates: string[] = [];
    if (e.gifName) candidates.push(e.gifName);

    candidates.push(makeEffectGifName(e.group, e.name, e.signatureOf));

    const clean = e.name.replace(/[:]/g, "").replace(/\s+/g, " ").trim();

    if (e.group?.toUpperCase() === "SIGNATURE" && e.signatureOf) {
      candidates.push(`EFFECT ${e.signatureOf} ${clean}.gif`);
      candidates.push(`EFFECT ${e.signatureOf.toUpperCase()} ${clean}.gif`);
    }

    if (e.group) {
      candidates.push(`EFFECT ${e.group} ${e.name}.gif`);
      candidates.push(`EFFECT ${e.group} ${clean}.gif`);
      candidates.push(`EFFECT ${e.group.toUpperCase()} ${clean}.gif`);
    }

    candidates.push(`EFFECT ${e.name}.gif`);
    candidates.push(`EFFECT ${clean}.gif`);

    const tried = new Set<string>();
    for (const c of candidates) {
      if (tried.has(c)) continue;
      tried.add(c);
      const url = getGifURLByName(c);
      if (url) return url;
    }
    return null;
  };

  const value: GifLibraryValue = useMemo(
    () => ({
      // core
      addFiles,
      getGifURLByName,
      makeBabeGifName,
      makeEffectGifName,
      getBabeURL,
      getEffectURL,
      count,

      // shims
      clearAll,
      knownCount: count,
      getUrl: getGifURLByName,
    }),
    [count]
  );

  return <GifLibraryCtx.Provider value={value}>{children}</GifLibraryCtx.Provider>;
}
