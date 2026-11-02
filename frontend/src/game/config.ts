export type UpgradeKey = "cannon" | "deflector" | "hull";

export const UPGRADES: { key: UpgradeKey; name: string; desc: string; base: number }[] = [
  { key: "cannon", name: "Cannon Array", desc: "+4 cannon damage", base: 30 },
  { key: "deflector", name: "Deflector Screen", desc: "+4% damage resistance", base: 40 },
  { key: "hull", name: "Hull Plating", desc: "+12 max hull", base: 35 },
];

export const MAX_UPGRADE_LEVEL = 15;

export function upgradeCost(base: number, level: number) {
  return Math.round(base * Math.pow(1.45, level - 1));
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
export const roman = (n: number) => ROMAN[n] ?? String(n);

export interface RunStats {
  damage: number;
  resist: number; // 0..0.75
  maxHp: number;
  fireRate: number; // shots per second
  projectiles: number;
  crit: number; // 0..1
  pickup: number; // px
  repairPerKill: number;
}

export function baseStats(u: Record<UpgradeKey, number>): RunStats {
  return {
    damage: 5 + 4 * u.cannon,
    resist: Math.min(0.6, 0.04 * (u.deflector - 1)),
    maxHp: 100 + 12 * (u.hull - 1),
    fireRate: 2.4,
    projectiles: 1,
    crit: 0.05,
    pickup: 120,
    repairPerKill: 0,
  };
}

export type SystemIcon = "rocket" | "shield" | "zap" | "magnet" | "crosshair" | "wrench" | "sparkles" | "heart";

export interface SystemDef {
  id: string;
  name: string;
  desc: string;
  icon: SystemIcon;
}

export const SYSTEMS: SystemDef[] = [
  { id: "ion_lance", name: "Ion Lance", desc: "+15% cannon damage", icon: "rocket" },
  { id: "hull_plating", name: "Hull Plating", desc: "+20 max hull, repaired", icon: "shield" },
  { id: "overclocked", name: "Overclocked Coils", desc: "+15% fire rate", icon: "zap" },
  { id: "tractor", name: "Tractor Beam", desc: "+40% pickup range", icon: "magnet" },
  { id: "targeting", name: "Targeting Array", desc: "+10% critical chance", icon: "crosshair" },
  { id: "nanite", name: "Nanite Repair", desc: "Repair 3 hull per kill", icon: "wrench" },
  { id: "twin", name: "Twin Barrels", desc: "+1 projectile", icon: "sparkles" },
  { id: "deflector", name: "Deflector Pulse", desc: "+5% damage resistance", icon: "heart" },
];

export function pickSystems(count = 3): SystemDef[] {
  const pool = [...SYSTEMS];
  const out: SystemDef[] = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}
