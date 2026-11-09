import React from "react";
import { ActivityIndicator, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { fonts, makeStyles, spacing, useTheme } from "@/src/theme";
import { useProfile } from "@/src/game/profile";
import { useSavedRun } from "@/src/game/save";
import { EmberBackground } from "@/src/components/Ember";
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

  return (
    <View style={s.root} testID="home-screen">
      <StatusBar style="light" />
      <EmberBackground />
      <View style={[s.header, padH, { paddingTop: insets.top + (wide ? spacing.md : spacing.lg) }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit>STOOOPID</Text>
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
  title: { fontFamily: fonts.display, fontSize: 26, letterSpacing: 9, color: c.onSurface },
  titleSub: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 4, color: c.brandSecondary, textTransform: "uppercase", marginTop: 2 },
  subtitle: { fontFamily: fonts.text, fontSize: 10, letterSpacing: 2.4, color: c.muted, marginTop: spacing.xs },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  content: { gap: spacing.lg },
  contentWide: { flexDirection: "row", alignItems: "flex-start", maxWidth: 1000, width: "100%", alignSelf: "center" },
  col: { flex: 1, gap: spacing.lg },
  stack: { gap: spacing.lg },
  headRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
}));
