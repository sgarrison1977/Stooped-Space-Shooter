import React from "react";
import { Text, View } from "react-native";
import { fonts, makeStyles, radius } from "@/src/theme";
import { badgeName, badgeTier, TIER_COLORS } from "@/src/game/prestige";
import { t } from "@/src/i18n";

// Prestige badge: metal tier colour + star count; renders nothing before the first prestige
export function PrestigeBadge({ count, testID }: { count: number; testID?: string }) {
  const s = useStyles();
  if (!count) return null;
  const color = TIER_COLORS[badgeTier(count)];
  return (
    <View style={[s.badge, { borderColor: color }]} testID={testID}>
      <Text style={[s.star, { color }]}>★{count}</Text>
      <Text style={[s.tier, { color }]}>{t(badgeName(count))}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  badge: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 2, backgroundColor: c.surface },
  star: { fontFamily: fonts.display, fontSize: 18 },
  tier: { fontFamily: fonts.bold, fontSize: 11, textTransform: "uppercase" },
}));
