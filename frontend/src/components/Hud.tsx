import React from "react";
import { Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { GameState } from "@/src/game/engine";

function Pill({ icon, label, value, testID }: { icon: any; label: string; value: number; testID: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.pill}>
      <Lucide name={icon} size={10} color={colors.brandSecondary} />
      <Text style={s.pillLabel}>{label}</Text>
      <Text testID={testID} style={s.pillValue}>{value}</Text>
    </View>
  );
}

export function Hud({ g, onPause }: { g: GameState; onPause: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const hpPct = Math.max(0, g.player.hp / g.stats.maxHp);
  const xpPct = Math.min(1, g.xp / g.xpNext);
  return (
    <View style={s.wrap} testID="game-hud">
      <View style={s.topRow}>
        <View style={s.bars}>
          <View style={s.hpTrack}>
            <View style={[s.hpFill, { width: `${hpPct * 100}%` }]} />
          </View>
          <View style={s.xpTrack}>
            <View style={[s.xpFill, { width: `${xpPct * 100}%` }]} />
          </View>
          <View style={s.barText}>
            <Text testID="hud-hp" style={s.small}>{Math.ceil(g.player.hp)}/{g.stats.maxHp}</Text>
            <Text testID="hud-level" style={s.small}>Lv {g.level}</Text>
          </View>
        </View>
        <Pressable testID="pause-button" onPress={onPause} hitSlop={8} style={s.pause}>
          <Lucide name="pause" size={16} color={colors.onSurfaceSecondary} />
        </Pressable>
      </View>
      <View style={s.pills}>
        <Pill icon="waves" label="Wave" value={g.wave} testID="hud-wave" />
        <Pill icon="skull" label="Kills" value={g.kills} testID="hud-kills" />
        <Pill icon="coins" label="Coins" value={g.coins} testID="hud-coins" />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  bars: { flex: 1, gap: 4 },
  hpTrack: { height: 7, borderRadius: radius.pill, backgroundColor: c.hpTrack, overflow: "hidden" },
  hpFill: { height: 7, backgroundColor: c.error, borderRadius: radius.pill },
  xpTrack: { height: 3, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary, overflow: "hidden" },
  xpFill: { height: 3, backgroundColor: c.xp },
  barText: { flexDirection: "row", justifyContent: "space-between" },
  small: { fontFamily: fonts.text, fontSize: 10, color: c.muted, letterSpacing: 1 },
  pause: {
    width: 40, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border,
    alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary,
  },
  pills: { flexDirection: "row", gap: spacing.sm },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5, height: 28, paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary,
  },
  pillLabel: { fontFamily: fonts.text, fontSize: 9, letterSpacing: 1.6, color: c.muted, textTransform: "uppercase" },
  pillValue: { fontFamily: fonts.display, fontSize: 12, color: c.onSurface },
}));
