// Headless: push each weapon to level ~30, report peak entity counts and any exceptions
import { createGame, step } from "../src/game/sim";
import { baseStats } from "../src/game/config";
import { DIFFICULTIES } from "../src/game/content";
import { applyChoice, levelChoices, setupLoadout } from "../src/game/arsenal-sim";
import { CLASSES, WEAPONS } from "../src/game/arsenal";

let fail = false;
for (const w of WEAPONS) for (const cl of [CLASSES[2], CLASSES[3]]) {
  const g = createGame(baseStats({ cannon: 5, deflector: 1, hull: 1 }), 390, 750, DIFFICULTIES[1]);
  setupLoadout(g, { mode: "standard", weapon: w.id, ability: "gravity", cls: cl.id });
  const peak: Record<string, number> = {};
  try {
    for (let t = 0; t < 60 * 60 * 9 && g.level < 34; t++) {
      g.player.hp = 1e9; g.stats.maxHp = 1e9; if (t % 120 === 0) g.xp += g.xpNext;
      step(g, 1 / 60, { x: Math.cos(t / 50) * 0.6, y: Math.sin(t / 50) * 0.6 });
      while (g.pendingLevelUps > 0) { const c = levelChoices(g); applyChoice(g, c[Math.floor(Math.random() * c.length)].id); g.pendingLevelUps--; }
      for (const k of ["bullets", "eBullets", "enemies", "floaters", "particles", "gems", "arcs"] as const) peak[k] = Math.max(peak[k] ?? 0, (g as any)[k].length);
    }
  } catch (e) { console.log("EXCEPTION", w.id, cl.id, g.level, e); fail = true; }
  console.log(w.id.padEnd(8), cl.id.padEnd(9), "lvl", g.level, "wave", g.wave, JSON.stringify(peak));
}
console.log(fail ? "FAIL" : "DONE");
