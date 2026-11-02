import { RunStats } from "./config";

export type Vec = { x: number; y: number };
export type EnemyKind = "grunt" | "elite" | "boss";

export interface Enemy {
  id: number; x: number; y: number; hp: number; maxHp: number; speed: number; r: number; dmg: number;
  kind: EnemyKind; angle: number; flash: number; fireTimer: number; ringTimer: number;
}
export interface Bullet { id: number; x: number; y: number; vx: number; vy: number; dmg: number; crit: boolean; life: number }
export interface EBullet { id: number; x: number; y: number; vx: number; vy: number; dmg: number; life: number }
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
  bossSpawned: boolean; boss: Enemy | null; bossName: string; bossBanner: number; bossesDown: number;
  shake: number; time: number;
}

export const WAVE_SECONDS = 30;
export const PLAYER_R = 13;
const BOSS_AT = 6; // seconds into each wave
const MAX_ENEMIES = 70;
const MAX_PARTICLES = 220;
// "On ice" handling: thrust accelerates, very little friction, walls bounce.
const ACCEL = 950;
const MAX_SPEED = 330;
const FRICTION = 1.7;
const TURN_RATE = 7; // radians per second
const INVULN = 0.75;
const REGEN_PER_SEC = 0.6;

const BOSS_NAMES = ["The Cinder Maw", "Ashen Leviathan", "Pyre Warden", "Molten Hydra", "Obsidian Herald", "Ember Tyrant", "The Slag King", "Furnace Queen"];

export function createGame(stats: RunStats, w: number, h: number): GameState {
  return {
    w, h,
    player: { x: w / 2, y: h / 2, vx: 0, vy: 0, hp: stats.maxHp, angle: -Math.PI / 2, invuln: 0, thrust: 0 },
    stats,
    enemies: [], bullets: [], eBullets: [], gems: [], floaters: [], particles: [],
    wave: 1, waveTime: 0, spawnTimer: 0.8, fireTimer: 0,
    kills: 0, coins: 0, xp: 0, xpNext: 5, level: 1,
    pendingLevelUps: 0, nextId: 1, dead: false,
    bossSpawned: false, boss: null, bossName: "", bossBanner: 0, bossesDown: 0,
    shake: 0, time: 0,
  };
}

function edgePoint(s: GameState, m: number): Vec {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: Math.random() * s.w, y: -m };
  if (side === 1) return { x: s.w + m, y: Math.random() * s.h };
  if (side === 2) return { x: Math.random() * s.w, y: s.h + m };
  return { x: -m, y: Math.random() * s.h };
}

function spawnEnemy(s: GameState, kind: EnemyKind) {
  const w = s.wave;
  const cfg = kind === "boss"
    ? { hp: 120 + w * 70, speed: 22 + w, r: 36, dmg: 12 + w * 2 }
    : kind === "elite"
      ? { hp: (8 + w * 4) * 4, speed: 30 + w * 2, r: 18, dmg: 9 + w * 2 }
      : { hp: 8 + w * 4, speed: Math.min(90, 38 + w * 2.5) + Math.random() * 14, r: 11, dmg: 5 + w * 1.2 };
  const pt = edgePoint(s, cfg.r + 10);
  const e: Enemy = {
    id: s.nextId++, x: pt.x, y: pt.y, hp: cfg.hp, maxHp: cfg.hp, speed: cfg.speed, r: cfg.r, dmg: cfg.dmg,
    kind, angle: 0, flash: 0, fireTimer: 2, ringTimer: 2.5,
  };
  s.enemies.push(e);
  if (kind === "boss") {
    s.boss = e;
    s.bossName = BOSS_NAMES[(w - 1) % BOSS_NAMES.length];
    s.bossBanner = 2.4;
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

export interface StepEvents { hurt: boolean; levelUp: boolean; dead: boolean; waveUp: boolean; bossSpawn: boolean; bossDown: boolean }

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
  const ev: StepEvents = { hurt: false, levelUp: false, dead: false, waveUp: false, bossSpawn: false, bossDown: false };
  const p = s.player;
  const st = s.stats;
  s.time += dt;
  s.shake = Math.max(0, s.shake - 40 * dt);
  s.bossBanner = Math.max(0, s.bossBanner - dt);

  // Waves + one boss per wave
  s.waveTime += dt;
  if (s.waveTime >= WAVE_SECONDS) {
    s.waveTime -= WAVE_SECONDS;
    s.wave += 1;
    s.bossSpawned = false;
    p.hp = Math.min(st.maxHp, p.hp + st.maxHp * 0.25); // breather heal between waves
    ev.waveUp = true;
  }
  p.hp = Math.min(st.maxHp, p.hp + REGEN_PER_SEC * dt);
  if (!s.bossSpawned && s.waveTime >= BOSS_AT && !s.boss) {
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
  if (s.spawnTimer <= 0 && s.enemies.length < MAX_ENEMIES) {
    const n = 1 + Math.floor(s.wave / 6);
    for (let i = 0; i < n; i++) spawnEnemy(s, s.wave >= 4 && Math.random() < 0.08 ? "elite" : "grunt");
    s.spawnTimer = Math.max(0.5, 1.8 - s.wave * 0.07) * (s.boss ? 1.8 : 1);
  }

  // Fire only from the nose, once the ship is lined up with its target
  s.fireTimer -= dt;
  if (nearest && s.fireTimer <= 0 && aimError < 0.2) {
    const a = p.angle;
    const nx = p.x + Math.cos(a) * 16, ny = p.y + Math.sin(a) * 16;
    s.fireTimer = 1 / st.fireRate;
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
    e.x += (dx / d) * e.speed * dt * keepAway;
    e.y += (dy / d) * e.speed * dt * keepAway;
    if (e.kind === "boss") { e.x = Math.max(e.r, Math.min(s.w - e.r, e.x)); e.y = Math.max(e.r, Math.min(s.h - e.r, e.y)); }
    e.flash = Math.max(0, e.flash - dt);
    if (d < e.r + PLAYER_R) {
      hurtPlayer(s, e.dmg, ev);
      // ship gets knocked away on the ice, enemy recoils
      p.vx -= (dx / d) * -140; p.vy -= (dy / d) * -140;
      if (e.kind !== "boss") { e.x -= (dx / d) * 30; e.y -= (dy / d) * 30; }
    }
    if (e.kind === "boss") {
      const bs = Math.min(200, 100 + s.wave * 4);
      const bd = 5 + s.wave;
      e.ringTimer -= dt;
      if (e.ringTimer <= 0) {
        e.ringTimer = Math.max(2.2, 3.6 - s.wave * 0.08);
        const n = Math.min(16, 6 + Math.floor(s.wave / 2));
        const rot = s.time;
        for (let i = 0; i < n; i++) {
          const a = rot + (i / n) * Math.PI * 2;
          s.eBullets.push({ id: s.nextId++, x: e.x, y: e.y, vx: Math.cos(a) * bs, vy: Math.sin(a) * bs, dmg: bd, life: 5 });
        }
      }
      if (s.wave >= 3) {
        e.fireTimer -= dt;
        if (e.fireTimer <= 0) {
          e.fireTimer = 2.0;
          const spread = s.wave >= 6 ? 1 : 0;
          for (let k = -spread; k <= spread; k++) {
            const a = e.angle + k * 0.18;
            s.eBullets.push({ id: s.nextId++, x: e.x, y: e.y, vx: Math.cos(a) * bs * 1.2, vy: Math.sin(a) * bs * 1.2, dmg: bd, life: 5 });
          }
        }
      }
    }
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
  // Enemy bullets
  for (const b of s.eBullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < (PLAYER_R + 4) ** 2) { b.life = 0; hurtPlayer(s, b.dmg, ev); }
  }
  s.eBullets = s.eBullets.filter((b) => b.life > 0 && b.x > -30 && b.x < s.w + 30 && b.y > -30 && b.y < s.h + 30);

  // Deaths
  for (const e of s.enemies) {
    if (e.hp > 0) continue;
    s.kills += 1;
    if (e.kind === "boss") {
      s.coins += 10 + s.wave * 3;
      s.gems.push({ id: s.nextId++, x: e.x, y: e.y, value: 5 + s.wave, pulled: true });
      burst(s, e.x, e.y, 46, "ember", 260, 6);
      s.shake = 16;
      s.boss = null;
      s.bossesDown += 1;
      s.eBullets = [];
      ev.bossDown = true;
    } else {
      s.coins += e.kind === "elite" ? 5 : 1;
      s.gems.push({ id: s.nextId++, x: e.x, y: e.y, value: e.kind === "elite" ? 5 : 1, pulled: false });
      burst(s, e.x, e.y, e.kind === "elite" ? 16 : 9, "ember", 160, 4);
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
    if (d < PLAYER_R + 5) { s.xp += g.value; g.value = 0; }
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
