import re
p = '/app/frontend/src/game/sim.ts'
t = open(p).read()
def rep(old, new, count=1):
    global t
    assert old in t, old[:60]
    t = t.replace(old, new, count)

rep('import { BOSSES, DifficultyDef, MobKind, MOBS } from "./content";',
    'import { BOSSES, DifficultyDef, MobKind, MOBS } from "./content";\nimport { WAVE_MODS } from "./arsenal";\nimport { activeWeapon, ArsenalState, arsenalDefaults, bulletHit, onEnemyDeath, reflect, updateArsenal, waveDone } from "./arsenal-sim";\n\n// Swappable RNG so the Daily Run is the same for everyone\nexport let rnd: () => number = Math.random;\nexport function setRng(f: () => number) { rnd = f; }')
t = t.replace('Math.random()', 'rnd()')
t = t.replace('export let rnd: () => number = rnd;', 'export let rnd: () => number = Math.random;')
rep('export interface Bullet { id: number; x: number; y: number; vx: number; vy: number; dmg: number; crit: boolean; life: number }',
    'export interface Bullet { id: number; x: number; y: number; vx: number; vy: number; dmg: number; crit: boolean; life: number; kind?: "flame" | "missile"; hits?: number[] }')
rep('export interface GameState {', 'export interface GameState extends ArsenalState {')
rep('shake: 0, time: 0, mods, breakT: 0,', 'shake: 0, time: 0, mods, breakT: 0, ...arsenalDefaults(),')
rep('function burst(', 'export function burst(')
rep('const FRICTION = 2.3;', 'const FRICTION = 3.0;')
rep('  p.hp -= dmg * (1 - s.stats.resist);\n  p.invuln = INVULN;',
    '  if (s.shieldT > 0 || s.buffShieldT > 0) return;\n  p.hp -= s.mode === "hardcore" ? p.hp : dmg * (1 - s.stats.resist);\n  p.invuln = INVULN;')
rep('      s.bossSpawned = false;\n      ev.waveUp = true;', '      s.bossSpawned = false;\n      s.waveMod = s.nextMod;\n      s.nextMod = "none";\n      ev.waveUp = true;')
rep('    if (s.waveTime >= WAVE_SECONDS && !s.boss) {\n      s.breakT = WAVE_BREAK;', '    if (waveDone(s)) {\n      s.breakT = WAVE_BREAK;\n      s.pathPending = true;')
rep('s.wave % BOSS_EVERY === 0 && s.waveTime >= BOSS_AT && !s.boss', '(s.mode === "bossrush" ? s.waveTime >= 2 : s.wave % BOSS_EVERY === 0 && s.waveTime >= BOSS_AT) && !s.boss')
rep('p.vx += joy.x * ACCEL * dt;\n    p.vy += joy.y * ACCEL * dt;', 'p.vx += joy.x * ACCEL * s.cls.move * dt;\n    p.vy += joy.y * ACCEL * s.cls.move * dt;')
rep('  if (spd > MAX_SPEED) { p.vx = (p.vx / spd) * MAX_SPEED; p.vy = (p.vy / spd) * MAX_SPEED; }',
    '  const maxSp = MAX_SPEED * s.cls.move * (spd > MAX_SPEED * 1.5 ? 2.6 : 1); // dash may exceed briefly\n  if (spd > maxSp) { p.vx = (p.vx / spd) * maxSp; p.vy = (p.vy / spd) * maxSp; }')
rep('if (!s.breakT && s.spawnTimer <= 0', 'if (!s.breakT && s.mode !== "bossrush" && s.spawnTimer <= 0')
rep('/ s.mods.spawn;', '/ (s.mods.spawn * WAVE_MODS[s.waveMod].spawn);')
rep('MOBS[k].weight > 0 && MOBS[k].minWave <= s.wave', 'MOBS[k].weight > 0 && (s.waveMod === "heavies" ? ["brute", "elite", "juggernaut", "splitter"].includes(k) : MOBS[k].minWave <= s.wave)')
rep('const hp = cfg.hp * m.hp;', 'const wm = WAVE_MODS[s.waveMod];\n  const hp = cfg.hp * m.hp * (kind === "boss" ? 1 : wm.hp);')
rep('speed: cfg.speed * m.speed,', 'speed: cfg.speed * m.speed * (kind === "boss" ? 1 : wm.speed),')
rep('  s.fireTimer -= dt;\n  if (nearest && s.fireTimer <= 0 && aimError < 0.2) {',
    '  s.fireTimer -= dt * (s.overT > 0 ? 2 : 1);\n  updateArsenal(s, dt, nearest, aimError, ev);\n  if (activeWeapon(s) === "cannon" && nearest && s.fireTimer <= 0 && aimError < 0.2) {')
rep('        e.hp -= b.dmg; e.flash = 0.08; b.life = 0;', '        if (b.hits?.includes(e.id)) continue;\n        if (bulletHit(s, b, e)) continue;\n        e.hp -= b.dmg; e.flash = 0.08; b.life = 0;')
rep('  // Enemies\n', '  // Enemies (time slow affects enemies + their shots only)\n  const realDt = dt;\n  dt = s.slowT > 0 ? dt * 0.35 : dt;\n')
rep('    if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < (PLAYER_R + 4) ** 2) { b.life = 0; hurtPlayer(s, b.dmg, ev); }',
    '    if (s.shieldT > 0 && (b.x - p.x) ** 2 + (b.y - p.y) ** 2 < 48 * 48) { reflect(s, b); continue; }\n    if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < (PLAYER_R + 4) ** 2) { b.life = 0; hurtPlayer(s, b.dmg, ev); }')
rep('  // Deaths\n', '  dt = realDt;\n  // Deaths\n')
rep('    ev.kill = true;\n', '    ev.kill = true;\n    onEnemyDeath(s, e);\n')
open(p, 'w').write(t)
print("sim patched")
