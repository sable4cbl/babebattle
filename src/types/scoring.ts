export type Limits = { babes: number; effects: number };

export type Resolution = {
  finalScore: number;
  mutatedSum: number;
  baseSum: number;
  log: string[];
  updatedLimits: Limits;
  babeScores: Map<string, number>;
};
