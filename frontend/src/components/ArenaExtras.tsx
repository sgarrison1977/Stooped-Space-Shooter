import React from "react";
import { Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import * as Haptics from "expo-haptics";
import { fonts, makeStyles, radius, spacing, useTheme, pop } from "@/src/theme";
import { GameState } from "@/src/game/sim";
import { ABILITIES, WEAPONS } from "@/src/game/arsenal";
import { activeWeapon, bladeCount, bladeReach, droneCount } from "@/src/game/arsenal-sim";

function Seg({ x1, y1, x2, y2, color, w, op = 1 }: { x1: number; y1: number; x2: number; y2: number; color: string; w: number; op?: number }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  return (
    <View style={{ position: "absolute", left: (x1 + x2) / 2 - len / 2, top: (y1 + y2) / 2 - w / 2, width: len, height: w, borderRadius: w, opacity: op, backgroundColor: color, transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad` }] }} />
  );
}

// Jagged lightning: re-randomised every frame so it crackles, with a glow pass and small side sprigs
function Bolt({ from, to, glow, core }: { from: { x: number; y: number }; to: { x: number; y: number }; glow: string; core: string }) {
  const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, n = Math.max(3, Math.min(8, Math.round(len / 22)));
  const pts = [from];
  for (let i = 1; i < n; i++) { const t = i / n, j = (Math.random() - 0.5) * Math.min(26, len * 0.25); pts.push({ x: from.x + dx * t + nx * j, y: from.y + dy * t + ny * j }); }
  pts.push(to);
  const segs: React.ReactNode[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    segs.push(<Seg key={`g${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} color={glow} w={7} op={0.35} />);
    segs.push(<Seg key={`c${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} color={core} w={2} />);
    if (i < pts.length - 1 && Math.random() < 0.45) {
      const ang = Math.atan2(dy, dx) + (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.7), l = 10 + Math.random() * 16;
      segs.push(<Seg key={`s${i}`} x1={b.x} y1={b.y} x2={b.x + Math.cos(ang) * l} y2={b.y + Math.sin(ang) * l} color={core} w={1.5} op={0.8} />);
    }
  }
  return <>{segs}</>;
}

const PICKUP_ICON = { shield: "shield", magnet: "magnet", repair: "wrench", weapon: "crosshair" } as const;

// Weapon effects, blades, drone, pickups, ability visuals.
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
      {g.arcs.map((a) => a.pts.slice(1).map((pt, i) => <Bolt key={`${a.id}-${i}`} from={a.pts[i]} to={pt} glow={colors.xp} core={colors.shipLight} />))}
      {activeWeapon(g) === "blades" ? Array.from({ length: nBlades }, (_, i) => {
        const a = g.bladeA + (i / nBlades) * Math.PI * 2;
        return <View key={i} style={[s.blade, { left: p.x + Math.cos(a) * reach - 8, top: p.y + Math.sin(a) * reach - 8, transform: [{ rotate: `${a + 0.8}rad` }] }]} />;
      }) : null}
      {g.drone ? Array.from({ length: droneCount(g) }, (_, i) => {
        const a = g.drone!.a + (i / droneCount(g)) * Math.PI * 2;
        return <View key={`d${i}`} style={[s.drone, { left: p.x + Math.cos(a) * 40 - 6, top: p.y + Math.sin(a) * 40 - 6 }]} />;
      }) : null}
      {g.grav ? <View style={[s.grav, { left: g.grav.x - 40, top: g.grav.y - 40, transform: [{ scale: 0.5 + g.grav.t * 0.6 }] }]} /> : null}
      {g.shieldT > 0 || g.buffShieldT > 0 ? <View style={[s.bubble, { left: p.x - 26, top: p.y - 26 }]} /> : null}
    </>
  );
}

// Full-arena overlays: darkness wave + time slow tint.
export function ArenaOverlays({ g }: { g: GameState }) {
  const s = useStyles();
  return (
    <>
      {g.slowT > 0 ? <View pointerEvents="none" style={s.slow} /> : null}
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


const useStyles = makeStyles((c) => ({
  pickup: { position: "absolute", width: 26, height: 26, borderRadius: 13, backgroundColor: c.brandPrimary, borderWidth: 2, borderColor: c.bossCore, alignItems: "center", justifyContent: "center" },
  blade: { position: "absolute", width: 16, height: 16, backgroundColor: c.shipLight, borderWidth: 1.5, borderColor: c.xp, borderRadius: 3 },
  drone: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: c.xp, borderWidth: 2, borderColor: c.shipLight },
  grav: { position: "absolute", width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: c.info, backgroundColor: c.scrimLight },
  bubble: { position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: c.xp, backgroundColor: c.transparent },
  slow: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: c.nebulaBlue, opacity: 0.18 },
  temp: { position: "absolute", bottom: 26, alignSelf: "center", fontFamily: fonts.display, fontSize: 15, color: c.brandTertiary },
  ability: {
    position: "absolute", right: spacing.lg, bottom: spacing.lg, width: 72, height: 72, borderRadius: 36, backgroundColor: c.brandPrimary,
    alignItems: "center", justifyContent: "center", ...pop(c),
  },
  abilityCd: { backgroundColor: c.surfaceSecondary, borderColor: c.border },
  abilityText: { fontFamily: fonts.bold, fontSize: 11, color: c.onSurface, marginTop: 2 },
  scrim: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: c.scrim, justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 26, color: c.onSurface, textAlign: "center", marginBottom: spacing.md },
  list: { gap: spacing.md, width: "100%", maxWidth: 640, alignSelf: "center" },
  option: { padding: spacing.lg, borderRadius: radius.md, ...pop(c), backgroundColor: c.surfaceSecondary, minHeight: 72 },
  optionOn: { borderColor: c.borderStrong, backgroundColor: c.brandTertiary },
  optName: { fontFamily: fonts.display, fontSize: 17, color: c.onSurface },
  optDesc: { fontFamily: fonts.text, fontSize: 12, color: c.muted, marginTop: 2 },
}));
