// Data-first description of effects the interpreter can run.

export type BabeType = "BADDIE" | "BIMBO" | "BUSTY" | "MILF" | "PAWG" | "TRANS";

export type EffectGroup = "GENERIC" | "SIGNATURE" | BabeType;

export type TargetSelector =
  | { kind: "none" }
  | { kind: "one-babe"; ofType?: BabeType } // pick 1 babe in play
  | {
      kind: "many-babes";
      min: number;
      max: number;
      ofType?: BabeType;
      distinctTypes?: boolean;
    } // pick N babes in play
  | {
      kind: "from-discard";
      min: number;
      max: number;
      ofType?: BabeType;
      action?: "read" | "play"; // "read" (don’t move) vs "play" (move to played)
      ignoreBabeLimit?: boolean;
    } // pick from discard
  | {
      kind: "from-deck";
      min: number;
      max: number;
      ofType?: BabeType;
      distinctTypes?: boolean;
    }; // pick directly from deck

export type ScoreMod =
  | {
      scope: "babe";
      appliesTo: "targets" | "type";
      type?: BabeType;
      op: "add" | "mult";
      amount: number;
    }
  | { scope: "final"; op: "add" | "mult"; amount: number };

export type LimitPatch = Partial<{
  setBabeLimitTo: number;
  extraBabes: number;
  extraEffects: number;
  ignoreBabeLimit: boolean;
  ignoreEffectLimit: boolean;
}>;

export type FutureHook = {
  nextAdd?: number;
  nextMult?: number;
  nextBanEffects?: boolean;
  nextTurnsAdd?: Array<{ turnOffset: 1 | 2 | 3; add: number }>;
};

export type Requirement =
  | { kind: "only-babe-played"; name: string }
  | { kind: "played-has-babe"; name: string }
  | { kind: "discard-has-babe"; name: string }
  | { kind: "min-babes-played"; count: number }
  | { kind: "only-effect-this-turn" };

export type EffectScript = {
  id: string;
  name: string;
  group?: EffectGroup;
  cost?: number; // strokes
  freeEffect?: boolean;
  requires?: Requirement[];
  target: TargetSelector;
  score?: ScoreMod[];
  signatureOf?: string;
  limits?: LimitPatch[];
  future?: FutureHook;
  discardSelectedTargets?: boolean; // if true, move selected targets to discard
  onRemove?: { undoDiscardedTargets?: boolean };
  description?: string;
  gifName?: string;
};

// ---------------- Engine glue ----------------

export type EngineDelta =
  | { t: "add-final"; amount: number }
  | { t: "mult-final"; amount: number }
  | { t: "babe-add"; babeId: string; amount: number }
  | { t: "babe-mult"; babeId: string; amount: number }
  | { t: "discard-babes"; ids: string[] } // from play → discard
  | { t: "discard-from-deck"; ids: string[] } // from deck → discard
  | { t: "play-from-discard"; ids: string[]; ignoreLimit?: boolean } // from discard → played
  | { t: "limit-change"; patch: LimitPatch }
  | { t: "strokes"; change: number }
  | { t: "future-next"; add?: number; mult?: number };

export type BoundTargets = {
  babeIds?: string[];
  discardBabeIds?: string[];
  deckBabeIds?: string[];
};

export type EngineRunResult = {
  deltas: EngineDelta[];
  bound: BoundTargets;
};

export type MinimalBabe = {
  id: string;
  name: string;
  type: BabeType;
  baseScore: number;
};
export type MinimalEffect = { id: string; name: string };

export type MinimalTurnState = {
  playedBabes: MinimalBabe[];
  discardBabes: MinimalBabe[];
  deckBabes: MinimalBabe[];
  strokesThisTurn: number;
  effectsPlayedCount: number;
  limits: {
    babeLimit: number;
    effectLimit: number;
    ignoreBabeLimit?: boolean;
    ignoreEffectLimit?: boolean;
  };
};
