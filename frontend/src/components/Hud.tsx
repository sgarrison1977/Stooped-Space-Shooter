import React from "react";
import { Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { fonts, makeStyles, radius, spacing, useTheme, pop } from "@/src/theme";
import { GameState } from "@/src/game/sim";

function Pill({ icon, label, value, testID }: { icon: any; label: string; value: number; testID: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.pill}>
      <Lucide name={icon} size={13} color={colors.brandPrimary} />
      <Text style={s.pillLabel}>{label}</Text>
      <Text testID={testID} style={s.pillValue}>{value}</Text>
    </View>
  );
}

export function Hud({ g, onPause, wide }: { g: GameState; onPause: () => void; wide: boolean }) {
  const s = useStyles();
  const { colors } = useTheme();
  const hpPct = Math.max(0, g.player.hp / g.stats.maxHp);
  const xpPct = Math.min(1, g.xp / g.xpNext);
  const bars = (
    <View style={wide ? s.barsWide : s.bars}>
      <View style={s.hpTrack}>
        <View style={[s.hpFill, { width: `${hpPct * 100}%` }]} />
      </View>
      <View style={s.xpTrack}>
        <View style={[s.xpFill, { width: `${xpPct * 100}%` }]} />
      </View>
      <View style={s.barText}>
        <Text testID="hud-hp" style={s.small}>{Math.ceil(g.player.hp)}/{g.stats.maxHp}</Text>
        <Text testID="hud-level" style={s.small}>Lv {g.level}</Text>
        <Text testID="hud-lives" style={s.small}>{"♥".repeat(Math.max(0, g.lives))}</Text>
      </View>
    </View>
  );
  const pills = (
    <View style={s.pills}>
      <Pill icon="waves" label="Wave" value={g.wave} testID="hud-wave" />
      <Pill icon="skull" label="Kills" value={g.kills} testID="hud-kills" />
      <Pill icon="coins" label="Coins" value={Math.floor(g.coins)} testID="hud-coins" />
    </View>
  );
  const pause = (
    <Pressable testID="pause-button" onPress={onPause} hitSlop={8} style={s.pause}>
      <Lucide name="pause" size={16} color={colors.onSurfaceSecondary} />
    </Pressable>
  );
  if (wide) {
    return (
      <View style={[s.wrap, s.topRow]} testID="game-hud">
        {bars}
        <View style={{ flex: 1 }} />
        {pills}
        {pause}
      </View>
    );
  }
  return (
    <View style={s.wrap} testID="game-hud">
      <View style={s.topRow}>
        {bars}
        {pause}
      </View>
      {pills}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  bars: { flex: 1, gap: 4 },
  barsWide: { width: 240, gap: 4 },
  hpTrack: { height: 10, borderRadius: radius.pill, backgroundColor: c.hpTrack, overflow: "hidden", borderWidth: 1, borderColor: c.border },
  hpFill: { height: "100%", backgroundColor: c.error, borderRadius: radius.pill },
  xpTrack: { height: 5, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, overflow: "hidden", borderWidth: 1, borderColor: c.border },
  xpFill: { height: "100%", backgroundColor: c.xp },
  barText: { flexDirection: "row", justifyContent: "space-between" },
  small: { fontFamily: fonts.bold, fontSize: 12, color: c.onSurface },
  pause: {
    width: 44, height: 44, borderRadius: radius.sm, ...pop(c),
    alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary,
  },
  pills: { flexDirection: "row", gap: spacing.sm },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5, height: 34, paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm, ...pop(c), backgroundColor: c.surfaceSecondary,
  },
  pillLabel: { fontFamily: fonts.bold, fontSize: 11, color: c.muted, textTransform: "uppercase" },
  pillValue: { fontFamily: fonts.display, fontSize: 15, color: c.onSurface, paddingTop: 2 },
}));
