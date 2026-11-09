// Translates the game's content tables in place (names, descriptions) so every screen that reads
// them shows the selected language. English originals are kept so switching back works.
import { setLang, t } from "./index";
import { ABILITIES, ABILITY_UPGRADES, BOARDS, CLASS_UPGRADES, CLASSES, EVOLUTIONS, MODES, SPEEDS, WEAPON_EVOS, WEAPON_UPGRADES, WEAPONS } from "@/src/game/arsenal";
import { SYSTEMS, UPGRADES } from "@/src/game/config";
import { BOSSES, DIFFICULTIES, MOBS } from "@/src/game/content";
import { ACHIEVEMENTS, MISSION_POOL, RUN_MODS, STREAK_REWARDS, WEEKLY_RULES } from "@/src/game/retention";
import { BONUSES } from "@/src/game/prestige";
import { SEASON_GOAL, SEASONS } from "@/src/game/seasons";
import { UI_STYLES } from "@/src/theme";

type Obj = Record<string, unknown>;
const originals = new WeakMap<Obj, Record<string, string>>();

function tr(list: readonly object[], fields: string[]) {
  for (const o of list as Obj[]) {
    let orig = originals.get(o);
    if (!orig) { orig = {}; for (const f of fields) if (typeof o[f] === "string") orig[f] = o[f] as string; originals.set(o, orig); }
    for (const f in orig) o[f] = t(orig[f]);
  }
}

export function applyLanguage(pref: string) {
  setLang(pref);
  const nd = ["name", "desc"];
  tr(WEAPONS, nd); tr(ABILITIES, nd); tr(CLASSES, nd); tr(SPEEDS, nd); tr(MODES, nd); tr(EVOLUTIONS, nd);
  tr(Object.values(WEAPON_UPGRADES).flat(), nd); tr(Object.values(WEAPON_EVOS), nd);
  tr(Object.values(ABILITY_UPGRADES).flat(), nd); tr(Object.values(CLASS_UPGRADES).flat(), nd);
  tr(BOARDS, ["name"]); tr(SYSTEMS, nd); tr(UPGRADES, nd); tr(DIFFICULTIES, nd);
  tr(Object.values(MOBS), ["desc"]); tr(BOSSES, ["tagline"]);
  tr(WEEKLY_RULES, nd); tr(RUN_MODS, nd); tr(STREAK_REWARDS, ["name"]); tr(BONUSES, nd); tr(SEASONS, nd); tr(UI_STYLES, ["name"]);
  tr(ACHIEVEMENTS.filter((a) => !a.season), nd);
  for (const a of ACHIEVEMENTS) {
    const se = SEASONS.find((x) => x.id === a.season);
    if (se) { a.name = se.name; a.desc = t("Destroy {n} enemies during the {s} event", { n: SEASON_GOAL, s: se.name }); }
  }
  tr(MISSION_POOL.filter((m) => !m.weapon), ["text"]);
  for (const m of MISSION_POOL) if (m.weapon) m.text = t("Destroy 250 enemies with {w}", { w: WEAPONS.find((w) => w.id === m.weapon)!.name });
}
