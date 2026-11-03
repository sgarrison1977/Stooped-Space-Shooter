import React, { memo } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import { BOSSES, Skin } from "@/src/game/content";

// Nose-up sprites in a 100x100 box. Gradient ids are unique per palette so
// several variants can render at once on web.

export const PlayerSprite = memo(function PlayerSprite({ size, skin }: { size: number; skin: Skin }) {
  const k = skin.id;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={`pHull-${k}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={skin.light} />
          <Stop offset="0.45" stopColor={skin.mid} />
          <Stop offset="1" stopColor={skin.dark} />
        </LinearGradient>
        <LinearGradient id={`pWing-${k}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={skin.dark} />
          <Stop offset="0.5" stopColor={skin.mid} />
          <Stop offset="1" stopColor={skin.dark} />
        </LinearGradient>
        <RadialGradient id={`pCock-${k}`} cx="50%" cy="40%" r="60%">
          <Stop offset="0" stopColor={skin.light} />
          <Stop offset="1" stopColor={skin.cockpit} />
        </RadialGradient>
      </Defs>
      <Path d="M44 40 L8 72 L10 80 L40 72 Z" fill={`url(#pWing-${k})`} stroke={skin.light} strokeWidth={1.2} strokeOpacity={0.6} />
      <Path d="M56 40 L92 72 L90 80 L60 72 Z" fill={`url(#pWing-${k})`} stroke={skin.light} strokeWidth={1.2} strokeOpacity={0.6} />
      <Path d="M12 74 L4 60 L8 58 L16 70 Z" fill={skin.light} />
      <Path d="M88 74 L96 60 L92 58 L84 70 Z" fill={skin.light} />
      <Path d="M38 76 L44 76 L44 90 L38 90 Z" fill={skin.dark} />
      <Path d="M56 76 L62 76 L62 90 L56 90 Z" fill={skin.dark} />
      <Path d="M50 4 L60 36 L62 78 L50 86 L38 78 L40 36 Z" fill={`url(#pHull-${k})`} stroke={skin.light} strokeWidth={1.5} />
      <Path d="M50 14 L50 80" stroke={skin.light} strokeOpacity={0.35} strokeWidth={1} />
      <Ellipse cx={50} cy={40} rx={5.5} ry={11} fill={`url(#pCock-${k})`} />
      <Path d="M30 66 L42 60 M70 66 L58 60" stroke={skin.accent} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
});

function BossBody({ v }: { v: number }) {
  const b = BOSSES[v];
  const hull = `url(#bHull${v})`;
  const core = `url(#bCore${v})`;
  switch (v) {
    case 1: // Ashen Leviathan – segmented serpent
      return (
        <G>
          <Circle cx={50} cy={93} r={6} fill={b.dark} stroke={b.light} strokeWidth={1} />
          <Circle cx={50} cy={81} r={9} fill={hull} stroke={b.light} strokeWidth={1} />
          <Circle cx={50} cy={66} r={12} fill={hull} stroke={b.light} strokeWidth={1.2} />
          <Path d="M34 60 L14 70 L36 70 Z M66 60 L86 70 L64 70 Z" fill={b.light} opacity={0.8} />
          <Circle cx={50} cy={48} r={15} fill={hull} stroke={b.light} strokeWidth={1.5} />
          <Ellipse cx={50} cy={26} rx={20} ry={17} fill={hull} stroke={b.light} strokeWidth={1.8} />
          <Path d="M36 14 L30 2 L42 12 Z M64 14 L70 2 L58 12 Z" fill={b.light} />
          <Circle cx={42} cy={24} r={3.5} fill={b.core} />
          <Circle cx={58} cy={24} r={3.5} fill={b.core} />
          <Circle cx={50} cy={48} r={6} fill={core} />
        </G>
      );
    case 2: // Pyre Warden – crested shield
      return (
        <G>
          <Path d="M36 18 L40 2 L46 16 M54 16 L60 2 L64 18 M47 14 L50 0 L53 14" fill={b.core} stroke={b.light} strokeWidth={1.5} />
          <Path d="M50 10 L86 24 L82 62 L50 96 L18 62 L14 24 Z" fill={hull} stroke={b.light} strokeWidth={2} />
          <Path d="M50 22 L72 32 L70 58 L50 82 L30 58 L28 32 Z" fill="none" stroke={b.light} strokeWidth={1.2} strokeDasharray="5 3" />
          <Path d="M50 34 L62 50 L50 66 L38 50 Z" fill={b.dark} stroke={b.core} strokeWidth={1.5} />
          <Circle cx={50} cy={50} r={8} fill={core} />
        </G>
      );
    case 3: // Molten Hydra – three heads
      return (
        <G>
          <Path d="M50 58 L50 18 M50 58 L18 34 M50 58 L82 34" stroke={b.mid} strokeWidth={9} strokeLinecap="round" />
          <Path d="M50 58 L50 18 M50 58 L18 34 M50 58 L82 34" stroke={b.light} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          {[[50, 14], [16, 32], [84, 32]].map(([x, y], i) => (
            <G key={i}>
              <Ellipse cx={x} cy={y} rx={11} ry={10} fill={hull} stroke={b.light} strokeWidth={1.5} />
              <Circle cx={x} cy={y - 1} r={3.5} fill={b.core} />
            </G>
          ))}
          <Circle cx={50} cy={62} r={24} fill={hull} stroke={b.light} strokeWidth={2} />
          <Circle cx={50} cy={62} r={11} fill={core} />
        </G>
      );
    case 4: // Obsidian Herald – crystal shard
      return (
        <G>
          <Path d="M28 42 L4 58 L34 66 Z M72 42 L96 58 L66 66 Z" fill={b.mid} stroke={b.light} strokeWidth={1.2} />
          <Path d="M50 2 L72 40 L62 98 L38 98 L28 40 Z" fill={hull} stroke={b.light} strokeWidth={1.8} />
          <Path d="M50 2 L50 98 M28 40 L50 54 L72 40 M38 98 L50 54 L62 98" stroke={b.light} strokeWidth={0.8} opacity={0.6} />
          <Circle cx={50} cy={50} r={11} fill={core} />
          <Circle cx={50} cy={50} r={4} fill={b.core} />
        </G>
      );
    case 5: // Ember Tyrant – crowned flagship
      return (
        <G>
          <Path d="M50 8 L62 30 L96 44 L84 72 L62 66 L56 94 L44 94 L38 66 L16 72 L4 44 L38 30 Z" fill={hull} stroke={b.light} strokeWidth={1.8} />
          <Path d="M38 30 L42 12 L50 24 L58 12 L62 30" fill={b.core} stroke={b.light} strokeWidth={1} />
          <Path d="M14 48 L40 46 M86 48 L60 46" stroke={b.light} strokeWidth={2} strokeLinecap="round" />
          <Path d="M50 34 L60 52 L50 72 L40 52 Z" fill={b.dark} />
          <Circle cx={50} cy={52} r={9} fill={core} />
        </G>
      );
    case 6: // Slag King – armoured hexagon
      return (
        <G>
          <Path d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" fill={hull} stroke={b.light} strokeWidth={2} />
          <Path d="M50 20 L76 35 L76 65 L50 80 L24 65 L24 35 Z" fill={b.dark} stroke={b.light} strokeWidth={1.2} />
          {[[50, 11], [83, 31], [83, 69], [50, 89], [17, 69], [17, 31]].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={3} fill={b.core} />
          ))}
          <Circle cx={50} cy={50} r={14} fill={core} />
          <Circle cx={50} cy={50} r={5} fill={b.core} />
        </G>
      );
    case 7: // Furnace Queen – rosette
      return (
        <G>
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <Ellipse key={d} cx={50} cy={24} rx={10} ry={22} fill={hull} stroke={b.light} strokeWidth={1.2} transform={`rotate(${d} 50 50)`} />
          ))}
          <Circle cx={50} cy={50} r={20} fill={b.dark} stroke={b.light} strokeWidth={2} />
          <Circle cx={50} cy={50} r={14} fill={core} />
          <Path d="M44 8 L50 0 L56 8" stroke={b.core} strokeWidth={2} fill="none" />
        </G>
      );
    default: { // The Cinder Maw – spiked disc
      const spikes = Array.from({ length: 10 }, (_, i) => (i * 360) / 10);
      return (
        <G>
          {spikes.map((deg) => <Path key={deg} d="M46 14 L50 2 L54 14 Z" fill={b.light} transform={`rotate(${deg} 50 50)`} />)}
          <Circle cx={50} cy={50} r={38} fill={hull} stroke={b.light} strokeWidth={2} />
          <Circle cx={50} cy={50} r={29} fill="none" stroke={b.mid} strokeWidth={1.5} strokeDasharray="6 4" />
          <Path d="M36 22 L42 6 L46 24 Z M64 22 L58 6 L54 24 Z" fill={b.light} />
          <Path d="M30 50 L50 30 L70 50 L50 70 Z" fill={b.dark} stroke={b.mid} strokeWidth={1.5} />
          <Circle cx={50} cy={50} r={16} fill={core} />
          <Circle cx={50} cy={50} r={6} fill={b.core} />
        </G>
      );
    }
  }
}

export const BossSprite = memo(function BossSprite({ size, variant }: { size: number; variant: number }) {
  const b = BOSSES[variant];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={`bHull${variant}`} cx="50%" cy="45%" r="60%">
          <Stop offset="0" stopColor={b.mid} />
          <Stop offset="1" stopColor={b.dark} />
        </RadialGradient>
        <RadialGradient id={`bCore${variant}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={b.core} />
          <Stop offset="0.6" stopColor={b.light} />
          <Stop offset="1" stopColor={b.mid} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <BossBody v={variant} />
    </Svg>
  );
});
