import type {
  BabeType,
  EffectScript,
  BoundTargets,
  EngineDelta,
} from "./effects";

// ---- Core card types ----

export type BabeCard = {
  id: string;
  name: string;
  type: BabeType;
  baseScore: number;
  gifName?: string;
};

// Legacy compatibility aliases (so older components don’t break)
export type EffectCard = EffectScript;

export type PlayedEffect = {
  id: string;              // script id
  script: EffectScript;
  bound: BoundTargets;
  deltas: EngineDelta[];
};

// Some UIs expect a PlayedBabe with a playId separate from id.
// We can map BabeCard -> PlayedBabe in App when passing to those UIs.
export type PlayedBabe = BabeCard & { playId: string };
