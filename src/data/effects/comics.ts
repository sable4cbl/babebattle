import type { EffectScript } from "../../types/effects";
import { stubEffect } from "./helpers";

const implemented: EffectScript[] = [];

const stubNames: string[] = [
  // add COMICS effect names here as they are authored
];

export const COMICS_EFFECTS: EffectScript[] = [
  ...implemented,
  ...stubNames.map((name) => stubEffect("COMICS", name, `EFFECT HENTAI COMICS ${name}.gif`)),
];

