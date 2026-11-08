import React from "react";
import { Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { GameState } from "@/src/game/sim";
import { ABILITIES, WAVE_MODS, WaveModId, WEAPONS } from "@/src/game/arsenal";
import { activeWeapon, bladeCount, bladeReach } from "@/src/game/arsenal-sim";
import { Label } from "./ui";

function Seg({ x1, y1, x2, y2, color, w }: { x1: number; y1: number; x2: number; y2: number; color: string; w: number }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  return (
    <View style={{ position: "absolute", left: (x1 + x2) / 2 - len / 2, top: (y1 + y2) / 2 - w / 2, width: len, height: w, borderRadius: w, backgroundColor: color, transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }] }} />
  );
}

const PICKUP_ICON = { shield: "shield", magnet: "magnet", repair: "wrench", weapon: "crosshair" } as const;

// Weapon effects, mines, blades, drone, pickups, ability visuals.
export function ArenaExtras({ g }: { g: GameState }) {
  const s = useStyles();
  const { colors } = useTheme();
  const p = g.player;
  const nBlades = bladeCount(g), reach = bladeReach(g);
  return (
    <>
      {g.pickups.map((k) => (
        <View key={k.id} style={[s.pickup, { left: k.x - 13, top: k.y - 13, opacity: k.life < 3 ? 0.5 : 1 }]} testID={`pickup-${k.kind}`}>
          <Lucide name={PICKUP_ICON[k.kind]} size={14} color={colors.onSurface} />
        </View>
      ))}
      {g.pMines.map((m) => <View key={m.id} style={[s.pMine, { left: m.x - 7, top: m.y - 7 }]} />)}
      {g.beams.map((b) => <Seg key={b.id} x1={b.x} y1={b.y} x2={b.x + Math.cos(b.a) * 1400} y2={b.y + Math.sin(b.a) * 1400} color={colors.xp} w={2 + b.life * 24} />)}
      {g.arcs.map((a) => a.pts.slice(1).map((pt, i) => <Seg key={`${a.id}-${i}`} x1={a.pts[i].x} y1={a.pts[i].y} x2={pt.x} y2={pt.y} color={colors.shipLight} w={3} />))}
      {activeWeapon(g) === "blades" ? Array.from({ length: nBlades }, (_, i) => {
        const a = g.bladeA + (i / nBlades) * Math.PI * 2;
        return <View key={i} style={[s.blade, { left: p.x + Math.cos(a) * reach - 8, top: p.y + Math.sin(a) * reach - 8, transform: [{ rotate: `${a + 0.8}rad` }] }]} />;
      }) : null}
      {g.drone ? <View style={[s.drone, { left: p.x + Math.cos(g.drone.a) * 40 - 6, top: p.y + Math.sin(g.drone.a) * 40 - 6 }]} /> : null}
      {g.grav ? <View style={[s.grav, { left: g.grav.x - 40, top: g.grav.y - 40, transform: [{ scale: 0.5 + g.grav.t * 0.6 }] }]} /> : null}
      {g.shieldT > 0 || g.buffShieldT > 0 ? <View style={[s.bubble, { left: p.x - 26, top: p.y - 26 }]} /> : null}
    </>
  );
}

// Full-arena overlays: darkness wave + time slow tint.
export function ArenaOverlays({ g }: { g: GameState }) {
  const s = useStyles();
  const R = 110, B = 1600;
  return (
    <>
      {g.slowT > 0 ? <View pointerEvents="none" style={s.slow} /> : null}
      {g.waveMod === "dark" && !g.breakT ? (
        <View pointerEvents="none" style={[s.dark, { left: g.player.x - R - B, top: g.player.y - R - B, width: (R + B) * 2, height: (R + B) * 2, borderRadius: R + B, borderWidth: B }]} />
      ) : null}
      {g.tempWeapon ? <Text style={s.temp}>{WEAPONS.find((w) => w.id === g.tempWeapon!.id)!.name} · {Math.ceil(g.tempWeapon.t)}s</Text> : null}
    </>
  );
}

export function AbilityButton({ g, onPress }: { g: GameState; onPress: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const ab = ABILITIES.find((a) => a.id === g.ability)!;
  const ready = g.abilityCd <= 0;
  return (
    <Pressable
      testID="ability-button"
      onPress={() => { if (ready) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); onPress(); } }}
      style={[s.ability, !ready && s.abilityCd]}
    >
      <Lucide name={ab.icon} size={22} color={ready ? colors.onBrandPrimary : colors.muted} />
      <Text style={s.abilityText}>{ready ? ab.name : Math.ceil(g.abilityCd)}</Text>
    </Pressable>
  );
}

export function PathOverlay({ wave, options, onPick, wide }: { wave: number; options: WaveModId[]; onPick: (id: WaveModId) => void; wide: boolean }) {
  const s = useStyles();
  return (
    <Animated.View entering={FadeIn.duration(200)} style={s.scrim} testID="path-overlay">
      <Label style={{ textAlign: "center" }}>Wave {wave} cleared</Label>
      <Text style={s.title}>Choose your path</Text>
      <View style={[s.list, wide && { flexDirection: "row" }]}>
        {options.map((id) => (
          <Pressable key={id} testID={`path-option-${id}`} onPress={() => onPick(id)} style={({ pressed }) => [s.option, wide && { flex: 1 }, pressed && s.optionOn]}>
            <Text style={s.optName}>{WAVE_MODS[id].name}</Text>
            <Text style={s.optDesc}>{WAVE_MODS[id].desc}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  pickup: { position: "absolute", width: 26, height: 26, borderRadius: 13, backgroundColor: c.brandPrimary, borderWidth: 2, borderColor: c.bossCore, alignItems: "center", justifyContent: "center" },
  pMine: { position: "absolute", width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: c.xp, backgroundColor: c.shipDark },
  blade: { position: "absolute", width: 16, height: 16, backgroundColor: c.shipLight, borderWidth: 1.5, borderColor: c.xp, borderRadius: 3 },
  drone: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: c.xp, borderWidth: 2, borderColor: c.shipLight },
  grav: { position: "absolute", width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: c.info, backgroundColor: c.scrimLight },
  bubble: { position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: c.xp, backgroundColor: c.transparent },
  slow: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: c.nebulaBlue, opacity: 0.18 },
  dark: { position: "absolute", borderColor: c.arena, opacity: 0.96 },
  temp: { position: "absolute", bottom: 26, alignSelf: "center", fontFamily: fonts.display, fontSize: 13, color: c.brandSecondary },
  ability: {
    position: "absolute", right: spacing.lg, bottom: spacing.lg, width: 72, height: 72, borderRadius: 36, backgroundColor: c.brandPrimary,
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: c.brandSecondary,
  },
  abilityCd: { backgroundColor: c.surfaceSecondary, borderColor: c.border },
  abilityText: { fontFamily: fonts.text, fontSize: 10, letterSpacing: 1, color: c.onSurface, marginTop: 2 },
  scrim: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: c.scrim, justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 26, color: c.onSurface, textAlign: "center", marginBottom: spacing.md },
  list: { gap: spacing.md, width: "100%", maxWidth: 640, alignSelf: "center" },
  option: { padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, minHeight: 72 },
  optionOn: { borderColor: c.borderStrong, backgroundColor: c.brandTertiary },
  optName: { fontFamily: fonts.display, fontSize: 17, color: c.onSurface },
  optDesc: { fontFamily: fonts.text, fontSize: 12, color: c.muted, marginTop: 2 },
}));
