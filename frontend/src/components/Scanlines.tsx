import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/src/theme";

// Static CRT scanline overlay drawn once over the whole app; never intercepts touches
export const Scanlines = memo(function Scanlines() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 300 }, (_, i) => <View key={i} style={s.line} />)}
    </View>
  );
});

const s = StyleSheet.create({
  line: { height: 1, marginBottom: 2, backgroundColor: colors.arena, opacity: 0.22 },
});
