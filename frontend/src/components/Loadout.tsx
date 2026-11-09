import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { fonts, makeStyles, radius, spacing } from "@/src/theme";
import { Profile } from "@/src/game/profile";
import { ABILITIES, ABILITY_UPGRADES, CLASS_UPGRADES, CLASSES, dailyLoadout, MODES, SPEEDS, WEAPON_EVOS, WEAPON_UPGRADES, WeaponId, WEAPONS } from "@/src/game/arsenal";
import { DifficultyChips } from "./DifficultyChips";
import { Label } from "./ui";

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
const weaponUps = (w: WeaponId) => `Level-up upgrades: ${names(WEAPON_UPGRADES[w])}\nCombo: ${WEAPON_EVOS[w].name}`;

export function LoadoutCard({ profile, update }: { profile: Profile; update: Upd }) {
  const s = useStyles();
  const daily = profile.mode === "daily";
  const d = dailyLoadout();
  const nm = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name;
  return (
    <Animated.View entering={FadeInDown.duration(450).delay(60)} style={s.card} testID="loadout-card">
      <Text style={s.title}>Loadout</Text>
      <Row label="Mode" options={MODES} value={profile.mode} onChange={(mode) => update((p) => ({ ...p, mode: mode as Profile["mode"] }))} prefix="mode-chip" />
          <Row label="Game Speed" options={SPEEDS} value={profile.speed} onChange={(speed) => update((p) => ({ ...p, speed: speed as Profile["speed"] }))} prefix="speed-chip" />
      {daily ? (
        <Text style={s.daily} testID="daily-loadout">Today: {nm(WEAPONS, d.weapon)} · {nm(ABILITIES, d.ability)} · {nm(CLASSES, d.cls)}</Text>
      ) : (
        <>
          <Row label="Weapon" options={WEAPONS} value={profile.weapon} onChange={(weapon) => update((p) => ({ ...p, weapon: weapon as Profile["weapon"] }))} prefix="weapon-chip" ups={weaponUps(profile.weapon)} />
          <Row label="Ability" options={ABILITIES} value={profile.ability} onChange={(ability) => update((p) => ({ ...p, ability: ability as Profile["ability"] }))} prefix="ability-chip" ups={`Level-up upgrades: ${names(ABILITY_UPGRADES[profile.ability])}`} />
          <Row label="Ship Class" options={CLASSES} value={profile.shipClass} onChange={(shipClass) => update((p) => ({ ...p, shipClass: shipClass as Profile["shipClass"] }))} prefix="class-chip" ups={`Level-up perks: ${names(CLASS_UPGRADES[profile.shipClass])}`} />
        </>
      )}
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 20, color: c.onSurface, letterSpacing: 1 },
  row: { gap: spacing.xs },
  desc: { fontFamily: fonts.text, fontSize: 11, color: c.muted },
  ups: { fontFamily: fonts.text, fontSize: 11, color: c.brandSecondary, lineHeight: 16 },
  daily: { fontFamily: fonts.display, fontSize: 14, color: c.brandSecondary },
}));
