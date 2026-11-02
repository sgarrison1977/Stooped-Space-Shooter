import React from "react";
import { Text, View } from "react-native";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { GameState } from "@/src/game/engine";

const toDeg = (a: number) => (a * 180) / Math.PI;

// Filled triangle ship pointing along `angle` (radians, 0 = right).
function Ship({ x, y, angle, size, color, core }: { x: number; y: number; angle: number; size: number; color: string; core: string }) {
  const half = size / 2;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute", left: x - half, top: y - half, width: size, height: size,
        alignItems: "center", justifyContent: "center", transform: [{ rotate: `${toDeg(angle) + 90}deg` }],
      }}
    >
      <View
        style={{
          width: 0, height: 0, borderLeftWidth: half * 0.72, borderRightWidth: half * 0.72, borderBottomWidth: size,
          borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color,
        }}
      />
      <View style={{ position: "absolute", top: half * 0.9, width: size * 0.18, height: size * 0.18, borderRadius: size, backgroundColor: core }} />
    </View>
  );
}

export function Arena({ g }: { g: GameState }) {
  const s = useStyles();
  const c = useTheme().colors;
  const p = g.player;
  return (
    <View style={s.fill} pointerEvents="none">
      {g.gems.map((gm) => (
        <View key={gm.id} style={[s.gem, gm.value > 1 && s.gemBig, { left: gm.x - (gm.value > 1 ? 5 : 3.5), top: gm.y - (gm.value > 1 ? 5 : 3.5) }]} />
      ))}
      {g.enemies.map((e) => (
        <React.Fragment key={e.id}>
          <Ship x={e.x} y={e.y} angle={e.angle} size={e.r * 2.2} color={e.flash > 0 ? c.bullet : e.elite ? c.enemyElite : c.enemy} core={c.arena} />
          {e.elite ? (
            <View style={[s.eliteBar, { left: e.x - 18, top: e.y - e.r - 10 }]}>
              <View style={[s.eliteFill, { width: 36 * Math.max(0, e.hp / e.maxHp) }]} />
            </View>
          ) : null}
        </React.Fragment>
      ))}
      {g.bullets.map((b) => (
        <View key={b.id} style={[s.bullet, b.crit && s.bulletCrit, { left: b.x - 2.5, top: b.y - 2.5 }]} />
      ))}
      <View style={{ opacity: p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0 ? 0.35 : 1 }}>
        <Ship x={p.x} y={p.y} angle={p.angle} size={28} color={c.player} core={c.playerCore} />
      </View>
      {g.floaters.map((f) => (
        <Text key={f.id} style={[s.floater, f.crit && s.floaterCrit, { left: f.x - 20, top: f.y - 10, opacity: Math.min(1, f.life * 2.5) }]}>
          {f.text}
        </Text>
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  fill: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, overflow: "hidden" },
  gem: { position: "absolute", width: 7, height: 7, backgroundColor: c.xp, transform: [{ rotate: "45deg" }] },
  gemBig: { width: 10, height: 10 },
  bullet: { position: "absolute", width: 5, height: 5, borderRadius: 3, backgroundColor: c.bullet },
  bulletCrit: { backgroundColor: c.warning },
  eliteBar: { position: "absolute", width: 36, height: 3, backgroundColor: c.hpTrack },
  eliteFill: { height: 3, backgroundColor: c.enemyElite },
  floater: { position: "absolute", width: 40, textAlign: "center", fontFamily: fonts.display, fontSize: 12, color: c.muted },
  floaterCrit: { color: c.warning, fontSize: 15 },
}));
