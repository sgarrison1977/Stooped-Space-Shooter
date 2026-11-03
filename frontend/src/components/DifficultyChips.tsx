import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { fonts, makeStyles, radius, spacing } from "@/src/theme";
import { DIFFICULTIES, DifficultyId } from "@/src/game/content";

// One horizontal chip row; selected chip changes colour/border only.
export function DifficultyChips({ value, onChange, testPrefix, padded }: { value: DifficultyId; onChange: (d: DifficultyId) => void; testPrefix: string; padded?: boolean }) {
  const s = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.row}
      contentContainerStyle={[s.content, padded && { paddingHorizontal: spacing.lg }]}
    >
      {DIFFICULTIES.map((d) => {
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
  row: { flexGrow: 0, height: 44 },
  content: { gap: spacing.sm, alignItems: "center" },
  chip: {
    height: 36, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.surface, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  chipOn: { borderColor: c.borderStrong, backgroundColor: c.brandTertiary },
  text: { fontFamily: fonts.text, fontSize: 11, letterSpacing: 1.2, color: c.muted, textTransform: "uppercase" },
  textOn: { color: c.onBrandTertiary },
}));
