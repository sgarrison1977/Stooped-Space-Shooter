import { RunStats } from "./config";

export type Vec = { x: number; y: number };

export interface Enemy {
  id: number; x: number; y: number; hp: number; maxHp: number;
  speed: number; r: number; dmg: number; elite: boolean; angle: number; flash: number;
}
export interface Bullet { id: number; x: number; y: number; vx: number; vy: number; dmg: number; crit: boolean; life: number }
export interface Gem { id: number; x: number; y: number; value: number; pulled: boolean }
export interface Floater { id: number; x: number; y: number; text: string; life: number; crit: boolean }

export interface GameState {
  w: number; h: number;
  player: { x: number; y: number; hp: number; angle: number; invuln: number };
  stats: RunStats;
  enemies: Enemy[]; bullets: Bullet[]; gems: Gem[]; floaters: Floater[];
  wave: number; waveTime: number; spawnTimer: number; fireTimer: number;
  kills: number; coins: number; xp: number; xpNext: number; level: number;
  pendingLevelUps: number; nextId: number; dead: boolean;
}

export const WAVE_SECONDS = 25;
const PLAYER_R = 12;
const MAX_ENEMIES = 70;

export function createGame(stats: RunStats, w: number, h: number): GameState {
  return {
    w, h,
    player: { x: w / 2, y: h / 2, hp: stats.maxHp, angle: -Math.PI / 2, invuln: 0 },
    stats,
    enemies: [], bullets: [], gems: [], floaters: [],
    wave: 1, waveTime: 0, spawnTimer: 0.6, fireTimer: 0,
    kills: 0, coins: 0, xp: 0, xpNext: 5, level: 1,
    pendingLevelUps: 0, nextId: 1, dead: false,
  };
}

function spawnEnemy(s: GameState, elite: boolean) {
  const side = Math.floor(Math.random() * 4);
  const m = 24;
  let x = 0, y = 0;
  if (side === 0) { x = Math.random() * s.w; y = -m; }
  else if (side === 1) { x = s.w + m; y = Math.random() * s.h; }
  else if (side === 2) { x = Math.random() * s.w; y = s.h + m; }
  else { x = -m; y = Math.random() * s.h; }
  const hp = (10 + s.wave * 7) * (elite ? 6 : 1);
  s.enemies.push({
    id: s.nextId++, x, y, hp, maxHp: hp,
    speed: (elite ? 34 : 50) + s.wave * 4 + Math.random() * 20,
    r: elite ? 18 : 11,
    dmg: (8 + s.wave * 2) * (elite ? 2 : 1),
    elite, angle: 0, flash: 0,
  });
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

export interface StepEvents { hurt: boolean; levelUp: boolean; dead: boolean; waveUp: boolean }

export function step(s: GameState, dt: number, target: Vec | null): StepEvents {
  const ev: StepEvents = { hurt: false, levelUp: false, dead: false, waveUp: false };
  const p = s.player;
  const st = s.stats;

  // Wave progression
  s.waveTime += dt;
  if (s.waveTime >= WAVE_SECONDS) {
    s.waveTime -= WAVE_SECONDS;
    s.wave += 1;
    ev.waveUp = true;
    if (s.wave % 5 === 0) spawnEnemy(s, true);
  }

  // Player movement toward drag target
  if (target) {
    const dx = target.x - p.x, dy = target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 1) {
      const mv = Math.min(d, 560 * dt);
      p.x += (dx / d) * mv;
      p.y += (dy / d) * mv;
    }
  }
  p.x = Math.max(PLAYER_R, Math.min(s.w - PLAYER_R, p.x));
  p.y = Math.max(PLAYER_R, Math.min(s.h - PLAYER_R, p.y));
  p.invuln = Math.max(0, p.invuln - dt);

  // Spawning
  s.spawnTimer -= dt;
  if (s.spawnTimer <= 0 && s.enemies.length < MAX_ENEMIES) {
    const burst = 1 + Math.floor(s.wave / 4);
    for (let i = 0; i < burst; i++) spawnEnemy(s, false);
    s.spawnTimer = Math.max(0.35, 1.5 - s.wave * 0.09);
  }

  // Auto-fire at nearest enemy
  let nearest: Enemy | null = null;
  let nd = Infinity;
  for (const e of s.enemies) {
    const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
    if (d < nd) { nd = d; nearest = e; }
  }
  s.fireTimer -= dt;
  if (nearest) {
    const a = Math.atan2(nearest.y - p.y, nearest.x - p.x);
    p.angle = a;
    if (s.fireTimer <= 0) {
      s.fireTimer = 1 / st.fireRate;
      const n = st.projectiles;
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * 0.16;
        const crit = Math.random() < st.crit;
        s.bullets.push({
          id: s.nextId++, x: p.x, y: p.y,
          vx: Math.cos(a + off) * 520, vy: Math.sin(a + off) * 520,
          dmg: Math.round(st.damage * (crit ? 2 : 1)), crit, life: 1.4,
        });
      }
    }
  }

  // Bullets
  for (const b of s.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const e of s.enemies) {
      if (e.hp <= 0) continue;
      if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.r + 3) ** 2) {
        e.hp -= b.dmg; e.flash = 0.1; b.life = 0;
        s.floaters.push({ id: s.nextId++, x: e.x, y: e.y - e.r, text: String(b.dmg), life: 0.6, crit: b.crit });
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
    e.x += (dx / d) * e.speed * dt;
    e.y += (dy / d) * e.speed * dt;
    e.flash = Math.max(0, e.flash - dt);
    if (d < e.r + PLAYER_R) {
      if (p.invuln <= 0) {
        p.hp -= e.dmg * (1 - st.resist);
        p.invuln = 0.45;
        ev.hurt = true;
      }
      e.x -= (dx / d) * 34; e.y -= (dy / d) * 34;
    }
  }
  // Light separation so enemies don't stack
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
        a.x -= (dx / d) * push; a.y -= (dy / d) * push;
        b.x += (dx / d) * push; b.y += (dy / d) * push;
      }
    }
  }
  // Deaths
  for (const e of s.enemies) {
    if (e.hp > 0) continue;
    s.kills += 1;
    s.coins += e.elite ? 5 : 1;
    s.gems.push({ id: s.nextId++, x: e.x, y: e.y, value: e.elite ? 5 : 1, pulled: false });
    if (st.repairPerKill) p.hp = Math.min(st.maxHp, p.hp + st.repairPerKill);
  }
  s.enemies = s.enemies.filter((e) => e.hp > 0);

  // XP gems
  for (const g of s.gems) {
    const dx = p.x - g.x, dy = p.y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < st.pickup) g.pulled = true;
    else { g.x += (dx / d) * 14 * dt; g.y += (dy / d) * 14 * dt; } // slow drift toward ship
    if (g.pulled) {
      const sp = Math.min(d, 460 * dt);
      g.x += (dx / d) * sp; g.y += (dy / d) * sp;
    }
    if (d < PLAYER_R + 4) {
      g.value = -g.value; // mark collected
      s.xp += -g.value;
    }
  }
  s.gems = s.gems.filter((g) => g.value > 0);
  while (s.xp >= s.xpNext) {
    s.xp -= s.xpNext;
    s.level += 1;
    s.xpNext = Math.round(s.xpNext * 1.35 + 2);
    s.pendingLevelUps += 1;
    ev.levelUp = true;
  }

  // Floaters
  for (const f of s.floaters) { f.life -= dt; f.y -= 30 * dt; }
  s.floaters = s.floaters.filter((f) => f.life > 0);

  if (p.hp <= 0) { p.hp = 0; s.dead = true; ev.dead = true; }
  return ev;
}
