import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors as c, fx, makeStyles } from "@/src/theme";

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// Static nebula glow behind everything.
export const Nebula = memo(function Nebula({ w, h }: { w: number; h: number }) {
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="nEmber" cx="78%" cy="22%" r="60%">
          <Stop offset="0" stopColor={c.nebulaEmber} stopOpacity={0.22} />
          <Stop offset="1" stopColor={c.nebulaEmber} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="nBlue" cx="15%" cy="85%" r="55%">
          <Stop offset="0" stopColor={c.nebulaBlue} stopOpacity={0.35} />
          <Stop offset="1" stopColor={c.nebulaBlue} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="nCore" cx="50%" cy="50%" r="70%">
          <Stop offset="0" stopColor={c.arena} stopOpacity={0} />
          <Stop offset="1" stopColor={c.surface} stopOpacity={0.9} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="url(#nEmber)" />
      <Rect x={0} y={0} width={w} height={h} fill="url(#nBlue)" />
      <Rect x={0} y={0} width={w} height={h} fill="url(#nCore)" />
    </Svg>
  );
});

// A layer of stars, 30% larger than the arena so it can parallax-shift.
const StarLayer = memo(function StarLayer({ w, h, count, seed, maxR }: { w: number; h: number; count: number; seed: number; maxR: number }) {
  const stars = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({ x: r() * w * 1.3, y: r() * h * 1.3, r: 0.4 + r() * maxR, o: 0.25 + r() * 0.75, warm: r() > 0.7 }));
  }, [w, h, count, seed, maxR]);
  return (
    <Svg width={w * 1.3} height={h * 1.3}>
      {stars.map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.warm ? c.bossLight : c.star} opacity={s.o} />)}
    </Svg>
  );
});

// Notebook page (ruled lines + red margin) or blueprint grid instead of space
const ArenaSheet = memo(function ArenaSheet({ w, h, kind }: { w: number; h: number; kind: "paper" | "grid" }) {
  const step = kind === "paper" ? 28 : 24;
  const sheet = useSheet();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: Math.ceil(h / step) }, (_, i) => (
        <View key={`h${i}`} style={[sheet.hLine, { top: (i + 1) * step }, kind === "grid" && i % 5 === 4 && sheet.major]} />
      ))}
      {kind === "grid"
        ? Array.from({ length: Math.ceil(w / step) }, (_, i) => <View key={`v${i}`} style={[sheet.vLine, { left: (i + 1) * step }, i % 5 === 4 && sheet.major]} />)
        : <View style={sheet.margin} />}
    </View>
  );
});

export function Starfield({ w, h, px, py }: { w: number; h: number; px: number; py: number }) {
  if (fx.arenaBg !== "space") return <ArenaSheet w={w} h={h} kind={fx.arenaBg} />;
  const ox = (px / w - 0.5), oy = (py / h - 0.5);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Nebula w={w} h={h} />
      <View style={[styles.layer, { transform: [{ translateX: -w * 0.15 - ox * 20 }, { translateY: -h * 0.15 - oy * 20 }] }]}>
        <StarLayer w={w} h={h} count={Math.round((w * h) / 2600)} seed={7} maxR={0.9} />
      </View>
      <View style={[styles.layer, { transform: [{ translateX: -w * 0.15 - ox * 55 }, { translateY: -h * 0.15 - oy * 55 }] }]}>
        <StarLayer w={w} h={h} count={Math.round((w * h) / 9000)} seed={42} maxR={1.6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ layer: { position: "absolute", left: 0, top: 0 } });
// built per mount so they pick up the current UI style's colours
const useSheet = makeStyles((k) => ({
  hLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: k.divider, opacity: 0.6 },
  vLine: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: k.divider, opacity: 0.6 },
  major: { opacity: 1 },
  margin: { position: "absolute", top: 0, bottom: 0, left: 30, width: 2, backgroundColor: k.borderStrong, opacity: 0.45 },
}));
