import React from "react";
import { currentLang, t } from "@/src/i18n";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Backdrop } from "@/src/components/Backdrop";
import { Label, OutlineButton } from "@/src/components/ui";
import { fonts, fx, makeStyles, pop, radius, spacing, UI_STYLES, useTheme } from "@/src/theme";
import { useProfile } from "@/src/game/profile";
import { WEAPONS } from "@/src/game/arsenal";
import { ACHIEVEMENTS, MASTERY, masteryLevel, stylesUnlocked } from "@/src/game/retention";
import { SEASONS } from "@/src/game/seasons";

const fmtMd = (v: number) => new Date(2000, Math.floor(v / 100) - 1, v % 100).toLocaleDateString(currentLang(), { month: "short", day: "numeric" });
const seasonDates = (id: string) => { const se = SEASONS.find((x) => x.id === id)!; return `${t("Limited-time event")} · ${fmtMd(se.from)} – ${fmtMd(se.to)}`; };

export default function Achievements() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  if (!profile) return <View style={s.root} />;
  const open = stylesUnlocked(profile), nextStyle = UI_STYLES[open];
  return (
    <View style={s.root} testID="achievements-screen">
      <Backdrop />
      <StatusBar style={fx.statusBar} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}>
        <OutlineButton title={t("Back")} icon="arrow-left" testID="achievements-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
        <Text style={s.title}>{t("Achievements")}</Text>
        <Text style={s.sub} testID="style-unlock-progress">
          {nextStyle ? t("{n} more to unlock the {s} UI style", { n: 3 - (profile.achievements.length % 3), s: nextStyle.name }) : t("Every UI style unlocked!")}
        </Text>
        <View style={s.card}>
          <Label>{t("Weapon mastery")}</Label>
          {WEAPONS.map((w) => {
            const k = profile.mastery[w.id] ?? 0, lv = masteryLevel(k), goal = MASTERY[lv];
            return (
              <View key={w.id} style={s.row} testID={`mastery-${w.id}`}>
                <Text style={s.name}>{w.name}</Text>
                <Text style={s.meta}>{lv >= MASTERY.length ? t("GOLD · maxed") : t("Lv {lv} · {k}/{g} kills", { lv, k, g: goal })}</Text>
              </View>
            );
          })}
        </View>
        <View style={s.card}>
          {ACHIEVEMENTS.map((a) => {
            const got = profile.achievements.includes(a.id);
            return (
              <View key={a.id} style={[s.row, !got && { opacity: 0.55 }]} testID={`achievement-${a.id}`}>
                <Lucide name={got ? "trophy" : "lock"} size={18} color={got ? colors.brandSecondary : colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{a.name}</Text>
                  <Text style={s.meta}>{a.desc}</Text>
                  {a.season ? <Text style={s.limited}>{seasonDates(a.season)}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg, maxWidth: 760, width: "100%", alignSelf: "center" },
  title: { fontFamily: fonts.display, fontSize: 30, color: c[fx.titleColor], ...fx.titleShadow },
  sub: { fontFamily: fonts.text, fontSize: 14, color: c.muted },
  card: { backgroundColor: c.surfaceSecondary, ...pop(c), borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, justifyContent: "space-between" },
  name: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  meta: { fontFamily: fonts.text, fontSize: 13, color: c.muted },
  limited: { fontFamily: fonts.bold, fontSize: 12, color: c.brandSecondary },
}));
