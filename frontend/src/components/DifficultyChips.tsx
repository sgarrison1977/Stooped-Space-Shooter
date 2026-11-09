import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { fonts, ink, makeStyles, pop, radius, spacing } from "@/src/theme";
import { DIFFICULTIES } from "@/src/game/content";

// One horizontal chip row; selected chip changes colour/border only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DifficultyChips({ value, onChange, testPrefix, padded, options = DIFFICULTIES }: { value: string; onChange: (d: any) => void; testPrefix: string; padded?: boolean; options?: { id: string; name: string }[] }) {
  const s = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.row}
      contentContainerStyle={[s.content, padded && { paddingHorizontal: spacing.lg }]}
    >
      {options.map((d) => {
        const on = d.id === value;
        return (
          <Pressable
            key={d.id}
            testID={`${testPrefix}-${d.id}`}
            hitSlop={{ top: 6, bottom: 6 }}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange(d.id); }}
            style={[s.chip, on && s.chipOn]}
          >
            <Text style={[s.text, on && s.textOn]}>{d.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexGrow: 0, height: 50 },
  content: { gap: spacing.sm, alignItems: "center" },
  chip: {
    height: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, ...ink(c),
    backgroundColor: c.surface, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  chipOn: { ...pop(c), backgroundColor: c.brandTertiary, transform: [{ rotate: "-2deg" }] },
  text: { fontFamily: fonts.bold, fontSize: 13, color: c.muted, textTransform: "uppercase" },
  textOn: { color: c.onBrandTertiary },
}));
