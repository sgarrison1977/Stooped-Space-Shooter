import React from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fonts, makeStyles, radius, spacing, useTheme, pop, fx } from "@/src/theme";
import { Enemy, GameState } from "@/src/game/sim";
import { BOSSES, MOBS, Skin, Trail } from "@/src/game/content";
import { EliteSprite, RaiderSprite } from "./Sprites";
import { MobSprite } from "./MobArt";
import { ArenaExtras, ArenaOverlays } from "./ArenaExtras";
import { BossSprite, PlayerSprite } from "./ShipArt";
import { Starfield } from "./Starfield";

const deg = (a: number) => `${(a * 180) / Math.PI + 90}deg`;

function EnemyView({ e }: { e: Enemy }) {
  const s = useStyles();
  const size = e.r * (e.kind === "boss" ? 2.6 : 2.5);
  const warnPulse = e.warn > 0 ? 1.08 + Math.sin(e.warn * 40) * 0.06 : 1;
  const tanky = e.kind !== "boss" && MOBS[e.kind].hp >= 3 && e.hp < e.maxHp;
  return (
    <>
      <View
        testID={`enemy-${e.kind}`}
        style={{
          position: "absolute", left: e.x - size / 2, top: e.y - size / 2, width: size, height: size,
          opacity: e.flash > 0 ? 0.55 : 1, transform: [{ rotate: deg(e.angle) }, { scale: e.flash > 0 ? 1.08 : warnPulse }],
        }}
      >
        {e.kind === "boss" ? <BossSprite size={size} variant={e.variant} />
          : e.kind === "elite" ? <EliteSprite size={size} />
            : e.kind === "grunt" ? <RaiderSprite size={size} />
              : <MobSprite kind={e.kind} size={size} />}
      </View>
      {tanky ? (
        <View style={[s.mobBar, { left: e.x - e.r, top: e.y - e.r - 9, width: e.r * 2 }]}>
          <View style={[s.mobFill, { width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%` }]} />
        </View>
      ) : null}
    </>
  );
}

export function ArenaView({ g, skin, trail }: { g: GameState; skin: Skin; trail: Trail }) {
  const s = useStyles();
  const { colors } = useTheme();
  const p = g.player;
  const shakeX = g.shake ? Math.sin(g.time * 97) * 0.5 * g.shake : 0;
  const shakeY = g.shake ? Math.cos(g.time * 83) * 0.5 * g.shake : 0;
  const tone = { ember: colors.engineGlow, spark: colors.bullet, exhaust: trail.color };
  const blink = p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0;
  const boss = g.boss;
  return (
    <View style={s.fill} pointerEvents="none">
      <Starfield w={g.w} h={g.h} px={p.x} py={p.y} />
      <View style={[s.fill, { transform: [{ translateX: shakeX }, { translateY: shakeY }] }]}>
        {g.gems.map((gm) => {
          const z = gm.value > 1 ? 11 : 7;
          return <View key={gm.id} style={[s.gem, { width: z, height: z, left: gm.x - z / 2, top: gm.y - z / 2 }]} />;
        })}
        {g.particles.map((q) => (
          <View
            key={q.id}
            style={{
              position: "absolute", left: q.x - q.size / 2, top: q.y - q.size / 2, width: q.size, height: q.size,
              borderRadius: q.size, backgroundColor: tone[q.tone], opacity: q.life / q.max,
            }}
          />
        ))}
        {g.enemies.map((e) => <EnemyView key={e.id} e={e} />)}
        {g.bullets.map((b) => (
          <View
            key={b.id}
            style={[s.bullet, g.gold && !g.tempWeapon && s.goldB, b.crit && s.bulletCrit, b.kind === "flame" && s.flameB, b.kind === "missile" && s.missileB, { left: b.x - 7, top: b.y - 1.5, transform: [{ rotate: `${Math.atan2(b.vy, b.vx)}rad` }] }]}
          />
        ))}
        {g.eBullets.map((b) =>
          b.fuse !== undefined ? (
            <View key={b.id} style={[s.mine, { left: b.x - 8, top: b.y - 8, opacity: 0.55 + 0.45 * Math.abs(Math.sin(b.fuse * 10)) }]}>
              <View style={s.mineCore} />
            </View>
          ) : (
            <View key={b.id} style={[s.eBullet, b.homing && s.orb, { left: b.x - (b.homing ? 7 : 5), top: b.y - (b.homing ? 7 : 5) }]}>
              <View style={s.eCore} />
            </View>
          ),
        )}
        <ArenaExtras g={g} />
        {!g.dead ? (
          <View testID="player-ship" style={{ position: "absolute", left: p.x - 18, top: p.y - 18, width: 36, height: 36, opacity: blink ? 0.35 : 1, transform: [{ rotate: deg(p.angle) }] }}>
            <LinearGradient
              colors={[trail.flame, trail.color, colors.transparent]}
              style={[s.flame, { transform: [{ scaleY: 0.3 + p.thrust * 1.1 }], opacity: 0.4 + p.thrust * 0.6 }]}
            />
            <PlayerSprite size={36} skin={skin} />
          </View>
        ) : null}
        {g.floaters.map((f) => (
          <Text key={f.id} style={[s.floater, f.crit && s.floaterCrit, { left: f.x - 20, top: f.y - 10, opacity: Math.min(1, f.life * 2.5) }]}>
            {f.text}
          </Text>
        ))}
      </View>
      {g.intro && !g.bossBanner ? (
        <View style={[s.intro, { top: boss ? 44 : 10, opacity: Math.min(1, g.intro.t * 2) }]} testID="enemy-intro">
          <Text style={s.introLabel}>{g.intro.label ?? "New threat"}</Text>
          <Text style={s.introName}>{g.intro.name}</Text>
          <Text style={s.introDesc}>{g.intro.desc}</Text>
        </View>
      ) : null}
      {boss ? (
        <View style={s.bossBar} testID="boss-health-bar">
          <Text style={s.bossName} numberOfLines={1}>{g.bossName}</Text>
          <View style={s.bossTrack}>
            <View style={[s.bossFill, { width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }]} />
          </View>
        </View>
      ) : null}
      <ArenaOverlays g={g} />
      {g.breakT > 0 ? (
        <View style={s.banner} testID="wave-break-banner">
          <Text style={s.bannerLabel}>Wave {g.wave} cleared</Text>
          <Text style={s.bannerName}>Wave {g.wave + 1} in {Math.ceil(g.breakT)}</Text>
          <Text style={s.bannerTag}>Hull repaired · catch your breath</Text>
        </View>
      ) : null}
      {g.bossBanner > 0 && boss ? (
        <View style={s.banner} testID="boss-banner">
          <Text style={[s.bannerLabel, { opacity: Math.min(1, g.bossBanner) }]}>Boss Incoming</Text>
          <Text style={[s.bannerName, { opacity: Math.min(1, g.bossBanner) }]}>{g.bossName}</Text>
          <Text style={[s.bannerTag, { opacity: Math.min(1, g.bossBanner) }]}>{BOSSES[boss.variant].tagline}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  fill: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, overflow: "hidden" },
  gem: { position: "absolute", backgroundColor: c.xp, borderWidth: 1, borderColor: c.shipLight, transform: [{ rotate: "45deg" }] },
  bullet: { position: "absolute", width: 14, height: 3, borderRadius: 2, backgroundColor: c.bullet },
  goldB: { backgroundColor: "#FFD24A", height: 4 }, // mastered weapon: gold shots in every style
  flameB: { backgroundColor: c.engineGlow, width: 9, height: 7, borderRadius: 4, opacity: 0.85 },
  missileB: { backgroundColor: c.brandSecondary, width: 12, height: 4 },
  bulletCrit: { backgroundColor: c.warning, height: 4 },
  eBullet: { position: "absolute", width: 10, height: 10, borderRadius: 5, backgroundColor: c.enemy, alignItems: "center", justifyContent: "center" },
  eCore: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.bossCore },
  orb: { width: 14, height: 14, borderRadius: 7, backgroundColor: c.error, borderWidth: 1.5, borderColor: c.enemyLight },
  mine: {
    position: "absolute", width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: c.warning,
    backgroundColor: c.bossDark, alignItems: "center", justifyContent: "center",
  },
  mineCore: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.warning },
  bannerTag: { fontFamily: fonts.text, fontSize: 13, color: c.onArenaMuted, marginTop: 4 },
  mobBar: { position: "absolute", height: 3, borderRadius: 2, backgroundColor: c.hpTrack, overflow: "hidden" },
  mobFill: { height: 3, backgroundColor: c.enemyElite },
  intro: {
    position: "absolute", alignSelf: "center", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.md, ...pop(c), backgroundColor: c.surfaceSecondary,
  },
  introLabel: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1, color: c.brandSecondary, textTransform: "uppercase" },
  introName: { fontFamily: fonts.display, fontSize: 18, color: c.onSurface, paddingTop: 2 },
  introDesc: { fontFamily: fonts.text, fontSize: 15, color: c.onSurfaceSecondary },
  flame: { position: "absolute", left: 12, top: 30, width: 12, height: 16, borderRadius: 6 },
  floater: { position: "absolute", width: 40, textAlign: "center", fontFamily: fonts.display, fontSize: 13, color: c.onArena },
  floaterCrit: { color: c.warning, fontSize: 17 },
  bossBar: { position: "absolute", top: 10, left: "15%", right: "15%", alignItems: "center", gap: 4 },
  bossName: { fontFamily: fonts.display, fontSize: 15, letterSpacing: 1, color: c.onArena },
  bossTrack: { width: "100%", height: 14, borderRadius: radius.pill, backgroundColor: c.hpTrack, overflow: "hidden", borderWidth: 1, borderColor: c.border },
  bossFill: { height: "100%", backgroundColor: c.brandPrimary },
  banner: { position: "absolute", top: "38%", left: 0, right: 0, alignItems: "center" },
  bannerLabel: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 2, color: c.brandPrimary, textTransform: "uppercase" },
  bannerName: { fontFamily: fonts.display, fontSize: 36, color: c.onArena, letterSpacing: 1, marginTop: 4, ...fx.overlayShadow },
}));
