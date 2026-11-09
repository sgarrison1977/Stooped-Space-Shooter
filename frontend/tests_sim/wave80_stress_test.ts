// Headless: jump to wave 75, stack 150 random level-ups, run 4 min with a parked ship; report peaks & errors
import { createGame, step } from "../src/game/sim";
import { baseStats } from "../src/game/config";
import { DIFFICULTIES } from "../src/game/content";
import { applyChoice, levelChoices, setupLoadout } from "../src/game/arsenal-sim";
import { CLASSES, WEAPONS } from "../src/game/arsenal";

let fail = false;
for (const w of WEAPONS) {
  const g = createGame(baseStats({ cannon: 5, deflector: 5, hull: 5 }), 390, 750, DIFFICULTIES[2]);
  setupLoadout(g, { mode: "standard", weapon: w.id, ability: "gravity", cls: CLASSES[WEAPONS.indexOf(w) % 4].id });
  g.wave = 75;
  let empty = 0;
  for (let i = 0; i < 150; i++) { const c = levelChoices(g); if (c.length < 3) empty++; applyChoice(g, c[Math.floor(Math.random() * c.length)].id); }
  const peak: Record<string, number> = {};
  const t0 = Date.now();
  try {
    for (let t = 0; t < 60 * 240; t++) {
      g.player.hp = 1e9; g.dead = false;
      step(g, 1 / 60, t % 600 < 300 ? null : { x: 0.3, y: 0.2 });
      g.pendingLevelUps = 0;
      for (const k of ["bullets", "eBullets", "enemies", "floaters", "particles", "gems", "arcs", "pickups"] as const) peak[k] = Math.max(peak[k] ?? 0, (g as any)[k].length);
    }
  } catch (e) { console.log("EXCEPTION", w.id, e); fail = true; }
  const bad = !Number.isFinite(g.stats.damage) || g.enemies.some((e) => !Number.isFinite(e.hp) || !Number.isFinite(e.x));
  if (bad) { console.log("NON-FINITE", w.id); fail = true; }
  console.log(w.id.padEnd(8), "wave", g.wave, "shortChoices", empty, "ms/frame", ((Date.now() - t0) / (60 * 240)).toFixed(2), JSON.stringify(peak));
}
console.log(fail ? "FAIL" : "DONE");
