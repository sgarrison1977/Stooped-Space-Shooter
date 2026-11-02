import { useCallback, useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";
import { UpgradeKey } from "./config";

export interface Profile {
  id: string;
  name: string;
  coins: number;
  bestWave: number;
  kills: number;
  runs: number;
  upgrades: Record<UpgradeKey, number>;
}

const KEY = "emberdeep_profile_v1";
const API = process.env.EXPO_PUBLIC_BACKEND_URL;

function newId() {
  return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function fresh(): Profile {
  return { id: newId(), name: "", coins: 0, bestWave: 0, kills: 0, runs: 0, upgrades: { cannon: 1, deflector: 1, hull: 1 } };
}

let cache: Profile | null = null;
const listeners = new Set<(p: Profile) => void>();

export async function loadProfile(): Promise<Profile> {
  if (cache) return cache;
  const raw = await storage.getItem<string | null>(KEY, null);
  let p = fresh();
  if (raw) {
    try { p = { ...p, ...JSON.parse(raw) }; } catch { /* corrupted -> fresh */ }
  }
  cache = p;
  return p;
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

export async function submitScore(p: Profile, wave: number, kills: number) {
  const res = await fetch(`${API}/api/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_id: p.id, name: p.name || "Pilot", wave, kills }),
  });
  if (!res.ok) throw new Error("submit failed");
  return (await res.json()) as { rank: number };
}

export interface LeaderRow { rank: number; name: string; best_wave: number; best_kills: number; runs: number; is_you: boolean }

export async function fetchLeaderboard(playerId?: string): Promise<LeaderRow[]> {
  const q = playerId ? `?player_id=${encodeURIComponent(playerId)}` : "";
  const res = await fetch(`${API}/api/leaderboard${q}`);
  if (!res.ok) throw new Error("leaderboard failed");
  return res.json();
}
