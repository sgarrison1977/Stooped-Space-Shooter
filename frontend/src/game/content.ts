// Game content data: difficulties, bosses, ship skins, engine trails.
// Art colors are fixed game palette (identical in every theme).

export type DifficultyId = "casual" | "normal" | "hard" | "extreme";

export interface DifficultyDef {
  id: DifficultyId; name: string; desc: string;
  hp: number; dmg: number; speed: number; spawn: number; coins: number; regen: number;
  cap: number; // max enemies alive at once
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: "casual", name: "Casual", desc: "Gentle dive · 0.75x coins", hp: 0.7, dmg: 0.6, speed: 0.85, spawn: 0.6, coins: 0.75, regen: 1.6, cap: 18 },
  { id: "normal", name: "Normal", desc: "The intended dive · 1x coins", hp: 1, dmg: 1, speed: 1, spawn: 1, coins: 1, regen: 1, cap: 26 },
  { id: "hard", name: "Hard", desc: "Tougher swarm · 1.5x coins", hp: 1.35, dmg: 1.4, speed: 1.12, spawn: 1.25, coins: 1.5, regen: 0.5, cap: 34 },
  { id: "extreme", name: "Extreme", desc: "No regen, no mercy · 2.2x coins", hp: 1.8, dmg: 1.9, speed: 1.25, spawn: 1.5, coins: 2.2, regen: 0, cap: 42 },
];

export const difficulty = (id: string) => DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];

export type BossPattern = "ring" | "spiral" | "fan" | "rotor" | "charge" | "summon" | "mines" | "storm";

export type MobKind = "grunt" | "dart" | "brute" | "splitter" | "shard" | "gunner" | "phantom" | "elite" | "juggernaut";

export interface MobDef {
  name: string; desc: string;
  hp: number; speed: number; dmg: number; r: number; coins: number; xp: number;
  minWave: number; weight: number;
  dark: string; mid: string; light: string; core: string;
}

// Multipliers are applied on top of the per-wave base stats.
export const MOBS: Record<MobKind, MobDef> = {
  grunt: { name: "Raider", desc: "Swarming scout", hp: 1, speed: 1, dmg: 1, r: 11, coins: 1, xp: 1, minWave: 1, weight: 10, dark: "#5A1208", mid: "#E5533A", light: "#FFB199", core: "#FFE45C" },
  dart: { name: "Needle Dart", desc: "Fast, weaving and fragile", hp: 0.5, speed: 1.75, dmg: 0.7, r: 9, coins: 1, xp: 1, minWave: 2, weight: 3.5, dark: "#5C4300", mid: "#FFC400", light: "#FFF1A8", core: "#FFFFFF" },
  brute: { name: "Slag Brute", desc: "Armoured, slow, shrugs off knockback", hp: 3.2, speed: 0.55, dmg: 1.6, r: 16, coins: 3, xp: 2, minWave: 4, weight: 2.5, dark: "#1E1A1A", mid: "#6B5E5A", light: "#C9B8B0", core: "#FF5500" },
  splitter: { name: "Shardling", desc: "Splits into shards when destroyed", hp: 1.6, speed: 0.85, dmg: 1, r: 13, coins: 2, xp: 2, minWave: 5, weight: 2.5, dark: "#0B3D2A", mid: "#2BC48A", light: "#B8FFE2", core: "#E8FFF6" },
  shard: { name: "Shard", desc: "Splinter of a Shardling", hp: 0.35, speed: 1.5, dmg: 0.6, r: 7, coins: 0, xp: 1, minWave: 999, weight: 0, dark: "#0B3D2A", mid: "#2BC48A", light: "#B8FFE2", core: "#E8FFF6" },
  gunner: { name: "Ember Gunner", desc: "Keeps its distance and shoots", hp: 1.5, speed: 0.8, dmg: 0.8, r: 12, coins: 2, xp: 2, minWave: 7, weight: 1.8, dark: "#2A0F5A", mid: "#8A4DFF", light: "#D9C2FF", core: "#FF7BF2" },
  phantom: { name: "Phantom", desc: "Blinks right next to you", hp: 1.3, speed: 0.9, dmg: 1.1, r: 12, coins: 2, xp: 2, minWave: 6, weight: 2, dark: "#06323A", mid: "#1FB8D1", light: "#B5F6FF", core: "#FFFFFF" },
  elite: { name: "Marauder", desc: "Heavily armed elite", hp: 4, speed: 0.8, dmg: 1.8, r: 18, coins: 5, xp: 5, minWave: 4, weight: 1, dark: "#5A1208", mid: "#FF9A3C", light: "#FFC27A", core: "#FFE45C" },
  juggernaut: { name: "Juggernaut", desc: "A walking fortress", hp: 9, speed: 0.45, dmg: 2.5, r: 22, coins: 10, xp: 8, minWave: 8, weight: 0.6, dark: "#140600", mid: "#4A2A1A", light: "#FF7B33", core: "#FFE45C" },
};

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
