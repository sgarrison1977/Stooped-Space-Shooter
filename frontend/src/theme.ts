// Design tokens for Stooopid Space Shooter (clean racing HUD look). Dark theme only (from /app/design_guidelines.json).
// Components import `useTheme()` / `makeStyles` from here; never write color literals.

import { useMemo } from "react";
import { Appearance, StyleSheet } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Clean racing HUD: graphite panels, white type, one sharp lime accent
  surface: "#0E1013",
  onSurface: "#F5F7FA",
  surfaceSecondary: "#171A1F",
  onSurfaceSecondary: "#C9CED6",
  surfaceTertiary: "#22262D",
  onSurfaceTertiary: "#F5F7FA",
  surfaceInverse: "#F5F7FA",
  onSurfaceInverse: "#0E1013",
  muted: "#7D8590",

  brand: "#C6FF00",
  onBrand: "#0E1013",
  brandPrimary: "#C6FF00",
  onBrandPrimary: "#0E1013",
  brandSecondary: "#C6FF00",
  onBrandSecondary: "#0E1013",
  brandTertiary: "#232B05",
  onBrandTertiary: "#C6FF00",

  success: "#C6FF00",
  onSuccess: "#0E1013",
  warning: "#FFC400",
  onWarning: "#0E1013",
  error: "#FF3B3B",
  onError: "#FFFFFF",
  info: "#4FC3F7",
  onInfo: "#0E1013",

  border: "#2C3138",
  borderStrong: "#C6FF00",
  divider: "#22262D",

  // Text drawn over the dark arena / overlay scrim
  onArena: "#FFFFFF",
  onArenaMuted: "#A9B0BA",

  // Game-specific
  arena: "#0A0B0D",
  player: "#29C5F6",
  playerCore: "#E8FAFF",
  enemy: "#FF2E4D",
  enemyElite: "#FF6A00",
  bullet: "#FFF27A",
  xp: "#C6FF00",
  hpTrack: "#3A1414",
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
  nebulaEmber: "#3A4A00",
  nebulaBlue: "#1A2230",
  star: "#FFF7D6",
  scrim: "rgba(10,11,13,0.9)",
  scrimLight: "rgba(10,11,13,0.6)",
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
  display: "BarlowCondensed-BoldItalic",
  text: "Barlow-Medium",
  bold: "Barlow-SemiBold",
};

// Racing panel: hairline graphite border with a lime accent strip on the left edge
export const pop = (c: ThemeColors) => ({ borderWidth: 1, borderColor: c.border, borderLeftWidth: 4, borderLeftColor: c.borderStrong });
// Flat outline (unselected chips, inputs)
export const ink = (c: ThemeColors) => ({ borderWidth: 1, borderColor: c.border });

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 4, md: 6, lg: 10, pill: 999 };
