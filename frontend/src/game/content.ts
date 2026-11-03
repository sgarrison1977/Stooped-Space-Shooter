// Game content data: difficulties, bosses, ship skins, engine trails.
// Art colors are fixed game palette (identical in every theme).

export type DifficultyId = "casual" | "normal" | "hard" | "extreme";

export interface DifficultyDef {
  id: DifficultyId; name: string; desc: string;
  hp: number; dmg: number; speed: number; spawn: number; coins: number; regen: number;
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: "casual", name: "Casual", desc: "Gentle dive · 0.75x coins", hp: 0.7, dmg: 0.6, speed: 0.85, spawn: 0.75, coins: 0.75, regen: 1.6 },
  { id: "normal", name: "Normal", desc: "The intended dive · 1x coins", hp: 1, dmg: 1, speed: 1, spawn: 1, coins: 1, regen: 1 },
  { id: "hard", name: "Hard", desc: "Tougher swarm · 1.5x coins", hp: 1.35, dmg: 1.4, speed: 1.12, spawn: 1.25, coins: 1.5, regen: 0.5 },
  { id: "extreme", name: "Extreme", desc: "No regen, no mercy · 2.2x coins", hp: 1.8, dmg: 1.9, speed: 1.25, spawn: 1.5, coins: 2.2, regen: 0 },
];

export const difficulty = (id: string) => DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];

export type BossPattern = "ring" | "spiral" | "fan" | "rotor" | "charge" | "summon" | "mines" | "storm";

export interface BossDef {
  name: string; pattern: BossPattern; tagline: string;
  dark: string; mid: string; light: string; core: string;
}

export const BOSSES: BossDef[] = [
  { name: "The Cinder Maw", pattern: "ring", tagline: "Fires rings of embers", dark: "#2A0B05", mid: "#B8341B", light: "#FFC27A", core: "#FFE45C" },
  { name: "Ashen Leviathan", pattern: "spiral", tagline: "Spirals ash in long streams", dark: "#1C1A1E", mid: "#6B6470", light: "#D8CFCB", core: "#FF7B33" },
  { name: "Pyre Warden", pattern: "fan", tagline: "Fan volleys and raider escorts", dark: "#3A1600", mid: "#E06A00", light: "#FFD28A", core: "#FFF1B8" },
  { name: "Molten Hydra", pattern: "rotor", tagline: "Three heads, three streams", dark: "#4A1A00", mid: "#FF8A00", light: "#FFE066", core: "#FFFFFF" },
  { name: "Obsidian Herald", pattern: "charge", tagline: "Telegraphs, then rams you", dark: "#120818", mid: "#3B1F4A", light: "#B07CFF", core: "#F06BFF" },
  { name: "Ember Tyrant", pattern: "summon", tagline: "Summons swarms and seeker orbs", dark: "#3D0007", mid: "#B3001E", light: "#FF6B6B", core: "#FFD1D1" },
  { name: "The Slag King", pattern: "mines", tagline: "Seeds the deep with slag mines", dark: "#141A06", mid: "#4F5E1C", light: "#B9D65A", core: "#D8FF4D" },
  { name: "Furnace Queen", pattern: "storm", tagline: "Twin spirals and piercing shots", dark: "#3A2400", mid: "#C98A1B", light: "#FFF0C2", core: "#FFFFFF" },
];

export interface Skin { id: string; name: string; cost: number; light: string; mid: string; dark: string; cockpit: string; accent: string }

export const SKINS: Skin[] = [
  { id: "vanguard", name: "Vanguard", cost: 0, light: "#E6F3FF", mid: "#4FA3FF", dark: "#1B3F8F", cockpit: "#7FF6FF", accent: "#00E5FF" },
  { id: "crimson", name: "Crimson Wraith", cost: 150, light: "#FFD9CC", mid: "#E5533A", dark: "#5A1208", cockpit: "#FFB347", accent: "#FFB347" },
  { id: "verdant", name: "Verdant Hawk", cost: 250, light: "#E3FFE0", mid: "#3FCF6A", dark: "#0F4D25", cockpit: "#C8FF4D", accent: "#C8FF4D" },
  { id: "solar", name: "Solar Regent", cost: 400, light: "#FFF6D6", mid: "#FFC23D", dark: "#7A4A00", cockpit: "#FFFFFF", accent: "#FF7B33" },
  { id: "void", name: "Void Seraph", cost: 600, light: "#F0DDFF", mid: "#9B5CFF", dark: "#2A0F5A", cockpit: "#FF7BF2", accent: "#FF7BF2" },
  { id: "frost", name: "Frost Lancer", cost: 800, light: "#FFFFFF", mid: "#BFD9E8", dark: "#4A6273", cockpit: "#7FF6FF", accent: "#7FF6FF" },
  { id: "obsidian", name: "Obsidian Ghost", cost: 1200, light: "#8A8A9A", mid: "#2A2A36", dark: "#0A0A10", cockpit: "#FF5500", accent: "#FF5500" },
];

export interface Trail { id: string; name: string; cost: number; color: string; flame: string }

export const TRAILS: Trail[] = [
  { id: "ion", name: "Ion Stream", cost: 0, color: "#00E5FF", flame: "#7FF6FF" },
  { id: "ember", name: "Ember Flame", cost: 100, color: "#FF7B33", flame: "#FFB347" },
  { id: "plasma", name: "Plasma Violet", cost: 200, color: "#B266FF", flame: "#E0B3FF" },
  { id: "solar", name: "Solar Flare", cost: 300, color: "#FFD84D", flame: "#FFF3B0" },
  { id: "toxic", name: "Toxic Vent", cost: 300, color: "#9CFF3D", flame: "#E1FFB3" },
  { id: "blood", name: "Blood Comet", cost: 450, color: "#FF1744", flame: "#FF8A9E" },
];

export const skinById = (id: string) => SKINS.find((s) => s.id === id) ?? SKINS[0];
export const trailById = (id: string) => TRAILS.find((t) => t.id === id) ?? TRAILS[0];
