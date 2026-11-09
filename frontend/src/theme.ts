// Design tokens for Stooopid Space Shooter (goofy cartoon look). Dark theme only (from /app/design_guidelines.json).
// Components import `useTheme()` / `makeStyles` from here; never write color literals.

import { useMemo } from "react";
import { Appearance, StyleSheet } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Goofy cartoon: cream paper, ink outlines, loud candy colours
  surface: "#FFF1C9",
  onSurface: "#1A1423",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#2A2233",
  surfaceTertiary: "#FFE08A",
  onSurfaceTertiary: "#1A1423",
  surfaceInverse: "#1A1423",
  onSurfaceInverse: "#FFF1C9",
  muted: "#6E6177",

  brand: "#FF3D7F",
  onBrand: "#1A1423",
  brandPrimary: "#FF3D7F",
  onBrandPrimary: "#1A1423",
  brandSecondary: "#FF6A00",
  onBrandSecondary: "#1A1423",
  brandTertiary: "#FFD60A",
  onBrandTertiary: "#1A1423",

  success: "#8BE000",
  onSuccess: "#1A1423",
  warning: "#FFD60A",
  onWarning: "#1A1423",
  error: "#FF2E4D",
  onError: "#FFFFFF",
  info: "#29C5F6",
  onInfo: "#1A1423",

  border: "#1A1423",
  borderStrong: "#1A1423",
  divider: "#1A1423",

  // Text drawn over the dark arena / overlay scrim
  onArena: "#FFFFFF",
  onArenaMuted: "#D8CCE6",

  // Game-specific
  arena: "#15102A",
  player: "#29C5F6",
  playerCore: "#E8FAFF",
  enemy: "#FF2E4D",
  enemyElite: "#FF6A00",
  bullet: "#FFF27A",
  xp: "#9CFF2E",
  hpTrack: "#4A1426",
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
  nebulaEmber: "#FF3D7F",
  nebulaBlue: "#2B1F6B",
  star: "#FFF7D6",
  scrim: "rgba(21,16,42,0.86)",
  scrimLight: "rgba(21,16,42,0.6)",
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
  display: "LuckiestGuy",
  text: "Sniglet",
  bold: "SnigletBold",
};

// Cartoon "sticker" outline: thick ink border with a hard drop on the bottom/right edges
export const pop = (c: ThemeColors) => ({ borderWidth: 3, borderBottomWidth: 6, borderRightWidth: 5, borderColor: c.border });
// Flat outline (unselected chips, inputs)
export const ink = (c: ThemeColors) => ({ borderWidth: 3, borderColor: c.border });

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 12, md: 20, lg: 28, pill: 999 };
