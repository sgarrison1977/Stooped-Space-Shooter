// Ship prestige: reach wave 30 with a ship to prestige it (badge + resets its wave progress).
// Every prestige opens 3 more levels of that ship's 12 coin-bought bonuses (12 levels each).
import type { ClassId } from "./arsenal";
import type { Profile } from "./profile";

export const PRESTIGE_WAVE = 30;
export const MAX_BONUS_LV = 12;
export const LEVELS_PER_PRESTIGE = 3;

export const BONUSES = [
  { id: "dmg", name: "Firepower", desc: "+2% damage per level", icon: "rocket" },
  { id: "hull", name: "Armor Plates", desc: "+3% max hull per level", icon: "shield" },
  { id: "fire", name: "Trigger Finger", desc: "+1.5% fire rate per level", icon: "zap" },
  { id: "crit", name: "Sharp Eye", desc: "+1% critical chance per level", icon: "crosshair" },
  { id: "resist", name: "Deflector Tune", desc: "+1% damage resistance per level", icon: "shield-half" },
  { id: "magnet", name: "Magnet Coil", desc: "+4% pickup range per level", icon: "magnet" },
  { id: "repair", name: "Scrap Welder", desc: "Repair 0.2 hull per kill per level", icon: "wrench" },
  { id: "thrust", name: "Thruster Tune", desc: "+1.5% flight speed per level", icon: "wind" },
  { id: "coins", name: "Coin Hoarder", desc: "+3% coins per level", icon: "coins" },
  { id: "xp", name: "Fast Learner", desc: "+3% XP per level", icon: "sparkles" },
  { id: "boss", name: "Boss Breaker", desc: "Bosses spawn with 2% less health per level", icon: "skull" },
  { id: "heal", name: "Second Wind", desc: "+2% hull repaired between waves per level", icon: "heart" },
] as const;

export type BonusId = (typeof BONUSES)[number]["id"];

export const bonusCost = (lv: number) => Math.round(60 * Math.pow(1.32, lv));
export const prestigeCount = (p: Profile, cls: string) => p.prestige?.[cls] ?? 0;
export const shipBest = (p: Profile, cls: string) => p.shipBest?.[cls] ?? 0;
export const canPrestige = (p: Profile, cls: string) => shipBest(p, cls) >= PRESTIGE_WAVE;
export const bonusLv = (p: Profile, cls: string, id: string) => p.bonuses?.[cls]?.[id] ?? 0;
export const maxBonusLv = (p: Profile, cls: string) => Math.min(MAX_BONUS_LV, prestigeCount(p, cls) * LEVELS_PER_PRESTIGE);

const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
// Fixed metal colours (identical in every UI style)
export const TIER_COLORS = ["#CD7F32", "#C0C0C0", "#FFD700", "#9FE8E0", "#B9F2FF"];
export const badgeTier = (n: number) => Math.min(TIERS.length, n) - 1;
export const badgeName = (n: number) => (n > 0 ? TIERS[badgeTier(n)] : "");

export function prestigeShip(p: Profile, cls: ClassId): Profile {
  if (!canPrestige(p, cls)) return p;
  return { ...p, prestige: { ...p.prestige, [cls]: prestigeCount(p, cls) + 1 }, shipBest: { ...p.shipBest, [cls]: 0 } };
}

export function buyBonus(p: Profile, cls: ClassId, id: string): Profile {
  const lv = bonusLv(p, cls, id), cost = bonusCost(lv);
  if (lv >= maxBonusLv(p, cls) || p.coins < cost) return p;
  return { ...p, coins: p.coins - cost, bonuses: { ...p.bonuses, [cls]: { ...(p.bonuses?.[cls] ?? {}), [id]: lv + 1 } } };
}
