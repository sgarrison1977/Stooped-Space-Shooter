import React from "react";
import { t } from "@/src/i18n";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { fonts, makeStyles, radius, spacing, pop } from "@/src/theme";
import { Profile } from "@/src/game/profile";
import { ABILITIES, ABILITY_UPGRADES, CLASS_UPGRADES, CLASSES, dailyLoadout, MODES, SPEEDS, WEAPON_EVOS, WEAPON_UPGRADES, WeaponId, WEAPONS } from "@/src/game/arsenal";
import { DifficultyChips } from "./DifficultyChips";
import { MASTERY, masteryLevel, RUN_MODS, weeklyRule } from "@/src/game/retention";
import { Label } from "./ui";
import { badgeName, PRESTIGE_WAVE, prestigeCount, shipBest } from "@/src/game/prestige";

type Upd = (fn: (p: Profile) => Profile) => void;

function Row({ label, options, value, onChange, prefix, ups }: { label: string; options: { id: string; name: string; desc: string }[]; value: string; onChange: (id: string) => void; prefix: string; ups?: string }) {
  const s = useStyles();
  return (
    <View style={s.row}>
      <Label>{label}</Label>
      <DifficultyChips options={options} value={value} onChange={onChange} testPrefix={prefix} />
      <Text style={s.desc} testID={`${prefix}-desc`}>{options.find((o) => o.id === value)?.desc}</Text>
      {ups ? <Text style={s.ups} testID={`${prefix}-upgrades`}>{ups}</Text> : null}
    </View>
  );
}

const names = (l: { name: string }[]) => l.map((x) => x.name).join(" · ");
const weaponUps = (w: WeaponId, kills: number) => {
  const lv = masteryLevel(kills);
  return `${t("Level-up upgrades: {x}", { x: names(WEAPON_UPGRADES[w]) })}\n${t("Combo: {x}", { x: WEAPON_EVOS[w].name })}\n${t("Mastery: {x}", { x: lv >= MASTERY.length ? t("GOLD (gold shots)") : t("Lv {lv} · {k}/{g} kills", { lv, k: kills, g: MASTERY[lv] }) })}`;
};

const prestigeLine = (p: Profile) => {
  const n = prestigeCount(p, p.shipClass);
  return `${t("Prestige")}: ${n ? `${t(badgeName(n))} ★${n}` : "—"} · ${t("Wave {a}/{b} to next prestige", { a: Math.min(shipBest(p, p.shipClass), PRESTIGE_WAVE), b: PRESTIGE_WAVE })}`;
};

export function LoadoutCard({ profile, update }: { profile: Profile; update: Upd }) {
  const s = useStyles();
  const daily = profile.mode === "daily";
  const d = dailyLoadout();
  const nm = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name;
  return (
    <Animated.View entering={FadeInDown.duration(450).delay(60)} style={s.card} testID="loadout-card">
      <Text style={s.title}>{t("Loadout")}</Text>
      <Row label={t("Mode")} options={MODES} value={profile.mode} onChange={(mode) => update((p) => ({ ...p, mode: mode as Profile["mode"] }))} prefix="mode-chip" />
          <Row label={t("Game Speed")} options={SPEEDS} value={profile.speed} onChange={(speed) => update((p) => ({ ...p, speed: speed as Profile["speed"] }))} prefix="speed-chip" />
      {!daily ? (
        <View style={s.row}>
          <Label>{t("Run Modifiers · bonus coins")}</Label>
          <DifficultyChips
            options={RUN_MODS.map((m) => ({ id: m.id, name: `${m.name} +${Math.round(m.bonus * 100)}%` }))}
            value=""
            isOn={(id) => profile.runMods.includes(id)}
            onChange={(id: string) => update((p) => ({ ...p, runMods: p.runMods.includes(id) ? p.runMods.filter((x) => x !== id) : [...p.runMods, id] }))}
            testPrefix="run-mod-chip"
          />
          <Text style={s.desc}>{profile.runMods.length ? RUN_MODS.filter((m) => profile.runMods.includes(m.id)).map((m) => m.desc).join(" · ") : t("Optional risks; stack them for more coins")}</Text>
        </View>
      ) : null}
      {profile.mode === "weekly" ? <Text style={s.daily} testID="weekly-rule">{t("This week: {n} · {d}", { n: weeklyRule().name, d: weeklyRule().desc })}</Text> : null}
      {daily ? (
        <Text style={s.daily} testID="daily-loadout">{t("Today: {x}", { x: `${nm(WEAPONS, d.weapon)} · ${nm(ABILITIES, d.ability)} · ${nm(CLASSES, d.cls)}` })}</Text>
      ) : (
        <>
          <Row label={t("Weapon")} options={WEAPONS} value={profile.weapon} onChange={(weapon) => update((p) => ({ ...p, weapon: weapon as Profile["weapon"] }))} prefix="weapon-chip" ups={weaponUps(profile.weapon, profile.mastery[profile.weapon] ?? 0)} />
          <Row label={t("Ability")} options={ABILITIES} value={profile.ability} onChange={(ability) => update((p) => ({ ...p, ability: ability as Profile["ability"] }))} prefix="ability-chip" ups={t("Level-up upgrades: {x}", { x: names(ABILITY_UPGRADES[profile.ability]) })} />
          <Row label={t("Ship Class")} options={CLASSES} value={profile.shipClass} onChange={(shipClass) => update((p) => ({ ...p, shipClass: shipClass as Profile["shipClass"] }))} prefix="class-chip" ups={`${t("Level-up perks: {x}", { x: names(CLASS_UPGRADES[profile.shipClass]) })}\n${prestigeLine(profile)}`} />
        </>
      )}
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.surfaceSecondary, ...pop(c), borderRadius: radius.md, padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 20, color: c.onSurface, letterSpacing: 1 },
  row: { gap: spacing.xs },
  desc: { fontFamily: fonts.text, fontSize: 14, color: c.muted },
  ups: { fontFamily: fonts.text, fontSize: 14, color: c.brandSecondary, lineHeight: 16 },
  daily: { fontFamily: fonts.display, fontSize: 14, color: c.brandSecondary },
}));
