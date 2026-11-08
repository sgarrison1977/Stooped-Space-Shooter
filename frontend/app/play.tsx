import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, GestureResponderEvent, LayoutChangeEvent, Share, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { fonts, makeStyles, radius, spacing } from "@/src/theme";
import { applySystem, createGame, GameState, step, Vec } from "@/src/game/sim";
import { baseStats, pickSystems, SystemDef } from "@/src/game/config";
import { loadProfile, mergeBossKills, saveProfile, submitScore } from "@/src/game/profile";
import { BOSSES, difficulty, SKINS, skinById, TRAILS, trailById } from "@/src/game/content";
import { playSfx, startMusic } from "@/src/game/audio";
import { ArenaView } from "@/src/components/ArenaView";
import { Hud } from "@/src/components/Hud";
import { GameOverOverlay, LevelUpOverlay, PauseOverlay } from "@/src/components/Overlays";

type Mode = "play" | "levelup" | "paused" | "over";

export default function Play() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const game = useRef<GameState | null>(null);
  const joy = useRef<Vec | null>(null);
  const drag = useRef<{ lx: number; ly: number; tx: number; ty: number } | null>(null);
  const { width: winW, height: winH } = useWindowDimensions();
  const wide = winW > winH;
  const size = useRef<{ w: number; h: number } | null>(null);
  const modeRef = useRef<Mode>("play");
  const [mode, setModeState] = useState<Mode>("play");
  const [, setFrame] = useState(0);
  const [choices, setChoices] = useState<SystemDef[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [runId, setRunId] = useState(0);
  const [look, setLook] = useState({ skin: SKINS[0], trail: TRAILS[0] });
  const [highlight, setHighlight] = useState<string | null>(null);

  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); };

  useEffect(() => { startMusic(); }, []);

  const finishRun = useCallback(async (g: GameState) => {
    const p = await loadProfile();
    const earned = Math.floor(g.coins);
    const { records, highlight: hl } = mergeBossKills(p, g.bossKills, BOSSES.map((b) => b.name));
    setHighlight(hl);
    const next = { ...p, coins: p.coins + earned, kills: p.kills + g.kills, runs: p.runs + 1, bestWave: Math.max(p.bestWave, g.wave), bossRecords: records };
    await saveProfile(next);
    try { setRank((await submitScore(next, g.wave, g.kills)).rank); } catch { setRank(null); }
  }, []);

  // Start / restart a run once the arena is measured
  const startRun = useCallback(async () => {
    if (!size.current) return;
    const p = await loadProfile();
    setLook({ skin: skinById(p.skin), trail: trailById(p.trail) });
    game.current = createGame(baseStats(p.upgrades), size.current.w, size.current.h, difficulty(p.difficulty));
    joy.current = null;
    drag.current = null;
    setRank(null);
    setHighlight(null);
    setMode("play");
    setFrame((f) => f + 1);
  }, []);

  useEffect(() => { if (size.current) startRun(); }, [runId, startRun]);

  // Game loop
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const g = game.current;
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!g || modeRef.current !== "play") return;
      const ev = step(g, dt, joy.current);
      if (ev.shot) playSfx("laser");
      if (ev.kill && !ev.bossDown) playSfx("explosion");
      if (ev.pickup) playSfx("pickup");
      if (ev.hurt) { playSfx("hit"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }
      if (ev.bossSpawn) { playSfx("boss_warning"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); }
      if (ev.bossDown) { playSfx("boss_explosion"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); }
      if (ev.levelUp) playSfx("levelup");
      if (ev.waveClear) { playSfx("levelup"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }
      if (ev.dead) {
        playSfx("boss_explosion");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setMode("over");
        finishRun(g);
      } else if (g.pendingLevelUps > 0) {
        setChoices(pickSystems(3));
        setMode("levelup");
      }
      setFrame((f) => (f + 1) % 1000000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [finishRun]);

  // Pause when backgrounded; Android back pauses instead of leaving mid-run
  useEffect(() => {
    const sub = AppState.addEventListener("change", (st) => {
      if (st !== "active" && modeRef.current === "play") setMode("paused");
    });
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      if (modeRef.current === "play") { setMode("paused"); return true; }
      return false;
    });
    return () => { sub.remove(); back.remove(); };
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const first = !size.current;
    size.current = { w: width, h: height };
    if (game.current) {
      const g = game.current;
      g.w = width; g.h = height;
      g.player.x = Math.min(g.player.x, width - 14);
      g.player.y = Math.min(g.player.y, height - 14);
    }
    if (first) startRun();
  };

  // Virtual thumbstick: wherever you touch becomes the stick centre; push to thrust.
  const STICK = 50;
  const onGrant = (e: GestureResponderEvent) => {
    drag.current = { lx: e.nativeEvent.locationX, ly: e.nativeEvent.locationY, tx: e.nativeEvent.pageX, ty: e.nativeEvent.pageY };
    joy.current = { x: 0, y: 0 };
  };
  const onMove = (e: GestureResponderEvent) => {
    const d = drag.current;
    if (!d) return;
    let x = (e.nativeEvent.pageX - d.tx) / STICK, y = (e.nativeEvent.pageY - d.ty) / STICK;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    joy.current = { x, y };
  };
  const onRelease = () => { drag.current = null; joy.current = null; };

  const pick = (sys: SystemDef) => {
    const g = game.current;
    if (!g) return;
    applySystem(g, sys.id);
    g.pendingLevelUps -= 1;
    if (g.pendingLevelUps > 0) setChoices(pickSystems(3));
    else setMode("play");
  };

  const g = game.current;
  const d = drag.current;
  const j = joy.current;

  return (
    <View style={s.root} testID="play-screen">
      <StatusBar style="light" hidden={wide} />
      <View style={{ paddingTop: wide ? Math.max(insets.top, spacing.sm) : insets.top + spacing.sm, paddingLeft: insets.left, paddingRight: insets.right }}>
        {g ? <Hud g={g} wide={wide} onPause={() => mode === "play" && setMode("paused")} /> : <View style={{ height: wide ? 40 : 72 }} />}
      </View>
      <View
        style={[s.arena, { marginBottom: insets.bottom + spacing.sm, marginLeft: insets.left + spacing.md, marginRight: insets.right + spacing.md }]}
        testID="game-arena"
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onResponderRelease={onRelease}
        onResponderTerminate={onRelease}
      >
        {g ? <ArenaView g={g} skin={look.skin} trail={look.trail} /> : null}
        {d && j ? (
          <View pointerEvents="none" style={[s.stick, { left: d.lx - STICK, top: d.ly - STICK }]} testID="thumbstick">
            <View style={[s.knob, { transform: [{ translateX: j.x * STICK }, { translateY: j.y * STICK }] }]} />
          </View>
        ) : null}
        <Text style={s.hint} pointerEvents="none">Drag to thrust · You attack on your own</Text>
      </View>

      {g && mode === "levelup" ? <LevelUpOverlay key={`${g.level}-${g.pendingLevelUps}`} wide={wide} level={g.level - g.pendingLevelUps + 1} options={choices} onPick={pick} /> : null}
      {mode === "paused" ? <PauseOverlay onResume={() => setMode("play")} onQuit={() => { if (g) { g.dead = true; setMode("over"); finishRun(g); } }} /> : null}
      {g && mode === "over" ? (
        <GameOverOverlay
          wide={wide}
          bosses={g.bossesDown}
          highlight={highlight}
          wave={g.wave}
          kills={g.kills}
          coins={Math.floor(g.coins)}
          difficultyName={g.mods.name}
          rank={rank}
          onAgain={() => setRunId((r) => r + 1)}
          abandoned={g.player.hp > 0}
          onReturn={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          onShare={() => Share.share({ message: `I reached wave ${g.wave} on ${g.mods.name} with ${g.kills} kills and ${g.bossesDown} bosses down in Stooopid Space Shooter Game. Think you can beat that?` }).catch(() => {})}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface, userSelect: "none" } as any,
  arena: {
    flex: 1, marginHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.arena, overflow: "hidden",
  },
  hint: {
    position: "absolute", bottom: spacing.sm, left: 0, right: 0, textAlign: "center",
    fontFamily: fonts.text, fontSize: 9, letterSpacing: 1.8, color: c.muted, opacity: 0.6, textTransform: "uppercase",
  },
  stick: {
    position: "absolute", width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: c.border,
    backgroundColor: c.scrimLight, alignItems: "center", justifyContent: "center",
  },
  knob: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandTertiary, borderWidth: 1.5, borderColor: c.brandSecondary },
}));
