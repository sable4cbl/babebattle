import type { BabeCard } from "./cards";



export type BabeSource = "play" | "deck" | "discard";



export type TargetDeck =

  | { kind: "none" }

  | { kind: "one-babe"; ofType?: BabeCard["type"]; from?: BabeSource }

  | {

      kind: "many-babes";

      min: number; max: number;

      ofType?: BabeCard["type"];

      distinctTypes?: boolean;

      from?: BabeSource;

    };



export type ScoreOp =

  | { scope: "final"; op: "add"; amount: number }

  | { scope: "final"; op: "mult"; amount: number }

  | { scope: "final"; op: "add-target-base"; multiplier: number; whenOnlyEffectMultiplier?: number }

  // Adds to Final after per-babe sums, once per matching babe
  | {
      scope: "final-per-babe";
      ofType?: BabeCard["type"];
      amount: number;
      // Optional gate: only apply if all played babes this turn are this type
      whenAllPlayedAreType?: BabeCard["type"];
    }

  | {

      scope: "babe";

      appliesTo: "targets" | "all-of-type";

      ofType?: BabeCard["type"];

      op: "add" | "mult";

      amount: number;

    };



export type Requirement =

  | { kind: "only-babe-played"; name: string }

  | { kind: "discard-has-babe"; name: string }

  | { kind: "discard-has-type-at-least"; type: BabeCard["type"]; count: number };



export type LimitMod =

  | { ignoreEffectLimit?: true }

  | { setBabeLimitTo?: number }

  | { extraPlays?: { extraBabes?: number; extraEffects?: number } }

  | { capEffectLimitTo?: number }

  // Optional: restricts what babe type can be played this turn
  | { restrictBabeTypeTo?: BabeCard["type"] }

  // This effect consumes a babe slot (e.g., plays a babe from discard)
  | { consumesBabeSlot?: true }

  // Type-scoped extra babe plays for this turn (in addition to base limit)
  | { extraTypePlays?: { type: BabeCard["type"]; extraBabes: number } };



export type FutureBuff = {

  nextAdd?: number;

  nextMult?: number;

  replayBabeNextTurn?: true;

  ignoreBabeLimitNext?: true;

  // Next turn: allow playing one Effect card twice (UI/turn logic consumes this)
  doublePlayEffectNext?: true;

  // Apply a multiplier to any targeted babe(s) next turn, if played
  targetsNextTurnMult?: number;

  // Carry-over add for turn+2 (used by some signature effects)
  addNextNext?: number;

};



export type OnRemove = { undoDiscardedTargets?: boolean };



export type EffectScript = {

  id: string;

  name: string;

  group: "GENERIC"|"BUSTY"|"BIMBO"|"BADDIE"|"PAWG"|"MILF"|"TRANS"|"SIGNATURE"|string;

  gifName?: string;



  target: TargetDeck;

  score?: ScoreOp[];

  requires?: Requirement[];

  limits?: LimitMod[];

  freeEffect?: boolean;

  future?: FutureBuff;

  onRemove?: OnRemove;

  // Optional flat stroke cost charged immediately when this effect is played
  strokeCost?: number;



  description?: string;

  signatureOf?: string;

};



export type BoundEffect = EffectScript & {

  playId: string;

  boundTargetIds?: string[];

  boundTargetType?: BabeCard["type"];

  boundDiscards?: { source: BabeSource; babeIds: string[] };

  boundPlayedFromDiscard?: string[];

};



export type PendingNext = {

  addNext?: number;

  multNext?: number;

  replayBabeIds?: string[];

  ignoreBabeLimitNext?: boolean;

  // Per-babe multiplier to apply next turn if that babe is played
  babeMultNext?: Record<string, number>;

  // Adds that will become addNext on the following turn
  addNextNext?: number;

  // Source labeling for carry-overs
  addNextSources?: Array<{ name: string; amount: number }>;
  addNextNextSources?: Array<{ name: string; amount: number }>;
  multNextSources?: Array<{ name: string; mult: number }>;

  // Total strokes paid for effects in the previous turn
  effectStrokesLastTurn?: number;

  // Next turn flag: can play one Effect card twice (consumer clears after use)
  doublePlayEffectNext?: boolean;
};



export type Limits = {
  babes: number;
  effects: number;
  ignoreEffectLimit?: boolean;
  restrictBabeTypeTo?: BabeCard["type"];
  extraBabesByType?: Partial<Record<BabeCard["type"], number>>;
};



export type ScoreBreakdown = {

  baseSum: number;

  perBabe: Array<{ id: string; name: string; type: BabeCard["type"]; base: number; delta: number; mult: number; total: number }>;

  finalBefore: number;

  finalAfter: number;

};



export type EngineState = {

  playedBabes: BabeCard[];

  playedEffects: BoundEffect[];

  discardPile: BabeCard[];

  pendingNext?: PendingNext;

  // Optional history across turns: names of babes that have been played this game
  playedHistoryBabeNames?: string[];
};



export type EngineResult = {

  score: ScoreBreakdown;

  limits: Limits;

  nextPending: PendingNext | undefined;

  log: string[];

  overallOps?: OverallOp[];

};



export type OverallOp =

  | { name: string; op: "add"; amount: number }

  | { name: string; op: "mult"; amount: number }

  | { name: string; op: "carry-add"; amount: number }

  | { name: string; op: "carry-mult"; amount: number };

