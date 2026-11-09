import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { makeStyles, setUiStyle, UI_STYLES, useUiStyle } from "@/src/theme";
import { stylesUnlocked } from "@/src/game/retention";
import { Scanlines } from "@/src/components/Backdrop";
import { initAudio, setMuted, setSoundPack, startMusic } from "@/src/game/audio";
import { loadProfile } from "@/src/game/profile";
import { applyLanguage } from "@/src/i18n/data";
import { useLang } from "@/src/i18n";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

export default function RootLayout() {
  const [loaded, err] = useFonts({
    // every selectable UI style's fonts
    Cinzel: require("../assets/fonts/Cinzel.ttf"),
    DMSans: require("../assets/fonts/DMSans.ttf"),
    LuckiestGuy: require("../assets/fonts/LuckiestGuy.ttf"),
    Sniglet: require("../assets/fonts/Sniglet.ttf"),
    SnigletBold: require("../assets/fonts/SnigletBold.ttf"),
    PixelifySans: require("../assets/fonts/PixelifySans.ttf"),
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "BarlowCondensed-BoldItalic": require("../assets/fonts/BarlowCondensed-BoldItalic.ttf"),
    "Barlow-Medium": require("../assets/fonts/Barlow-Medium.ttf"),
    "Barlow-SemiBold": require("../assets/fonts/Barlow-SemiBold.ttf"),
    PermanentMarker: require("../assets/fonts/PermanentMarker.ttf"),
    PatrickHand: require("../assets/fonts/PatrickHand.ttf"),
    BlackOpsOne: require("../assets/fonts/BlackOpsOne.ttf"),
    ShareTechMono: require("../assets/fonts/ShareTechMono.ttf"),
    Bangers: require("../assets/fonts/Bangers.ttf"),
    ComicNeueBold: require("../assets/fonts/ComicNeueBold.ttf"),
    ArchitectsDaughter: require("../assets/fonts/ArchitectsDaughter.ttf"),
  });
  const [ready, setReady] = useState(false);
  const style = useUiStyle();
  const lang = useLang();
  const styles = useStyles();
  useEffect(() => {
    initAudio();
    loadProfile().then((p) => {
      // styles unlock in on-screen order; fall back to Ember if the saved one is still locked
      const st = UI_STYLES.findIndex((x) => x.id === p.uiStyle) < stylesUnlocked(p) ? p.uiStyle : "ember";
      applyLanguage(p.lang ?? "auto"); setUiStyle(st); setSoundPack(st); setReady(true); setMuted(p.muted); startMusic(); });
  }, []);
  // One app level ErrorBoundary; a render crash shows a reload screen
  // instead of a blank app. GestureHandlerRootView must wrap the whole tree
  // or any gesture/swipe/drawer screen crashes in Expo Go.
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            {(loaded || err) && ready ? (
              // keyed on the UI style + language so the whole tree remounts with the new look
              <View key={`${style}-${lang}`} style={styles.root}>
                <Stack screenOptions={{ headerShown: false, contentStyle: styles.root, animation: "fade" }}>
                  <Stack.Screen name="play" options={{ gestureEnabled: false }} />
                </Stack>
                <Scanlines />
              </View>
            ) : (
              <View style={styles.boot} />
            )}
          </KeyboardProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  boot: { flex: 1, backgroundColor: c.surface },
}));
