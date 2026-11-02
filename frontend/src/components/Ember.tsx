import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/theme";

const GLOW =
  "https://images.unsplash.com/photo-1557951959-e3e30ee937e5?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=900";

// Ember-glow backdrop: spark photo + strong dark scrim so text stays readable.
export function EmberBackground() {
  const { colors } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={{ uri: GLOW }} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} contentFit="cover" />
      <LinearGradient
        colors={[colors.surface, colors.scrimLight, colors.surface]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
