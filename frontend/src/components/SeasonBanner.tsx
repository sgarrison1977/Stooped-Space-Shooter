import React from "react";
import { Text, View } from "react-native";
import { fonts, makeStyles, radius, spacing } from "@/src/theme";
import { Profile } from "@/src/game/profile";
import { activeSeason, nextSeason, SEASON_GOAL, seasonEnd, seasonKey } from "@/src/game/seasons";
import { currentLang, t } from "@/src/i18n";

const fmt = (d: Date) => d.toLocaleDateString(currentLang(), { month: "short", day: "numeric" });

// Home banner: the running seasonal event (with achievement progress) or the next one coming up
export function SeasonBanner({ profile }: { profile: Profile }) {
  const s = useStyles();
  const se = activeSeason();
  if (!se) {
    const n = nextSeason();
    return (
      <View style={s.wrap} testID="season-next">
        <Text style={s.small}>{n.season.icon} {t("Next event: {n} · starts {d}", { n: n.season.name, d: fmt(n.start) })}</Text>
      </View>
    );
  }
  const kills = profile.seasonProg?.key === seasonKey(se) ? profile.seasonProg.kills : 0;
  return (
    <View style={[s.wrap, s.live, { borderColor: se.arena }]} testID="season-active">
      <Text style={s.big}>{se.icon} {t("{n} is on!", { n: se.name })}</Text>
      <Text style={s.small}>{se.desc} · {t("ends {d}", { d: fmt(seasonEnd(se)) })}</Text>
      <Text style={s.small}>{t("Event achievement: {a}/{b} kills", { a: Math.min(kills, SEASON_GOAL), b: SEASON_GOAL })}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { padding: spacing.sm, borderRadius: radius.sm, backgroundColor: c.surfaceTertiary, gap: 2 },
  live: { borderWidth: 2 },
  big: { fontFamily: fonts.display, fontSize: 16, color: c.onSurface },
  small: { fontFamily: fonts.text, fontSize: 13, color: c.muted },
}));
