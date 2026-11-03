import { AppState } from "react-native";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";

const SOURCES = {
  laser: require("../../assets/sounds/laser.wav"),
  explosion: require("../../assets/sounds/explosion.wav"),
  boss_explosion: require("../../assets/sounds/boss_explosion.wav"),
  hit: require("../../assets/sounds/hit.wav"),
  boss_warning: require("../../assets/sounds/boss_warning.wav"),
  levelup: require("../../assets/sounds/levelup.wav"),
  pickup: require("../../assets/sounds/pickup.wav"),
};
const MUSIC = require("../../assets/sounds/music.wav");

export type Sfx = keyof typeof SOURCES;

const POOL: Partial<Record<Sfx, number>> = { laser: 4, explosion: 4, pickup: 3, hit: 2 };
const VOLUME: Record<Sfx, number> = { laser: 0.22, explosion: 0.45, boss_explosion: 0.9, hit: 0.6, boss_warning: 0.7, levelup: 0.6, pickup: 0.25 };
const GAP_MS: Partial<Record<Sfx, number>> = { laser: 70, explosion: 45, pickup: 60, hit: 120 };

const pools: Partial<Record<Sfx, { players: AudioPlayer[]; i: number }>> = {};
const last: Partial<Record<Sfx, number>> = {};
let music: AudioPlayer | null = null;
let muted = false;
let musicWanted = false;
let ready = false;

export function initAudio() {
  if (ready) return;
  ready = true;
  setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: "mixWithOthers" }).catch(() => {});
  AppState.addEventListener("change", (st) => {
    if (!music) return;
    if (st === "active") { if (musicWanted && !muted) safe(() => music?.play()); } else safe(() => music?.pause());
  });
}

function safe(fn: () => void) {
  try { fn(); } catch { /* audio is best-effort */ }
}

function pool(name: Sfx) {
  let p = pools[name];
  if (!p) {
    const n = POOL[name] ?? 1;
    p = { players: Array.from({ length: n }, () => { const pl = createAudioPlayer(SOURCES[name]); pl.volume = VOLUME[name]; return pl; }), i: 0 };
    pools[name] = p;
  }
  return p;
}

export function playSfx(name: Sfx) {
  if (muted) return;
  const now = Date.now();
  const gap = GAP_MS[name];
  if (gap && now - (last[name] ?? 0) < gap) return;
  last[name] = now;
  safe(() => {
    const p = pool(name);
    const pl = p.players[p.i];
    p.i = (p.i + 1) % p.players.length;
    pl.seekTo(0).catch(() => {});
    pl.play();
  });
}

export function startMusic() {
  musicWanted = true;
  if (muted) return;
  safe(() => {
    if (!music) { music = createAudioPlayer(MUSIC); music.loop = true; music.volume = 0.35; }
    if (!music.playing) music.play();
  });
}

export function setMuted(m: boolean) {
  muted = m;
  if (m) safe(() => music?.pause());
  else if (musicWanted) startMusic();
}
