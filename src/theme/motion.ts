// Motion should explain causality, not decorate. Prefer transform/opacity only.
export const duration = {
  instant: 100,
  fast: 160,
  base: 220,
  slow: 320,
} as const;

// Reanimated spring configs. "snappy" for direct-manipulation settle
// (drag/drop, snap-into-place). "gentle" for screen-level transitions.
export const springs = {
  snappy: { damping: 22, stiffness: 320, mass: 0.9 },
  gentle: { damping: 20, stiffness: 180, mass: 1 },
} as const;

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const touchTarget = {
  min: 44,
} as const;
