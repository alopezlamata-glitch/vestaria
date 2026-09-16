// Warm, restrained neutral palette. Garments provide the visual color —
// the UI itself stays quiet. Only one accent (near-black/near-white) is used
// for primary actions so it never competes with garment photography.

export const lightColors = {
  background: "#FAF9F6",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1EFEA",
  border: "#E4E1DA",
  divider: "#ECE9E2",

  textPrimary: "#1B1A17",
  textSecondary: "#6E6A62",
  textTertiary: "#A19C91",
  textInverse: "#FAF9F6",

  accent: "#232019",
  accentInverse: "#FAF9F6",

  success: "#3E7A5C",
  danger: "#B3453B",

  overlay: "rgba(20, 18, 14, 0.45)",
  skeleton: "#EDEAE3",
} as const;

export const darkColors = {
  background: "#121110",
  surface: "#1B1A18",
  surfaceSecondary: "#24221F",
  border: "#333029",
  divider: "#2A2824",

  textPrimary: "#F5F3EE",
  textSecondary: "#B3AFA6",
  textTertiary: "#7C7870",
  textInverse: "#1B1A17",

  accent: "#F5F3EE",
  accentInverse: "#1B1A17",

  success: "#6FBF98",
  danger: "#E2837A",

  overlay: "rgba(0, 0, 0, 0.55)",
  skeleton: "#242220",
} as const;

export type ColorScheme = typeof lightColors;
