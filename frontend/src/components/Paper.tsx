import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/src/theme";

// Ruled notebook paper with a red margin line; render as the first child of a screen root
export const Paper = memo(function Paper() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 60 }, (_, i) => <View key={i} style={s.rule} />)}
      <View style={s.margin} />
    </View>
  );
});

const s = StyleSheet.create({
  rule: { height: 30, borderBottomWidth: 1, borderBottomColor: colors.divider },
  margin: { position: "absolute", top: 0, bottom: 0, left: 22, width: 2, backgroundColor: colors.borderStrong, opacity: 0.5 },
});
