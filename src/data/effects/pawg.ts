import type { EffectScript } from "../../types/effects";
import { stubEffect } from "./helpers";

const names = [
  "Assquake",
  "Booty Call",
  "Bubble Butt",
  "Dummy Thicc",
  "Extra Thicc",
  "Flare Pants",
  "Surprise Package",
];

export const PAWG_EFFECTS: EffectScript[] = names.map((name) =>
  stubEffect("PAWG", name, `EFFECT PAWG ${name}.gif`)
);

