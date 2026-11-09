// Design tokens for Stooopid Space Shooter. The whole UI look is player-selectable (UI_STYLES).
// `colors`, `fonts`, `radius` and `fx` are live objects: setUiStyle() swaps their contents and the
// root layout remounts the screen tree so every style sheet is rebuilt. Never write color literals.

import { useMemo, useSyncExternalStore } from "react";
import { Appearance, StyleSheet } from "react-native";

export type ColorScheme = "light" | "dark";

const ember = {
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
  // Text drawn over the dark arena / overlay scrim
  onArena: "#FCEBE6",
  onArenaMuted: "#A08B81",
  // Game-specific
  arena: "#0C0705",
  player: "#4FA3FF",
  playerCore: "#CFE6FF",
  enemy: "#E5533A",
  enemyElite: "#FF9A3C",
  bullet: "#FFF4E0",
  xp: "#00E5FF",
  hpTrack: "#3A1414",
  shipLight: "#E6F3FF",
  shipDark: "#1B3F8F",
  cockpit: "#7FF6FF",
  engineGlow: "#FFB347",
  enemyLight: "#FFB199",
  enemyDark: "#5A1208",
  bossDark: "#2A0B05",
  bossMid: "#B8341B",
  bossLight: "#FFC27A",
  bossCore: "#FFE45C",
  nebulaEmber: "#FF5500",
  nebulaBlue: "#1C3D8F",
  star: "#FFF4E0",
  scrim: "rgba(8,4,3,0.82)",
  scrimLight: "rgba(17,10,8,0.55)",
  transparent: "transparent",
};

export type ThemeColors = typeof ember;
type Box = Record<string, number | string>;
type Shadow = { textShadowColor?: string; textShadowOffset?: { width: number; height: number }; textShadowRadius?: number };

export type UiStyleId = "ember" | "cartoon" | "retro" | "racing" | "notebook" | "military" | "comic" | "blueprint";
export type Backdrop = "ember" | "paper" | "halftone" | "grid" | "none";

interface UiStyle {
  id: UiStyleId; name: string;
  palette: ThemeColors;
  fonts: { display: string; text: string; bold: string };
  radius: { sm: number; md: number; lg: number };
  pop: (c: ThemeColors) => Box; // outlined card/button
  ink: (c: ThemeColors) => Box; // flat outline (chips, inputs, round buttons)
  fx: {
    backdrop: Backdrop; scanlines: boolean; statusBar: "light" | "dark";
    tilt: string; // rotation for selected chips/cards
    primaryTransform: { skewX?: string; rotate?: string }[];
    pressed: object;
    titleColor: keyof ThemeColors; titleShadow: Shadow; overlayTitle: keyof ThemeColors; overlayShadow: Shadow;
    titleEm: number; // approx glyph width / font size of the display font (fits the home title)
    arenaBg: "space" | "paper" | "grid"; // battle background
  };
}

const flat = (w: number) => (c: ThemeColors) => ({ borderWidth: w, borderColor: c.border });
const noShadow: Shadow = {};
const hard = (color: string, d = 3): Shadow => ({ textShadowColor: color, textShadowOffset: { width: d, height: d }, textShadowRadius: 1 });
const baseFx = {
  backdrop: "none" as Backdrop, scanlines: false, statusBar: "light" as const, tilt: "0deg", primaryTransform: [],
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] }, arenaBg: "space" as const,
  titleColor: "onSurface" as const, titleShadow: noShadow, overlayTitle: "onArena" as const, overlayShadow: noShadow, titleEm: 0.75,
};

export const UI_STYLES: UiStyle[] = [
  {
    id: "ember", name: "Original Ember", palette: ember,
    fonts: { display: "Cinzel", text: "DMSans", bold: "DMSans" }, radius: { sm: 6, md: 12, lg: 20 },
    pop: flat(1), ink: flat(1),
    fx: { ...baseFx, backdrop: "ember", titleEm: 0.85 },
  },
  {
    id: "cartoon", name: "Goofy Cartoon",
    palette: {
      ...ember, surface: "#FFF1C9", onSurface: "#1A1423", surfaceSecondary: "#FFFFFF", onSurfaceSecondary: "#2A2233", surfaceTertiary: "#FFE08A",
      onSurfaceTertiary: "#1A1423", surfaceInverse: "#1A1423", onSurfaceInverse: "#FFF1C9", muted: "#6E6177",
      brand: "#FF3D7F", onBrand: "#1A1423", brandPrimary: "#FF3D7F", onBrandPrimary: "#1A1423", brandSecondary: "#FF6A00", onBrandSecondary: "#1A1423",
      brandTertiary: "#FFD60A", onBrandTertiary: "#1A1423", success: "#8BE000", onSuccess: "#1A1423", warning: "#FFD60A", error: "#FF2E4D", info: "#29C5F6",
      border: "#1A1423", borderStrong: "#1A1423", divider: "#1A1423", onArena: "#FFFFFF", onArenaMuted: "#D8CCE6",
      arena: "#15102A", player: "#29C5F6", enemy: "#FF2E4D", enemyElite: "#FF6A00", bullet: "#FFF27A", xp: "#9CFF2E", hpTrack: "#4A1426",
      shipDark: "#1E6FD9", engineGlow: "#FFD60A", enemyLight: "#FFB0C0", enemyDark: "#6A0F2A", bossDark: "#2A0B1A", bossMid: "#D81E5B",
      nebulaEmber: "#FF3D7F", nebulaBlue: "#2B1F6B", star: "#FFF7D6", scrim: "rgba(21,16,42,0.86)", scrimLight: "rgba(21,16,42,0.6)",
    },
    fonts: { display: "LuckiestGuy", text: "Sniglet", bold: "SnigletBold" }, radius: { sm: 12, md: 20, lg: 28 },
    pop: (c) => ({ borderWidth: 3, borderBottomWidth: 6, borderRightWidth: 5, borderColor: c.border }), ink: flat(3),
    fx: {
      ...baseFx, statusBar: "dark", tilt: "-2deg", primaryTransform: [{ rotate: "-1deg" }],
      pressed: { transform: [{ translateY: 2 }, { rotate: "-1deg" }], borderBottomWidth: 3, borderRightWidth: 3 },
      titleColor: "brandPrimary", titleShadow: hard("#1A1423"), overlayTitle: "brandTertiary", overlayShadow: hard("#FF3D7F"), titleEm: 0.8,
    },
  },
  {
    id: "retro", name: "Retro Arcade",
    palette: {
      ...ember, surface: "#07060F", onSurface: "#F4F1FF", surfaceSecondary: "#120F24", onSurfaceSecondary: "#D4CFF0", surfaceTertiary: "#1E1838",
      onSurfaceTertiary: "#F4F1FF", surfaceInverse: "#F4F1FF", onSurfaceInverse: "#07060F", muted: "#8C84B8",
      brand: "#FF2A6D", onBrand: "#07060F", brandPrimary: "#FF2A6D", onBrandPrimary: "#07060F", brandSecondary: "#05D9E8", onBrandSecondary: "#07060F",
      brandTertiary: "#FFE600", onBrandTertiary: "#07060F", success: "#39FF14", onSuccess: "#07060F", warning: "#FFE600", error: "#FF2A6D", info: "#05D9E8",
      border: "#05D9E8", borderStrong: "#FF2A6D", divider: "#2A2450", onArena: "#FFFFFF", onArenaMuted: "#B8B3D9",
      arena: "#05040B", hpTrack: "#3A0A1E", xp: "#39FF14", nebulaBlue: "#1B1458", scrim: "rgba(5,4,11,0.88)", scrimLight: "rgba(5,4,11,0.6)",
    },
    fonts: { display: "PixelifySans", text: "SpaceMono", bold: "PixelifySans" }, radius: { sm: 0, md: 2, lg: 4 },
    pop: (c) => ({
      borderWidth: 3, borderBottomWidth: 6, borderRightWidth: 6, borderColor: c.border, borderBottomColor: c.borderStrong, borderRightColor: c.borderStrong,
    }),
    ink: flat(3),
    fx: {
      ...baseFx, scanlines: true, pressed: { transform: [{ translateX: 3 }, { translateY: 3 }], borderBottomWidth: 3, borderRightWidth: 3 },
      titleColor: "brandPrimary", titleShadow: hard("#05D9E8"), overlayTitle: "brandTertiary", overlayShadow: hard("#FF2A6D"), titleEm: 0.7,
    },
  },
  {
    id: "racing", name: "Racing HUD",
    palette: {
      ...ember, surface: "#0E1013", onSurface: "#F5F7FA", surfaceSecondary: "#171A1F", onSurfaceSecondary: "#C9CED6", surfaceTertiary: "#22262D",
      onSurfaceTertiary: "#F5F7FA", surfaceInverse: "#F5F7FA", onSurfaceInverse: "#0E1013", muted: "#7D8590",
      brand: "#C6FF00", onBrand: "#0E1013", brandPrimary: "#C6FF00", onBrandPrimary: "#0E1013", brandSecondary: "#C6FF00", onBrandSecondary: "#0E1013",
      brandTertiary: "#232B05", onBrandTertiary: "#C6FF00", success: "#C6FF00", onSuccess: "#0E1013", warning: "#FFC400", error: "#FF3B3B", info: "#4FC3F7",
      border: "#2C3138", borderStrong: "#C6FF00", divider: "#22262D", onArena: "#FFFFFF", onArenaMuted: "#A9B0BA",
      arena: "#0A0B0D", xp: "#C6FF00", nebulaBlue: "#1A2230", nebulaEmber: "#3A4A00", scrim: "rgba(10,11,13,0.9)", scrimLight: "rgba(10,11,13,0.6)",
    },
    fonts: { display: "BarlowCondensed-BoldItalic", text: "Barlow-Medium", bold: "Barlow-SemiBold" }, radius: { sm: 4, md: 6, lg: 10 },
    pop: (c) => ({ borderWidth: 1, borderColor: c.border, borderLeftWidth: 4, borderLeftColor: c.borderStrong }), ink: flat(1),
    fx: { ...baseFx, primaryTransform: [{ skewX: "-10deg" }], titleColor: "brandPrimary", titleEm: 0.5 },
  },
  {
    id: "notebook", name: "Notebook Doodle",
    palette: {
      ...ember, surface: "#FBF7EC", onSurface: "#1F2A5A", surfaceSecondary: "#FFFDF6", onSurfaceSecondary: "#34407A", surfaceTertiary: "#F3EDDC",
      onSurfaceTertiary: "#1F2A5A", surfaceInverse: "#1F2A5A", onSurfaceInverse: "#FBF7EC", muted: "#7A7F99",
      brand: "#FFE14D", onBrand: "#1F2A5A", brandPrimary: "#FFE14D", onBrandPrimary: "#1F2A5A", brandSecondary: "#E0393E", onBrandSecondary: "#FFFFFF",
      brandTertiary: "#FFF08A", onBrandTertiary: "#1F2A5A", success: "#3FA34D", onSuccess: "#FFFFFF", warning: "#F2A900", error: "#E0393E", info: "#3D7FD9",
      border: "#1F2A5A", borderStrong: "#E0393E", divider: "#BFD3EE", onArena: "#1F2A5A", onArenaMuted: "#6E7596",
      arena: "#FBF7EC", hpTrack: "#F1C9CC", xp: "#3FA34D", bullet: "#1F2A5A", nebulaBlue: "#2C3A6B", nebulaEmber: "#E0393E",
      scrim: "rgba(251,247,236,0.93)", scrimLight: "rgba(251,247,236,0.7)",
    },
    fonts: { display: "PermanentMarker", text: "PatrickHand", bold: "PatrickHand" }, radius: { sm: 8, md: 12, lg: 16 },
    pop: (c) => ({
      borderWidth: 2, borderBottomWidth: 3.5, borderColor: c.border,
      borderTopLeftRadius: 16, borderTopRightRadius: 5, borderBottomRightRadius: 18, borderBottomLeftRadius: 6,
    }),
    ink: flat(2),
    fx: {
      ...baseFx, backdrop: "paper", statusBar: "dark", tilt: "-2deg", primaryTransform: [{ rotate: "-1deg" }],
      pressed: { transform: [{ rotate: "-1.5deg" }, { scale: 0.97 }] }, titleEm: 0.8, arenaBg: "paper",
    },
  },
  {
    id: "military", name: "Military Cockpit",
    palette: {
      ...ember, surface: "#1B1E17", onSurface: "#E8E2C8", surfaceSecondary: "#252A1F", onSurfaceSecondary: "#C9C2A3", surfaceTertiary: "#303628",
      onSurfaceTertiary: "#E8E2C8", surfaceInverse: "#E8E2C8", onSurfaceInverse: "#1B1E17", muted: "#8A8670",
      brand: "#FFB000", onBrand: "#1B1E17", brandPrimary: "#FFB000", onBrandPrimary: "#1B1E17", brandSecondary: "#A8C46E", onBrandSecondary: "#1B1E17",
      brandTertiary: "#3A3418", onBrandTertiary: "#FFB000", success: "#A8C46E", onSuccess: "#1B1E17", warning: "#FFB000", error: "#E5483B", info: "#7FB3A6",
      border: "#4A5238", borderStrong: "#FFB000", divider: "#343A2A", onArena: "#E8E2C8", onArenaMuted: "#A9A48A",
      arena: "#11130E", xp: "#B8E05A", hpTrack: "#3A1A14", nebulaBlue: "#1F2A1A", nebulaEmber: "#5A4A10", star: "#E8E2C8",
      scrim: "rgba(17,19,14,0.9)", scrimLight: "rgba(17,19,14,0.6)",
    },
    fonts: { display: "BlackOpsOne", text: "ShareTechMono", bold: "ShareTechMono" }, radius: { sm: 0, md: 2, lg: 3 },
    pop: (c) => ({ borderWidth: 2, borderColor: c.border, borderTopWidth: 4, borderTopColor: c.borderStrong }), ink: flat(2),
    fx: { ...baseFx, backdrop: "grid", titleColor: "brandPrimary", overlayTitle: "brandPrimary", titleEm: 0.85 },
  },
  {
    id: "comic", name: "Comic Book",
    palette: {
      ...ember, surface: "#FDF3D0", onSurface: "#111111", surfaceSecondary: "#FFFFFF", onSurfaceSecondary: "#222222", surfaceTertiary: "#FFE3E3",
      onSurfaceTertiary: "#111111", surfaceInverse: "#111111", onSurfaceInverse: "#FDF3D0", muted: "#5A5A5A",
      brand: "#E62429", onBrand: "#FFFFFF", brandPrimary: "#E62429", onBrandPrimary: "#FFFFFF", brandSecondary: "#1E5BD8", onBrandSecondary: "#FFFFFF",
      brandTertiary: "#FFE600", onBrandTertiary: "#111111", success: "#2FB344", onSuccess: "#FFFFFF", warning: "#FFB400", error: "#E62429", info: "#1E5BD8",
      border: "#111111", borderStrong: "#111111", divider: "#E8C9A0", onArena: "#FFFFFF", onArenaMuted: "#D5DAF0",
      arena: "#141A33", xp: "#FFE600", hpTrack: "#4A1416", nebulaBlue: "#22306B", nebulaEmber: "#E62429", scrim: "rgba(17,17,17,0.82)", scrimLight: "rgba(17,17,17,0.55)",
    },
    fonts: { display: "Bangers", text: "ComicNeueBold", bold: "ComicNeueBold" }, radius: { sm: 4, md: 6, lg: 8 },
    pop: (c) => ({ borderWidth: 3, borderBottomWidth: 5, borderRightWidth: 5, borderColor: c.border }), ink: flat(3),
    fx: {
      ...baseFx, backdrop: "halftone", statusBar: "dark", tilt: "-2deg", primaryTransform: [{ rotate: "-1.5deg" }],
      pressed: { transform: [{ scale: 0.96 }, { rotate: "1deg" }] },
      titleColor: "brandPrimary", titleShadow: hard("#111111"), overlayTitle: "brandTertiary", overlayShadow: hard("#E62429"), titleEm: 0.55,
    },
  },
  {
    id: "blueprint", name: "Engineer Blueprint",
    palette: {
      ...ember, surface: "#0F3B73", onSurface: "#FFFFFF", surfaceSecondary: "#134784", onSurfaceSecondary: "#D6E6FA", surfaceTertiary: "#1A559A",
      onSurfaceTertiary: "#FFFFFF", surfaceInverse: "#FFFFFF", onSurfaceInverse: "#0F3B73", muted: "#9DBCE3",
      brand: "#FFFFFF", onBrand: "#0F3B73", brandPrimary: "#FFFFFF", onBrandPrimary: "#0F3B73", brandSecondary: "#FFD166", onBrandSecondary: "#0F3B73",
      brandTertiary: "#1F64B5", onBrandTertiary: "#FFFFFF", success: "#7CE0A3", onSuccess: "#0F3B73", warning: "#FFD166", error: "#FF7B7B", info: "#CFE3FF",
      border: "#CFE3FF", borderStrong: "#FFFFFF", divider: "#2D62A3", onArena: "#FFFFFF", onArenaMuted: "#B5CDEB",
      arena: "#0A2A55", xp: "#7CE0A3", hpTrack: "#4A2A4A", nebulaBlue: "#1A4A8A", nebulaEmber: "#2D62A3", star: "#CFE3FF",
      scrim: "rgba(8,32,66,0.9)", scrimLight: "rgba(8,32,66,0.6)",
    },
    fonts: { display: "ArchitectsDaughter", text: "ShareTechMono", bold: "ShareTechMono" }, radius: { sm: 2, md: 3, lg: 4 },
    pop: flat(1.5), ink: flat(1.5),
    fx: { ...baseFx, backdrop: "grid", titleColor: "brandSecondary", overlayTitle: "brandSecondary", titleEm: 0.7, arenaBg: "grid" },
  },
];

const byId = (id: string) => UI_STYLES.find((s) => s.id === id) ?? UI_STYLES[0];

// Live, mutable token objects (contents swapped by setUiStyle)
export const colors: ThemeColors = { ...ember };
export const fonts = { ...UI_STYLES[0].fonts };
export const radius = { ...UI_STYLES[0].radius, pill: 999 };
export const fx: UiStyle["fx"] = { ...UI_STYLES[0].fx };
let current: UiStyle = UI_STYLES[0];
export const pop = (c: ThemeColors) => current.pop(c);
export const currentUiStyle = (): UiStyleId => current.id;
export const ink = (c: ThemeColors) => current.ink(c);

const listeners = new Set<() => void>();
export function setUiStyle(id: string) {
  const s = byId(id);
  if (s === current) return;
  current = s;
  Object.assign(colors, s.palette);
  Object.assign(fonts, s.fonts);
  Object.assign(radius, s.radius);
  Object.assign(fx, s.fx);
  listeners.forEach((l) => l());
}
export function useUiStyle(): UiStyleId {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => current.id);
}

export type { UiStyle };
export const defaultScheme = "dark" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark: ThemeColors } = { light: colors, dark: colors };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  return { scheme: "dark", colors };
}

// Style sheets are rebuilt whenever the UI style changes
export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const style = useUiStyle();
    return useMemo(() => StyleSheet.create(factory(colors)), [style]); // eslint-disable-line react-hooks/exhaustive-deps
  };
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
