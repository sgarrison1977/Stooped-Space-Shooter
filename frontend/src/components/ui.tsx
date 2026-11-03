import React from "react";
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import * as Haptics from "expo-haptics";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { useProfile } from "@/src/game/profile";
import { setMuted, startMusic } from "@/src/game/audio";

export function MuteButton({ testID }: { testID: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const { profile, update } = useProfile();
  const muted = !!profile?.muted;
  return (
    <Pressable
      testID={testID}
      hitSlop={6}
      accessibilityLabel={muted ? "Unmute sound" : "Mute sound"}
      onPress={() => {
        const m = !muted;
        setMuted(m);
        if (!m) startMusic();
        update((p) => ({ ...p, muted: m }));
      }}
      style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
    >
      <Lucide name={muted ? "volume-x" : "volume-2"} size={16} color={muted ? colors.muted : colors.onSurfaceSecondary} />
    </Pressable>
  );
}

export function Label({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<TextStyle>; testID?: string }) {
  const s = useStyles();
  return <Text testID={testID} style={[s.label, style]}>{children}</Text>;
}

export function CoinPill({ value, testID }: { value: number; testID?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.coinPill} testID={testID}>
      <Lucide name="coins" size={14} color={colors.brandSecondary} />
      <Text style={s.coinText}>{value}</Text>
    </View>
  );
}

export function PrimaryButton({ title, onPress, testID, disabled }: { title: string; onPress: () => void; testID: string; disabled?: boolean }) {
  const s = useStyles();
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); onPress(); }}
      style={({ pressed }) => [s.primary, pressed && s.pressed, disabled && s.disabled]}
    >
      <Text style={s.primaryText}>{title}</Text>
    </Pressable>
  );
}

export function OutlineButton({ title, icon, onPress, testID, style }: { title: string; icon?: any; onPress: () => void; testID: string; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [s.outline, pressed && s.pressed, style]}>
      {icon ? <Lucide name={icon} size={15} color={colors.onSurfaceSecondary} /> : null}
      <Text style={s.outlineText}>{title}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  label: { fontFamily: fonts.text, fontSize: 10, letterSpacing: 2.4, color: c.brandSecondary, textTransform: "uppercase" },
  coinPill: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs + 2, paddingHorizontal: spacing.md, height: 34,
    borderRadius: radius.sm, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary,
  },
  coinText: { fontFamily: fonts.display, fontSize: 14, color: c.brandSecondary },
  primary: {
    height: 52, borderRadius: radius.sm, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center",
  },
  primaryText: { fontFamily: fonts.display, fontSize: 15, letterSpacing: 3.5, color: c.onSurface, textTransform: "uppercase" },
  outline: {
    height: 46, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: c.surface,
  },
  outlineText: { fontFamily: fonts.text, fontSize: 11, letterSpacing: 2.6, color: c.onSurfaceSecondary, textTransform: "uppercase" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border,
    alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary,
  },
  disabled: { opacity: 0.4 },
}));
