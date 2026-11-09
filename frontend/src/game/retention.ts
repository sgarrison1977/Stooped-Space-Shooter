// Retention systems: daily streak, daily missions, weekly challenge, achievements, weapon mastery,
// opt-in run modifiers and UI style unlocks. Pure functions over the Profile + a finished run.
import { weekKey, WeaponId, WEAPONS } from "./arsenal";
export { weekKey };
import type { Profile } from "./profile";

export interface RunResult {
  wave: number; kills: number; level: number; bosses: number; coins: number;
  mode: string; difficulty: string; weapon: WeaponId; cls: string; mods: string[]; livesLeft: number; combos: number;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const dayNum = (k: string) => Math.floor(Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)) / 864e5);
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// ---------- Weekly challenge (one rule per week, own leaderboard) ----------
export const WEEKLY_RULES = [
  { id: "blades", name: "Blade Week", desc: "Everyone flies Blades" },
  { id: "noheal", name: "No Repairs", desc: "No healing between waves or over time" },
  { id: "bigboss", name: "Boss Buffet", desc: "Bosses have double health" },
  { id: "glass", name: "Glass Fleet", desc: "Double damage, half hull" },
  { id: "speedy", name: "Speed Demons", desc: "Enemies move 35% faster" },
] as const;
export const weeklyRule = () => WEEKLY_RULES[+weekKey() % WEEKLY_RULES.length];

// ---------- Opt-in run modifiers: risk for bonus coins ----------
export const RUN_MODS = [
  { id: "glass", name: "Glass Cannon", desc: "2x damage, half hull", bonus: 0.5 },
  { id: "swarm", name: "Swarm", desc: "30% more enemies", bonus: 0.3 },
  { id: "ironman", name: "Ironman", desc: "No healing at all", bonus: 0.4 },
  { id: "fastfoes", name: "Fast Foes", desc: "Enemies 25% faster", bonus: 0.3 },
] as const;
export type RunModId = (typeof RUN_MODS)[number]["id"];
export const modBonus = (mods: string[]) => 1 + RUN_MODS.filter((m) => mods.includes(m.id)).reduce((a, m) => a + m.bonus, 0);

// ---------- Daily missions (3 per day, same for everyone) ----------
type MissionDef = { id: string; text: string; goal: number; reward: number; score: (r: RunResult) => number; weapon?: WeaponId };
const MISSION_POOL: MissionDef[] = [
  { id: "kills", text: "Destroy 400 enemies", goal: 400, reward: 60, score: (r) => r.kills },
  { id: "kills2", text: "Destroy 1,000 enemies", goal: 1000, reward: 120, score: (r) => r.kills },
  { id: "wave8", text: "Reach wave 8 in one run", goal: 8, reward: 70, score: (r) => r.wave },
  { id: "wave15", text: "Reach wave 15 in one run", goal: 15, reward: 140, score: (r) => r.wave },
  { id: "boss2", text: "Defeat 2 bosses", goal: 2, reward: 80, score: (r) => r.bosses },
  { id: "boss5", text: "Defeat 5 bosses", goal: 5, reward: 150, score: (r) => r.bosses },
  { id: "lvl15", text: "Reach level 15 in one run", goal: 15, reward: 90, score: (r) => r.level },
  { id: "runs3", text: "Finish 3 runs", goal: 3, reward: 60, score: () => 1 },
  { id: "daily", text: "Play the Daily Run", goal: 1, reward: 50, score: (r) => (r.mode === "daily" ? 1 : 0) },
  { id: "mod", text: "Finish a run with a modifier on", goal: 1, reward: 70, score: (r) => (r.mods.length ? 1 : 0) },
  ...WEAPONS.map((w) => ({ id: `w_${w.id}`, text: `Destroy 250 enemies with ${w.name}`, goal: 250, reward: 80, weapon: w.id, score: (r: RunResult) => (r.weapon === w.id ? r.kills : 0) })),
];
export function todaysMissions(day = dayKey()): MissionDef[] {
  const r = seeded(+day % 2147483646 || 1), pool = [...MISSION_POOL], out: MissionDef[] = [];
  while (out.length < 3) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}

// ---------- Weapon mastery (lifetime kills per weapon) ----------
export const MASTERY = [250, 1000, 2500, 5000, 10000];
export const masteryLevel = (kills: number) => MASTERY.filter((t) => kills >= t).length;
export const isGold = (p: Profile, w: string) => masteryLevel(p.mastery?.[w] ?? 0) >= MASTERY.length;

// ---------- Achievements ----------
type Ach = { id: string; name: string; desc: string; test: (p: Profile, r: RunResult) => boolean };
const reached = (n: number, diff?: string) => (_: Profile, r: RunResult) => r.wave >= n && (!diff || r.difficulty === diff);
export const ACHIEVEMENTS: Ach[] = [
  { id: "first", name: "Liftoff", desc: "Finish your first run", test: () => true },
  { id: "w10", name: "Getting Warm", desc: "Reach wave 10", test: reached(10) },
  { id: "w25", name: "Deep Space", desc: "Reach wave 25", test: reached(25) },
  { id: "w50", name: "Half Century", desc: "Reach wave 50", test: reached(50) },
  { id: "w100", name: "Centurion", desc: "Reach wave 100", test: reached(100) },
  { id: "hard20", name: "Hard Boiled", desc: "Reach wave 20 on Hard", test: reached(20, "hard") },
  { id: "ext15", name: "Extremist", desc: "Reach wave 15 on Extreme", test: reached(15, "extreme") },
  { id: "boss1", name: "Boss Slayer", desc: "Defeat a boss", test: (_, r) => r.bosses >= 1 },
  { id: "boss10", name: "Boss Breaker", desc: "Defeat 10 bosses in one run", test: (_, r) => r.bosses >= 10 },
  { id: "k1k", name: "Thousand Cuts", desc: "Destroy 1,000 enemies in one run", test: (_, r) => r.kills >= 1000 },
  { id: "k25k", name: "Exterminator", desc: "Destroy 25,000 enemies in total", test: (p) => p.kills >= 25000 },
  { id: "lvl30", name: "Overclocked", desc: "Reach level 30 in one run", test: (_, r) => r.level >= 30 },
  { id: "combo", name: "Combo Maker", desc: "Unlock a combo upgrade", test: (_, r) => r.combos >= 1 },
  { id: "combo3", name: "Combo King", desc: "Unlock 3 combos in one run", test: (_, r) => r.combos >= 3 },
  { id: "flawless", name: "Never Say Die", desc: "Reach wave 10 without losing a life", test: (_, r) => r.wave >= 10 && r.livesLeft >= 3 },
  { id: "hardcore10", name: "One Shot", desc: "Reach wave 10 in Hardcore", test: (_, r) => r.mode === "hardcore" && r.wave >= 10 },
  { id: "rush5", name: "Rush Hour", desc: "Defeat 5 bosses in Boss Rush", test: (_, r) => r.mode === "bossrush" && r.bosses >= 5 },
  { id: "dailyer", name: "Daily Driver", desc: "Finish a Daily Run", test: (_, r) => r.mode === "daily" },
  { id: "weekly", name: "Weekend Warrior", desc: "Finish a Weekly Challenge", test: (_, r) => r.mode === "weekly" },
  { id: "risk", name: "Risk Taker", desc: "Reach wave 10 with 2+ modifiers on", test: (_, r) => r.mods.length >= 2 && r.wave >= 10 },
  { id: "streak3", name: "Habit", desc: "Play 3 days in a row", test: (p) => p.streak.count >= 3 },
  { id: "streak7", name: "Devoted", desc: "Play 7 days in a row", test: (p) => p.streak.count >= 7 },
  { id: "allw", name: "Arms Dealer", desc: "Finish a run with every weapon", test: (p) => WEAPONS.every((w) => (p.mastery?.[w.id] ?? 0) > 0) },
  { id: "gold", name: "Golden Gun", desc: "Max a weapon's mastery", test: (p) => WEAPONS.some((w) => isGold(p, w.id)) },
  { id: "classes", name: "Pilot School", desc: "Finish a run with every ship class", test: (p) => (p.classesUsed ?? []).length >= 4 },
  { id: "rich", name: "Moneybags", desc: "Hold 2,000 coins", test: (p) => p.coins >= 2000 },
];

// ---------- UI styles: first 3 free, the rest unlock in on-screen order every 3 achievements ----------
export const FREE_STYLES = 3;
export const stylesUnlocked = (p: Profile) => FREE_STYLES + Math.floor((p.achievements?.length ?? 0) / 3);

// ---------- Streak cosmetics ----------
export const STREAK_REWARDS = [
  { days: 3, kind: "trail" as const, id: "streak", name: "Streak Flame trail" },
  { days: 7, kind: "skin" as const, id: "streaker", name: "Streak Runner skin" },
  { days: 30, kind: "skin" as const, id: "eternal", name: "Eternal skin" },
];

export interface RunReport { coinsFromMissions: number; missionsDone: string[]; newAchievements: string[]; streakReward: string | null; masteryUp: number | null; styleUnlocked: boolean }

// Apply a finished run to the profile: streak, missions, mastery, achievements, unlocks
export function applyRun(p0: Profile, r: RunResult): { profile: Profile; report: RunReport } {
  const p: Profile = { ...p0, streak: { ...p0.streak }, mastery: { ...p0.mastery }, achievements: [...p0.achievements] };
  const today = dayKey();
  // streak (a shield covers one missed day; earn a shield every 7 days of streak)
  if (p.streak.last !== today) {
    const gap = p.streak.last ? dayNum(today) - dayNum(p.streak.last) : 99;
    if (gap === 1) p.streak.count += 1;
    else if (gap === 2 && p.streak.shield > 0) { p.streak.shield -= 1; p.streak.count += 1; }
    else p.streak.count = 1;
    if (p.streak.count % 7 === 0) p.streak.shield = Math.min(1, p.streak.shield + 1);
    p.streak.last = today;
  }
  let streakReward: string | null = null;
  for (const sr of STREAK_REWARDS) {
    const owned = sr.kind === "skin" ? p.ownedSkins : p.ownedTrails;
    if (p.streak.count >= sr.days && !owned.includes(sr.id)) {
      if (sr.kind === "skin") p.ownedSkins = [...p.ownedSkins, sr.id]; else p.ownedTrails = [...p.ownedTrails, sr.id];
      streakReward = sr.name;
    }
  }
  // missions
  const ms = p.missions.day === today ? { ...p.missions, progress: { ...p.missions.progress } } : { day: today, progress: {} as Record<string, number>, done: [] as string[] };
  let coinsFromMissions = 0; const missionsDone: string[] = [];
  for (const m of todaysMissions(today)) {
    if (ms.done.includes(m.id)) continue;
    const cumulative = ["kills", "kills2", "boss2", "boss5", "runs3"].includes(m.id) || m.id.startsWith("w_");
    ms.progress[m.id] = cumulative ? (ms.progress[m.id] ?? 0) + m.score(r) : Math.max(ms.progress[m.id] ?? 0, m.score(r));
    if (ms.progress[m.id] >= m.goal) { ms.done = [...ms.done, m.id]; coinsFromMissions += m.reward; missionsDone.push(m.text); }
  }
  p.missions = ms; p.coins += coinsFromMissions;
  // mastery + classes used
  const before = masteryLevel(p.mastery[r.weapon] ?? 0);
  p.mastery[r.weapon] = (p.mastery[r.weapon] ?? 0) + r.kills;
  const after = masteryLevel(p.mastery[r.weapon]);
  p.classesUsed = Array.from(new Set([...(p.classesUsed ?? []), r.cls]));
  // achievements
  const stylesBefore = stylesUnlocked(p);
  const newAchievements = ACHIEVEMENTS.filter((a) => !p.achievements.includes(a.id) && a.test(p, r)).map((a) => a.id);
  p.achievements.push(...newAchievements);
  return {
    profile: p,
    report: { coinsFromMissions, missionsDone, newAchievements, streakReward, masteryUp: after > before ? after : null, styleUnlocked: stylesUnlocked(p) > stylesBefore },
  };
}
