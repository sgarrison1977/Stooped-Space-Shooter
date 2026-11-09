import React from "react";
import { ActivityIndicator, Text, useWindowDimensions, View } from "react-native";
import { Backdrop } from "@/src/components/Backdrop";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { fonts, fx, makeStyles, pop, radius, setUiStyle, spacing, UI_STYLES, useTheme } from "@/src/theme";
import { Label } from "@/src/components/ui";
import { DifficultyChips } from "@/src/components/DifficultyChips";
import { useProfile } from "@/src/game/profile";
import { useSavedRun } from "@/src/game/save";
import { CoinPill, MuteButton } from "@/src/components/ui";
import { ArmouryCard, MusterCard } from "@/src/components/HomeCards";
import { startMusic } from "@/src/game/audio";
import { LoadoutCard } from "@/src/components/Loadout";

export default function Home() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, update } = useProfile();
  const saved = useSavedRun();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const padH = { paddingLeft: insets.left + spacing.xl, paddingRight: insets.right + spacing.xl };
  // Size the title from the screen width so the full word fits in every UI style's font
  const headW = width - insets.left - insets.right - spacing.xl * 2 - (wide ? 0 : 150);
  const titleSize = Math.max(18, Math.min(44, headW / (8 * fx.titleEm + 0.6)));

  return (
    <View style={s.root} testID="home-screen">
      <Backdrop />
      <StatusBar style={fx.statusBar} />
      <View style={[s.header, padH, { paddingTop: insets.top + (wide ? spacing.md : spacing.lg) }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { fontSize: titleSize }]} numberOfLines={1} testID="home-title">STOOOPID</Text>
          <Text style={s.titleSub} testID="home-game-title">Space Shooter Game</Text>
          <Text testID="home-subtitle" style={s.subtitle} numberOfLines={1}>
            {(profile?.name || "New pilot").toUpperCase()} · BEST WAVE {profile?.bestWave ?? 0}
          </Text>
        </View>
        <View style={s.headRight}>
          <MuteButton testID="home-mute-button" />
          <CoinPill value={profile?.coins ?? 0} testID="header-coins" />
        </View>
      </View>
      {!profile ? (
        <View style={s.loading}>
          <ActivityIndicator color={colors.brandPrimary} />
          <Text style={s.subtitle}>IGNITING DEEP...</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          bottomOffset={24}
          contentContainerStyle={[
            s.content,
            wide && s.contentWide,
            { paddingBottom: insets.bottom + spacing.xl, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={wide ? s.col : s.stack}>
          <View style={s.styleCard} testID="ui-style-card">
            <Label>UI Style</Label>
            <DifficultyChips
              options={UI_STYLES}
              value={profile.uiStyle}
              testPrefix="ui-style-chip"
              onChange={(uiStyle) => { setUiStyle(uiStyle); update((p) => ({ ...p, uiStyle })); }}
            />
          </View>
          <MusterCard
            profile={profile}
            onRename={(name) => update((p) => ({ ...p, name }))}
            onEnter={() => { startMusic(); router.push("/play"); }}
            saved={saved}
            onContinue={() => { startMusic(); router.push("/play?resume=1"); }}
            onDifficulty={(difficulty) => update((p) => ({ ...p, difficulty }))}
          />
          <LoadoutCard profile={profile} update={update} />
          </View>
          <View style={wide ? s.col : s.stack}>
          <ArmouryCard
            profile={profile}
            onBuy={(key, cost) =>
              update((p) => p.coins < cost ? p : ({ ...p, coins: p.coins - cost, upgrades: { ...p.upgrades, [key]: p.upgrades[key] + 1 } }))
            }
            onLeaderboard={() => router.push("/leaderboard")}
            onHangar={() => router.push("/hangar")}
            onBosses={() => router.push("/bosses")}
          />
          </View>
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", paddingBottom: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 34, letterSpacing: 1, color: c[fx.titleColor], ...fx.titleShadow, transform: [{ rotate: fx.tilt }] },
  styleCard: { backgroundColor: c.surfaceSecondary, ...pop(c), borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  titleSub: { fontFamily: fonts.display, fontSize: 14, letterSpacing: 1.5, color: c.onSurface, textTransform: "uppercase", marginTop: 2 },
  subtitle: { fontFamily: fonts.bold, fontSize: 15, letterSpacing: 1, color: c.muted, marginTop: spacing.xs },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  content: { gap: spacing.lg },
  contentWide: { flexDirection: "row", alignItems: "flex-start", maxWidth: 1000, width: "100%", alignSelf: "center" },
  col: { flex: 1, gap: spacing.lg },
  stack: { gap: spacing.lg },
  headRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
}));
