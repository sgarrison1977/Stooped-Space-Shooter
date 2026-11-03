// Headless enemy-cap regression: force late waves (14-20), invulnerable player, report max enemies alive per difficulty
import { createGame, step, applySystem } from "../src/game/sim";
import { baseStats, pickSystems } from "../src/game/config";
import { DIFFICULTIES } from "../src/game/content";

const SCENARIOS = [
  { name: "lowDmg", dmg: 1 },      // enemies pile up (kills slow) -> tests the cap itself
  { name: "highDmg", dmg: 500 },   // lots of kills -> splitter shards transients
];
let fail = false;
for (const d of DIFFICULTIES) {
  for (const sc of SCENARIOS) {
    let maxE = 0, maxNonShard = 0, overCapFrames = 0, frames = 0;
    const perWave: Record<number, number> = {};
    for (let run = 0; run < 3; run++) {
      const g = createGame(baseStats({ cannon: 1, deflector: 1, hull: 1 }), 390, 650, d);
      g.wave = 14;
      g.stats.damage = sc.dmg;
      let t = 0;
      while (g.wave <= 20 && t < 7 * 30 + 5) {
        g.player.hp = 1e9; g.stats.maxHp = 1e9;
        const a = t * 0.9;
        step(g, 1 / 60, { x: Math.cos(a) * 0.6, y: Math.sin(a) * 0.6 });
        while (g.pendingLevelUps > 0) { applySystem(g, pickSystems(1)[0].id); g.pendingLevelUps--; }
        const n = g.enemies.length;
        const ns = g.enemies.filter((e) => e.kind !== "shard" && e.kind !== "boss").length;
        maxE = Math.max(maxE, n);
        maxNonShard = Math.max(maxNonShard, ns);
        perWave[g.wave] = Math.max(perWave[g.wave] ?? 0, n);
        if (n > d.cap) overCapFrames++;
        frames++;
        t += 1 / 60;
      }
    }
    if (maxNonShard > d.cap) fail = true;
    console.log(
      d.id.padEnd(8), sc.name.padEnd(8), "cap", d.cap,
      "maxAlive", maxE, "maxNonShardNonBoss", maxNonShard,
      "overCap%", ((overCapFrames / frames) * 100).toFixed(2),
      "perWave", JSON.stringify(perWave),
    );
  }
}
console.log(fail ? "RESULT: FAIL (non-shard enemies exceeded cap)" : "RESULT: PASS");
