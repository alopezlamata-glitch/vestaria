import { useColorScheme } from "react-native";
import { darkColors, lightColors } from "./colors";
import { radii } from "./radii";
import { duration, iconSize, springs, touchTarget } from "./motion";
import { spacing } from "./spacing";
import { fontFamily, typography } from "./typography";

export { spacing } from "./spacing";
export { radii } from "./radii";
export { typography, fontFamily, fontWeight } from "./typography";
export { duration, springs, iconSize, touchTarget } from "./motion";

export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === "dark" ? darkColors : lightColors;

  return {
    colors,
    spacing,
    radii,
    typography,
    fontFamily,
    duration,
    springs,
    iconSize,
    touchTarget,
    isDark: scheme === "dark",
  };
}

export type Theme = ReturnType<typeof useTheme>;
