import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { fetchLeaderboard, LeaderRow, loadProfile } from "@/src/game/profile";
import { DifficultyId } from "@/src/game/content";
import { DifficultyChips } from "@/src/components/DifficultyChips";
import { EmberBackground } from "@/src/components/Ember";
import { Label, OutlineButton } from "@/src/components/ui";

export default function Leaderboard() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [diff, setDiff] = useState<DifficultyId | null>(null);

  const load = useCallback(async (d?: DifficultyId) => {
    try {
      const p = await loadProfile();
      const use = d ?? diff ?? p.difficulty;
      if (!diff) setDiff(use);
      setRows(await fetchLeaderboard(use, p.id));
      setError(false);
    } catch {
      setError(true);
    }
  }, [diff]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (d: DifficultyId) => { setDiff(d); setRows(null); load(d); };

  return (
    <View style={s.root} testID="leaderboard-screen">
      <EmberBackground />
      <View style={[s.header, { paddingTop: insets.top + spacing.md, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg }]}>
        <Pressable testID="leaderboard-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={s.back} hitSlop={8}>
          <Lucide name="arrow-left" size={18} color={colors.onSurface} />
        </Pressable>
        <View>
          <Label>Deepest Dives</Label>
          <Text style={s.title}>Leaderboard</Text>
        </View>
      </View>
      <View style={[s.chips, { paddingLeft: insets.left, paddingRight: insets.right }]}>
        {diff ? <DifficultyChips value={diff} onChange={choose} testPrefix="leaderboard-diff" padded /> : null}
      </View>
      {!rows && !error ? (
        <View style={s.center}><ActivityIndicator color={colors.brandPrimary} /></View>
      ) : error && !rows ? (
        <View style={s.center}>
          <Text style={s.muted} testID="leaderboard-error">Could not reach the deep. Check your connection.</Text>
          <OutlineButton title="Retry" testID="leaderboard-retry-button" onPress={() => load()} style={{ paddingHorizontal: spacing.xl }} />
        </View>
      ) : (
        <FlatList
          data={rows ?? []}
          keyExtractor={(r) => `${r.rank}-${r.name}`}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + spacing.xl, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg }]}
          refreshControl={<RefreshControl tintColor={colors.brandPrimary} refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListEmptyComponent={<Text style={[s.muted, { textAlign: "center" }]} testID="leaderboard-empty">No dives yet. Be the first to climb.</Text>}
          renderItem={({ item }) => (
            <View style={[s.row, item.is_you && s.rowYou]} testID={`leaderboard-row-${item.rank}`}>
              <Text style={[s.rank, item.rank <= 3 && s.rankTop]}>{item.rank}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{item.name}{item.is_you ? "  (you)" : ""}</Text>
                <Text style={s.muted}>{item.best_kills} kills · {item.runs} {item.runs === 1 ? "run" : "runs"}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.wave}>{item.best_wave}</Text>
                <Text style={s.waveLabel}>WAVE</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  chips: { height: 56, justifyContent: "center", width: "100%", maxWidth: 720, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingBottom: spacing.lg, width: "100%", maxWidth: 720, alignSelf: "center" },
  back: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  title: { fontFamily: fonts.display, fontSize: 24, color: c.onSurface, letterSpacing: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg, padding: spacing.xl },
  list: { gap: spacing.sm, width: "100%", maxWidth: 720, alignSelf: "center" },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.sm,
    borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary,
  },
  rowYou: { borderColor: c.borderStrong, backgroundColor: c.brandTertiary },
  rank: { width: 28, fontFamily: fonts.display, fontSize: 16, color: c.muted, textAlign: "center" },
  rankTop: { color: c.brandSecondary },
  name: { fontFamily: fonts.display, fontSize: 15, color: c.onSurface },
  muted: { fontFamily: fonts.text, fontSize: 12, color: c.muted },
  wave: { fontFamily: fonts.display, fontSize: 20, color: c.onSurface },
  waveLabel: { fontFamily: fonts.text, fontSize: 8, letterSpacing: 1.6, color: c.muted },
}));
