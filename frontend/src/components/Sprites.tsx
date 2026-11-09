import React, { memo } from "react";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { ef, ak, aw } from "@/src/game/art";
import { colors as c } from "@/src/theme";

// All sprites are drawn nose-up in a 100x100 box; the caller rotates them.

export const RaiderSprite = memo(function RaiderSprite({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="rHull" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ef(c.enemyLight)} />
          <Stop offset="0.5" stopColor={ef(c.enemy)} />
          <Stop offset="1" stopColor={ef(c.enemyDark)} />
        </LinearGradient>
      </Defs>
      <Path d="M50 8 L62 40 L90 26 L76 64 L60 68 L50 92 L40 68 L24 64 L10 26 L38 40 Z" fill="url(#rHull)" stroke={ak(c.enemyLight)} strokeWidth={aw(1.5)} strokeOpacity={0.7} />
      <Path d="M50 26 L56 50 L50 70 L44 50 Z" fill={ef(c.enemyDark)} />
      <Circle cx={50} cy={50} r={6} fill={ef(c.engineGlow)} />
      <Circle cx={50} cy={50} r={2.5} fill={ef(c.bossCore)} />
    </Svg>
  );
});

export const EliteSprite = memo(function EliteSprite({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="eHull" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ef(c.bossLight)} />
          <Stop offset="0.5" stopColor={ef(c.enemyElite)} />
          <Stop offset="1" stopColor={ef(c.enemyDark)} />
        </LinearGradient>
      </Defs>
      <Path d="M50 4 L66 26 L94 30 L80 56 L90 86 L62 76 L50 96 L38 76 L10 86 L20 56 L6 30 L34 26 Z" fill="url(#eHull)" stroke={ak(c.bossLight)} strokeWidth={aw(1.5)} strokeOpacity={0.7} />
      <Path d="M50 18 L64 44 L58 72 L42 72 L36 44 Z" fill={ef(c.enemyDark)} />
      <Circle cx={50} cy={48} r={9} fill={ef(c.enemy)} stroke={ak(c.bossCore)} strokeWidth={aw(2)} />
      <Circle cx={50} cy={48} r={3.5} fill={ef(c.bossCore)} />
    </Svg>
  );
});
