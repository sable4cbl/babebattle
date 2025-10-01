import type { EffectScript } from "../../types/effects";
import { stubEffect } from "./helpers";

const implemented: EffectScript[] = [];

const stubNames: string[] = [
  // add ANIME effect names here as they are authored
];

export const ANIME_EFFECTS: EffectScript[] = [
  ...implemented,
  ...stubNames.map((name) => stubEffect("ANIME", name, `EFFECT ANIME ${name}.gif`)),
];

