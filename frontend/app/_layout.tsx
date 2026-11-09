import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { LogBox, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { colors } from "@/src/theme";
import { initAudio, setMuted, startMusic } from "@/src/game/audio";
import { loadProfile } from "@/src/game/profile";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

export default function RootLayout() {
  const [loaded, err] = useFonts({
    "BarlowCondensed-BoldItalic": require("../assets/fonts/BarlowCondensed-BoldItalic.ttf"),
    "Barlow-Medium": require("../assets/fonts/Barlow-Medium.ttf"),
    "Barlow-SemiBold": require("../assets/fonts/Barlow-SemiBold.ttf"),
  });
  useEffect(() => {
    initAudio();
    loadProfile().then((p) => { setMuted(p.muted); startMusic(); });
  }, []);
  // One app level ErrorBoundary; a render crash shows a reload screen
  // instead of a blank app. GestureHandlerRootView must wrap the whole tree
  // or any gesture/swipe/drawer screen crashes in Expo Go.
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            {loaded || err ? (
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface }, animation: "fade" }}>
                <Stack.Screen name="play" options={{ gestureEnabled: false }} />
              </Stack>
            ) : (
              <View style={styles.boot} />
            )}
          </KeyboardProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  boot: { flex: 1, backgroundColor: colors.surface },
});
