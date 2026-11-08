// Headless: every weapon gets weapon-specific level-up choices, never useless ones, and runs without errors
import { createGame, step } from "../src/game/sim";
import { baseStats } from "../src/game/config";
import { DIFFICULTIES } from "../src/game/content";
import { applyChoice, levelChoices, setupLoadout } from "../src/game/arsenal-sim";
import { SYSTEM_EXCLUDE, WEAPON_UPGRADES, WEAPONS } from "../src/game/arsenal";

let fail = false;
for (const w of WEAPONS) {
  const g = createGame(baseStats({ cannon: 1, deflector: 1, hull: 1 }), 390, 650, DIFFICULTIES[1]);
  setupLoadout(g, { mode: "standard", weapon: w.id, ability: "dash", cls: "standard" });
  const own = WEAPON_UPGRADES[w.id].map((x) => x.id), skip = SYSTEM_EXCLUDE[w.id] ?? [];
  const foreign = Object.entries(WEAPON_UPGRADES).filter(([k]) => k !== w.id).flatMap(([, v]) => v.map((x) => x.id));
  let rounds = 0, withOwn = 0, kills = 0;
  for (let i = 0; i < 30; i++) {
    const c = levelChoices(g);
    if (!c.length) break;
    rounds++;
    if (c.some((x) => own.includes(x.id))) withOwn++;
    if (c.some((x) => foreign.includes(x.id) || skip.includes(x.id))) { console.log("BAD choice", w.id, c.map((x) => x.id)); fail = true; }
    applyChoice(g, (c.find((x) => own.includes(x.id)) ?? c[0]).id);
  }
  for (let t = 0; t < 60 * 40; t++) { g.player.hp = 1e9; step(g, 1 / 60, { x: Math.cos(t / 50) * 0.6, y: Math.sin(t / 50) * 0.6 }); g.pendingLevelUps = 0; }
  kills = g.kills;
  const ownPicks = own.map((id) => `${id}:${g.picks[id] ?? 0}`).join(" ");
  console.log(`${w.id.padEnd(8)} rounds=${rounds} withOwn=${withOwn} kills40s=${kills} ${ownPicks}`);
}
console.log(fail ? "FAIL" : "PASS");
