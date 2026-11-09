import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { storage } from "@/src/utils/storage";
import { CLASSES } from "./arsenal";
import { GameState } from "./sim";

// One auto-saved run in progress; cleared when the run ends.
const KEY = "stooopid_run_v1";

export interface RunSummary { wave: number; level: number; lives: number }

export async function saveRun(g: GameState) {
  if (g.dead) return;
  await storage.setItem(KEY, JSON.stringify(g));
}

export async function loadRun(): Promise<GameState | null> {
  const raw = await storage.getItem<string | null>(KEY, null);
  if (!raw) return null;
  try {
    const g = JSON.parse(raw) as GameState;
    // restore shared references lost in JSON
    g.boss = g.boss ? g.enemies.find((e) => e.id === g.boss!.id) ?? null : null;
    g.cls = CLASSES.find((c) => c.id === g.cls.id) ?? CLASSES[0];
    g.lives = g.lives ?? 3;
    return g;
  } catch {
    return null;
  }
}

export const clearRun = () => storage.removeItem(KEY);

// Home screen: summary of the saved run, refreshed whenever the screen gains focus
export function useSavedRun() {
  const [run, setRun] = useState<RunSummary | null>(null);
  useFocusEffect(useCallback(() => {
    let alive = true;
    loadRun().then((g) => alive && setRun(g ? { wave: g.wave, level: g.level, lives: g.lives } : null));
    return () => { alive = false; };
  }, []));
  return run;
}
