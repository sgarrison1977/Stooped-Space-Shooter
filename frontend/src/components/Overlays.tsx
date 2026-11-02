import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { SystemDef } from "@/src/game/config";
import { Label, OutlineButton, PrimaryButton } from "./ui";

export function LevelUpOverlay({ level, options, onPick }: { level: number; options: SystemDef[]; onPick: (s: SystemDef) => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <Animated.View entering={FadeIn.duration(200)} style={s.scrim} testID="level-up-overlay">
      <Label style={{ textAlign: "center" }} testID="level-up-level">Level {level}</Label>
      <Text style={s.title}>Choose a System</Text>
      <View style={s.list}>
        {options.map((o, i) => (
          <Animated.View key={o.id} entering={FadeInDown.delay(80 * i).duration(260)}>
            <Pressable
              testID={`system-option-${o.id}`}
              onPress={() => {
                if (chosen) return;
                setChosen(o.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                setTimeout(() => onPick(o), 180);
              }}
              style={({ pressed }) => [s.option, (pressed || chosen === o.id) && s.optionActive]}
            >
              <View style={s.iconBox}>
                <Lucide name={o.icon} size={18} color={colors.brandSecondary} />
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

export function PauseOverlay({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  const s = useStyles();
  return (
    <Animated.View entering={FadeIn.duration(180)} style={s.scrim} testID="pause-overlay">
      <Label style={{ textAlign: "center" }}>Holding Position</Label>
      <Text style={s.title}>Paused</Text>
      <View style={s.list}>
        <PrimaryButton title="Resume" testID="pause-resume-button" onPress={onResume} />
        <OutlineButton title="Abandon Run" testID="pause-abandon-button" onPress={onQuit} />
      </View>
    </Animated.View>
  );
}

export function GameOverOverlay({
  wave, kills, coins, rank, abandoned, onReturn, onAgain, onShare,
}: { wave: number; kills: number; coins: number; rank: number | null; abandoned: boolean; onReturn: () => void; onAgain: () => void; onShare: () => void }) {
  const s = useStyles();
  const Stat = ({ label, value, testID }: { label: string; value: string | number; testID: string }) => (
    <View style={s.statRow}>
      <Text style={s.statLabel}>{label}</Text>
      <Text testID={testID} style={s.statValue}>{value}</Text>
    </View>
  );
  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.scrim} testID="game-over-overlay">
      <Label style={{ textAlign: "center" }}>Run Ended</Label>
      <Text style={s.title}>{abandoned ? "Run Abandoned" : "Hull Breached"}</Text>
      <View style={[s.list, s.statsCard]}>
        <Stat label="Wave Reached" value={wave} testID="game-over-wave" />
        <Stat label="Kills" value={kills} testID="game-over-kills" />
        <Stat label="Coins Gathered" value={`+${coins}`} testID="game-over-coins" />
        <Stat label="Global Rank" value={rank ? `#${rank}` : "—"} testID="game-over-rank" />
      </View>
      <View style={s.list}>
        <PrimaryButton title="Dive Again" testID="game-over-again-button" onPress={onAgain} />
        <OutlineButton title="Challenge a Friend" icon="share-2" testID="game-over-share-button" onPress={onShare} />
        <OutlineButton title="Return to Muster" testID="game-over-return-button" onPress={onReturn} />
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  scrim: {
    position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: c.scrim,
    justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.sm,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: c.onSurface, textAlign: "center", letterSpacing: 1, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  option: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, minHeight: 76,
  },
  optionActive: { borderColor: c.borderStrong, backgroundColor: c.brandTertiary },
  iconBox: {
    width: 38, height: 38, borderRadius: radius.sm, borderWidth: 1, borderColor: c.brandSecondary,
    alignItems: "center", justifyContent: "center", backgroundColor: c.brandTertiary,
  },
  optName: { fontFamily: fonts.display, fontSize: 16, color: c.onSurface },
  optDesc: { fontFamily: fonts.text, fontSize: 12, color: c.muted, marginTop: 2 },
  statsCard: {
    padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary,
    marginBottom: spacing.lg,
  },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontFamily: fonts.text, fontSize: 11, letterSpacing: 2, color: c.muted, textTransform: "uppercase" },
  statValue: { fontFamily: fonts.display, fontSize: 18, color: c.onSurface },
}));
