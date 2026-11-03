import { RunStats } from "./config";
import { BOSSES, DifficultyDef, MobKind, MOBS } from "./content";

export type Vec = { x: number; y: number };
export type EnemyKind = MobKind | "boss";

export interface Enemy {
  id: number; x: number; y: number; hp: number; maxHp: number; speed: number; r: number; dmg: number;
  kind: EnemyKind; angle: number; flash: number; fireTimer: number; ringTimer: number;
  variant: number; spin: number; warn: number; dash: number; dvx: number; dvy: number; patT: number; spawnedAt: number;
}
export interface Bullet { id: number; x: number; y: number; vx: number; vy: number; dmg: number; crit: boolean; life: number }
export interface EBullet { id: number; x: number; y: number; vx: number; vy: number; dmg: number; life: number; homing?: boolean; fuse?: number }
export interface Gem { id: number; x: number; y: number; value: number; pulled: boolean }
export interface Floater { id: number; x: number; y: number; text: string; life: number; crit: boolean }
export type ParticleTone = "ember" | "spark" | "exhaust";
export interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; tone: ParticleTone }

export interface GameState {
  w: number; h: number;
  player: { x: number; y: number; vx: number; vy: number; hp: number; angle: number; invuln: number; thrust: number };
  stats: RunStats;
  enemies: Enemy[]; bullets: Bullet[]; eBullets: EBullet[]; gems: Gem[]; floaters: Floater[]; particles: Particle[];
  wave: number; waveTime: number; spawnTimer: number; fireTimer: number;
  kills: number; coins: number; xp: number; xpNext: number; level: number;
  pendingLevelUps: number; nextId: number; dead: boolean;
  bossSpawned: boolean; boss: Enemy | null; bossName: string; bossBanner: number; bossesDown: number; bossCount: number;
  bossKills: { variant: number; secs: number }[];
  seen: string[]; intro: { name: string; desc: string; t: number } | null;
  shake: number; time: number; mods: DifficultyDef;
}

export const WAVE_SECONDS = 30;
export const PLAYER_R = 13;
const BOSS_AT = 10; // seconds into a boss wave
const BOSS_EVERY = 3; // boss on waves 3, 6, 9...
const MAX_ENEMIES = 70;
const MAX_PARTICLES = 220;
// "On ice" handling: thrust accelerates, very little friction, walls bounce.
const ACCEL = 950;
const MAX_SPEED = 330;
const FRICTION = 1.7;
const TURN_RATE = 7; // radians per second
const INVULN = 0.75;
const REGEN_PER_SEC = 0.6;

export function createGame(stats: RunStats, w: number, h: number, mods: DifficultyDef): GameState {
  return {
    w, h,
    player: { x: w / 2, y: h / 2, vx: 0, vy: 0, hp: stats.maxHp, angle: -Math.PI / 2, invuln: 0, thrust: 0 },
    stats,
    enemies: [], bullets: [], eBullets: [], gems: [], floaters: [], particles: [],
    wave: 1, waveTime: 0, spawnTimer: 0.8, fireTimer: 0,
    kills: 0, coins: 0, xp: 0, xpNext: 5, level: 1,
    pendingLevelUps: 0, nextId: 1, dead: false,
    bossSpawned: false, boss: null, bossName: "", bossBanner: 0, bossesDown: 0, bossCount: 0, bossKills: [], seen: [], intro: null,
    shake: 0, time: 0, mods,
  };
}

function edgePoint(s: GameState, m: number): Vec {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: Math.random() * s.w, y: -m };
  if (side === 1) return { x: s.w + m, y: Math.random() * s.h };
  if (side === 2) return { x: Math.random() * s.w, y: s.h + m };
  return { x: -m, y: Math.random() * s.h };
}

function spawnEnemy(s: GameState, kind: EnemyKind, at?: Vec) {
  const w = s.wave;
  const m = s.mods;
  const cycle = Math.floor(s.bossCount / BOSSES.length);
  const mob = kind === "boss" ? null : MOBS[kind];
  const cfg = !mob
    ? { hp: (120 + w * 70) * (1 + cycle * 0.5), speed: 22 + w, r: 36, dmg: 12 + w * 2 }
    : { hp: (8 + w * 4) * mob.hp, speed: (Math.min(90, 38 + w * 2.5) + Math.random() * 14) * mob.speed, r: mob.r, dmg: (5 + w * 1.2) * mob.dmg };
  const pt = at ?? edgePoint(s, cfg.r + 10);
  const hp = cfg.hp * m.hp;
  const e: Enemy = {
    id: s.nextId++, x: pt.x, y: pt.y, hp, maxHp: hp, speed: cfg.speed * m.speed, r: cfg.r, dmg: cfg.dmg * m.dmg,
    kind, angle: 0, flash: 0, fireTimer: 2, ringTimer: 2.5,
    variant: 0, spin: 0, warn: 0, dash: 0, dvx: 0, dvy: 0, patT: 0, spawnedAt: s.time,
  };
  s.enemies.push(e);
  if (mob && kind !== "grunt" && kind !== "shard" && !s.seen.includes(kind)) {
    s.seen.push(kind);
    s.intro = { name: mob.name, desc: mob.desc, t: 2.4 };
  }
  if (kind === "boss") {
    e.variant = s.bossCount % BOSSES.length;
    s.bossCount += 1;
    s.boss = e;
    s.bossName = BOSSES[e.variant].name;
    s.bossBanner = 2.6;
  }
}

// Weighted pick among enemy types unlocked by the current wave.
function pickMob(s: GameState): MobKind {
  const pool = (Object.keys(MOBS) as MobKind[]).filter((k) => MOBS[k].weight > 0 && MOBS[k].minWave <= s.wave);
  let r = Math.random() * pool.reduce((a, k) => a + MOBS[k].weight, 0);
  for (const k of pool) { r -= MOBS[k].weight; if (r <= 0) return k; }
  return "grunt";
}

// Each named boss has its own attack pattern.
function bossAttack(s: GameState, e: Enemy, dt: number) {
  const p = s.player;
  const bs = Math.min(200, 100 + s.wave * 4) * (0.85 + s.mods.speed * 0.15);
  const bd = (5 + s.wave) * s.mods.dmg;
  const shoot = (a: number, sp = bs, extra: Partial<EBullet> = {}) =>
    s.eBullets.push({ id: s.nextId++, x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: bd, life: 5, ...extra });
  const ring = (n: number, off: number, sp = bs) => { for (let i = 0; i < n; i++) shoot(off + (i / n) * Math.PI * 2, sp); };
  const minion = () => {
    if (s.enemies.length >= Math.min(s.mods.cap, 10 + s.wave * 2)) return;
    const a = Math.random() * Math.PI * 2;
    spawnEnemy(s, "grunt", { x: e.x + Math.cos(a) * (e.r + 14), y: e.y + Math.sin(a) * (e.r + 14) });
  };
  const aim = e.angle;
  e.patT += dt; e.ringTimer -= dt; e.fireTimer -= dt;
  switch (BOSSES[e.variant].pattern) {
    case "ring":
      if (e.ringTimer <= 0) { e.ringTimer = Math.max(2.2, 3.4 - s.wave * 0.06); ring(Math.min(16, 8 + Math.floor(s.wave / 3)), s.time); }
      if (s.wave >= 6 && e.fireTimer <= 0) { e.fireTimer = 2; shoot(aim, bs * 1.2); }
      break;
    case "spiral":
      e.spin += 2.6 * dt;
      if (e.patT % 4.5 < 3 && e.fireTimer <= 0) { e.fireTimer = 0.14; shoot(e.spin, bs * 0.85); }
      break;
    case "fan":
      if (e.fireTimer <= 0) { e.fireTimer = 1.9; for (let k = -2; k <= 2; k++) shoot(aim + k * 0.22, bs * 1.1); }
      if (e.ringTimer <= 0) { e.ringTimer = 6; minion(); minion(); }
      break;
    case "rotor":
      e.spin += 1.1 * dt;
      if (e.fireTimer <= 0) { e.fireTimer = 0.24; for (let k = 0; k < 3; k++) shoot(e.spin + (k * 2 * Math.PI) / 3, bs * 0.8); }
      break;
    case "charge":
      if (e.dash > 0) { e.dash -= dt; if (e.dash <= 0) ring(10, s.time, bs * 0.9); }
      else if (e.warn > 0) {
        e.warn -= dt;
        if (e.warn <= 0) { e.dash = 0.6; e.dvx = Math.cos(aim) * 400; e.dvy = Math.sin(aim) * 400; }
      } else if (e.ringTimer <= 0) { e.ringTimer = 3.6; e.warn = 0.85; }
      break;
    case "summon":
      if (e.ringTimer <= 0) { e.ringTimer = 5; minion(); minion(); minion(); }
      if (e.fireTimer <= 0) { e.fireTimer = 2.6; shoot(aim + 0.5, bs * 0.7, { homing: true, life: 4 }); shoot(aim - 0.5, bs * 0.7, { homing: true, life: 4 }); }
      break;
    case "mines":
      if (e.fireTimer <= 0) {
        e.fireTimer = 2.2;
        const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 90;
        const mx = Math.max(10, Math.min(s.w - 10, p.x + Math.cos(a) * r));
        const my = Math.max(10, Math.min(s.h - 10, p.y + Math.sin(a) * r));
        s.eBullets.push({ id: s.nextId++, x: mx, y: my, vx: 0, vy: 0, dmg: bd, life: 6, fuse: 1.5 });
      }
      if (e.ringTimer <= 0) { e.ringTimer = 4; ring(8, s.time, bs * 0.8); }
      break;
    case "storm":
      e.spin -= 2.2 * dt;
      if (e.patT % 5 < 2.5 && e.fireTimer <= 0) { e.fireTimer = 0.18; shoot(e.spin, bs * 0.8); shoot(e.spin + Math.PI, bs * 0.8); }
      if (e.ringTimer <= 0) { e.ringTimer = 2.4; for (let k = -1; k <= 1; k++) shoot(aim + k * 0.2, bs * 1.15); }
      break;
  }
}

function burst(s: GameState, x: number, y: number, n: number, tone: ParticleTone, speed: number, size: number) {
  for (let i = 0; i < n && s.particles.length < MAX_PARTICLES; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.4 + Math.random() * 0.8);
    const life = 0.35 + Math.random() * 0.45;
    s.particles.push({ id: s.nextId++, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, size: size * (0.6 + Math.random() * 0.8), tone });
  }
}

export function applySystem(s: GameState, id: string) {
  const st = s.stats;
  switch (id) {
    case "ion_lance": st.damage = Math.round(st.damage * 1.15 * 10) / 10; break;
    case "hull_plating": st.maxHp += 20; s.player.hp = Math.min(st.maxHp, s.player.hp + 20); break;
    case "overclocked": st.fireRate *= 1.15; break;
    case "tractor": st.pickup *= 1.4; break;
    case "targeting": st.crit = Math.min(0.9, st.crit + 0.1); break;
    case "nanite": st.repairPerKill += 3; break;
    case "twin": st.projectiles += 1; break;
    case "deflector": st.resist = Math.min(0.75, st.resist + 0.05); break;
  }
}

export interface StepEvents { hurt: boolean; levelUp: boolean; dead: boolean; waveUp: boolean; bossSpawn: boolean; bossDown: boolean; shot: boolean; kill: boolean; pickup: boolean }

function hurtPlayer(s: GameState, dmg: number, ev: StepEvents) {
  const p = s.player;
  if (p.invuln > 0) return;
  p.hp -= dmg * (1 - s.stats.resist);
  p.invuln = INVULN;
  s.shake = Math.max(s.shake, 7);
  ev.hurt = true;
  burst(s, p.x, p.y, 6, "spark", 140, 3);
}

// joy: thumbstick vector, magnitude 0..1 (null = no input, ship keeps gliding)
export function step(s: GameState, dt: number, joy: Vec | null): StepEvents {
  const ev: StepEvents = { hurt: false, levelUp: false, dead: false, waveUp: false, bossSpawn: false, bossDown: false, shot: false, kill: false, pickup: false };
  const p = s.player;
  const st = s.stats;
  s.time += dt;
  s.shake = Math.max(0, s.shake - 40 * dt);
  s.bossBanner = Math.max(0, s.bossBanner - dt);
  if (s.intro) { s.intro.t -= dt; if (s.intro.t <= 0) s.intro = null; }

  // Waves + one boss per wave
  s.waveTime += dt;
  if (s.waveTime >= WAVE_SECONDS) {
    s.waveTime -= WAVE_SECONDS;
    s.wave += 1;
    s.bossSpawned = false;
    p.hp = Math.min(st.maxHp, p.hp + st.maxHp * 0.25); // breather heal between waves
    ev.waveUp = true;
  }
  p.hp = Math.min(st.maxHp, p.hp + REGEN_PER_SEC * s.mods.regen * dt);
  if (!s.bossSpawned && s.wave % BOSS_EVERY === 0 && s.waveTime >= BOSS_AT && !s.boss) {
    s.bossSpawned = true;
    spawnEnemy(s, "boss");
    ev.bossSpawn = true;
  }

  // Ice physics
  if (joy) {
    p.vx += joy.x * ACCEL * dt;
    p.vy += joy.y * ACCEL * dt;
    p.thrust = Math.min(1, Math.hypot(joy.x, joy.y));
  } else p.thrust = 0;
  const damp = Math.exp(-FRICTION * dt);
  p.vx *= damp; p.vy *= damp;
  const spd = Math.hypot(p.vx, p.vy);
  if (spd > MAX_SPEED) { p.vx = (p.vx / spd) * MAX_SPEED; p.vy = (p.vy / spd) * MAX_SPEED; }
  p.x += p.vx * dt; p.y += p.vy * dt;
  if (p.x < PLAYER_R) { p.x = PLAYER_R; p.vx = Math.abs(p.vx) * 0.55; }
  if (p.x > s.w - PLAYER_R) { p.x = s.w - PLAYER_R; p.vx = -Math.abs(p.vx) * 0.55; }
  if (p.y < PLAYER_R) { p.y = PLAYER_R; p.vy = Math.abs(p.vy) * 0.55; }
  if (p.y > s.h - PLAYER_R) { p.y = s.h - PLAYER_R; p.vy = -Math.abs(p.vy) * 0.55; }
  // Nose turns toward the nearest enemy (turn rate limited); when clear it follows thrust/drift
  let nearest: Enemy | null = null;
  let nd = Infinity;
  for (const e of s.enemies) {
    const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
    if (d < nd) { nd = d; nearest = e; }
  }
  const want = nearest
    ? Math.atan2(nearest.y - p.y, nearest.x - p.x)
    : joy && p.thrust > 0.15 ? Math.atan2(joy.y, joy.x) : spd > 25 ? Math.atan2(p.vy, p.vx) : p.angle;
  let da = want - p.angle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  const turn = TURN_RATE * dt;
  p.angle += Math.max(-turn, Math.min(turn, da));
  const aimError = Math.abs(da) - Math.min(Math.abs(da), turn);
  p.invuln = Math.max(0, p.invuln - dt);
  if (p.thrust > 0.2 && s.particles.length < MAX_PARTICLES && Math.random() < 0.8) {
    const bx = p.x - Math.cos(p.angle) * 14, by = p.y - Math.sin(p.angle) * 14;
    const life = 0.25 + Math.random() * 0.2;
    s.particles.push({
      id: s.nextId++, x: bx, y: by, life, max: life, size: 3 + Math.random() * 2, tone: "exhaust",
      vx: -Math.cos(p.angle + (Math.random() - 0.5) * 0.6) * 120 + p.vx * 0.3,
      vy: -Math.sin(p.angle + (Math.random() - 0.5) * 0.6) * 120 + p.vy * 0.3,
    });
  }

  // Spawning (slower while a boss is out)
  s.spawnTimer -= dt;
  // Hard cap on enemies alive (per difficulty, ramping with wave) so the arena never floods
  const alive = Math.min(s.mods.cap, 10 + s.wave * 2, MAX_ENEMIES);
  if (s.spawnTimer <= 0 && s.enemies.length < alive) {
    const n = Math.min(1 + Math.floor(s.wave / 8), alive - s.enemies.length);
    let heft = 1;
    for (let i = 0; i < n; i++) { const k = pickMob(s); heft = Math.max(heft, MOBS[k].hp); spawnEnemy(s, k); }
    // tougher enemies arrive less often so total pressure stays fair
    s.spawnTimer = (Math.max(0.7, 1.8 - s.wave * 0.05) * (s.boss ? 1.8 : 1) * Math.sqrt(heft)) / s.mods.spawn;
  }

  // Fire only from the nose, once the ship is lined up with its target
  s.fireTimer -= dt;
  if (nearest && s.fireTimer <= 0 && aimError < 0.2) {
    const a = p.angle;
    const nx = p.x + Math.cos(a) * 16, ny = p.y + Math.sin(a) * 16;
    s.fireTimer = 1 / st.fireRate;
    ev.shot = true;
    const n = st.projectiles;
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 0.16;
      const crit = Math.random() < st.crit;
      s.bullets.push({
        id: s.nextId++, x: nx, y: ny, vx: Math.cos(a + off) * 540, vy: Math.sin(a + off) * 540,
        dmg: Math.round(st.damage * (crit ? 2 : 1)), crit, life: 1.4,
      });
    }
  }

  // Player bullets
  for (const b of s.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const e of s.enemies) {
      if (e.hp <= 0) continue;
      if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.r + 3) ** 2) {
        e.hp -= b.dmg; e.flash = 0.08; b.life = 0;
        s.floaters.push({ id: s.nextId++, x: e.x, y: e.y - e.r, text: String(b.dmg), life: 0.6, crit: b.crit });
        burst(s, b.x, b.y, 2, "spark", 90, 2);
        break;
      }
    }
  }
  s.bullets = s.bullets.filter((b) => b.life > 0 && b.x > -20 && b.x < s.w + 20 && b.y > -20 && b.y < s.h + 20);

  // Enemies
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.angle = Math.atan2(dy, dx);
    const keepAway = e.kind === "boss" && d < 140 ? -0.4 : 1;
    let mx = dx / d, my = dy / d, sp = e.speed * keepAway;
    if (e.kind === "dart") { const wob = Math.sin(s.time * 8 + e.id) * 0.7; mx += (-dy / d) * wob; my += (dx / d) * wob; }
    if (e.kind === "gunner") {
      sp = d < 150 ? -e.speed * 0.6 : d < 200 ? 0 : e.speed;
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && d < 340) {
        e.fireTimer = 3.2;
        s.eBullets.push({ id: s.nextId++, x: e.x, y: e.y, vx: (dx / d) * 130, vy: (dy / d) * 130, dmg: (3 + s.wave * 0.6) * s.mods.dmg, life: 4 });
      }
    }
    if (e.kind === "phantom") {
      e.ringTimer -= dt;
      if (e.ringTimer <= 0) {
        e.ringTimer = 3.5 + Math.random() * 1.5;
        burst(s, e.x, e.y, 10, "spark", 120, 3);
        const a = Math.random() * Math.PI * 2, r = 110 + Math.random() * 40;
        e.x = Math.max(e.r, Math.min(s.w - e.r, p.x + Math.cos(a) * r));
        e.y = Math.max(e.r, Math.min(s.h - e.r, p.y + Math.sin(a) * r));
        e.flash = 0.15;
        burst(s, e.x, e.y, 10, "spark", 120, 3);
      }
    }
    if (e.kind === "boss" && e.dash > 0) { e.x += e.dvx * dt; e.y += e.dvy * dt; }
    else if (!(e.kind === "boss" && e.warn > 0)) {
      e.x += mx * sp * dt;
      e.y += my * sp * dt;
    }
    if (e.kind === "boss") { e.x = Math.max(e.r, Math.min(s.w - e.r, e.x)); e.y = Math.max(e.r, Math.min(s.h - e.r, e.y)); }
    e.flash = Math.max(0, e.flash - dt);
    if (d < e.r + PLAYER_R) {
      hurtPlayer(s, e.dmg, ev);
      // ship gets knocked away on the ice, enemy recoils
      p.vx -= (dx / d) * -140; p.vy -= (dy / d) * -140;
      if (e.kind !== "boss" && e.kind !== "brute" && e.kind !== "juggernaut") { e.x -= (dx / d) * 30; e.y -= (dy / d) * 30; }
    }
    if (e.kind === "boss") bossAttack(s, e, dt);
  }
  // Separation
  const es = s.enemies;
  for (let i = 0; i < es.length; i++) {
    for (let j = i + 1; j < es.length; j++) {
      const a = es[i], b = es[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const min = a.r + b.r;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < min * min) {
        const d = Math.sqrt(d2);
        const push = (min - d) / 2;
        const wa = a.kind === "boss" ? 0 : 1, wb = b.kind === "boss" ? 0 : 1;
        a.x -= (dx / d) * push * wa * (wb ? 1 : 2); a.y -= (dy / d) * push * wa * (wb ? 1 : 2);
        b.x += (dx / d) * push * wb * (wa ? 1 : 2); b.y += (dy / d) * push * wb * (wa ? 1 : 2);
      }
    }
  }
  // Enemy bullets (incl. homing orbs and slag mines)
  for (const b of s.eBullets) {
    if (b.fuse !== undefined) {
      b.fuse -= dt;
      if (b.fuse <= 0) {
        b.life = 0;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          s.eBullets.push({ id: s.nextId++, x: b.x, y: b.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, dmg: b.dmg, life: 3 });
        }
        burst(s, b.x, b.y, 8, "ember", 120, 3);
        continue;
      }
    } else if (b.homing) {
      const want = Math.atan2(p.y - b.y, p.x - b.x);
      const cur = Math.atan2(b.vy, b.vx);
      let da = want - cur;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      const na = cur + Math.max(-1.6 * dt, Math.min(1.6 * dt, da));
      const sp = Math.hypot(b.vx, b.vy);
      b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < (PLAYER_R + 4) ** 2) { b.life = 0; hurtPlayer(s, b.dmg, ev); }
  }
  s.eBullets = s.eBullets.filter((b) => b.life > 0 && b.x > -30 && b.x < s.w + 30 && b.y > -30 && b.y < s.h + 30);

  // Deaths
  for (const e of s.enemies) {
    if (e.hp > 0) continue;
    s.kills += 1;
    ev.kill = true;
    if (e.kind === "boss") {
      s.coins += (10 + s.wave * 3) * s.mods.coins;
      s.gems.push({ id: s.nextId++, x: e.x, y: e.y, value: 5 + s.wave, pulled: true });
      burst(s, e.x, e.y, 46, "ember", 260, 6);
      s.shake = 16;
      s.boss = null;
      s.bossesDown += 1;
      s.bossKills.push({ variant: e.variant, secs: Math.round((s.time - e.spawnedAt) * 10) / 10 });
      s.eBullets = [];
      ev.bossDown = true;
    } else {
      const mob = MOBS[e.kind];
      s.coins += mob.coins * s.mods.coins;
      s.gems.push({ id: s.nextId++, x: e.x, y: e.y, value: mob.xp, pulled: false });
      burst(s, e.x, e.y, Math.min(24, Math.round(e.r * 0.8)), "ember", 160, e.r > 15 ? 5 : 4);
      if (e.kind === "splitter") {
        for (const off of [-1, 1]) spawnEnemy(s, "shard", { x: e.x + off * 12, y: e.y - off * 6 });
      }
    }
    if (st.repairPerKill) p.hp = Math.min(st.maxHp, p.hp + st.repairPerKill);
  }
  s.enemies = s.enemies.filter((e) => e.hp > 0);

  // XP gems (blue dots)
  for (const g of s.gems) {
    const dx = p.x - g.x, dy = p.y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < st.pickup) g.pulled = true;
    if (g.pulled) {
      const sp = Math.min(d, 480 * dt);
      g.x += (dx / d) * sp; g.y += (dy / d) * sp;
    } else { g.x += (dx / d) * 14 * dt; g.y += (dy / d) * 14 * dt; }
    if (d < PLAYER_R + 5) { s.xp += g.value; g.value = 0; ev.pickup = true; }
  }
  s.gems = s.gems.filter((g) => g.value > 0);
  while (s.xp >= s.xpNext) {
    s.xp -= s.xpNext;
    s.level += 1;
    s.xpNext = Math.round(s.xpNext * 1.28 + 2);
    s.pendingLevelUps += 1;
    ev.levelUp = true;
  }

  for (const f of s.floaters) { f.life -= dt; f.y -= 30 * dt; }
  s.floaters = s.floaters.filter((f) => f.life > 0);
  for (const q of s.particles) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.94; q.vy *= 0.94; }
  s.particles = s.particles.filter((q) => q.life > 0);

  if (p.hp <= 0) { p.hp = 0; s.dead = true; ev.dead = true; burst(s, p.x, p.y, 30, "exhaust", 220, 5); }
  return ev;
}
