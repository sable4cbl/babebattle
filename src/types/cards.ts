export type BabeType = "Rock" | "Pop" | "Indie" | "Electro" | "Any" | string;

export type BabeCard = {
  id: string;
  name: string;
  type: BabeType;
  baseScore: number;
  img?: string;
};

export type EffectKind =
  | "multiply-babe"
  | "multiply-type"
  | "multiply-all"
  | "add-final"
  | "multiply-final"
  | "extra-plays"
  | "discard-babes-add-final"; // NEW

export type EffectCard = {
  id: string;
  name: string;
  description?: string;
  kind: EffectKind;
  factor?: number;           // for multiply-* / multiply-final
  add?: number;              // for add-final
  targetBabeId?: string;     // for multiply-babe
  targetType?: BabeType;     // for multiply-type

  // For extra-plays
  extraBabes?: number;
  extraEffects?: number;

  // NEW: for discard-babes-add-final
  discardCount?: number;     // how many babes must be discarded
  discardType?: BabeType;    // optional filter (e.g., "Pop")
};

export type PlayedBabe = BabeCard & { playId: string };

// Snapshot of a discarded-from-deck babe bound to an effect
export type BoundDiscard = { id: string; name: string; baseScore: number; type: BabeType };

export type PlayedEffect = EffectCard & {
  playId: string;

  boundTargetBabeId?: string;
  boundTargetType?: BabeType;

  // NEW: the babes discarded from the deck for this effect
  boundDiscards?: BoundDiscard[];
};
