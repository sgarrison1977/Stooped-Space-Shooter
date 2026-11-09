import React, { useState } from "react";
import { t } from "@/src/i18n";
import { Pressable, Text, TextInput, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { fonts, makeStyles, radius, spacing, useTheme, pop, fx } from "@/src/theme";
import { Label, PrimaryButton, OutlineButton } from "./ui";
import { Profile } from "@/src/game/profile";
import { RunSummary } from "@/src/game/save";
import { baseStats, MAX_UPGRADE_LEVEL, roman, UPGRADES, upgradeCost, UpgradeKey } from "@/src/game/config";
import { difficulty, DifficultyId } from "@/src/game/content";
import { DifficultyChips } from "./DifficultyChips";

function StatTile({ icon, label, value, testID }: { icon: any; label: string; value: number; testID: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.tile}>
      <View style={s.tileHead}>
        <Lucide name={icon} size={11} color={colors.muted} />
        <Text style={s.tileLabel}>{label}</Text>
      </View>
      <Text testID={testID} style={s.tileValue}>{value}</Text>
    </View>
  );
}

function Row({ label, value, testID }: { label: string; value: string; testID: string }) {
  const s = useStyles();
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text testID={testID} style={s.rowValue}>{value}</Text>
    </View>
  );
}

export function MusterCard({ profile, onRename, onEnter, onDifficulty, saved, onContinue }: { profile: Profile; onRename: (n: string) => void; onEnter: () => void; onDifficulty: (d: DifficultyId) => void; saved: RunSummary | null; onContinue: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const [editing, setEditing] = useState(!profile.name);
  const [draft, setDraft] = useState(profile.name);
  const st = baseStats(profile.upgrades);
  const save = () => {
    const n = draft.trim().slice(0, 20);
    if (!n) return;
    onRename(n);
    setEditing(false);
  };
  return (
    <Animated.View entering={FadeInDown.duration(450)} style={s.card} testID="muster-card">
      <Label>{t("The Muster")}</Label>
      {editing ? (
        <View style={s.nameEdit}>
          <TextInput
            testID="pilot-name-input"
            value={draft}
            onChangeText={setDraft}
            placeholder={t("Name your pilot")}
            placeholderTextColor={colors.muted}
            maxLength={20}
            autoFocus={!profile.name}
            onSubmitEditing={save}
            returnKeyType="done"
            style={s.input}
          />
          <Pressable testID="pilot-name-save-button" onPress={save} style={s.saveBtn} hitSlop={6}>
            <Lucide name="check" size={18} color={colors.onBrandPrimary} />
          </Pressable>
        </View>
      ) : (
        <Pressable testID="pilot-name-edit-button" onPress={() => { setDraft(profile.name); setEditing(true); }} style={s.nameRow}>
          <Text testID="pilot-name-text" style={s.name} numberOfLines={1}>{profile.name}</Text>
          <Lucide name="pencil" size={14} color={colors.muted} />
        </Pressable>
      )}
      <View style={s.grid}>
        <StatTile icon="trophy" label={t("Best Wave")} value={profile.bestWave} testID="stat-best-wave" />
        <StatTile icon="skull" label={t("Kills")} value={profile.kills} testID="stat-kills" />
        <StatTile icon="repeat" label={t("Runs")} value={profile.runs} testID="stat-runs" />
        <StatTile icon="coins" label={t("Coins")} value={profile.coins} testID="stat-coins" />
      </View>
      <View style={s.divider} />
      <Row label={t("Damage")} value={String(st.damage)} testID="stat-damage" />
      <Row label={t("Resistance")} value={`${Math.round(st.resist * 100)}%`} testID="stat-resistance" />
      <Row label={t("Max Health")} value={String(st.maxHp)} testID="stat-max-health" />
      <View style={{ height: spacing.sm }} />
      <Label>{t("Difficulty")}</Label>
      <DifficultyChips value={profile.difficulty} onChange={onDifficulty} testPrefix="difficulty-chip" />
      <Text style={s.diffDesc} testID="difficulty-desc">{difficulty(profile.difficulty).desc}</Text>
      {saved && profile.name ? (
        <PrimaryButton title={`${t("Continue · Wave {w} · Lv {l}", { w: saved.wave, l: saved.level })} · ${"♥".repeat(saved.lives)}`} testID="continue-run-button" onPress={onContinue} />
      ) : null}
      {saved && profile.name ? (
        <OutlineButton title={t("New Run")} testID="enter-the-deep-button" onPress={onEnter} />
      ) : (
        <PrimaryButton title={t("Enter the Deep")} testID="enter-the-deep-button" onPress={onEnter} disabled={!profile.name} />
      )}
      <Text style={s.hint}>{!profile.name ? t("Name your pilot to dive") : saved ? t("Starting a new run replaces your saved run") : t("Drag to thrust · Automatically attacks")}</Text>
    </Animated.View>
  );
}

export function ArmouryCard({ profile, onBuy, onLeaderboard, onHangar, onBosses, onPrestige, onStats }: { profile: Profile; onBuy: (k: UpgradeKey, cost: number) => void; onLeaderboard: () => void; onHangar: () => void; onBosses: () => void; onPrestige: () => void; onStats: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(450).delay(120)} style={s.card} testID="armoury-card">
      <View style={s.armouryHead}>
        <Text style={s.cardTitle}>{t("Armoury")}</Text>
        <View style={s.inlineCoins}>
          <Lucide name="coins" size={13} color={colors.brandSecondary} />
          <Text testID="armoury-coins" style={s.inlineCoinText}>{profile.coins}</Text>
        </View>
      </View>
      {UPGRADES.map((u) => {
        const lv = profile.upgrades[u.key];
        const maxed = lv >= MAX_UPGRADE_LEVEL;
        const cost = upgradeCost(u.base, lv);
        const afford = !maxed && profile.coins >= cost;
        return (
          <View key={u.key} style={s.upRow} testID={`upgrade-row-${u.key}`}>
            <View style={{ flex: 1 }}>
              <Text style={s.upName} numberOfLines={1}>
                {u.name} <Text style={s.upLv}>· {t("Lv")} {roman(lv)}</Text>
              </Text>
              <Text style={s.upDesc}>{u.desc}</Text>
            </View>
            <Pressable
              testID={`upgrade-buy-${u.key}`}
              disabled={!afford}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); onBuy(u.key, cost); }}
              style={({ pressed }) => [s.buy, !afford && s.buyDisabled, pressed && { opacity: 0.7 }]}
            >
              <Lucide name="coins" size={12} color={colors.brandSecondary} />
              <Text style={s.buyText}>{maxed ? t("MAX") : cost}</Text>
            </Pressable>
          </View>
        );
      })}
      <View style={s.btnRow}>
        <OutlineButton title={t("Hangar")} icon="rocket" testID="hangar-button" onPress={onHangar} style={{ flex: 1 }} />
        <OutlineButton title={t("Bosses")} icon="skull" testID="boss-gallery-button" onPress={onBosses} style={{ flex: 1 }} />
      </View>
      <View style={s.btnRow}>
        <OutlineButton title={t("Prestige")} icon="star" testID="prestige-button-home" onPress={onPrestige} style={{ flex: 1 }} />
        <OutlineButton title={t("Stats")} icon="chart-column" testID="stats-button" onPress={onStats} style={{ flex: 1 }} />
      </View>
      <OutlineButton title={t("Leaderboard")} icon="trophy" testID="leaderboard-button" onPress={onLeaderboard} />
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.surfaceSecondary, ...pop(c), borderRadius: radius.md,
    padding: spacing.xl, gap: spacing.md,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 26, color: c.onSurface, letterSpacing: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 44 },
  name: { fontFamily: fonts.display, fontSize: 34, color: c[fx.titleColor], flexShrink: 1, ...fx.titleShadow },
  nameEdit: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  input: {
    flex: 1, minWidth: 0, height: 52, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.md,
    color: c.onSurface, fontFamily: fonts.display, fontSize: 18, backgroundColor: c.surface,
  },
  saveBtn: { width: 52, height: 52, borderRadius: radius.md, ...pop(c), backgroundColor: c.success, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    flexBasis: "48%", flexGrow: 1, ...pop(c), borderRadius: radius.sm,
    padding: spacing.md, backgroundColor: c.surfaceTertiary, gap: spacing.xs,
  },
  tileHead: { flexDirection: "row", alignItems: "center", gap: 5 },
  tileLabel: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurfaceSecondary, textTransform: "uppercase" },
  tileValue: { fontFamily: fonts.display, fontSize: 26, color: c.onSurface },
  divider: { height: 1, borderRadius: 2, backgroundColor: c.divider, marginVertical: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontFamily: fonts.bold, fontSize: 15, color: c.muted, textTransform: "uppercase" },
  rowValue: { fontFamily: fonts.display, fontSize: 16, color: c.onSurface },
  hint: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.5, color: c.muted, textAlign: "center", textTransform: "uppercase" },
  armouryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  inlineCoins: { flexDirection: "row", alignItems: "center", gap: 5 },
  inlineCoinText: { fontFamily: fonts.display, fontSize: 17, color: c.onSurface },
  upRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, ...pop(c),
    borderRadius: radius.sm, padding: spacing.md, backgroundColor: c.surface,
  },
  upName: { fontFamily: fonts.display, fontSize: 17, color: c.onSurface },
  upLv: { fontFamily: fonts.display, fontSize: 12, color: c.muted },
  upDesc: { fontFamily: fonts.text, fontSize: 14, color: c.muted, marginTop: 2 },
  buy: {
    flexDirection: "row", alignItems: "center", gap: 4, minWidth: 68, height: 44, justifyContent: "center",
    borderRadius: radius.md, ...pop(c), backgroundColor: c.brandTertiary,
  },
  buyDisabled: { opacity: 0.4 },
  buyText: { fontFamily: fonts.display, fontSize: 15, color: c.onSurface, paddingTop: 2 },
  btnRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  diffDesc: { fontFamily: fonts.text, fontSize: 14, color: c.muted, marginTop: -spacing.xs, marginBottom: spacing.xs },
}));
