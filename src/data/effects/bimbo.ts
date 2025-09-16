import type { EffectScript } from "../../types/effects";
import { uid } from "../../utils/uid";
import { stubEffect } from "./helpers";

const implemented: EffectScript[] = [
  {
    id: uid(),
    name: "Bimbo Negotiations",
    group: "BIMBO",
    target: { kind: "none" },
    score: [{ scope: "final", op: "mult", amount: 2 }],
    description:
      "Add 3 BIMBOS from your Deck and/or Discard Pile to your Opponent's Deck and double the Final Score.",
    gifName: "EFFECT BIMBO Bimbo Negotiations.gif",
  },
  {
    id: uid(),
    name: "Bimbo Party",
    group: "BIMBO",
    target: { kind: "none" },
    score: [{ scope: "final-per-babe", ofType: "BIMBO", amount: 5 }],
    description: "Add 5 Score for each BIMBO you played this turn.",
    gifName: "EFFECT BIMBO Bimbo Party.gif",
  },
];

const stubNames = [
  "Bimbo Boob Bounce",
  "Bimbofication",
  "Cock Trap",
  "Fake Tits",
  "Lush Lips",
  "Marked",
  "Mindless Mode",
  "Play With Me!",
  "Size Queen",
  "Yummy Cummy",
];

export const BIMBO_EFFECTS: EffectScript[] = [
  ...implemented,
  ...stubNames.map((name) => stubEffect("BIMBO", name, `EFFECT BIMBO ${name}.gif`)),
];

