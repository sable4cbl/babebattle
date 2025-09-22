import type { EffectScript } from "../../types/effects";
import { uid } from "../../utils/uid";
import { stubEffect } from "./helpers";

const implemented: EffectScript[] = [
  {
    id: uid(),
    name: "Babe Swap",
    group: "GENERIC",
    target: { kind: "one-babe", from: "discard" },
    description:
      "Discard 1 Babe from your Deck. Choose 1 Babe from your Discard; add her to your Deck.",
    gifName: "EFFECT Babe Swap.gif",
  },
  {
    id: uid(),
    name: "69",
    group: "GENERIC",
    target: { kind: "many-babes", min: 1, max: 3, from: "deck" },
    description:
      "Discard up to 3 Babes whose Base Score is 6. Add 9 Score for each one. You can pay 69 Strokes and triple the Final Score.",
    gifName: "EFFECT 69.gif",
  },
  {
    id: uid(),
    name: "7 Sins Lust",
    group: "GENERIC",
    target: { kind: "one-babe", from: "discard" },
    description:
      "Pay 15 Strokes and choose 1 Babe with a Base Score of 7 from the Discard Pile; play her this turn, ignoring Babe Limit, and triple her Base Score.",
    gifName: "EFFECT 7 Sins Lust.gif",
    score: [
      { scope: "babe", appliesTo: "targets", op: "mult", amount: 3 },
    ],
  },
  {
    id: uid(),
    name: "Pumping Frenzy",
    group: "GENERIC",
    target: { kind: "none" },
    description: "Triple the Final Score.",
    gifName: "EFFECT Pumping Frenzy.gif",
    score: [
      { scope: "final", op: "mult", amount: 3 },
    ],
  },
];

const names = [
  "7 Sins Envy",
  "7 Sins Gluttony",
  "7 Sins Greed",
  "7 Sins Pride",
  "7 Sins Sloth",
  "7 Sins Wrath",
  "All Tied Up",
  "Bad Girl",
  "Blowjob Bribe",
  "Cant Hold Em",
  "Censored",
  "Cheating Wife",
  "Close Bond",
  "Cucked",
  "Deep Throat",
  "Dont Tell My BF",
  "Dry Humping",
  "Escort",
  "Fetish Fun",
  "Girls Night",
  "Good Girl",
  "Gooning Sesh",
  "Hard To Swallow",
  "Hate Fuck",
  "Heated Workout",
  "Jerk It Now!",
  "JOI",
  "Live On The Edge",
  "Maid Useful",
  "Not My Type",
  "Overload",
  "Overworked",
  "Pay Me More!",
  "Porn Addict",
  "Pump Action",
  "Ready For Use",
  "Seductress",
  "Semen Extraction",
  "Side Chick",
  "Sloppy Toppy",
  "Stress Relief",
  "Subby Service",
  "Suck You Later",
  "Swinger Club",
  "The Number Of The Beast",
  "Too Hot To Handle",
  "Trifecta",
  "Triple Team",
  "Trophy Wife",
  "Two Hander",
  "Unload",
];

export const GENERIC_EFFECTS: EffectScript[] = [
  ...implemented,
  ...names.map((name) => stubEffect("GENERIC", name, `EFFECT ${name}.gif`)),
];
