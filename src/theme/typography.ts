import { Platform } from "react-native";

// Three weights only: regular, medium, semibold. Native system font per platform.
export const fontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
} as const;

export const typography = {
  largeTitle: { fontSize: 32, lineHeight: 38, fontWeight: fontWeight.semibold },
  title: { fontSize: 22, lineHeight: 28, fontWeight: fontWeight.semibold },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: fontWeight.medium },
  body: { fontSize: 16, lineHeight: 22, fontWeight: fontWeight.regular },
  secondary: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.regular },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: fontWeight.medium },
} as const;

export type TypographyToken = keyof typeof typography;
