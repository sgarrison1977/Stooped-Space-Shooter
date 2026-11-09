// Design tokens for Stooopid Space Shooter (notebook doodle look). Dark theme only (from /app/design_guidelines.json).
// Components import `useTheme()` / `makeStyles` from here; never write color literals.

import { useMemo } from "react";
import { Appearance, StyleSheet } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Notebook doodle: ruled paper, ballpoint-blue ink, red pen, highlighter yellow
  surface: "#FBF7EC",
  onSurface: "#1F2A5A",
  surfaceSecondary: "#FFFDF6",
  onSurfaceSecondary: "#34407A",
  surfaceTertiary: "#F3EDDC",
  onSurfaceTertiary: "#1F2A5A",
  surfaceInverse: "#1F2A5A",
  onSurfaceInverse: "#FBF7EC",
  muted: "#7A7F99",

  brand: "#FFE14D",
  onBrand: "#1F2A5A",
  brandPrimary: "#FFE14D",
  onBrandPrimary: "#1F2A5A",
  brandSecondary: "#E0393E",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FFF08A",
  onBrandTertiary: "#1F2A5A",

  success: "#3FA34D",
  onSuccess: "#FFFFFF",
  warning: "#F2A900",
  onWarning: "#1F2A5A",
  error: "#E0393E",
  onError: "#FFFFFF",
  info: "#3D7FD9",
  onInfo: "#FFFFFF",

  border: "#1F2A5A",
  borderStrong: "#E0393E",
  divider: "#BFD3EE",

  // Text drawn over the dark arena / overlay scrim
  onArena: "#FFFFFF",
  onArenaMuted: "#C3CBE6",

  // Game-specific
  arena: "#1F2433",
  player: "#29C5F6",
  playerCore: "#E8FAFF",
  enemy: "#FF2E4D",
  enemyElite: "#FF6A00",
  bullet: "#FFF27A",
  xp: "#9CF06B",
  hpTrack: "#5A2430",
  shipLight: "#FFFFFF",
  shipDark: "#1E6FD9",
  cockpit: "#7FF6FF",
  engineGlow: "#FFD60A",
  enemyLight: "#FFB0C0",
  enemyDark: "#6A0F2A",
  bossDark: "#2A0B1A",
  bossMid: "#D81E5B",
  bossLight: "#FFC27A",
  bossCore: "#FFE45C",
  nebulaEmber: "#E0393E",
  nebulaBlue: "#2C3A6B",
  star: "#FFF7D6",
  scrim: "rgba(31,36,51,0.88)",
  scrimLight: "rgba(31,36,51,0.6)",
  transparent: "transparent",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark: ThemeColors } = { light: dark, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.("dark");

export const colors = dark;

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  return { scheme: "dark", colors: dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const fonts = {
  display: "PermanentMarker",
  text: "PatrickHand",
  bold: "PatrickHand",
};

// Hand-drawn box: ink outline with uneven corners and a heavier bottom stroke, like a pen doodle
export const pop = (c: ThemeColors) => ({
  borderWidth: 2, borderBottomWidth: 3.5, borderColor: c.border,
  borderTopLeftRadius: 16, borderTopRightRadius: 5, borderBottomRightRadius: 18, borderBottomLeftRadius: 6,
});
// Flat outline (unselected chips, inputs)
export const ink = (c: ThemeColors) => ({ borderWidth: 2, borderColor: c.border });

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
