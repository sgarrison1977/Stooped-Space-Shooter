// Recolours ship/enemy/boss art so it matches the selected UI style
import { currentUiStyle } from "@/src/theme";
import { activeSeason } from "./seasons";

type Look = { fill?: (hex: string) => string; stroke?: (hex: string) => string; width: number };

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (r: number[]) => "#" + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const isHex = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);
// blend colour a toward b by k (0..1)
const mix = (a: string, b: string, k: number) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * k)); };
const gray = (a: string) => { const [r, g, b] = hexRgb(a); const l = r * 0.3 + g * 0.59 + b * 0.11; return rgbHex([l, l, l]); };

const LOOKS: Record<string, Look> = {
  ember: { width: 1 },
  cartoon: { stroke: () => "#1A1423", width: 2.6 },
  comic: { stroke: () => "#111111", width: 2.4, fill: (c) => mix(c, "#FFFFFF", 0.08) },
  retro: { fill: (c) => mix(c, "#07060F", 0.65), stroke: (c) => mix(c, "#FFFFFF", 0.25), width: 1.6 },
  racing: { fill: (c) => mix(c, "#22262D", 0.45), stroke: () => "#C6FF00", width: 1 },
  notebook: { fill: (c) => mix(c, "#FFFDF6", 0.5), stroke: () => "#1F2A5A", width: 1.7 },
  military: { fill: (c) => mix(gray(c), "#5A6338", 0.55), stroke: () => "#D9D2B0", width: 1.2 },
  blueprint: { fill: (c) => mix(c, "#134784", 0.82), stroke: () => "#FFFFFF", width: 1.3 },
};

const look = () => LOOKS[currentUiStyle()] ?? LOOKS.ember;
/** fill colour */
export const af = (c: string) => { const f = look().fill; return f && isHex(c) ? f(c) : c; };
/** stroke colour */
export const ak = (c: string) => { const f = look().stroke; return f && isHex(c) ? f(c) : c; };
/** enemy fill colour: UI style look + seasonal event skin */
export const ef = (c: string) => { const s = activeSeason(); const f = af(c); return s && isHex(f) ? mix(f, s.enemy, 0.4) : f; };
/** stroke width */
export const aw = (w: number) => w * look().width;
