// Headless: 300 level-ups per weapon/ability/class combo never run out of real upgrades (bug: "upgrades max out at wave 52")
import { createGame } from "../src/game/sim";
import { baseStats } from "../src/game/config";
import { DIFFICULTIES } from "../src/game/content";
import { applyChoice, levelChoices, setupLoadout } from "../src/game/arsenal-sim";
import { ABILITIES, CLASSES, SYSTEM_EXCLUDE, WEAPONS } from "../src/game/arsenal";

const LIMIT: Record<string, number> = { twin: 4, targeting: 8, deflector: 14, sp_choke: 5, hm_pod: 5, ar_fork: 5, bl_extra: 5, cl_drone: 3, ab_cd: 6 };
const KEY_UPS = ["ion_lance", "overclocked", "hull_plating"];
let fail = false;
const msgs: string[] = [];
for (const w of WEAPONS) for (const ab of ABILITIES) for (const cl of CLASSES) {
  for (const strategy of ["random", "first"]) {
    const g = createGame(baseStats({ cannon: 1, deflector: 1, hull: 1 }), 390, 650, DIFFICULTIES[1]);
    setupLoadout(g, { mode: "standard", weapon: w.id, ability: ab.id, cls: cl.id });
    let lt3 = 0, repairOnly = 0, dup = 0, overLimit = 0, nonFinite = 0;
    const seenAfter3: Record<string, number> = {};
    for (let i = 0; i < 300; i++) {
      const c = levelChoices(g);
      if (c.length < 3) lt3++;
      if (c.every((x) => x.id === "field_repair")) repairOnly++;
      if (new Set(c.map((x) => x.id)).size !== c.length) dup++;
      for (const x of c) if ((g.picks[x.id] ?? 0) >= (LIMIT[x.id] ?? Infinity)) overLimit++;
      for (const k of KEY_UPS) if (i >= 150 && c.some((x) => x.id === k)) seenAfter3[k] = (seenAfter3[k] ?? 0) + 1;
      const pick = strategy === "random" ? c[Math.floor(Math.random() * c.length)] : c[0];
      applyChoice(g, pick.id);
      const st = g.stats as any;
      for (const k of Object.keys(st)) if (typeof st[k] === "number" && !Number.isFinite(st[k])) nonFinite++;
    }
    const missingKey = KEY_UPS.filter((k) => !(SYSTEM_EXCLUDE[w.id] ?? []).includes(k) && !seenAfter3[k]);
    if (lt3 || repairOnly || dup || overLimit || nonFinite || missingKey.length) {
      fail = true;
      msgs.push(`${w.id}/${ab.id}/${cl.id}/${strategy}: lt3=${lt3} repairOnly=${repairOnly} dup=${dup} overLimit=${overLimit} nonFinite=${nonFinite} missingKeyAfter150=${missingKey.join(",")} picks=${JSON.stringify(g.picks)}`);
    }
  }
}
// sample stats after 300 picks for sanity
const g = createGame(baseStats({ cannon: 1, deflector: 1, hull: 1 }), 390, 650, DIFFICULTIES[1]);
setupLoadout(g, { mode: "standard", weapon: "cannon", ability: "dash", cls: "standard" as any });
for (let i = 0; i < 300; i++) { const c = levelChoices(g); applyChoice(g, c[Math.floor(Math.random() * c.length)].id); }
console.log("sample stats after 300 picks:", JSON.stringify(g.stats));
console.log(msgs.slice(0, 15).join("\n"));
console.log(`combos tested=${WEAPONS.length * ABILITIES.length * CLASSES.length * 2} failures=${msgs.length}`);
console.log(fail ? "FAIL" : "PASS");
