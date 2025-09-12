import { EffectScript } from "../types/effects";
import { uid } from "../utils/uid";

const list: EffectScript[] = [];

// --- Examples you already had implemented (kept exactly) ---
list.push({
  id: uid(),
  name: "Pumping Frenzy",
  group: "GENERIC",
  target: { kind: "none" },
  score: [{ scope: "final", op: "mult", amount: 3 }],
  description: "Triple the Final Score (both players).",
  gifName: "EFFECT Pumping Frenzy.gif",
});

list.push({
  id: uid(),
  name: "Trifecta",
  group: "GENERIC",
  target: { kind: "many-babes", min: 3, max: 3, distinctTypes: true },
  score: [{ scope: "final", op: "mult", amount: 2 }],
  onRemove: { undoDiscardedTargets: true },
  description: "Discard 3 babes with different types. Double the Final Score.",
  gifName: "EFFECT Trifecta.gif",
});

list.push({
  id: uid(),
  name: "Jeanie Wishes",
  group: "SIGNATURE",
  requires: [{ kind: "discard-has-babe", name: "Elsa Jean" }],
  limits: [{ setBabeLimitTo: 3 }, { ignoreEffectLimit: true }],
  freeEffect: true,
  target: { kind: "none" },
  description: "If Elsa Jean is in your Discard, you can play 3 Babes this turn (ignores Effect limit).",
  gifName: "EFFECT ELSA JEAN Jeanie Wishes.gif",
});

list.push({
  id: uid(),
  name: "Bouncing Boobies",
  group: "BUSTY",
  target: { kind: "one-babe", ofType: "BUSTY" },
  score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 3 }],
  description: "Choose 1 BUSTY Babe you played this turn; triple her Base Score.",
  gifName: "EFFECT BUSTY Bouncing Boobies.gif",
});

list.push({
  id: uid(),
  name: "Delish-Ious",
  group: "SIGNATURE",
  requires: [{ kind: "only-babe-played", name: "Alice Delish" }],
  target: { kind: "none" },
  future: { nextMult: 2 },
  description: "If Alice Delish is the only Babe you played this turn, double next turn’s Final Score.",
  gifName: "EFFECT ALICE DELISH Delish-Ious.gif",
});

// --- Helper to add simple “does nothing” stubs ---
function add(group: EffectScript["group"], name: string, gifName: string) {
  list.push({
    id: uid(),
    name,
    group,
    target: { kind: "none" },
    description: "",
    gifName,
  });
}

// BADDIE
for (const name of [
  "Baddie Brigade",
  "Collab",
  "Intimate Dreams",
  "Link In Bio",
  "Measuring Time",
  "She Can Take It!",
  "She's a Rider",
  "Teasing Together",
]) {
  add("BADDIE", name, `EFFECT BADDIE ${name}.gif`);
}

// BIMBO
for (const name of [
  "Bimbo Boob Bounce",
  "Bimbo Negotiations",
  "Bimbo Party",
  "Bimbofication",
  "Cock Trap",
  "Fake Tits",
  "Lush Lips",
  "Marked",
  "Mindless Mode",
  "Play With Me!",
  "Size Queen",
  "Yummy Cummy",
]) {
  add("BIMBO", name, `EFFECT BIMBO ${name}.gif`);
}

// BUSTY
for (const name of [
  "A-bra-cada-bra",
  "Boobs In Yo Face",
  "Boobzooka",
  "Breast Is Best",
  "Cheer Me Up",
  "Handbra",
  "Jiggly Jugs",
  "Let Em Out",
  "Shes All Yours",
  "Side Boob",
  "Sun Dress",
  "Titty Drop",
]) {
  add("BUSTY", name, `EFFECT BUSTY ${name}.gif`);
}

// GENERIC (excluding the ones already fully implemented above if you want to avoid duplicates)
for (const name of [
  "7 Sins Envy",
  "7 Sins Gluttony",
  "7 Sins Greed",
  "7 Sins Lust",
  "7 Sins Pride",
  "7 Sins Sloth",
  "7 Sins Wrath",
  "All Tied Up",
  "Babe Swap",
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
  // Pumping Frenzy already added with real effect above
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
  // Trifecta already added with real effect above
  "Triple Team",
  "Trophy Wife",
  "Two Hander",
  "Unload",
]) {
  add("GENERIC", name, `EFFECT ${name}.gif`);
}

// MILF
for (const name of [
  "Captured MILF",
  "MILF Duo",
  "Mommys Girl",
  "Sexual Experience",
  "Stepmom Is Stuck",
  "Still Got It",
  "Vintage Form",
]) {
  add("MILF", name, `EFFECT MILF ${name}.gif`);
}

// PAWG
for (const name of [
  "Assquake",
  "Booty Call",
  "Bubble Butt",
  "Dummy Thicc",
  "Extra Thicc",
  "Flare Pants",
  "Surprise Package",
]) {
  add("PAWG", name, `EFFECT PAWG ${name}.gif`);
}

// SIGNATURE
for (const [sig, name] of [
  ["ANGELA WHITE SAVANNAH BOND", "Aussie Awesomeness"],
  ["BLAKE BLOSSOM", "Blooming Blossom"],
  ["BONNIE BLUE", "Blue Balls"],
  ["SAVANNAH BOND", "Bond For Life"],
  ["BROOKLYN CHASE", "Chase The Sun"],
  ["PIPER PERRI", "Cream-Pied Piper"],
  ["ALEXIS TEXAS", "Everything Is Bigger In Texas"],
  ["ANGIE FAITH", "Faithful"],
  ["AUTUMN FALLS", "Fall For Autumn"],
  ["FAYE REAGAN", "Faye-Tal"],
  ["KARMA RX", "Instant Karma"],
  ["JYNX MAZE", "Jynxd"],
  ["KRYSTAL BOYD", "Krystal Klear"],
  ["EMILY BLOOM", "Late Bloomer"],
  ["MALENA MORGAN", "Morganized Crime"],
  ["ALETTA OCEAN", "Ocean Of Love"],
  ["OCTAVIA RED", "Red Alert"],
  ["RUTH LEE", "Ruthless Game"],
  ["SOMMER RAY", "Sommer Heat"],
  ["KALI ROSES", "Thorned Roses"],
  ["VICTORIA JUNE", "Victorias Secret"],
  ["LUCIE WILDE", "Wilde Card"],
] as const) {
  add("SIGNATURE", name, `EFFECT ${sig} ${name}.gif`);
}

export const EFFECTS = list;
