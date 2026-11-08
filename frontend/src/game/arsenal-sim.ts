import { SYSTEMS, SystemDef } from "./config";
import { applySystem, burst, Enemy, EBullet, GameState, rnd, setRng, StepEvents, Vec, Bullet } from "./sim";
import {
  ABILITIES, ABILITY_UPGRADES, AbilityId, CLASS_UPGRADES, ClassDef, CLASSES, ClassId, dailyLoadout, EVOLUTIONS, ModeId, PickupKind,
  SYSTEM_EXCLUDE, todaySeed, WAVE_MODS, WaveModId, WEAPON_EVOS, WEAPON_UPGRADES, WeaponId, WEAPONS,
} from "./arsenal";

export interface ArsenalState {
  mode: ModeId; weapon: WeaponId; ability: AbilityId; cls: ClassDef;
  abilityCd: number; shieldT: number; overT: number; slowT: number; buffShieldT: number;
  grav: { x: number; y: number; t: number } | null;
  beams: { id: number; x: number; y: number; a: number; life: number }[];
  arcs: { id: number; pts: Vec[]; life: number }[];
  pMines: { id: number; x: number; y: number; life: number; mini?: boolean }[];
  bladeA: number; bladeCd: Record<number, number>; mineT: number;
  drone: { a: number; cd: number } | null;
  pickups: { id: number; x: number; y: number; kind: PickupKind; life: number }[];
  tempWeapon: { id: WeaponId; t: number } | null;
  picks: Record<string, number>; evolved: string[];
  waveMod: WaveModId;
}

export const arsenalDefaults = (): ArsenalState => ({
  mode: "standard", weapon: "cannon", ability: "dash", cls: CLASSES[0],
  abilityCd: 0, shieldT: 0, overT: 0, slowT: 0, buffShieldT: 0, grav: null, beams: [], arcs: [], pMines: [],
  bladeA: 0, bladeCd: {}, mineT: 0, drone: null, pickups: [], tempWeapon: null, picks: {}, evolved: [],
  waveMod: "none",
});

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function setupLoadout(s: GameState, lo: { mode: ModeId; weapon: WeaponId; ability: AbilityId; cls: ClassId }) {
  const daily = lo.mode === "daily" ? dailyLoadout() : null;
  setRng(daily ? mulberry(todaySeed()) : Math.random);
  s.mode = lo.mode;
  s.weapon = daily?.weapon ?? lo.weapon;
  s.ability = daily?.ability ?? lo.ability;
  s.cls = CLASSES.find((c) => c.id === (daily?.cls ?? lo.cls)) ?? CLASSES[0];
  const st = s.stats;
  st.maxHp = Math.round(st.maxHp * s.cls.hp); s.player.hp = st.maxHp;
  st.damage *= s.cls.dmg; st.projectiles += s.cls.proj; st.resist = Math.min(0.75, st.resist + s.cls.resist);
  if (s.cls.drone) s.drone = { a: 0, cd: 1 };
}

// Pick count of a weapon upgrade, only while the loadout weapon is the one firing
const L = (s: GameState, id: string) => (s.tempWeapon ? 0 : s.picks[id] ?? 0);
const P = (s: GameState, id: string) => s.picks[id] ?? 0; // ability / class perks
export const evolvedW = (s: GameState, id: string) => !s.tempWeapon && s.evolved.includes(id);
export const moveMul = (s: GameState) => s.cls.move * (1 + 0.12 * P(s, "cl_burn"));
export const droneCount = (s: GameState) => (s.drone ? 1 + P(s, "cl_drone") : 0);
export const bladeCount = (s: GameState) => 2 + s.stats.projectiles + L(s, "bl_extra");
export const bladeReach = (s: GameState) => 54 * (1 + 0.2 * L(s, "bl_tether"));

export const activeWeapon = (s: GameState): WeaponId => s.tempWeapon?.id ?? s.weapon;
export const waveDone = (s: GameState) => (s.mode === "bossrush" ? s.bossSpawned && !s.boss : s.waveTime >= 30 && !s.boss);
export const boardKey = (s: GameState) => (s.mode === "standard" ? s.mods.id : s.mode === "daily" ? `daily-${todaySeed()}` : s.mode);


function hit(s: GameState, e: Enemy, dmg: number, crit = false) {
  const d = Math.max(1, Math.round(dmg));
  e.hp -= d; e.flash = 0.08;
  s.floaters.push({ id: s.nextId++, x: e.x, y: e.y - e.r, text: String(d), life: 0.6, crit });
}

function explode(s: GameState, x: number, y: number, r: number, dmg: number) {
  for (const e of s.enemies) if (e.hp > 0 && (e.x - x) ** 2 + (e.y - y) ** 2 < (r + e.r) ** 2) hit(s, e, dmg);
  burst(s, x, y, 14, "ember", 200, 4);
}

// Called from the bullet loop; true = handled (flame pierces, missiles explode)
export function bulletHit(s: GameState, b: Bullet, e: Enemy): boolean {
  if (b.kind === "flame" || b.kind === "pierce") { hit(s, e, b.dmg, b.crit); b.hits?.push(e.id); return true; }
  if (b.kind === "shell") { if (b.life > 0) { b.life = 0; hit(s, e, b.dmg, b.crit); explode(s, b.x, b.y, 40, b.dmg * 0.5); } return true; }
  if (b.kind === "missile") {
    if (b.life > 0) {
      b.life = 0; explode(s, b.x, b.y, 55 * (1 + 0.3 * L(s, "hm_warhead")), b.dmg);
      if (evolvedW(s, "hm_evo")) for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + rnd();
        s.bullets.push({ id: s.nextId++, x: b.x, y: b.y, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, dmg: Math.max(1, Math.round(b.dmg * 0.4)), crit: false, life: 0.45 });
      }
    }
    return true;
  }
  return false;
}

export function reflect(s: GameState, b: EBullet) {
  s.bullets.push({ id: s.nextId++, x: b.x, y: b.y, vx: -b.vx * 1.6, vy: -b.vy * 1.6, dmg: Math.round(s.stats.damage), crit: false, life: 1.2 });
  b.life = 0;
}

export function onEnemyDeath(s: GameState, e: Enemy) {
  delete s.bladeCd[e.id];
  const wm = WAVE_MODS[s.waveMod];
  if (wm.coins > 1) s.coins += (wm.coins - 1) * s.mods.coins;
  if (s.waveMod === "volatile" && e.kind !== "boss") {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      s.eBullets.push({ id: s.nextId++, x: e.x, y: e.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, dmg: (3 + s.wave * 0.5) * s.mods.dmg, life: 1.6 });
    }
  }
  if (rnd() < (e.kind === "boss" ? 1 : 0.03)) {
    const kinds: PickupKind[] = ["shield", "magnet", "repair", "weapon"];
    s.pickups.push({ id: s.nextId++, x: e.x, y: e.y, kind: kinds[Math.floor(rnd() * 4)], life: 12 });
  }
}

export function activateAbility(s: GameState): boolean {
  if (s.abilityCd > 0 || s.dead) return false;
  const p = s.player;
  switch (s.ability) {
    case "dash": {
      const sp = Math.hypot(p.vx, p.vy), ph = P(s, "ab_dash");
      const a = sp > 30 ? Math.atan2(p.vy, p.vx) : p.angle;
      p.vx = Math.cos(a) * 900 * (1 + 0.25 * ph); p.vy = Math.sin(a) * 900 * (1 + 0.25 * ph); p.invuln = Math.max(p.invuln, 0.35 + 0.15 * ph);
      burst(s, p.x, p.y, 12, "exhaust", 160, 4);
      break;
    }
    case "shield": s.shieldT = 1.2 + 0.6 * P(s, "ab_shield"); break;
    case "overdrive": s.overT = 5 + 2 * P(s, "ab_over"); break;
    case "gravity":
      s.grav = { x: Math.max(20, Math.min(s.w - 20, p.x + Math.cos(p.angle) * 120)), y: Math.max(20, Math.min(s.h - 20, p.y + Math.sin(p.angle) * 120)), t: 1.1 };
      break;
    case "timeslow": s.slowT = 3 + P(s, "ab_slow"); break;
  }
  s.abilityCd = ABILITIES.find((a) => a.id === s.ability)!.cd * Math.pow(0.88, P(s, "ab_cd"));
  return true;
}

function fire(s: GameState, w: WeaponId, nearest: Enemy | null, aimError: number, ev: StepEvents) {
  if (!nearest || s.fireTimer > 0 || w === "cannon" || w === "blades" || w === "mines") return;
  const st = s.stats, p = s.player, a = p.angle, rate = st.fireRate / 2.8;
  const crit = rnd() < st.crit, dmg = st.damage * (crit ? 2 : 1);
  const nx = p.x + Math.cos(a) * 16, ny = p.y + Math.sin(a) * 16;
  const shot = (ang: number, sp: number, life: number, d: number, kind?: Bullet["kind"]) =>
    s.bullets.push({ id: s.nextId++, x: nx, y: ny, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dmg: Math.max(1, Math.round(d)), crit, life, kind, hits: kind === "flame" || kind === "pierce" ? [] : undefined });
  switch (w) {
    case "spread": {
      if (aimError > 0.25) return;
      s.fireTimer = 0.45 / rate;
      const n = 5 + (st.projectiles - 1) * 2 + 2 * L(s, "sp_choke");
      for (let i = 0; i < n; i++) shot(a + (i / (n - 1) - 0.5) * 0.7, 480, 0.42 * (1 + 0.35 * L(s, "sp_barrel")), dmg * 0.75, evolvedW(s, "sp_evo") ? "pierce" : undefined);
      break;
    }
    case "railgun": {
      if (aimError > 0.1) return;
      s.fireTimer = (1.4 * Math.pow(0.85, L(s, "rg_caps"))) / rate;
      const width = 6 * (1 + 0.6 * L(s, "rg_wide")), rdmg = dmg * 3.2 * (1 + (st.projectiles - 1) * 0.3) * (1 + 0.35 * L(s, "rg_overcharge"));
      const struck: Vec[] = [];
      for (const e of s.enemies) {
        const dx = e.x - p.x, dy = e.y - p.y, along = dx * Math.cos(a) + dy * Math.sin(a);
        if (along > 0 && Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)) < e.r + width) { hit(s, e, rdmg, crit); struck.push({ x: e.x, y: e.y }); }
      }
      if (evolvedW(s, "rg_evo")) for (const pt of struck.slice(0, 6)) explode(s, pt.x, pt.y, 45, rdmg * 0.3);
      s.beams.push({ id: s.nextId++, x: nx, y: ny, a, life: 0.25 });
      break;
    }
    case "flame":
      if (aimError > 0.35) return;
      s.fireTimer = 0.07 / rate;
      for (let i = 0; i < 1 + Math.ceil(st.projectiles / 2); i++) {
        const fr = 0.32 * (1 + 0.3 * L(s, "fl_nozzle")), fd = dmg * 0.3 * (1 + 0.3 * L(s, "fl_napalm"));
        shot(a + (rnd() - 0.5) * 0.6, 260 + rnd() * 80, fr, fd, "flame");
        if (evolvedW(s, "fl_evo")) shot(a + Math.PI + (rnd() - 0.5) * 0.6, 260 + rnd() * 80, fr, fd, "flame");
      }
      break;
    case "homing": {
      s.fireTimer = 0.65 / rate;
      const n = st.projectiles + L(s, "hm_pod");
      for (let i = 0; i < n; i++) shot(a + (i - (n - 1) / 2) * 0.5, 300, 2.5, dmg * 1.5, "missile");
      break;
    }
    case "arc": {
      s.fireTimer = 0.5 / rate;
      const pts: Vec[] = [{ x: p.x, y: p.y }];
      const done = new Set<number>();
      const reach = 1 + 0.25 * L(s, "ar_reach"), volt = 1 + 0.3 * L(s, "ar_volt");
      let from: Vec = p, range = 260 * reach;
      for (let k = 0; k < Math.min(5, 3 + Math.floor(s.level / 4)) + L(s, "ar_fork"); k++) {
        let best: Enemy | null = null, bd = range * range;
        for (const e of s.enemies) { const d = (e.x - from.x) ** 2 + (e.y - from.y) ** 2; if (!done.has(e.id) && e.hp > 0 && d < bd) { bd = d; best = e; } }
        if (!best) break;
        done.add(best.id); hit(s, best, dmg * volt * (best.kind === "boss" ? 0.5 : 1.3), crit);
        pts.push({ x: best.x, y: best.y }); from = best; range = 150 * reach;
        if (evolvedW(s, "ar_evo")) {
          let fk: Enemy | null = null, fd = (120 * reach) ** 2;
          for (const e of s.enemies) { const d = (e.x - best.x) ** 2 + (e.y - best.y) ** 2; if (!done.has(e.id) && e.hp > 0 && d < fd) { fd = d; fk = e; } }
          if (fk) { done.add(fk.id); hit(s, fk, dmg * volt * (fk.kind === "boss" ? 0.3 : 0.8), crit); s.arcs.push({ id: s.nextId++, pts: [{ x: best.x, y: best.y }, { x: fk.x, y: fk.y }], life: 0.15 }); }
        }
      }
      if (pts.length > 1) s.arcs.push({ id: s.nextId++, pts, life: 0.15 });
      break;
    }
  }
  ev.shot = true;
}

export function updateArsenal(s: GameState, dt: number, nearest: Enemy | null, aimError: number, ev: StepEvents) {
  const p = s.player, st = s.stats;
  s.abilityCd = Math.max(0, s.abilityCd - dt); s.shieldT = Math.max(0, s.shieldT - dt); s.overT = Math.max(0, s.overT - dt);
  s.slowT = Math.max(0, s.slowT - dt); s.buffShieldT = Math.max(0, s.buffShieldT - dt);
  if (s.tempWeapon && (s.tempWeapon.t -= dt) <= 0) s.tempWeapon = null;
  for (const b of s.beams) b.life -= dt;
  for (const a of s.arcs) a.life -= dt;
  s.beams = s.beams.filter((b) => b.life > 0); s.arcs = s.arcs.filter((a) => a.life > 0);
  const w = activeWeapon(s);
  fire(s, w, nearest, aimError, ev);

  if (s.grav) {
    const g = s.grav, gr = 1 + 0.3 * P(s, "ab_grav");
    g.t -= dt;
    for (const e of s.enemies) { const dx = g.x - e.x, dy = g.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < 220 * gr && e.kind !== "boss") { e.x += (dx / d) * 260 * dt; e.y += (dy / d) * 260 * dt; } }
    for (const gm of s.gems) { const dx = g.x - gm.x, dy = g.y - gm.y, d = Math.hypot(dx, dy) || 1; if (d < 260 * gr) { gm.x += (dx / d) * 300 * dt; gm.y += (dy / d) * 300 * dt; } }
    if (g.t <= 0) { explode(s, g.x, g.y, 130 * gr, st.damage * 4 * gr); s.shake = 10; s.grav = null; }
  }
  if (w === "blades") {
    const motor = 1 + 0.3 * L(s, "bl_motor"), tether = 1 + 0.2 * L(s, "bl_tether");
    s.bladeA += 4 * motor * dt;
    const n = bladeCount(s), reach = bladeReach(s);
    const storm = evolvedW(s, "bl_evo") && nearest && (s.mineT -= dt) <= 0;
    if (storm) s.mineT = 1.2;
    for (let i = 0; i < n; i++) {
      const a = s.bladeA + (i / n) * Math.PI * 2, bx = p.x + Math.cos(a) * reach, by = p.y + Math.sin(a) * reach;
      if (storm) s.bullets.push({ id: s.nextId++, x: bx, y: by, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, dmg: Math.max(1, Math.round(st.damage)), crit: false, life: 0.8, kind: "pierce", hits: [] });
      for (const e of s.enemies) {
        if (e.hp > 0 && (s.bladeCd[e.id] ?? 0) < s.time && (e.x - bx) ** 2 + (e.y - by) ** 2 < (e.r + 10 * tether) ** 2) {
          const crit = rnd() < st.crit;
          hit(s, e, st.damage * 1.4 * (crit ? 2 : 1), crit); s.bladeCd[e.id] = s.time + 0.25 / motor; ev.shot = true;
        }
      }
    }
  }
  if (w === "mines") {
    const layer = L(s, "mn_layer");
    s.mineT -= dt * (s.overT > 0 ? 2 : 1);
    if (s.mineT <= 0 && Math.hypot(p.vx, p.vy) > 40 && s.pMines.length < 14 + 4 * layer) {
      s.mineT = (0.45 * Math.pow(0.85, layer)) / (st.fireRate / 2.8);
      s.pMines.push({ id: s.nextId++, x: p.x - Math.cos(p.angle) * 16, y: p.y - Math.sin(p.angle) * 16, life: 6 });
    }
    const blast = 75 * (1 + 0.3 * L(s, "mn_blast")), payload = 3 * (1 + 0.35 * L(s, "mn_payload"));
    const spawn: { x: number; y: number }[] = [];
    for (const m of s.pMines) {
      m.life -= dt;
      if (s.enemies.some((e) => (e.x - m.x) ** 2 + (e.y - m.y) ** 2 < (e.r + 18) ** 2)) {
        const k = m.mini ? 0.55 : 1;
        m.life = 0; explode(s, m.x, m.y, blast * k, st.damage * payload * k * (rnd() < st.crit ? 2 : 1)); ev.shot = true;
        if (!m.mini && evolvedW(s, "mn_evo")) spawn.push(m);
      }
    }
    for (const m of spawn) for (let i = 0; i < 2; i++) {
      const a = rnd() * Math.PI * 2;
      s.pMines.push({ id: s.nextId++, x: Math.max(8, Math.min(s.w - 8, m.x + Math.cos(a) * 45)), y: Math.max(8, Math.min(s.h - 8, m.y + Math.sin(a) * 45)), life: 3, mini: true });
    }
    s.pMines = s.pMines.filter((m) => m.life > 0);
  }
  for (const b of s.bullets) {
    if (b.kind !== "missile" || !nearest) continue;
    let tgt = nearest, bd = Infinity;
    for (const e of s.enemies) { const d = (e.x - b.x) ** 2 + (e.y - b.y) ** 2; if (d < bd) { bd = d; tgt = e; } }
    const cur = Math.atan2(b.vy, b.vx); let da = Math.atan2(tgt.y - b.y, tgt.x - b.x) - cur;
    while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    const na = cur + Math.max(-4 * dt, Math.min(4 * dt, da));
    b.vx = Math.cos(na) * 300; b.vy = Math.sin(na) * 300;
  }
  if (s.drone) {
    const d = s.drone;
    d.a += 1.5 * dt; d.cd -= dt;
    if (d.cd <= 0 && nearest) {
      const oc = P(s, "cl_dronefire"), n = droneCount(s);
      d.cd = 0.8 * Math.pow(0.8, oc);
      for (let i = 0; i < n; i++) {
        const da = d.a + (i / n) * Math.PI * 2;
        const x = p.x + Math.cos(da) * 40, y = p.y + Math.sin(da) * 40, a = Math.atan2(nearest.y - y, nearest.x - x);
        s.bullets.push({ id: s.nextId++, x, y, vx: Math.cos(a) * 500, vy: Math.sin(a) * 500, dmg: Math.max(1, Math.round(st.damage * 0.6 * (1 + 0.25 * oc))), crit: false, life: 1.2 });
      }
    }
  }
  for (const k of s.pickups) {
    k.life -= dt;
    if ((k.x - p.x) ** 2 + (k.y - p.y) ** 2 < 26 * 26) {
      k.life = 0; ev.pickup = true;
      if (k.kind === "shield") s.buffShieldT = 5;
      if (k.kind === "magnet") for (const g of s.gems) g.pulled = true;
      if (k.kind === "repair") p.hp = Math.min(st.maxHp, p.hp + 30);
      if (k.kind === "weapon") { const opts = WEAPONS.filter((x) => x.id !== s.weapon); s.tempWeapon = { id: opts[Math.floor(rnd() * opts.length)].id, t: 10 }; }
    }
  }
  s.pickups = s.pickups.filter((k) => k.life > 0);
}

// Level-up: up to 3 picks per upgrade; a combo appears once both parts have 2+ picks.
// Offers only upgrades that matter for the loadout; at least one is weapon-specific.
export function levelChoices(s: GameState): SystemDef[] {
  const skip = SYSTEM_EXCLUDE[s.weapon] ?? [];
  const ready = (from: string[]) => from.every((f) => (s.picks[f] ?? 0) >= 2);
  const we = WEAPON_EVOS[s.weapon];
  const evo = [...(!s.evolved.includes(we.id) && ready(we.from) ? [we] : []), ...EVOLUTIONS.filter((e) => !s.evolved.includes(e.id) && ready(e.from))].slice(0, 1);
  const open = (x: SystemDef) => (s.picks[x.id] ?? 0) < 3;
  const wpool = WEAPON_UPGRADES[s.weapon].filter(open);
  const pool = [
    ...SYSTEMS.filter((x) => !skip.includes(x.id) && open(x)),
    ...ABILITY_UPGRADES[s.ability].filter(open), ...CLASS_UPGRADES[s.cls.id].filter(open),
  ];
  const out: SystemDef[] = evo.map((e) => ({ id: e.id, name: e.name, desc: e.desc, icon: e.icon }));
  if (out.length < 3 && wpool.length) out.push(wpool.splice(Math.floor(rnd() * wpool.length), 1)[0]);
  pool.push(...wpool);
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out;
}

export function applyChoice(s: GameState, id: string) {
  const st = s.stats;
  if (Object.values(WEAPON_EVOS).some((e) => e.id === id)) { s.evolved.push(id); return; }
  if (EVOLUTIONS.some((e) => e.id === id)) {
    s.evolved.push(id);
    if (id === "plasma_storm") { st.projectiles += 2; st.damage *= 1.3; }
    if (id === "singularity") { st.fireRate *= 1.4; st.crit = Math.min(0.9, st.crit + 0.15); }
    if (id === "bastion") { st.maxHp += 60; s.player.hp += 60; st.resist = Math.min(0.8, st.resist + 0.15); }
    if (id === "vampiric") { st.repairPerKill += 8; st.pickup *= 2; }
    return;
  }
  if (id === "cl_std") { st.damage *= 1.08; st.maxHp += 10; s.player.hp += 10; }
  if (id === "cl_hot") st.damage *= 1.12;
  if (id === "cl_hull") { st.maxHp += 25; s.player.hp += 25; st.resist = Math.min(0.75, st.resist + 0.03); }
  applySystem(s, id);
  s.picks[id] = (s.picks[id] ?? 0) + 1;
}
