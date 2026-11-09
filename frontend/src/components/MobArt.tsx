import React, { memo } from "react";
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { ef, ak, aw } from "@/src/game/art";
import { MobKind, MOBS } from "@/src/game/content";

// Nose-up enemy sprites (100x100). Raider + Marauder live in Sprites.tsx.
function Body({ kind }: { kind: MobKind }) {
  const m = MOBS[kind];
  const hull = `url(#m-${kind})`;
  switch (kind) {
    case "dart":
      return (
        <G>
          <Path d="M50 2 L58 58 L74 94 L50 80 L26 94 L42 58 Z" fill={ef(hull)} stroke={ak(m.light)} strokeWidth={aw(1.5)} />
          <Path d="M50 14 L50 72" stroke={ak(m.light)} strokeWidth={aw(1.2)} opacity={0.7} />
          <Circle cx={50} cy={56} r={5} fill={ef(m.core)} />
        </G>
      );
    case "brute":
      return (
        <G>
          <Path d="M36 12 L50 0 L64 12 Z" fill={ef(m.light)} />
          <Path d="M30 10 L70 10 L90 30 L90 78 L70 96 L30 96 L10 78 L10 30 Z" fill={ef(hull)} stroke={ak(m.light)} strokeWidth={aw(2)} />
          <Path d="M10 46 L90 46 M10 66 L90 66 M30 10 L30 96 M70 10 L70 96" stroke={ak(m.dark)} strokeWidth={aw(2)} />
          <Rect x={36} y={20} width={28} height={8} rx={3} fill={ef(m.core)} />
          {[[20, 36], [80, 36], [20, 84], [80, 84]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.5} fill={ef(m.light)} />)}
        </G>
      );
    case "splitter":
      return (
        <G>
          <Path d="M28 28 L44 52 L28 80 L12 52 Z" fill={ef(hull)} stroke={ak(m.light)} strokeWidth={aw(1.2)} />
          <Path d="M72 28 L88 52 L72 80 L56 52 Z" fill={ef(hull)} stroke={ak(m.light)} strokeWidth={aw(1.2)} />
          <Path d="M50 4 L68 50 L50 96 L32 50 Z" fill={ef(hull)} stroke={ak(m.light)} strokeWidth={aw(1.8)} />
          <Path d="M50 4 L50 96 M32 50 L68 50" stroke={ak(m.light)} strokeWidth={aw(0.8)} opacity={0.6} />
          <Circle cx={50} cy={50} r={6} fill={ef(m.core)} />
        </G>
      );
    case "shard":
      return (
        <G>
          <Path d="M50 6 L74 50 L50 94 L26 50 Z" fill={ef(hull)} stroke={ak(m.light)} strokeWidth={aw(2)} />
          <Circle cx={50} cy={50} r={8} fill={ef(m.core)} />
        </G>
      );
    case "gunner":
      return (
        <G>
          <Rect x={45} y={2} width={10} height={44} rx={3} fill={ef(m.dark)} stroke={ak(m.light)} strokeWidth={aw(1.5)} />
          <Path d="M24 50 L6 80 L28 72 Z M76 50 L94 80 L72 72 Z" fill={ef(m.mid)} stroke={ak(m.light)} strokeWidth={aw(1.2)} />
          <Circle cx={50} cy={60} r={27} fill={ef(hull)} stroke={ak(m.light)} strokeWidth={aw(2)} />
          <Circle cx={50} cy={60} r={16} fill={ef(m.dark)} />
          <Circle cx={50} cy={60} r={7} fill={ef(m.core)} />
        </G>
      );
    case "phantom":
      return (
        <G opacity={0.85}>
          <Path
            d="M50 6 C74 6 86 28 86 52 L86 92 L72 80 L62 94 L50 80 L38 94 L28 80 L14 92 L14 52 C14 28 26 6 50 6 Z"
            fill={ef(hull)}
            stroke={ak(m.light)}
            strokeWidth={aw(1.5)}
          />
          <Path d="M34 42 L44 48 L34 52 Z M66 42 L56 48 L66 52 Z" fill={ef(m.core)} />
          <Path d="M30 66 Q50 74 70 66" stroke={ak(m.light)} strokeWidth={aw(1.5)} fill="none" opacity={0.7} />
        </G>
      );
    case "juggernaut": {
      const spikes = [0, 45, 90, 135, 180, 225, 270, 315];
      return (
        <G>
          {spikes.map((d) => <Path key={d} d="M44 12 L50 0 L56 12 Z" fill={ef(m.light)} transform={`rotate(${d} 50 50)`} />)}
          <Path d="M34 10 L66 10 L90 34 L90 66 L66 90 L34 90 L10 66 L10 34 Z" fill={ef(hull)} stroke={ak(m.light)} strokeWidth={aw(2.5)} />
          <Path d="M38 22 L62 22 L78 38 L78 62 L62 78 L38 78 L22 62 L22 38 Z" fill={ef(m.dark)} stroke={ak(m.light)} strokeWidth={aw(1.2)} />
          <Circle cx={50} cy={50} r={12} fill={ef(m.core)} />
          <Circle cx={34} cy={34} r={4} fill={ef(m.light)} />
          <Circle cx={66} cy={34} r={4} fill={ef(m.light)} />
          <Circle cx={34} cy={66} r={4} fill={ef(m.light)} />
          <Circle cx={66} cy={66} r={4} fill={ef(m.light)} />
        </G>
      );
    }
    default:
      return null;
  }
}

export const MobSprite = memo(function MobSprite({ kind, size }: { kind: MobKind; size: number }) {
  const m = MOBS[kind];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={`m-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ef(m.light)} />
          <Stop offset="0.5" stopColor={ef(m.mid)} />
          <Stop offset="1" stopColor={ef(m.dark)} />
        </LinearGradient>
      </Defs>
      <Body kind={kind} />
    </Svg>
  );
});
