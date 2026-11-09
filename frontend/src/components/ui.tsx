import React from "react";
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import * as Haptics from "expo-haptics";
import { fonts, makeStyles, radius, spacing, useTheme, pop } from "@/src/theme";
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
  label: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, color: c.brandSecondary, textTransform: "uppercase" },
  coinPill: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs + 2, paddingHorizontal: spacing.md, height: 34,
    borderRadius: radius.sm, ...pop(c), backgroundColor: c.surfaceSecondary,
  },
  coinText: { fontFamily: fonts.display, fontSize: 16, color: c.onSurface, paddingTop: 3 },
  primary: {
    height: 58, borderRadius: radius.md, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", ...pop(c),
  },
  primaryText: { fontFamily: fonts.display, fontSize: 20, letterSpacing: 1.5, color: c.onBrandPrimary, textTransform: "uppercase", paddingTop: 4 },
  outline: {
    height: 50, borderRadius: radius.md, ...pop(c), flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: c.surface,
  },
  outlineText: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.8, color: c.onSurface, textTransform: "uppercase" },
  pressed: { transform: [{ translateY: 2 }, { rotate: "-1deg" }], borderBottomWidth: 3, borderRightWidth: 3 },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.sm, ...pop(c),
    alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary,
  },
  disabled: { opacity: 0.4 },
}));
