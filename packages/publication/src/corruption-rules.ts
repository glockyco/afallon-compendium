/**
 * Corruption rules that native and live evidence establish. A finished timed dungeon run adds `completionFirstBonus`
 * token levels when the first threshold is beaten, and `completionSecondBonus` when only the second one is.
 */
export const CORRUPTION_NATIVE_RULES = {
  altarWithoutTokenIncrement: 1, completionFirstBonus: 2, completionSecondBonus: 1,
  completionOtherwiseBonus: 0, timeoutDecrease: 1, timeoutMinimum: 1,
} as const;
