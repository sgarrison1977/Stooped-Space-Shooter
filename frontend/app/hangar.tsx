import React, { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Backdrop } from "@/src/components/Backdrop";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Lucide } from "@react-native-vector-icons/lucide";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { fonts, makeStyles, radius, spacing, useTheme, pop, fx } from "@/src/theme";
import { Profile, useProfile } from "@/src/game/profile";
import { SKINS, Skin, skinById, Trail, TRAILS, trailById } from "@/src/game/content";
import { PlayerSprite } from "@/src/components/ShipArt";
import { CoinPill, Label } from "@/src/components/ui";

type Kind = "skin" | "trail";

function ItemButton({ owned, equipped, cost, coins, onPress, testID }: { owned: boolean; equipped: boolean; cost: number; coins: number; onPress: () => void; testID: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const afford = cost >= 0 && coins >= cost;
  if (equipped) return <View style={[s.btn, s.btnEquipped]} testID={testID}><Lucide name="check" size={12} color={colors.onBrandTertiary} /><Text style={s.btnTextOn}>Equipped</Text></View>;
  return (
    <Pressable testID={testID} disabled={!owned && !afford} onPress={onPress} style={({ pressed }) => [s.btn, !owned && !afford && s.btnDisabled, pressed && { opacity: 0.7 }]}>
      {owned ? <Text style={s.btnText}>Equip</Text> : (
        <>
          <Lucide name={afford ? "coins" : "lock"} size={12} color={colors.brandSecondary} />
          <Text style={s.btnText}>{cost < 0 ? "Streak" : cost}</Text>
        </>
      )}
    </Pressable>
  );
}

export default function Hangar() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const cols = wide ? 4 : 2;
  const { profile, update } = useProfile();
  const [preview, setPreview] = useState<{ skin?: Skin; trail?: Trail }>({});

  if (!profile) return <View style={s.root} />;
  const skin = preview.skin ?? skinById(profile.skin);
  const trail = preview.trail ?? trailById(profile.trail);

  const acquire = (kind: Kind, id: string, cost: number) => {
    update((p: Profile) => {
      const owned = kind === "skin" ? p.ownedSkins : p.ownedTrails;
      const has = owned.includes(id);
      if (!has && (cost < 0 || p.coins < cost)) return p;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return kind === "skin"
        ? { ...p, coins: has ? p.coins : p.coins - cost, ownedSkins: has ? owned : [...owned, id], skin: id }
        : { ...p, coins: has ? p.coins : p.coins - cost, ownedTrails: has ? owned : [...owned, id], trail: id };
    });
    setPreview({});
  };

  const cardW = { width: `${100 / cols - 2}%` as const };

  return (
    <View style={s.root} testID="hangar-screen">
      <Backdrop />
      <StatusBar style={fx.statusBar} />
      <View style={[s.header, { paddingTop: insets.top + spacing.md, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg }]}>
        <Pressable testID="hangar-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={s.back} hitSlop={8}>
          <Lucide name="arrow-left" size={18} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Label>Outfit your fighter</Label>
          <Text style={s.title}>Hangar</Text>
        </View>
        <CoinPill value={profile.coins} testID="hangar-coins" />
      </View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xl, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)} style={s.preview} testID="hangar-preview">
          <View style={s.previewShip}>
            <LinearGradient colors={[trail.flame, trail.color, colors.transparent]} style={s.previewTrail} />
            <PlayerSprite size={112} skin={skin} />
          </View>
          <Text style={s.previewName} testID="hangar-preview-name">{skin.name}</Text>
          <Text style={s.previewSub}>{trail.name}{preview.skin || preview.trail ? " · Preview" : ""}</Text>
        </Animated.View>

        <Text style={s.section}>Hulls</Text>
        <View style={s.grid}>
          {SKINS.map((k) => {
            const owned = profile.ownedSkins.includes(k.id);
            return (
              <Pressable key={k.id} testID={`skin-card-${k.id}`} onPress={() => setPreview((p) => ({ ...p, skin: k }))} style={[s.card, cardW, skin.id === k.id && s.cardActive]}>
                <PlayerSprite size={56} skin={k} />
                <Text style={s.cardName} numberOfLines={1}>{k.name}</Text>
                <ItemButton owned={owned} equipped={profile.skin === k.id} cost={k.cost} coins={profile.coins} onPress={() => acquire("skin", k.id, k.cost)} testID={`skin-action-${k.id}`} />
              </Pressable>
            );
          })}
        </View>

        <Text style={s.section}>Engine Trails</Text>
        <View style={s.grid}>
          {TRAILS.map((t) => {
            const owned = profile.ownedTrails.includes(t.id);
            return (
              <Pressable key={t.id} testID={`trail-card-${t.id}`} onPress={() => setPreview((p) => ({ ...p, trail: t }))} style={[s.card, cardW, trail.id === t.id && s.cardActive]}>
                <LinearGradient colors={[t.flame, t.color, colors.transparent]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.swatch} />
                <Text style={s.cardName} numberOfLines={1}>{t.name}</Text>
                <ItemButton owned={owned} equipped={profile.trail === t.id} cost={t.cost} coins={profile.coins} onPress={() => acquire("trail", t.id, t.cost)} testID={`trail-action-${t.id}`} />
              </Pressable>
            );
          })}
        </View>
        <Text style={s.note}>Everything here is earned with in-game coins.</Text>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingBottom: spacing.lg },
  back: { width: 44, height: 44, borderRadius: radius.sm, ...pop(c), alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  title: { fontFamily: fonts.display, fontSize: 24, color: c.onSurface, letterSpacing: 1 },
  content: { gap: spacing.md, width: "100%", maxWidth: 900, alignSelf: "center" },
  preview: { alignItems: "center", padding: spacing.xl, borderRadius: radius.md, ...pop(c), backgroundColor: c.arena },
  previewShip: { width: 112, height: 150, alignItems: "center" },
  previewTrail: { position: "absolute", top: 92, width: 26, height: 58, borderRadius: 13 },
  previewName: { fontFamily: fonts.display, fontSize: 22, color: c.onArena, marginTop: spacing.sm },
  previewSub: { fontFamily: fonts.text, fontSize: 13, color: c.onArenaMuted, marginTop: 2 },
  section: { fontFamily: fonts.text, fontSize: 14, letterSpacing: 2.4, color: c.brandSecondary, textTransform: "uppercase", marginTop: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between" },
  card: {
    alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, ...pop(c),
    backgroundColor: c.surfaceSecondary, marginBottom: spacing.xs,
  },
  cardActive: { backgroundColor: c.brandTertiary },
  cardName: { fontFamily: fonts.display, fontSize: 13, color: c.onSurface },
  swatch: { width: "100%", height: 56, borderRadius: radius.sm },
  btn: {
    flexDirection: "row", gap: 4, height: 36, minWidth: 96, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center",
    borderRadius: radius.sm, ...pop(c), backgroundColor: c.brandTertiary,
  },
  btnEquipped: { borderColor: c.border, backgroundColor: c.surfaceTertiary },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.display, fontSize: 12, color: c.brandSecondary },
  btnTextOn: { fontFamily: fonts.text, fontSize: 14, letterSpacing: 1, color: c.onBrandTertiary },
  note: { fontFamily: fonts.text, fontSize: 14, color: c.muted, textAlign: "center", marginTop: spacing.md },
}));
