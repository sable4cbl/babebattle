import React, { createContext, useContext, useMemo, useRef, useState } from "react";

/**
 * Very lightweight in-memory GIF library:
 * - Stores File -> objectURL map
 * - Provides babe/effect URL resolvers with robust normalization
 * - Exposes debug utilities so you can see what was attempted
 */

type FileMap = Map<string, string>; // filename -> objectURL

type GetBabeURLParams = {
  type?: string;
  name?: string;
  gifName?: string; // explicit override
};

type GetEffectURLParams = {
  group?: string;       // e.g. "BADDIE", "GENERIC", "SIGNATURE"
  name?: string;        // e.g. "Collab"
  gifName?: string;     // explicit override
  signatureOf?: string; // e.g. "ALICE DELISH" (for SIGNATURE)
};

type DebugReport = {
  availableKeys: string[];
  triedKeys: string[];
  matchedKey?: string;
};

export type GifLibraryValue = {
  addFiles: (files: File[]) => void;
  clearAll: () => void;
  knownCount: number;

  // raw access
  getUrl: (filename: string) => string | undefined;

  // domain-aware access
  getBabeURL: (p: GetBabeURLParams) => string | undefined;
  getEffectURL: (p: GetEffectURLParams) => string | undefined;

  // debug helpers
  debugEffectLookup: (p: GetEffectURLParams) => DebugReport;
  debugBabeLookup: (p: GetBabeURLParams) => DebugReport;
};

const GifLibraryCtx = createContext<GifLibraryValue | null>(null);

function normalizeFilename(s: string): string {
  // Lowercase, collapse spaces/underscores, remove duplicate dashes,
  // unify "gold" vs "GOLD", strip exotic punctuation
  return s
    .toLowerCase()
    .replace(/\.(gif|webp|png|jpg|jpeg)$/i, ".gif")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[’'`"]/g, "")         // quotes
    .replace(/[:;,!?()]/g, "")      // punctuation
    .replace(/\s*-\s*/g, " ")       // hyphen spacing
    .replace(/\s+/g, " ")
    .trim();
}

function allVariants(base: string): string[] {
  // produce simple permutations: collapse consecutive spaces, with/without "gold"
  const b = normalizeFilename(base);
  const variants = new Set<string>();
  variants.add(b);
  variants.add(b.replace(/\bgold\b/g, "gold"));
  variants.add(b.replace(/\bgold\b/g, " gold"));
  variants.add(b.replace(/\s+/g, " "));
  return Array.from(variants);
}

function effectCandidateNames(p: GetEffectURLParams): string[] {
  const group = (p.group ?? "").trim();
  const name = (p.name ?? "").trim();
  const sig  = (p.signatureOf ?? "").trim();

  const raw: string[] = [];

  // 1) Explicit gifName has priority
  if (p.gifName && p.gifName.trim()) raw.push(p.gifName.trim());

  // 2) Canonical patterns
  if (group && name)      raw.push(`EFFECT ${group} ${name}.gif`);
  if (sig && name)        raw.push(`EFFECT ${sig} ${name}.gif`);
  if (name && !group && !sig) raw.push(`EFFECT ${name}.gif`);

  // 3) Looser variants (remove extra punctuation already done in normalize)
  return raw.flatMap(allVariants);
}

function babeCandidateNames(p: GetBabeURLParams): string[] {
  const type = (p.type ?? "").trim();
  const name = (p.name ?? "").trim();

  const raw: string[] = [];

  if (p.gifName && p.gifName.trim()) raw.push(p.gifName.trim());
  if (type && name) raw.push(`${type} ${name}.gif`);
  if (name && !type) raw.push(`${name}.gif`);

  return raw.flatMap(allVariants);
}

export function GifLibraryProvider({ children }: { children: React.ReactNode }) {
  const filesRef = useRef<FileMap>(new Map());
  const [version, setVersion] = useState(0); // bump to trigger renders

  function addFiles(files: File[]) {
    for (const f of files) {
      const key = normalizeFilename(f.name);
      const prev = filesRef.current.get(key);
      if (prev) URL.revokeObjectURL(prev);
      const url = URL.createObjectURL(f);
      filesRef.current.set(key, url);
    }
    setVersion((v) => v + 1);
  }

  function clearAll() {
    for (const [, url] of filesRef.current) URL.revokeObjectURL(url);
    filesRef.current.clear();
    setVersion((v) => v + 1);
  }

  function getUrl(filename: string): string | undefined {
    if (!filename) return undefined;
    const key = normalizeFilename(filename);
    return filesRef.current.get(key);
  }

  function tryKeys(candidates: string[]): { url?: string; matchedKey?: string; tried: string[] } {
    const tried: string[] = [];
    for (const c of candidates) {
      const k = normalizeFilename(c);
      tried.push(k);
      const url = filesRef.current.get(k);
      if (url) return { url, matchedKey: k, tried };
    }
    return { tried };
  }

  function getEffectURL(p: GetEffectURLParams): string | undefined {
    const candidates = effectCandidateNames(p);
    const { url } = tryKeys(candidates);
    return url;
  }

  function getBabeURL(p: GetBabeURLParams): string | undefined {
    const candidates = babeCandidateNames(p);
    const { url } = tryKeys(candidates);
    return url;
  }

  function debugEffectLookup(p: GetEffectURLParams): DebugReport {
    const candidates = effectCandidateNames(p);
    const { url, matchedKey, tried } = tryKeys(candidates);
    return {
      availableKeys: Array.from(filesRef.current.keys()).sort(),
      triedKeys: tried,
      matchedKey: url ? matchedKey : undefined,
    };
  }

  function debugBabeLookup(p: GetBabeURLParams): DebugReport {
    const candidates = babeCandidateNames(p);
    const { url, matchedKey, tried } = tryKeys(candidates);
    return {
      availableKeys: Array.from(filesRef.current.keys()).sort(),
      triedKeys: tried,
      matchedKey: url ? matchedKey : undefined,
    };
  }

  const value: GifLibraryValue = useMemo(
    () => ({
      addFiles,
      clearAll,
      knownCount: filesRef.current.size,
      getUrl,
      getBabeURL,
      getEffectURL,
      debugEffectLookup,
      debugBabeLookup,
    }),
    [version]
  );

  return <GifLibraryCtx.Provider value={value}>{children}</GifLibraryCtx.Provider>;
}

export function useGifLibrary(): GifLibraryValue {
  const ctx = useContext(GifLibraryCtx);
  if (!ctx) throw new Error("GifLibraryProvider missing in tree");
  return ctx;
}
