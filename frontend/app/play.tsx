import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, GestureResponderEvent, LayoutChangeEvent, Share, Text, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { fonts, makeStyles, radius, spacing, pop, ink } from "@/src/theme";
import { createGame, GameState, setRng, step, StepEvents, Vec } from "@/src/game/sim";
import { activateAbility, applyChoice, boardKey, levelChoices, retryWave, setupLoadout } from "@/src/game/arsenal-sim";
import { MODES, SPEEDS } from "@/src/game/arsenal";
import { clearRun, loadRun, saveRun } from "@/src/game/save";

const runLabel = (g: GameState) => (g.mode === "standard" ? g.mods.name : MODES.find((m) => m.id === g.mode)!.name);
import { AbilityButton } from "@/src/components/ArenaExtras";
import { baseStats, SystemDef } from "@/src/game/config";
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

  const setMode = (m: Mode) => {
    modeRef.current = m; setModeState(m);
    if (m === "paused" && game.current) saveRun(game.current);
  };
  const params = useLocalSearchParams<{ resume?: string }>();
  const resume = useRef(params.resume === "1");
  const speed = useRef(1);

  useEffect(() => { startMusic(); }, []);

  const finishRun = useCallback(async (g: GameState) => {
    await clearRun();
    const p = await loadProfile();
    const earned = Math.floor(g.coins);
    const { records, highlight: hl } = mergeBossKills(p, g.bossKills, BOSSES.map((b) => b.name));
    setHighlight(hl);
    const next = { ...p, coins: p.coins + earned, kills: p.kills + g.kills, runs: p.runs + 1, bestWave: Math.max(p.bestWave, g.wave), bossRecords: records };
    await saveProfile(next);
    try { setRank((await submitScore(next, g.wave, g.kills, boardKey(g))).rank); } catch { setRank(null); }
  }, []);

  // Start / restart a run once the arena is measured
  const startRun = useCallback(async () => {
    if (!size.current) return;
    const p = await loadProfile();
    setLook({ skin: skinById(p.skin), trail: trailById(p.trail) });
    speed.current = SPEEDS.find((x) => x.id === p.speed)?.mul ?? 1;
    joy.current = null;
    drag.current = null;
    setRank(null);
    setHighlight(null);
    // Continue a saved run (once, when opened from the home screen's Continue button)
    const saved = resume.current ? await loadRun() : null;
    resume.current = false;
    if (saved) {
      setRng(Math.random);
      saved.w = size.current.w; saved.h = size.current.h;
      saved.player.x = Math.min(saved.player.x, saved.w - 14); saved.player.y = Math.min(saved.player.y, saved.h - 14);
      game.current = saved;
      setMode("paused");
      setFrame((f) => f + 1);
      return;
    }
    await clearRun();
    // Special modes use Normal; Daily also ignores Armoury upgrades so it is the same for everyone
    const ups = p.mode === "daily" ? { cannon: 1, deflector: 1, hull: 1 } : p.upgrades;
    game.current = createGame(baseStats(ups), size.current.w, size.current.h, difficulty(p.mode === "standard" ? p.difficulty : "normal"));
    setupLoadout(game.current, { mode: p.mode, weapon: p.weapon, ability: p.ability, cls: p.shipClass });
    setMode("play");
    setFrame((f) => f + 1);
  }, []);

  useEffect(() => { if (size.current) startRun(); }, [runId, startRun]);

  // Game loop
  useEffect(() => {
    let raf = 0;
    let last = 0;
    let lastSave = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const g = game.current;
      if (!last) last = t;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!g || modeRef.current !== "play") return;
      // Game speed: run the sim faster/slower in small substeps so fast speeds stay accurate
      const total = dt * speed.current, n = Math.max(1, Math.ceil(total / 0.034));
      let ev: StepEvents | null = null;
      try {
        for (let i = 0; i < n; i++) {
          const e = step(g, total / n, joy.current);
          if (!ev) ev = e; else for (const k of Object.keys(e) as (keyof StepEvents)[]) ev[k] = ev[k] || e[k];
          if (e.dead || g.pendingLevelUps > 0) break;
        }
      } catch (e) { console.warn("[step] skipped frame", e); return; } // never let one bad frame kill the run
      if (!ev) return;
      if (ev.shot) playSfx("laser");
      if (ev.kill && !ev.bossDown) playSfx("explosion");
      if (ev.pickup) playSfx("pickup");
      if (ev.hurt) { playSfx("hit"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }
      if (ev.bossSpawn) { playSfx("boss_warning"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); }
      if (ev.bossDown) { playSfx("boss_explosion"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); }
      if (ev.levelUp) playSfx("levelup");
      if (ev.waveClear) { playSfx("levelup"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); saveRun(g); }
      if (t - lastSave > 10000) { lastSave = t; saveRun(g); }
      if (ev.dead && g.lives > 1) {
        // lose a life and replay this wave
        playSfx("boss_explosion");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        retryWave(g);
        saveRun(g);
      } else if (ev.dead) {
        playSfx("boss_explosion");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        g.lives = 0;
        setMode("over");
        finishRun(g);
      } else if (g.pendingLevelUps > 0) {
        setChoices(levelChoices(g));
        setMode("levelup");
      }
      setFrame((f) => (f + 1) % 1000000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [finishRun]);

  // Pause (and save) when backgrounded; Android back pauses instead of leaving mid-run
  useEffect(() => {
    const sub = AppState.addEventListener("change", (st) => {
      if (st !== "active" && modeRef.current === "play") setMode("paused");
      if (st !== "active" && game.current && modeRef.current !== "over") saveRun(game.current);
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
    applyChoice(g, sys.id);
    g.pendingLevelUps -= 1;
    if (g.pendingLevelUps > 0) setChoices(levelChoices(g));
    else { setMode("play"); saveRun(g); }
  };
  const leave = () => (router.canGoBack() ? router.back() : router.replace("/"));

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
        {g && mode === "play" ? <AbilityButton g={g} onPress={() => activateAbility(g)} /> : null}
        {d && j ? (
          <View pointerEvents="none" style={[s.stick, { left: d.lx - STICK, top: d.ly - STICK }]} testID="thumbstick">
            <View style={[s.knob, { transform: [{ translateX: j.x * STICK }, { translateY: j.y * STICK }] }]} />
          </View>
        ) : null}
        {g && g.wave <= 2 ? <Text style={s.hint} pointerEvents="none">Drag to thrust · Automatically attacks</Text> : null}
      </View>

      {g && mode === "levelup" ? <LevelUpOverlay key={`${g.level}-${g.pendingLevelUps}`} wide={wide} level={g.level - g.pendingLevelUps + 1} options={choices} onPick={pick} /> : null}
      {mode === "paused" ? (
        <PauseOverlay
          onResume={() => setMode("play")}
          onSaveLeave={async () => { if (g) await saveRun(g); leave(); }}
          onQuit={() => { if (g) { g.dead = true; setMode("over"); finishRun(g); } }}
        />
      ) : null}
      {g && mode === "over" ? (
        <GameOverOverlay
          wide={wide}
          bosses={g.bossesDown}
          highlight={highlight}
          wave={g.wave}
          kills={g.kills}
          coins={Math.floor(g.coins)}
          difficultyName={runLabel(g)}
          rank={rank}
          onAgain={() => setRunId((r) => r + 1)}
          abandoned={g.player.hp > 0}
          onReturn={leave}
          onShare={() => Share.share({ message: `I reached wave ${g.wave} on ${runLabel(g)} with ${g.kills} kills and ${g.bossesDown} bosses down in Stooopid Space Shooter Game. Think you can beat that?` }).catch(() => {})}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface, userSelect: "none" } as any,
  arena: {
    flex: 1, marginHorizontal: spacing.md, borderRadius: radius.lg, ...pop(c),
    backgroundColor: c.arena, overflow: "hidden",
  },
  hint: {
    position: "absolute", bottom: spacing.sm, left: 0, right: 0, textAlign: "center",
    fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1, color: c.onArenaMuted, opacity: 0.9, textTransform: "uppercase",
  },
  stick: {
    position: "absolute", width: 100, height: 100, borderRadius: 50, ...ink(c), borderColor: c.onArenaMuted,
    backgroundColor: c.scrimLight, alignItems: "center", justifyContent: "center",
  },
  knob: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandPrimary },
}));
