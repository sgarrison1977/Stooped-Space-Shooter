import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors as c } from "@/src/theme";

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

export function Starfield({ w, h, px, py }: { w: number; h: number; px: number; py: number }) {
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
