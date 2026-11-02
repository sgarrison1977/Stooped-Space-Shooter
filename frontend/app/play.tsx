import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, GestureResponderEvent, LayoutChangeEvent, Share, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { fonts, makeStyles, radius, spacing } from "@/src/theme";
import { applySystem, createGame, GameState, step, Vec } from "@/src/game/engine";
import { baseStats, pickSystems, SystemDef } from "@/src/game/config";
import { loadProfile, saveProfile, submitScore } from "@/src/game/profile";
import { Arena } from "@/src/components/Arena";
import { Hud } from "@/src/components/Hud";
import { GameOverOverlay, LevelUpOverlay, PauseOverlay } from "@/src/components/Overlays";

type Mode = "play" | "levelup" | "paused" | "over";

export default function Play() {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const game = useRef<GameState | null>(null);
  const target = useRef<Vec | null>(null);
  const drag = useRef<{ tx: number; ty: number; px: number; py: number } | null>(null);
  const size = useRef<{ w: number; h: number } | null>(null);
  const modeRef = useRef<Mode>("play");
  const [mode, setModeState] = useState<Mode>("play");
  const [, setFrame] = useState(0);
  const [choices, setChoices] = useState<SystemDef[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [runId, setRunId] = useState(0);

  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); };

  const finishRun = useCallback(async (g: GameState) => {
    const p = await loadProfile();
    const next = { ...p, coins: p.coins + g.coins, kills: p.kills + g.kills, runs: p.runs + 1, bestWave: Math.max(p.bestWave, g.wave) };
    await saveProfile(next);
    try { setRank((await submitScore(next, g.wave, g.kills)).rank); } catch { setRank(null); }
  }, []);

  // Start / restart a run once the arena is measured
  const startRun = useCallback(async () => {
    if (!size.current) return;
    const p = await loadProfile();
    game.current = createGame(baseStats(p.upgrades), size.current.w, size.current.h);
    target.current = null;
    setRank(null);
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
      const ev = step(g, dt, target.current);
      if (ev.hurt) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (ev.dead) {
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
    if (game.current) { game.current.w = width; game.current.h = height; }
    if (first) startRun();
  };

  const onGrant = (e: GestureResponderEvent) => {
    const g = game.current;
    if (!g) return;
    drag.current = { tx: e.nativeEvent.pageX, ty: e.nativeEvent.pageY, px: g.player.x, py: g.player.y };
    target.current = { x: g.player.x, y: g.player.y };
  };
  const onMove = (e: GestureResponderEvent) => {
    const d = drag.current;
    if (!d) return;
    target.current = { x: d.px + (e.nativeEvent.pageX - d.tx) * 1.15, y: d.py + (e.nativeEvent.pageY - d.ty) * 1.15 };
  };
  const onRelease = () => { drag.current = null; target.current = null; };

  const pick = (sys: SystemDef) => {
    const g = game.current;
    if (!g) return;
    applySystem(g, sys.id);
    g.pendingLevelUps -= 1;
    if (g.pendingLevelUps > 0) setChoices(pickSystems(3));
    else setMode("play");
  };

  const g = game.current;

  return (
    <View style={s.root} testID="play-screen">
      <StatusBar style="light" />
      <View style={{ paddingTop: insets.top + spacing.sm }}>
        {g ? <Hud g={g} onPause={() => mode === "play" && setMode("paused")} /> : <View style={{ height: 72 }} />}
      </View>
      <View
        style={[s.arena, { marginBottom: insets.bottom + spacing.sm }]}
        testID="game-arena"
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onResponderRelease={onRelease}
        onResponderTerminate={onRelease}
      >
        {g ? <Arena g={g} /> : null}
        <Text style={s.hint} pointerEvents="none">Drag to move · You attack on your own</Text>
      </View>

      {g && mode === "levelup" ? <LevelUpOverlay key={`${g.level}-${g.pendingLevelUps}`} level={g.level - g.pendingLevelUps + 1} options={choices} onPick={pick} /> : null}
      {mode === "paused" ? <PauseOverlay onResume={() => setMode("play")} onQuit={() => { if (g) { g.dead = true; setMode("over"); finishRun(g); } }} /> : null}
      {g && mode === "over" ? (
        <GameOverOverlay
          wave={g.wave}
          kills={g.kills}
          coins={g.coins}
          rank={rank}
          onAgain={() => setRunId((r) => r + 1)}
          abandoned={g.player.hp > 0}
          onReturn={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          onShare={() => Share.share({ message: `I reached wave ${g.wave} with ${g.kills} kills in EMBERDEEP. Think you can dive deeper?` }).catch(() => {})}
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
}));
