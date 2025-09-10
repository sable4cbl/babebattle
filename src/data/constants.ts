// Global defaults that are still needed

export const DEFAULT_LIMITS = { babes: 2, effects: 2 } as const;

// NOTE: DEFAULT_PRIORITY removed — effect resolution order is the order
// they appear in the playedEffects array (i.e., the order the player plays them).
