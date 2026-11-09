import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Backdrop } from "@/src/components/Backdrop";
import { Label, OutlineButton } from "@/src/components/ui";
import { fonts, fx, makeStyles, pop, radius, spacing } from "@/src/theme";
import { freshLife, useProfile } from "@/src/game/profile";
import { CLASSES, WEAPONS } from "@/src/game/arsenal";
import { ACHIEVEMENTS } from "@/src/game/retention";
import { t } from "@/src/i18n";

const fmtTime = (secs: number) => {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), sec = Math.floor(secs % 60);
  return h ? `${h}h ${m}m` : `${m}m ${sec}s`;
};
const num = (n: number) => Math.round(n).toLocaleString();

function Stat({ label, value, testID }: { label: string; value: string; testID: string }) {
  const s = useStyles();
  return (
    <View style={s.tile}>
      <Text style={s.tLabel}>{label}</Text>
      <Text style={s.tValue} testID={testID} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

export default function Stats() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile: p } = useProfile();
  if (!p) return <View style={s.root} />;
  const l = { ...freshLife(), ...p.life };
  const favW = WEAPONS.map((w) => ({ w, k: p.mastery[w.id] ?? 0 })).sort((a, b) => b.k - a.k)[0];
  const favC = CLASSES.map((c) => ({ c, n: l.classRuns[c.id] ?? 0 })).sort((a, b) => b.n - a.n)[0];
  const prestiges = Object.values(p.prestige ?? {}).reduce((a, n) => a + n, 0);
  return (
    <View style={s.root} testID="stats-screen">
      <Backdrop />
      <StatusBar style={fx.statusBar} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}>
        <OutlineButton title={t("Back")} icon="arrow-left" testID="stats-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
        <Text style={s.title}>{t("Lifetime Stats")}</Text>
        <Label>{t("Combat")}</Label>
        <View style={s.grid}>
          <Stat label={t("Total kills")} value={num(p.kills)} testID="life-kills" />
          <Stat label={t("Bosses defeated")} value={num(l.bosses)} testID="life-bosses" />
          <Stat label={t("Waves survived")} value={num(l.waves)} testID="life-waves" />
          <Stat label={t("Levels gained")} value={num(l.levels)} testID="life-levels" />
          <Stat label={t("Most kills in a run")} value={num(l.bestKills)} testID="life-best-kills" />
          <Stat label={t("Best wave")} value={num(p.bestWave)} testID="life-best-wave" />
        </View>
        <Label>{t("Time & runs")}</Label>
        <View style={s.grid}>
          <Stat label={t("Runs played")} value={num(p.runs)} testID="life-runs" />
          <Stat label={t("Time played")} value={fmtTime(l.time)} testID="life-time" />
          <Stat label={t("Longest run")} value={fmtTime(l.longest)} testID="life-longest" />
          <Stat label={t("Average wave")} value={p.runs ? (l.waves / p.runs).toFixed(1) : "0"} testID="life-avg-wave" />
        </View>
        <Label>{t("Favourites & progress")}</Label>
        <View style={s.grid}>
          <Stat label={t("Favourite weapon")} value={favW.k ? favW.w.name : "—"} testID="life-fav-weapon" />
          <Stat label={t("Favourite ship")} value={favC.n ? favC.c.name : "—"} testID="life-fav-ship" />
          <Stat label={t("Coins earned")} value={num(l.coins)} testID="life-coins" />
          <Stat label={t("Best streak")} value={t("{n} days", { n: Math.max(l.bestStreak, p.streak.count) })} testID="life-streak" />
          <Stat label={t("Achievements")} value={`${p.achievements.length}/${ACHIEVEMENTS.length}`} testID="life-achievements" />
          <Stat label={t("Prestiges")} value={num(prestiges)} testID="life-prestiges" />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md, maxWidth: 760, width: "100%", alignSelf: "center" },
  title: { fontFamily: fonts.display, fontSize: 30, color: c[fx.titleColor], ...fx.titleShadow },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: { flexBasis: "48%", flexGrow: 1, padding: spacing.md, borderRadius: radius.sm, backgroundColor: c.surfaceSecondary, ...pop(c), gap: spacing.xs },
  tLabel: { fontFamily: fonts.bold, fontSize: 12, color: c.muted, textTransform: "uppercase" },
  tValue: { fontFamily: fonts.display, fontSize: 22, color: c.onSurface },
}));
