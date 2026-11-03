import React from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown } from "react-native-reanimated";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { formatSecs, useProfile } from "@/src/game/profile";
import { BOSSES, difficulty } from "@/src/game/content";
import { BossSprite } from "@/src/components/ShipArt";
import { EmberBackground } from "@/src/components/Ember";
import { Label } from "@/src/components/ui";

const BOSS_EVERY = 3;

export default function BossGallery() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const cols = width > height ? 4 : 2;
  const { profile } = useProfile();
  const records = profile?.bossRecords ?? {};
  const beaten = BOSSES.filter((_, i) => records[String(i)]).length;

  return (
    <View style={s.root} testID="boss-gallery-screen">
      <EmberBackground />
      <View style={[s.header, { paddingTop: insets.top + spacing.md, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg }]}>
        <Pressable testID="boss-gallery-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={s.back} hitSlop={8}>
          <Lucide name="arrow-left" size={18} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Label>Trophies of the deep</Label>
          <Text style={s.title}>Boss Gallery</Text>
        </View>
        <View style={s.progress}>
          <Text style={s.progressText} testID="boss-gallery-progress">{beaten}/{BOSSES.length}</Text>
          <Text style={s.progressLabel}>Defeated</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + spacing.xl, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {BOSSES.map((b, i) => {
          const r = records[String(i)];
          return (
            <Animated.View
              key={b.name}
              entering={FadeInDown.delay(50 * i).duration(320)}
              style={[s.card, { width: `${100 / cols - 2}%` }, r && s.cardBeaten]}
              testID={`boss-card-${i}`}
            >
              <View style={s.art}>
                <View style={{ opacity: r ? 1 : 0.12 }}>
                  <BossSprite size={88} variant={i} />
                </View>
                {!r ? <View style={s.lock}><Lucide name="lock" size={18} color={colors.muted} /></View> : null}
              </View>
              <Text style={s.name} numberOfLines={1} testID={`boss-name-${i}`}>{r ? b.name : "Unknown Threat"}</Text>
              <Text style={s.tag} numberOfLines={2}>{r ? b.tagline : `First appears around wave ${(i + 1) * BOSS_EVERY}`}</Text>
              {r ? (
                <View style={s.stats}>
                  <View style={s.statRow}>
                    <Text style={s.statLabel}>Fastest</Text>
                    <Text style={s.statValue} testID={`boss-fastest-${i}`}>{formatSecs(r.fastest)}</Text>
                  </View>
                  <View style={s.statRow}>
                    <Text style={s.statLabel}>Defeated</Text>
                    <Text style={s.statValue} testID={`boss-kills-${i}`}>×{r.kills}</Text>
                  </View>
                  <Text style={s.diff}>Record on {difficulty(r.fastestDifficulty).name}</Text>
                </View>
              ) : null}
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingBottom: spacing.lg, width: "100%", maxWidth: 900, alignSelf: "center" },
  back: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  title: { fontFamily: fonts.display, fontSize: 24, color: c.onSurface, letterSpacing: 1 },
  progress: { alignItems: "flex-end" },
  progressText: { fontFamily: fonts.display, fontSize: 20, color: c.brandSecondary },
  progressLabel: { fontFamily: fonts.text, fontSize: 9, letterSpacing: 1.6, color: c.muted, textTransform: "uppercase" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.sm, width: "100%", maxWidth: 900, alignSelf: "center" },
  card: {
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary,
    alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs,
  },
  cardBeaten: { borderColor: c.brandTertiary, backgroundColor: c.arena },
  art: { width: 96, height: 96, alignItems: "center", justifyContent: "center" },
  lock: { position: "absolute" },
  name: { fontFamily: fonts.display, fontSize: 14, color: c.onSurface, textAlign: "center" },
  tag: { fontFamily: fonts.text, fontSize: 11, color: c.muted, textAlign: "center", minHeight: 30 },
  stats: { alignSelf: "stretch", gap: 4, marginTop: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: c.divider },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  statLabel: { fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.4, color: c.muted, textTransform: "uppercase" },
  statValue: { fontFamily: fonts.display, fontSize: 13, color: c.onSurface },
  diff: { fontFamily: fonts.text, fontSize: 10, color: c.brandSecondary, textAlign: "center", marginTop: 2 },
}));
