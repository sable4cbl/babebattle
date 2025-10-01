import type { EffectScript } from "../../types/effects";
import { stubEffect } from "./helpers";

const implemented: EffectScript[] = [];

const stubNames: string[] = [
  // add GAME effect names here as they are authored
];

export const GAME_EFFECTS: EffectScript[] = [
  ...implemented,
  ...stubNames.map((name) => stubEffect("GAME", name, `EFFECT HENTAI GAME ${name}.gif`)),
];

