import React, { forwardRef } from "react";
import { t } from "@/src/i18n";
import { Platform, Share, Text, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { fonts, fx, makeStyles, pop, radius, spacing } from "@/src/theme";
import { PlayerSprite } from "./ShipArt";
import type { Skin } from "@/src/game/content";

export interface CardInfo { wave: number; kills: number; bosses: number; level: number; label: string; weapon: string; combos: string[]; pilot: string; skin: Skin }

// The image card that gets shared after a run
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ShareCard = forwardRef<any, { info: CardInfo }>(function ShareCard({ info }, ref) {
  const s = useStyles();
  return (
    <View ref={ref} collapsable={false} style={s.card} testID="share-card">
      <Text style={s.brand}>STOOOPID SPACE SHOOTER</Text>
      <View style={s.row}>
        <PlayerSprite skin={info.skin} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={s.big}>{t("Wave")} {info.wave}</Text>
          <Text style={s.small}>{info.pilot || t("Pilot")} · {info.label}</Text>
        </View>
      </View>
      <Text style={s.small}>{t("{k} kills · {b} bosses · Lv {l}", { k: info.kills, b: info.bosses, l: info.level })} · {info.weapon}</Text>
      {info.combos.length ? <Text style={s.accent}>{t("Combos: {x}", { x: info.combos.join(", ") })}</Text> : null}
      <Text style={s.tag}>{t("Think you can beat that?")}</Text>
    </View>
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function shareCard(view: any, fallback: string) {
  try {
    if (view && Platform.OS !== "web" && (await Sharing.isAvailableAsync())) {
      const uri = await captureRef(view, { format: "png", quality: 0.95 });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: t("Share your run") });
      return;
    }
  } catch { /* fall back to text */ }
  Share.share({ message: fallback }).catch(() => {});
}

const useStyles = makeStyles((c) => ({
  card: { width: 300, alignSelf: "center", padding: spacing.lg, gap: spacing.sm, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, ...pop(c) },
  brand: { fontFamily: fonts.display, fontSize: 14, color: c[fx.titleColor], letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  big: { fontFamily: fonts.display, fontSize: 30, color: c.onSurface },
  small: { fontFamily: fonts.text, fontSize: 13, color: c.onSurfaceSecondary },
  accent: { fontFamily: fonts.bold, fontSize: 13, color: c.brandSecondary },
  tag: { fontFamily: fonts.bold, fontSize: 12, color: c.muted, textTransform: "uppercase" },
}));
