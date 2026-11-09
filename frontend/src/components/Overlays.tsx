import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { fonts, makeStyles, radius, spacing, useTheme, pop, ink } from "@/src/theme";
import { SystemDef } from "@/src/game/config";
import { Label, MuteButton, OutlineButton, PrimaryButton } from "./ui";

export function LevelUpOverlay({ level, options, onPick, wide }: { level: number; options: SystemDef[]; onPick: (s: SystemDef) => void; wide: boolean }) {
  const s = useStyles();
  const { colors } = useTheme();
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <Animated.View entering={FadeIn.duration(200)} style={s.scrim} testID="level-up-overlay">
      <Label style={{ textAlign: "center" }} testID="level-up-level">Level {level}</Label>
      <Text style={[s.title, wide && s.titleWide]}>Choose a System</Text>
      <View style={[s.list, wide && s.listRow]}>
        {options.map((o, i) => (
          <Animated.View key={o.id} entering={FadeInDown.delay(80 * i).duration(260)} style={wide ? { flex: 1 } : undefined}>
            <Pressable
              testID={`system-option-${o.id}`}
              onPress={() => {
                if (chosen) return;
                setChosen(o.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                setTimeout(() => onPick(o), 180);
              }}
              style={({ pressed }) => [s.option, wide && s.optionWide, (pressed || chosen === o.id) && s.optionActive]}
            >
              <View style={s.iconBox}>
                <Lucide name={o.icon} size={18} color={colors.onBrandPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.optName}>{o.name}</Text>
                <Text style={s.optDesc}>{o.desc}</Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

export function PauseOverlay({ onResume, onQuit, onSaveLeave }: { onResume: () => void; onQuit: () => void; onSaveLeave: () => void }) {
  const s = useStyles();
  return (
    <Animated.View entering={FadeIn.duration(180)} style={s.scrim} testID="pause-overlay">
      <Label style={{ textAlign: "center" }}>Holding Position</Label>
      <Text style={s.title}>Paused</Text>
      <View style={s.list}>
        <PrimaryButton title="Resume" testID="pause-resume-button" onPress={onResume} />
        <OutlineButton title="Save & Leave" icon="save" testID="pause-save-leave-button" onPress={onSaveLeave} />
        <OutlineButton title="Abandon Run" testID="pause-abandon-button" onPress={onQuit} />
        <View style={s.muteRow}>
          <Text style={s.statLabel}>Sound & Music</Text>
          <MuteButton testID="pause-mute-button" />
        </View>
      </View>
    </Animated.View>
  );
}

function Stat({ label, value, testID }: { label: string; value: string | number; testID: string }) {
  const s = useStyles();
  return (
    <View style={s.statRow}>
      <Text style={s.statLabel}>{label}</Text>
      <Text testID={testID} style={s.statValue}>{value}</Text>
    </View>
  );
}

export function GameOverOverlay({
  wave, kills, coins, rank, abandoned, wide, bosses, difficultyName, highlight, onReturn, onAgain, onShare,
}: { wave: number; kills: number; coins: number; rank: number | null; abandoned: boolean; wide: boolean; bosses: number; difficultyName: string; highlight: string | null; onReturn: () => void; onAgain: () => void; onShare: () => void }) {
  const s = useStyles();
  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.scrim} testID="game-over-overlay">
      <Label style={{ textAlign: "center" }}>Run Ended · {difficultyName}</Label>
      <Text style={[s.title, wide && s.titleWide]}>{abandoned ? "Run Abandoned" : "Hull Breached"}</Text>
      <View style={[s.list, wide && s.listRow]}>
        <View style={[s.list, s.statsCard, wide && { flex: 1, marginBottom: 0 }]}>
          <Stat label="Wave Reached" value={wave} testID="game-over-wave" />
          <Stat label="Kills" value={kills} testID="game-over-kills" />
          <Stat label="Bosses Down" value={bosses} testID="game-over-bosses" />
          {highlight ? <Text style={s.highlight} testID="game-over-boss-record">{highlight}</Text> : null}
          <Stat label="Coins Gathered" value={`+${coins}`} testID="game-over-coins" />
          <Stat label="Global Rank" value={rank ? `#${rank}` : "—"} testID="game-over-rank" />
        </View>
        <View style={[s.list, wide && { flex: 1, justifyContent: "center" }]}>
          <PrimaryButton title="Dive Again" testID="game-over-again-button" onPress={onAgain} />
          <OutlineButton title="Challenge a Friend" icon="share-2" testID="game-over-share-button" onPress={onShare} />
          <OutlineButton title="Return to Muster" testID="game-over-return-button" onPress={onReturn} />
        </View>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  scrim: {
    position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: c.scrim,
    justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.sm,
  },
  title: { fontFamily: fonts.display, fontSize: 38, color: c.onArena, textAlign: "center", letterSpacing: 1, marginBottom: spacing.lg },
  titleWide: { fontSize: 22, marginBottom: spacing.sm },
  list: { gap: spacing.md, width: "100%", maxWidth: 760, alignSelf: "center" },
  listRow: { flexDirection: "row" },
  optionWide: { minHeight: 110, flexDirection: "column", alignItems: "flex-start" },
  option: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.md,
    ...pop(c), backgroundColor: c.surfaceSecondary, minHeight: 76,
  },
  optionActive: { backgroundColor: c.brandTertiary, transform: [{ rotate: "-1deg" }] },
  iconBox: {
    width: 44, height: 44, borderRadius: radius.pill, ...ink(c),
    alignItems: "center", justifyContent: "center", backgroundColor: c.brandPrimary,
  },
  optName: { fontFamily: fonts.display, fontSize: 19, color: c.onSurface, paddingTop: 3 },
  optDesc: { fontFamily: fonts.text, fontSize: 13, color: c.onSurfaceSecondary, marginTop: 2 },
  statsCard: {
    padding: spacing.lg, borderRadius: radius.md, ...pop(c), backgroundColor: c.surfaceSecondary,
    marginBottom: spacing.lg,
  },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muteRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, ...pop(c) },
  highlight: { fontFamily: fonts.display, fontSize: 15, color: c.brandSecondary, textAlign: "center" },
  statLabel: { fontFamily: fonts.bold, fontSize: 13, color: c.muted, textTransform: "uppercase" },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: c.onSurface },
}));
