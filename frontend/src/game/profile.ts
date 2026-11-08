import { useCallback, useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";
import { UpgradeKey } from "./config";
import { DifficultyId } from "./content";
import { AbilityId, ClassId, ModeId, WeaponId } from "./arsenal";

export interface Profile {
  id: string;
  name: string;
  coins: number;
  bestWave: number;
  kills: number;
  runs: number;
  upgrades: Record<UpgradeKey, number>;
  difficulty: DifficultyId;
  skin: string;
  trail: string;
  ownedSkins: string[];
  ownedTrails: string[];
  muted: boolean;
  mode: ModeId; weapon: WeaponId; ability: AbilityId; shipClass: ClassId;
  // Boss gallery: keyed by boss index
  bossRecords: Record<string, BossRecord>;
}

export interface BossRecord { kills: number; fastest: number; fastestDifficulty: DifficultyId }

export const formatSecs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}.${Math.floor((s * 10) % 10)}`;

// Merge this run's boss kills into the gallery; returns a highlight line for new records.
export function mergeBossKills(p: Profile, kills: { variant: number; secs: number }[], names: string[]): { records: Record<string, BossRecord>; highlight: string | null } {
  const records = { ...p.bossRecords };
  let highlight: string | null = null;
  for (const k of kills) {
    const key = String(k.variant);
    const prev = records[key];
    if (!prev) {
      records[key] = { kills: 1, fastest: k.secs, fastestDifficulty: p.difficulty };
      highlight = `First kill: ${names[k.variant]} in ${formatSecs(k.secs)}`;
    } else {
      const faster = k.secs < prev.fastest;
      records[key] = { kills: prev.kills + 1, fastest: faster ? k.secs : prev.fastest, fastestDifficulty: faster ? p.difficulty : prev.fastestDifficulty };
      if (faster) highlight = `New fastest: ${names[k.variant]} in ${formatSecs(k.secs)}`;
    }
  }
  return { records, highlight };
}

const KEY = "emberdeep_profile_v1";
const API = process.env.EXPO_PUBLIC_BACKEND_URL;

function newId() {
  return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function fresh(): Profile {
  return {
    id: newId(), name: "", coins: 0, bestWave: 0, kills: 0, runs: 0, upgrades: { cannon: 1, deflector: 1, hull: 1 },
    difficulty: "normal", skin: "vanguard", trail: "ion", ownedSkins: ["vanguard"], ownedTrails: ["ion"], muted: false, bossRecords: {}, mode: "standard", weapon: "cannon", ability: "dash", shipClass: "standard",
  };
}

let cache: Profile | null = null;
const listeners = new Set<(p: Profile) => void>();

let loading: Promise<Profile> | null = null;

// Single in-flight load so concurrent callers never overwrite each other's updates
export function loadProfile(): Promise<Profile> {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = (async () => {
      const raw = await storage.getItem<string | null>(KEY, null);
      let p = fresh();
      if (raw) {
        try { p = { ...p, ...JSON.parse(raw) }; } catch { /* corrupted -> fresh */ }
      }
      cache = cache ?? p;
      return cache;
    })();
  }
  return loading;
}

export async function saveProfile(p: Profile) {
  cache = p;
  listeners.forEach((l) => l(p));
  await storage.setItem(KEY, JSON.stringify(p));
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(cache);
  useEffect(() => {
    let alive = true;
    loadProfile().then((p) => alive && setProfile(p));
    listeners.add(setProfile);
    return () => { alive = false; listeners.delete(setProfile); };
  }, []);
  const update = useCallback(async (fn: (p: Profile) => Profile) => {
    const cur = await loadProfile();
    await saveProfile(fn(cur));
  }, []);
  return { profile, update };
}

export async function submitScore(p: Profile, wave: number, kills: number, board: string) {
  const res = await fetch(`${API}/api/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_id: p.id, name: p.name || "Pilot", wave, kills, difficulty: board }),
  });
  if (!res.ok) throw new Error("submit failed");
  return (await res.json()) as { rank: number };
}

export interface LeaderRow { rank: number; name: string; best_wave: number; best_kills: number; runs: number; is_you: boolean }

export async function fetchLeaderboard(difficulty: string, playerId?: string): Promise<LeaderRow[]> {
  const q = `?difficulty=${difficulty}` + (playerId ? `&player_id=${encodeURIComponent(playerId)}` : "");
  const res = await fetch(`${API}/api/leaderboard${q}`);
  if (!res.ok) throw new Error("leaderboard failed");
  return res.json();
}
