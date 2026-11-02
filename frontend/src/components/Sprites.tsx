import React, { memo } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import { colors as c } from "@/src/theme";

// All sprites are drawn nose-up in a 100x100 box; the caller rotates them.

export const PlayerSprite = memo(function PlayerSprite({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="pHull" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.shipLight} />
          <Stop offset="0.45" stopColor={c.player} />
          <Stop offset="1" stopColor={c.shipDark} />
        </LinearGradient>
        <LinearGradient id="pWing" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={c.shipDark} />
          <Stop offset="0.5" stopColor={c.player} />
          <Stop offset="1" stopColor={c.shipDark} />
        </LinearGradient>
        <RadialGradient id="pCock" cx="50%" cy="40%" r="60%">
          <Stop offset="0" stopColor={c.shipLight} />
          <Stop offset="1" stopColor={c.cockpit} />
        </RadialGradient>
      </Defs>
      {/* wings */}
      <Path d="M44 40 L8 72 L10 80 L40 72 Z" fill="url(#pWing)" stroke={c.shipLight} strokeWidth={1.2} strokeOpacity={0.6} />
      <Path d="M56 40 L92 72 L90 80 L60 72 Z" fill="url(#pWing)" stroke={c.shipLight} strokeWidth={1.2} strokeOpacity={0.6} />
      <Path d="M12 74 L4 60 L8 58 L16 70 Z" fill={c.shipLight} />
      <Path d="M88 74 L96 60 L92 58 L84 70 Z" fill={c.shipLight} />
      {/* engines */}
      <Path d="M38 76 L44 76 L44 90 L38 90 Z" fill={c.shipDark} />
      <Path d="M56 76 L62 76 L62 90 L56 90 Z" fill={c.shipDark} />
      <Ellipse cx={41} cy={91} rx={3} ry={2} fill={c.engineGlow} />
      <Ellipse cx={59} cy={91} rx={3} ry={2} fill={c.engineGlow} />
      {/* fuselage */}
      <Path d="M50 4 L60 36 L62 78 L50 86 L38 78 L40 36 Z" fill="url(#pHull)" stroke={c.shipLight} strokeWidth={1.5} />
      <Path d="M50 14 L50 80" stroke={c.shipLight} strokeOpacity={0.35} strokeWidth={1} />
      <Ellipse cx={50} cy={40} rx={5.5} ry={11} fill="url(#pCock)" />
      <Path d="M30 66 L42 60 M70 66 L58 60" stroke={c.xp} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
});

export const RaiderSprite = memo(function RaiderSprite({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="rHull" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.enemyLight} />
          <Stop offset="0.5" stopColor={c.enemy} />
          <Stop offset="1" stopColor={c.enemyDark} />
        </LinearGradient>
      </Defs>
      <Path d="M50 8 L62 40 L90 26 L76 64 L60 68 L50 92 L40 68 L24 64 L10 26 L38 40 Z" fill="url(#rHull)" stroke={c.enemyLight} strokeWidth={1.5} strokeOpacity={0.7} />
      <Path d="M50 26 L56 50 L50 70 L44 50 Z" fill={c.enemyDark} />
      <Circle cx={50} cy={50} r={6} fill={c.engineGlow} />
      <Circle cx={50} cy={50} r={2.5} fill={c.bossCore} />
    </Svg>
  );
});

export const EliteSprite = memo(function EliteSprite({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="eHull" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.bossLight} />
          <Stop offset="0.5" stopColor={c.enemyElite} />
          <Stop offset="1" stopColor={c.enemyDark} />
        </LinearGradient>
      </Defs>
      <Path d="M50 4 L66 26 L94 30 L80 56 L90 86 L62 76 L50 96 L38 76 L10 86 L20 56 L6 30 L34 26 Z" fill="url(#eHull)" stroke={c.bossLight} strokeWidth={1.5} strokeOpacity={0.7} />
      <Path d="M50 18 L64 44 L58 72 L42 72 L36 44 Z" fill={c.enemyDark} />
      <Circle cx={50} cy={48} r={9} fill={c.enemy} stroke={c.bossCore} strokeWidth={2} />
      <Circle cx={50} cy={48} r={3.5} fill={c.bossCore} />
    </Svg>
  );
});

export const BossSprite = memo(function BossSprite({ size }: { size: number }) {
  const spikes = Array.from({ length: 10 }, (_, i) => (i * 360) / 10);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="bHull" cx="50%" cy="45%" r="55%">
          <Stop offset="0" stopColor={c.bossMid} />
          <Stop offset="1" stopColor={c.bossDark} />
        </RadialGradient>
        <RadialGradient id="bCore" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={c.bossCore} />
          <Stop offset="0.6" stopColor={c.engineGlow} />
          <Stop offset="1" stopColor={c.bossMid} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <G>
        {spikes.map((deg) => (
          <Path key={deg} d="M46 14 L50 2 L54 14 Z" fill={c.bossLight} transform={`rotate(${deg} 50 50)`} />
        ))}
      </G>
      <Circle cx={50} cy={50} r={38} fill="url(#bHull)" stroke={c.bossLight} strokeWidth={2} />
      <Circle cx={50} cy={50} r={29} fill="none" stroke={c.enemyElite} strokeWidth={1.5} strokeDasharray="6 4" />
      {/* mandibles toward the front */}
      <Path d="M36 22 L42 6 L46 24 Z" fill={c.bossLight} />
      <Path d="M64 22 L58 6 L54 24 Z" fill={c.bossLight} />
      <Path d="M30 50 L50 30 L70 50 L50 70 Z" fill={c.bossDark} stroke={c.enemyElite} strokeWidth={1.5} />
      <Circle cx={50} cy={50} r={16} fill="url(#bCore)" />
      <Circle cx={50} cy={50} r={6} fill={c.bossCore} />
    </Svg>
  );
});
