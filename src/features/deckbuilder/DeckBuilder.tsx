import React, { useMemo, useState } from "react";
import type { BabeCard } from "../../types/cards";
import type { EffectScript } from "../../types/effects";
import { useDeckImport } from "../../components/import/useDeckImport";
import { useGifLibrary } from "../../media/GifLibrary";
import DeckRulesBar from "./DeckRulesBar";
import DeckPool from "./DeckPool";
import DeckArea from "./DeckArea";
import UnmatchedBox from "./UnmatchedBox";

type DeckEntry = { kind: "babe" | "effect"; id: string; t: number };

type Props = {
  onImported: (deck: { babes: BabeCard[]; effects: EffectScript[] }) => void;
};

function canonicalBabeName(name: string): string {
  return name
    .replace(/\s*\(.*?\)\s*$/i, "")
    .replace(/\s+gold\b/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export default function DeckBuilder({ onImported }: Props) {
  const gifLib = useGifLibrary();
  const [files, setFiles] = useState<File[]>([]);

  const [babeQuery, setBabeQuery] = useState("");
  const [effectQuery, setEffectQuery] = useState("");
  const [babeCompact, setBabeCompact] = useState(false);
  const [effectCompact, setEffectCompact] = useState(false);

  const [selBabes, setSelBabes] = useState<BabeCard[]>([]);
  const [selEffects, setSelEffects] = useState<EffectScript[]>([]);
  const [order, setOrder] = useState<DeckEntry[]>([]);

  const { recap, duplicates } = useDeckImport(files);

  const poolBabes = recap?.listBabes ?? [];
  const poolEffects = recap?.listEffects ?? [];

  // Unmatched files (filename + preview URL from gif library)
  const unmatched = useMemo(() => {
    const names = recap?.missing ?? [];
    return names.map((filename) => ({ filename, url: gifLib.getUrl(filename) }));
  }, [recap, gifLib]);

  const selectedBabeIds = useMemo(() => new Set(selBabes.map(b => b.id)), [selBabes]);
  const selectedEffectIds = useMemo(() => new Set(selEffects.map(e => e.id)), [selEffects]);

  const addBabe = (b: BabeCard) => {
    setSelBabes(prev => (prev.some(x => x.id === b.id) ? prev : [...prev, b]));
    setOrder(prev => [...prev, { kind: "babe", id: b.id, t: Date.now() + Math.random() }]);
  };
  const addEffect = (e: EffectScript) => {
    setSelEffects(prev => (prev.some(x => x.id === e.id) ? prev : [...prev, e]));
    setOrder(prev => [...prev, { kind: "effect", id: e.id, t: Date.now() + Math.random() }]);
  };
  const removeBabe = (id: string) => {
    setSelBabes(prev => prev.filter(b => b.id !== id));
    setOrder(prev => prev.filter(en => !(en.kind === "babe" && en.id === id)));
  };
  const removeEffect = (id: string) => {
    setSelEffects(prev => prev.filter(e => e.id !== id));
    setOrder(prev => prev.filter(en => !(en.kind === "effect" && en.id === id)));
  };

  const addAllBabesOfType = (type: string, visible: BabeCard[]) => {
    const add = visible.filter(b => b.type === type && !selectedBabeIds.has(b.id));
    if (!add.length) return;
    setSelBabes(prev => [...prev, ...add]);
    setOrder(prev => [...prev, ...add.map(b => ({ kind: "babe" as const, id: b.id, t: Date.now() + Math.random() }))]);
  };
  const addAllEffectsOfGroup = (group: string, visible: EffectScript[]) => {
    const add = visible.filter(e => String(e.group || "") === group && !selectedEffectIds.has(e.id));
    if (!add.length) return;
    setSelEffects(prev => [...prev, ...add]);
    setOrder(prev => [...prev, ...add.map(e => ({ kind: "effect" as const, id: e.id, t: Date.now() + Math.random() }))]);
  };

  const deckCounts = useMemo(() => {
    const byType = new Map<string, number>();
    for (const b of selBabes) byType.set(b.type, (byType.get(b.type) || 0) + 1);
    return {
      total: selBabes.length + selEffects.length,
      babes: selBabes.length,
      effects: selEffects.length,
      byType,
    };
  }, [selBabes, selEffects]);

  const duplicateNames = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of selBabes) {
      const key = canonicalBabeName(b.name);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).filter(([, n]) => n > 1).map(([n]) => n);
  }, [selBabes]);

  const isValid = useMemo(() => {
    const totalOk = deckCounts.total >= 30 && deckCounts.total <= 40;
    const babeOk = deckCounts.babes >= 15;
    const noDupNames = duplicateNames.length === 0;
    return totalOk && babeOk && noDupNames;
  }, [deckCounts, duplicateNames]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    gifLib.clearAll();
    if (picked.length) gifLib.addFiles(picked);
    setFiles(picked);
  }

  const visibleBabes = useMemo(() => {
    const q = babeQuery.trim().toLowerCase();
    let arr = poolBabes.filter(b => !selectedBabeIds.has(b.id));
    if (q) arr = arr.filter(b => b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q));
    return arr;
  }, [babeQuery, poolBabes, selectedBabeIds]);

  const visibleEffects = useMemo(() => {
    const q = effectQuery.trim().toLowerCase();
    let arr = poolEffects.filter(e => !selectedEffectIds.has(e.id));
    if (q) arr = arr.filter(e => e.name.toLowerCase().includes(q) || String(e.group || "").toLowerCase().includes(q));
    return arr;
  }, [effectQuery, poolEffects, selectedEffectIds]);

  const deckItems = useMemo(() => {
    const bm = new Map(selBabes.map(b => [b.id, b]));
    const em = new Map(selEffects.map(e => [e.id, e]));
    return order
      .map(en =>
        en.kind === "babe"
          ? (bm.get(en.id) ? { key: `b-${en.id}`, kind: "babe" as const, b: bm.get(en.id)! } : null)
          : (em.get(en.id) ? { key: `e-${en.id}`, kind: "effect" as const, e: em.get(en.id)! } : null)
      )
      .filter(Boolean) as Array<{ key: string; kind: "babe"; b: BabeCard } | { key: string; kind: "effect"; e: EffectScript }>;
  }, [order, selBabes, selEffects]);

  return (
    <div className="w-full p-4 space-y-4">
      <div className="bg-white/80 backdrop-blur border rounded-xl p-3 shadow">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm font-medium">Import GIFs:</div>
          <input type="file" accept=".gif" multiple onChange={onPickFiles} className="text-sm" />
          <div className="text-xs text-gray-600">Loaded into library: <b>{gifLib.knownCount}</b></div>
        </div>

        <DeckRulesBar
          total={deckCounts.total}
          babes={deckCounts.babes}
          effects={deckCounts.effects}
          byType={deckCounts.byType}
          duplicateNames={duplicateNames}
          duplicatesFromImport={duplicates}
          isValid={isValid}
          onPlay={() => isValid && onImported({ babes: selBabes, effects: selEffects })}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Babe pool */}
        <DeckPool
          title="Babes"
          kind="babe"
          poolBabes={visibleBabes}
          poolEffects={[]}
          compact={babeCompact}
          setCompact={setBabeCompact}
          search={babeQuery}
          setSearch={setBabeQuery}
          onAddBabe={addBabe}
          onAddEffect={undefined}
          onAddAll={(key, list) => addAllBabesOfType(key, list as BabeCard[])}
        />

        {/* Center column: Unmatched on top, then Deck */}
        <div className="flex flex-col gap-4">
          <UnmatchedBox items={unmatched} />
          <DeckArea
            items={deckItems}
            onRemoveBabe={removeBabe}
            onRemoveEffect={removeEffect}
          />
        </div>

        {/* Right: Effect pool */}
        <DeckPool
          title="Effects"
          kind="effect"
          poolBabes={[]}
          poolEffects={visibleEffects}
          compact={effectCompact}
          setCompact={setEffectCompact}
          search={effectQuery}
          setSearch={setEffectQuery}
          onAddBabe={undefined}
          onAddEffect={addEffect}
          onAddAll={(key, list) => addAllEffectsOfGroup(key, list as EffectScript[])}
        />
      </div>
    </div>
  );
}
