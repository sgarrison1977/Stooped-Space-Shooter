// Design tokens for EMBERDEEP. Dark theme only (from /app/design_guidelines.json).
// Components import `useTheme()` / `makeStyles` from here; never write color literals.

import { useMemo } from "react";
import { Appearance, StyleSheet } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#110A08",
  onSurface: "#FCEBE6",
  surfaceSecondary: "#1E130F",
  onSurfaceSecondary: "#E8D5CD",
  surfaceTertiary: "#2E1E17",
  onSurfaceTertiary: "#D9C3BA",
  surfaceInverse: "#EAEAEA",
  onSurfaceInverse: "#110A08",
  muted: "#A08B81",

  brand: "#FF5500",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF5500",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF7B33",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#4A1E0A",
  onBrandTertiary: "#FFB380",

  success: "#00E5FF",
  onSuccess: "#003333",
  warning: "#FFB300",
  onWarning: "#332400",
  error: "#FF1744",
  onError: "#FFFFFF",
  info: "#2979FF",
  onInfo: "#FFFFFF",

  border: "#3A231A",
  borderStrong: "#FF5500",
  divider: "#2D1A13",

  // Game-specific
  arena: "#0C0705",
  player: "#4FA3FF",
  playerCore: "#CFE6FF",
  enemy: "#E5533A",
  enemyElite: "#FF9A3C",
  bullet: "#FFF4E0",
  xp: "#00E5FF",
  hpTrack: "#3A1414",
  scrim: "rgba(8,4,3,0.82)",
  scrimLight: "rgba(17,10,8,0.55)",
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
  display: "Cinzel",
  text: "DMSans",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };
