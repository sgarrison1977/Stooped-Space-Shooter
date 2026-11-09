import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Lucide } from "@react-native-vector-icons/lucide";
import * as Haptics from "expo-haptics";
import { Backdrop } from "@/src/components/Backdrop";
import { DifficultyChips } from "@/src/components/DifficultyChips";
import { CoinPill, Label, OutlineButton, PrimaryButton } from "@/src/components/ui";
import { PrestigeBadge } from "@/src/components/PrestigeBadge";
import { fonts, fx, makeStyles, pop, radius, spacing, useTheme } from "@/src/theme";
import { useProfile } from "@/src/game/profile";
import { CLASSES, ClassId } from "@/src/game/arsenal";
import {
  BONUSES, bonusCost, bonusLv, buyBonus, canPrestige, LEVELS_PER_PRESTIGE, MAX_BONUS_LV, maxBonusLv, PRESTIGE_WAVE, prestigeCount, prestigeShip, shipBest,
} from "@/src/game/prestige";
import { t } from "@/src/i18n";

export default function Prestige() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, update } = useProfile();
  const [cls, setCls] = useState<ClassId | null>(null);
  const [confirm, setConfirm] = useState(false);
  if (!profile) return <View style={s.root} />;
  const ship = cls ?? profile.shipClass;
  const def = CLASSES.find((c) => c.id === ship)!;
  const count = prestigeCount(profile, ship), best = shipBest(profile, ship), ready = canPrestige(profile, ship), cap = maxBonusLv(profile, ship);

  const doPrestige = () => {
    if (!confirm) { setConfirm(true); return; }
    setConfirm(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    update((p) => prestigeShip(p, ship));
  };

  return (
    <View style={s.root} testID="prestige-screen">
      <Backdrop />
      <StatusBar style={fx.statusBar} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl }]}>
        <View style={s.head}>
          <OutlineButton title={t("Back")} icon="arrow-left" testID="prestige-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
          <CoinPill value={profile.coins} testID="prestige-coins" />
        </View>
        <Text style={s.title}>{t("Prestige")}</Text>
        <Text style={s.sub}>{t("Reach wave {n} with a ship to prestige it. Each prestige earns a badge and opens {k} more levels of that ship's bonuses.", { n: PRESTIGE_WAVE, k: LEVELS_PER_PRESTIGE })}</Text>
        <DifficultyChips options={CLASSES} value={ship} onChange={(id: ClassId) => { setCls(id); setConfirm(false); }} testPrefix="prestige-ship-chip" />

        <View style={s.card} testID="prestige-ship-card">
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{def.name}</Text>
              <Text style={s.meta}>{count ? t("Prestiged {n}x", { n: count }) : t("Not prestiged yet")}</Text>
            </View>
            <PrestigeBadge count={count} testID="prestige-badge" />
          </View>
          <Label>{t("Best wave since last prestige")}</Label>
          <View style={s.track}><View style={[s.fill, { width: `${Math.min(1, best / PRESTIGE_WAVE) * 100}%` }]} /></View>
          <Text style={s.meta} testID="prestige-progress">{Math.min(best, PRESTIGE_WAVE)}/{PRESTIGE_WAVE}</Text>
          <PrimaryButton
            title={confirm ? t("Tap again to confirm") : ready ? t("Prestige {ship}", { ship: def.name }) : t("Reach wave {n} to prestige", { n: PRESTIGE_WAVE })}
            testID="prestige-button" disabled={!ready} onPress={doPrestige}
          />
          {ready ? <Text style={s.meta}>{t("Your bonuses stay. Wave progress for this ship starts again.")}</Text> : null}
        </View>

        <View style={s.card} testID="prestige-bonuses">
          <View style={s.row}>
            <Label>{t("Ship bonuses")}</Label>
            <Text style={s.meta}>{t("Max level {a}/{b}", { a: cap, b: MAX_BONUS_LV })}</Text>
          </View>
          {!count ? <Text style={s.meta} testID="prestige-locked">{t("Prestige this ship to unlock its bonuses.")}</Text> : null}
          {BONUSES.map((b) => {
            const lv = bonusLv(profile, ship, b.id), cost = bonusCost(lv), maxed = lv >= MAX_BONUS_LV, capped = lv >= cap;
            const afford = !capped && profile.coins >= cost;
            return (
              <View key={b.id} style={[s.bonus, !count && { opacity: 0.5 }]} testID={`bonus-row-${b.id}`}>
                <Lucide name={b.icon} size={18} color={colors.brandSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.bName}>{b.name} <Text style={s.meta}>· {t("Lv")} {lv}/{MAX_BONUS_LV}</Text></Text>
                  <Text style={s.meta}>{b.desc}</Text>
                </View>
                <Pressable
                  testID={`bonus-buy-${b.id}`} disabled={!afford}
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); update((p) => buyBonus(p, ship, b.id)); }}
                  style={({ pressed }) => [s.buy, !afford && s.buyOff, pressed && { opacity: 0.7 }]}
                >
                  {maxed ? <Text style={s.buyText}>{t("MAX")}</Text> : capped ? <Lucide name="lock" size={14} color={colors.muted} /> : (
                    <><Lucide name="coins" size={12} color={colors.brandSecondary} /><Text style={s.buyText}>{cost}</Text></>
                  )}
                </Pressable>
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
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 30, color: c[fx.titleColor], ...fx.titleShadow },
  sub: { fontFamily: fonts.text, fontSize: 14, color: c.muted },
  card: { backgroundColor: c.surfaceSecondary, ...pop(c), borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, justifyContent: "space-between" },
  name: { fontFamily: fonts.display, fontSize: 22, color: c.onSurface },
  meta: { fontFamily: fonts.text, fontSize: 13, color: c.muted },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: c.success },
  bonus: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.sm, backgroundColor: c.surface, ...pop(c) },
  bName: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  buy: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, minWidth: 68, height: 44, borderRadius: radius.md, ...pop(c), backgroundColor: c.brandTertiary },
  buyOff: { opacity: 0.4 },
  buyText: { fontFamily: fonts.display, fontSize: 15, color: c.onSurface, paddingTop: 2 },
}));
