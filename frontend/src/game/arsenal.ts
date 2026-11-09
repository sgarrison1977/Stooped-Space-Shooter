import { SystemIcon } from "./config";

export type WeaponId = "cannon" | "spread" | "flame" | "homing" | "arc" | "blades";
export type AbilityId = "dash" | "shield" | "overdrive" | "gravity" | "timeslow";
export type ClassId = "standard" | "interceptor" | "gunship" | "engineer";
export type ModeId = "standard" | "bossrush" | "daily" | "hardcore";
export type PickupKind = "shield" | "magnet" | "repair" | "weapon";

type Item<T> = { id: T; name: string; desc: string };

export const WEAPONS: Item<WeaponId>[] = [
  { id: "cannon", name: "Cannon", desc: "Reliable nose cannon" },
  { id: "spread", name: "Spread", desc: "5-shot fan · brutal up close, short range" },
  { id: "flame", name: "Flamer", desc: "Short cone of fire · melts swarms" },
  { id: "homing", name: "Missiles", desc: "Slow homing missiles with a small blast" },
  { id: "arc", name: "Arc", desc: "Lightning chains 3–5 enemies · weak vs bosses" },
  { id: "blades", name: "Blades", desc: "Spinning blades orbit you · ram enemies" },
];

export const ABILITIES: (Item<AbilityId> & { cd: number; icon: "zap" | "shield" | "flame" | "magnet" | "clock" })[] = [
  { id: "dash", name: "Dash", desc: "Burst forward, briefly invulnerable", cd: 4, icon: "zap" },
  { id: "shield", name: "Shield", desc: "Reflect bullets for 1.2s", cd: 9, icon: "shield" },
  { id: "overdrive", name: "Overdrive", desc: "Double fire rate for 5s", cd: 14, icon: "flame" },
  { id: "gravity", name: "Gravity", desc: "Pull enemies + XP together, then boom", cd: 12, icon: "magnet" },
  { id: "timeslow", name: "Time Slow", desc: "Everything but you slows for 3s", cd: 16, icon: "clock" },
];

export interface ClassDef extends Item<ClassId> { move: number; hp: number; dmg: number; proj: number; resist: number; drone: boolean }
export const CLASSES: ClassDef[] = [
  { id: "standard", name: "Standard", desc: "Balanced fighter", move: 1, hp: 1, dmg: 1, proj: 0, resist: 0, drone: false },
  { id: "interceptor", name: "Interceptor", desc: "Fast and light · weaker guns", move: 1.3, hp: 0.75, dmg: 0.85, proj: 0, resist: 0, drone: false },
  { id: "gunship", name: "Gunship", desc: "Slow and tanky · twin cannons", move: 0.8, hp: 1.5, dmg: 1, proj: 1, resist: 0.1, drone: false },
  { id: "engineer", name: "Engineer", desc: "Helper drone shoots for you", move: 1, hp: 0.9, dmg: 1, proj: 0, resist: 0, drone: true },
];

export type SpeedId = "slow" | "normal" | "fast" | "lightning";
export const SPEEDS: (Item<SpeedId> & { mul: number })[] = [
  { id: "slow", name: "Slow", desc: "Everything moves at 75% speed", mul: 0.75 },
  { id: "normal", name: "Normal", desc: "The standard pace", mul: 1 },
  { id: "fast", name: "Fast", desc: "Everything runs 1.5x faster", mul: 1.5 },
  { id: "lightning", name: "Lightning Fast", desc: "Everything runs 2x faster", mul: 2 },
];

export const MODES: Item<ModeId>[] = [
  { id: "standard", name: "Standard", desc: "Waves, bosses every 3rd wave" },
  { id: "bossrush", name: "Boss Rush", desc: "Endless bosses back to back · Normal difficulty" },
  { id: "daily", name: "Daily Run", desc: "Same seed, loadout + stats for everyone today" },
  { id: "hardcore", name: "Hardcore", desc: "One hit and you're done · Normal difficulty" },
];

export const EVOLUTIONS: { id: string; name: string; desc: string; icon: SystemIcon; from: [string, string] }[] = [
  { id: "plasma_storm", name: "Plasma Storm", desc: "EVOLUTION · +2 projectiles, +30% damage", icon: "sparkles", from: ["twin", "ion_lance"] },
  { id: "singularity", name: "Singularity Coils", desc: "EVOLUTION · +40% fire rate, +15% crit", icon: "zap", from: ["overclocked", "targeting"] },
  { id: "bastion", name: "Bastion Hull", desc: "EVOLUTION · +60 max hull, +15% resist", icon: "shield", from: ["hull_plating", "deflector"] },
  { id: "vampiric", name: "Vampiric Nanites", desc: "EVOLUTION · repair 8 per kill, huge pickup", icon: "heart", from: ["nanite", "tractor"] },
];

type WUp = { id: string; name: string; desc: string; icon: SystemIcon };
// Weapon-specific level-up upgrades, offered only for the equipped weapon
export const WEAPON_UPGRADES: Record<WeaponId, WUp[]> = {
  cannon: [
    { id: "cn_heavy", name: "Heavy Shells", desc: "CANNON · +25% cannon damage", icon: "rocket" },
    { id: "cn_velocity", name: "Hypervelocity", desc: "CANNON · +30% shot speed and range", icon: "zap" },
  ],
  spread: [
    { id: "sp_choke", name: "Wide Choke", desc: "SPREAD · +2 pellets per blast", icon: "sparkles" },
    { id: "sp_barrel", name: "Long Barrel", desc: "SPREAD · +35% range", icon: "crosshair" },
  ],
  flame: [
    { id: "fl_napalm", name: "Napalm Mix", desc: "FLAMER · +30% fire damage", icon: "rocket" },
    { id: "fl_nozzle", name: "Pressure Nozzle", desc: "FLAMER · +30% flame range", icon: "crosshair" },
  ],
  homing: [
    { id: "hm_pod", name: "Missile Pod", desc: "MISSILES · +1 missile per volley", icon: "sparkles" },
    { id: "hm_warhead", name: "Big Warheads", desc: "MISSILES · +30% blast radius", icon: "rocket" },
  ],
  arc: [
    { id: "ar_fork", name: "Forked Lightning", desc: "ARC · +1 chain target", icon: "sparkles" },
    { id: "ar_volt", name: "High Voltage", desc: "ARC · +30% lightning damage", icon: "zap" },
    { id: "ar_reach", name: "Long Arc", desc: "ARC · +25% chain range", icon: "crosshair" },
  ],
  blades: [
    { id: "bl_extra", name: "Extra Blade", desc: "BLADES · +1 orbiting blade", icon: "sparkles" },
    { id: "bl_motor", name: "Spin Motor", desc: "BLADES · +30% spin speed, hit more often", icon: "zap" },
    { id: "bl_tether", name: "Long Tether", desc: "BLADES · +20% orbit reach and hit size", icon: "crosshair" },
  ],
};

// Weapon combo: unlocks once both listed weapon upgrades have 2+ picks
export const WEAPON_EVOS: Record<WeaponId, WUp & { from: [string, string] }> = {
  cannon: { id: "cn_evo", name: "Explosive Rounds", desc: "COMBO · cannon shots explode on impact", icon: "sparkles", from: ["cn_heavy", "cn_velocity"] },
  spread: { id: "sp_evo", name: "Flak Storm", desc: "COMBO · pellets pierce through enemies", icon: "sparkles", from: ["sp_choke", "sp_barrel"] },
  flame: { id: "fl_evo", name: "Dragon's Breath", desc: "COMBO · flames also blast out behind you", icon: "sparkles", from: ["fl_napalm", "fl_nozzle"] },
  homing: { id: "hm_evo", name: "Cluster Warheads", desc: "COMBO · blasts throw out shrapnel", icon: "sparkles", from: ["hm_pod", "hm_warhead"] },
  arc: { id: "ar_evo", name: "Storm Fork", desc: "COMBO · lightning splits on every bounce", icon: "sparkles", from: ["ar_fork", "ar_volt"] },
  blades: { id: "bl_evo", name: "Blade Storm", desc: "COMBO · blades fling razor shards outward", icon: "sparkles", from: ["bl_extra", "bl_motor"] },
};

const QUICK: WUp = { id: "ab_cd", name: "Quick Recharge", desc: "ABILITY · 12% shorter cooldown", icon: "wrench" };
export const ABILITY_UPGRADES: Record<AbilityId, WUp[]> = {
  dash: [QUICK, { id: "ab_dash", name: "Phase Dash", desc: "DASH · dash further, longer invulnerability", icon: "zap" }],
  shield: [QUICK, { id: "ab_shield", name: "Mirror Field", desc: "SHIELD · reflects 0.6s longer", icon: "shield" }],
  overdrive: [QUICK, { id: "ab_over", name: "Afterburn Core", desc: "OVERDRIVE · lasts 2s longer", icon: "zap" }],
  gravity: [QUICK, { id: "ab_grav", name: "Event Horizon", desc: "GRAVITY · +30% pull range and blast damage", icon: "magnet" }],
  timeslow: [QUICK, { id: "ab_slow", name: "Deep Freeze", desc: "TIME SLOW · lasts 1s longer", icon: "crosshair" }],
};

export const CLASS_UPGRADES: Record<ClassId, WUp[]> = {
  standard: [{ id: "cl_std", name: "Balanced Tuning", desc: "STANDARD · +8% damage, +10 max hull", icon: "rocket" }],
  interceptor: [
    { id: "cl_burn", name: "Afterburners", desc: "INTERCEPTOR · +12% flight speed", icon: "zap" },
    { id: "cl_hot", name: "Hot Guns", desc: "INTERCEPTOR · +12% damage", icon: "rocket" },
  ],
  gunship: [{ id: "cl_hull", name: "Reinforced Hull", desc: "GUNSHIP · +25 max hull, +3% resist", icon: "shield" }],
  engineer: [
    { id: "cl_drone", name: "Extra Drone", desc: "ENGINEER · +1 helper drone", icon: "sparkles" },
    { id: "cl_dronefire", name: "Drone Overclock", desc: "ENGINEER · drones fire faster and harder", icon: "wrench" },
  ],
};

// Generic systems that do nothing for a given weapon
export const SYSTEM_EXCLUDE: Partial<Record<WeaponId, string[]>> = {
  arc: ["twin"], blades: ["overclocked"],
};

export const todaySeed = () => { const d = new Date(); return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); };

export function dailyLoadout() {
  const s = todaySeed();
  return { weapon: WEAPONS[s % WEAPONS.length].id, ability: ABILITIES[(s >> 2) % ABILITIES.length].id, cls: CLASSES[(s >> 4) % CLASSES.length].id };
}

export const BOARDS = [
  { id: "casual", name: "Casual" }, { id: "normal", name: "Normal" }, { id: "hard", name: "Hard" }, { id: "extreme", name: "Extreme" },
  { id: "bossrush", name: "Boss Rush" }, { id: "hardcore", name: "Hardcore" }, { id: `daily-${todaySeed()}`, name: "Today" },
];
