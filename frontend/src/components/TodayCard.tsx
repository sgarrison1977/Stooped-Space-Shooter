import React from "react";
import { t } from "@/src/i18n";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Lucide } from "@react-native-vector-icons/lucide";
import { fonts, makeStyles, pop, radius, spacing, useTheme } from "@/src/theme";
import { Profile } from "@/src/game/profile";
import { ACHIEVEMENTS, dayKey, STREAK_REWARDS, todaysMissions, weeklyRule } from "@/src/game/retention";
import { Label, OutlineButton } from "./ui";
import { SeasonBanner } from "./SeasonBanner";

// Home card: daily streak, today's 3 missions, this week's challenge, achievements link
export function TodayCard({ profile, onWeekly, onAchievements }: { profile: Profile; onWeekly: () => void; onAchievements: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const today = dayKey();
  const ms = profile.missions.day === today ? profile.missions : { progress: {} as Record<string, number>, done: [] as string[] };
  const next = STREAK_REWARDS.find((r) => profile.streak.count < r.days);
  const rule = weeklyRule();
  return (
    <Animated.View entering={FadeInDown.duration(450)} style={s.card} testID="today-card">
      <SeasonBanner profile={profile} />
      <View style={s.streakRow}>
        <Lucide name="flame" size={28} color={colors.brandSecondary} />
        <View style={{ flex: 1 }}>
          <Text style={s.big} testID="streak-count">{t("{n} day streak", { n: profile.streak.count })}</Text>
          <Text style={s.small}>
            {profile.streak.last === today ? t("Played today ✓") : t("Finish a run today to keep it going")}
            {profile.streak.shield ? ` · ${t("1 streak shield")}` : ""}
          </Text>
          {next ? <Text style={s.small}>{t("Next reward at {d} days: {n}", { d: next.days, n: next.name })}</Text> : null}
        </View>
      </View>
      <Label>{t("Today's missions")}</Label>
      {todaysMissions(today).map((m) => {
        const done = ms.done.includes(m.id), prog = Math.min(m.goal, ms.progress[m.id] ?? 0);
        return (
          <View key={m.id} style={s.mission} testID={`mission-${m.id}`}>
            <View style={{ flex: 1 }}>
              <Text style={[s.mText, done && s.mDone]}>{m.text}</Text>
              <View style={s.track}><View style={[s.fill, { width: `${(done ? 1 : prog / m.goal) * 100}%` }]} /></View>
            </View>
            <Text style={s.reward}>{done ? "✓" : `+${m.reward}`}</Text>
          </View>
        );
      })}
      <Label>{t("Weekly challenge")}</Label>
      <Pressable onPress={onWeekly} style={s.weekly} testID="weekly-challenge-button">
        <View style={{ flex: 1 }}>
          <Text style={s.mText}>{rule.name}</Text>
          <Text style={s.small}>{rule.desc} · {t("own leaderboard")}</Text>
        </View>
        <Text style={s.reward}>{profile.mode === "weekly" ? t("Selected") : t("Pick")}</Text>
      </Pressable>
      <OutlineButton title={`${t("Achievements")} ${profile.achievements.length}/${ACHIEVEMENTS.length}`} icon="trophy" testID="achievements-button" onPress={onAchievements} />
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.surfaceSecondary, ...pop(c), borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  streakRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  big: { fontFamily: fonts.display, fontSize: 22, color: c.onSurface },
  small: { fontFamily: fonts.text, fontSize: 13, color: c.muted },
  mission: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  mText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface },
  mDone: { color: c.muted, textDecorationLine: "line-through" },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary, overflow: "hidden", marginTop: 4 },
  fill: { height: "100%", backgroundColor: c.success },
  reward: { fontFamily: fonts.display, fontSize: 15, color: c.brandSecondary },
  weekly: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.sm, backgroundColor: c.surfaceTertiary },
}));
