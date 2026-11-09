// Design tokens for Stooopid Space Shooter (retro arcade look). Dark theme only (from /app/design_guidelines.json).
// Components import `useTheme()` / `makeStyles` from here; never write color literals.

import { useMemo } from "react";
import { Appearance, StyleSheet } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Retro arcade: black CRT, neon cyan / hot pink / yellow
  surface: "#07060F",
  onSurface: "#F4F1FF",
  surfaceSecondary: "#120F24",
  onSurfaceSecondary: "#D4CFF0",
  surfaceTertiary: "#1E1838",
  onSurfaceTertiary: "#F4F1FF",
  surfaceInverse: "#F4F1FF",
  onSurfaceInverse: "#07060F",
  muted: "#8C84B8",

  brand: "#FF2A6D",
  onBrand: "#07060F",
  brandPrimary: "#FF2A6D",
  onBrandPrimary: "#07060F",
  brandSecondary: "#05D9E8",
  onBrandSecondary: "#07060F",
  brandTertiary: "#FFE600",
  onBrandTertiary: "#07060F",

  success: "#39FF14",
  onSuccess: "#07060F",
  warning: "#FFE600",
  onWarning: "#07060F",
  error: "#FF2A6D",
  onError: "#07060F",
  info: "#05D9E8",
  onInfo: "#07060F",

  border: "#05D9E8",
  borderStrong: "#FF2A6D",
  divider: "#2A2450",

  // Text drawn over the dark arena / overlay scrim
  onArena: "#FFFFFF",
  onArenaMuted: "#B8B3D9",

  // Game-specific
  arena: "#05040B",
  player: "#29C5F6",
  playerCore: "#E8FAFF",
  enemy: "#FF2E4D",
  enemyElite: "#FF6A00",
  bullet: "#FFF27A",
  xp: "#39FF14",
  hpTrack: "#3A0A1E",
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
  nebulaBlue: "#1B1458",
  star: "#FFF7D6",
  scrim: "rgba(5,4,11,0.88)",
  scrimLight: "rgba(5,4,11,0.6)",
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
  display: "PixelifySans",
  text: "SpaceMono",
  bold: "PixelifySans",
};

// 8-bit block outline: neon border with a hard pink drop on the bottom/right edges
export const pop = (c: ThemeColors) => ({
  borderWidth: 3, borderBottomWidth: 6, borderRightWidth: 6, borderColor: c.border, borderBottomColor: c.borderStrong, borderRightColor: c.borderStrong,
});
// Flat outline (unselected chips, inputs)
export const ink = (c: ThemeColors) => ({ borderWidth: 3, borderColor: c.border });

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 0, md: 2, lg: 4, pill: 999 };
