import { useCallback, useMemo, useRef } from "react";
import type { BabeCard } from "../../types/cards";
import type { EffectScript } from "../../types/effects";
import { KNOWN_BABES, KNOWN_EFFECTS } from "../../data/catalog";

export type RowStatus = "BABE" | "EFFECT" | "MISSING";

export type RecapRow = {
  filename: string;
  status: RowStatus;
  cardName?: string;
  cardType?: string;
};

export type Recap = {
  total: number;
  babes: number;
  effects: number;
  byType: Record<string, number>;
  listBabes: BabeCard[];
  listEffects: EffectScript[];
  rows: RecapRow[];
  missing: string[];
  duplicates: string[];
};

export function useDeckImport(files: File[]) {
  const babeByGifRef = useRef<Map<string, BabeCard> | null>(null);
  const effectByGifRef = useRef<Map<string, EffectScript> | null>(null);

  if (!babeByGifRef.current) {
    const m = new Map<string, BabeCard>();
    for (const b of KNOWN_BABES) {
      const key = (b as any).gifName as string | undefined;
      if (key) m.set(key.trim(), b);
    }
    babeByGifRef.current = m;
  }
  if (!effectByGifRef.current) {
    const m = new Map<string, EffectScript>();
    for (const e of KNOWN_EFFECTS) {
      const key = (e as any).gifName as string | undefined;
      if (key) m.set(key.trim(), e);
    }
    effectByGifRef.current = m;
  }

  const uniqueAnalysis = useMemo(() => {
    const seen = new Set<string>();
    const dups = new Set<string>();
    const names: string[] = [];
    const urlMap = new Map<string, string>();
    for (const f of files) {
      const name = f.name.trim();
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
        try { urlMap.set(name, URL.createObjectURL(f)); } catch {}
      } else {
        dups.add(name);
      }
    }
    return {
      uniqueNames: names,
      duplicates: Array.from(dups),
      fileUrlMap: urlMap,
    };
  }, [files]);

  const revokeUrls = useCallback((urls: Iterable<string>) => {
    for (const u of urls) {
      try { URL.revokeObjectURL(u); } catch {}
    }
  }, []);

  const gifKey = (card: BabeCard | EffectScript): string => {
    const gn = (card as any).gifName as string | undefined;
    if (gn && gn.trim().length > 0) return gn.trim();
    if ((card as BabeCard).type) {
      const b = card as BabeCard;
      return `${b.type} ${b.name}.gif`;
    }
    return `EFFECT ${(card as EffectScript).name}.gif`;
  };

  const matchAndSummarize = useMemo(() => {
    const { uniqueNames } = uniqueAnalysis;
    const babeByGif = babeByGifRef.current!;
    const effectByGif = effectByGifRef.current!;
    const babes: BabeCard[] = [];
    const effects: EffectScript[] = [];
    const seenCardGif = new Set<string>();
    const rows: RecapRow[] = [];
    const missing: string[] = [];

    for (const name of uniqueNames) {
      const b = babeByGif.get(name);
      const e = effectByGif.get(name);
      if (b) {
        const key = gifKey(b);
        if (!seenCardGif.has(key)) {
          babes.push(b);
          seenCardGif.add(key);
        }
        rows.push({ filename: name, status: "BABE", cardName: b.name, cardType: (b as any).type });
      } else if (e) {
        const key = gifKey(e);
        if (!seenCardGif.has(key)) {
          effects.push(e);
          seenCardGif.add(key);
        }
        rows.push({ filename: name, status: "EFFECT", cardName: e.name });
      } else {
        rows.push({ filename: name, status: "MISSING" });
        missing.push(name);
      }
    }

    const byType: Record<string, number> = {};
    for (const b of babes) {
      const t = (b as any).type as string;
      byType[t] = (byType[t] || 0) + 1;
    }

    const recap: Recap = {
      total: babes.length + effects.length,
      babes: babes.length,
      effects: effects.length,
      byType,
      listBabes: babes,
      listEffects: effects,
      rows,
      missing,
      duplicates: uniqueAnalysis.duplicates,
    };
    return recap;
  }, [uniqueAnalysis]);

  return {
    uniqueNames: uniqueAnalysis.uniqueNames,
    duplicates: uniqueAnalysis.duplicates,
    fileUrlMap: uniqueAnalysis.fileUrlMap,
    revokeUrls,
    recap: matchAndSummarize,
  };
}
