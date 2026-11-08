def patch(path, pairs):
    t = open(path).read()
    for old, new, *rest in pairs:
        assert old in t, (path, old[:70])
        t = t.replace(old, new) if rest else t.replace(old, new, 1)
    open(path, 'w').write(t)

F = '/app/frontend/'
patch(F + 'src/components/DifficultyChips.tsx', [
    ('export function DifficultyChips({ value, onChange, testPrefix, padded }: { value: DifficultyId; onChange: (d: DifficultyId) => void; testPrefix: string; padded?: boolean }) {',
     '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nexport function DifficultyChips({ value, onChange, testPrefix, padded, options = DIFFICULTIES }: { value: string; onChange: (d: any) => void; testPrefix: string; padded?: boolean; options?: { id: string; name: string }[] }) {'),
    ('{DIFFICULTIES.map((d) => {', '{options.map((d) => {'),
    ('import { DIFFICULTIES, DifficultyId } from "@/src/game/content";', 'import { DIFFICULTIES } from "@/src/game/content";'),
])
patch(F + 'src/game/profile.ts', [
    ('  muted: boolean;\n', '  muted: boolean;\n  mode: ModeId; weapon: WeaponId; ability: AbilityId; shipClass: ClassId;\n'),
    ('muted: false, bossRecords: {},', 'muted: false, bossRecords: {}, mode: "standard", weapon: "cannon", ability: "dash", shipClass: "standard",'),
    ('import { DifficultyId } from "./content";', 'import { DifficultyId } from "./content";\nimport { AbilityId, ClassId, ModeId, WeaponId } from "./arsenal";'),
    ('export async function submitScore(p: Profile, wave: number, kills: number) {', 'export async function submitScore(p: Profile, wave: number, kills: number, board: string) {'),
    ('wave, kills, difficulty: p.difficulty }', 'wave, kills, difficulty: board }'),
    ('export async function fetchLeaderboard(difficulty: DifficultyId,', 'export async function fetchLeaderboard(difficulty: string,'),
])
patch(F + 'app/leaderboard.tsx', [
    ('useState<DifficultyId | null>(null)', 'useState<string | null>(null)'),
    ('async (d?: DifficultyId)', 'async (d?: string)'),
    ('const choose = (d: DifficultyId)', 'const choose = (d: string)'),
    ('<DifficultyChips value={diff}', '<DifficultyChips options={BOARDS} value={diff}'),
    ('import { DifficultyId } from "@/src/game/content";', 'import { BOARDS } from "@/src/game/arsenal";'),
])
patch(F + 'app/index.tsx', [
    ('<View style={wide ? s.col : undefined}>', '<View style={wide ? s.col : s.stack}>', 'all'),
    ('            onDifficulty={(difficulty) => update((p) => ({ ...p, difficulty }))}\n          />',
     '            onDifficulty={(difficulty) => update((p) => ({ ...p, difficulty }))}\n          />\n          <LoadoutCard profile={profile} update={update} />'),
    ('  col: { flex: 1 },', '  col: { flex: 1, gap: spacing.lg },\n  stack: { gap: spacing.lg },'),
    ('import { startMusic } from "@/src/game/audio";', 'import { startMusic } from "@/src/game/audio";\nimport { LoadoutCard } from "@/src/components/Loadout";'),
])
patch(F + 'src/components/ArenaView.tsx', [
    ('style={[s.bullet, b.crit && s.bulletCrit,', 'style={[s.bullet, b.crit && s.bulletCrit, b.kind === "flame" && s.flameB, b.kind === "missile" && s.missileB,'),
    ('        {!g.dead ? (\n          <View testID="player-ship"', '        <ArenaExtras g={g} />\n        {!g.dead ? (\n          <View testID="player-ship"'),
    ('      {g.breakT > 0 ? (', '      <ArenaOverlays g={g} />\n      {g.breakT > 0 ? ('),
    ('  bulletCrit:', '  flameB: { backgroundColor: c.engineGlow, width: 9, height: 7, borderRadius: 4, opacity: 0.85 },\n  missileB: { backgroundColor: c.brandSecondary, width: 12, height: 4 },\n  bulletCrit:'),
    ('import { MobSprite } from "./MobArt";', 'import { MobSprite } from "./MobArt";\nimport { ArenaExtras, ArenaOverlays } from "./ArenaExtras";'),
])
patch(F + 'app/play.tsx', [
    ('import { applySystem, createGame, GameState, step, Vec } from "@/src/game/sim";', 'import { createGame, GameState, step, Vec } from "@/src/game/sim";\nimport { activateAbility, applyChoice, boardKey, levelChoices, pathOptions, setupLoadout } from "@/src/game/arsenal-sim";\nimport { WaveModId } from "@/src/game/arsenal";\nimport { AbilityButton, PathOverlay } from "@/src/components/ArenaExtras";'),
    ('import { baseStats, pickSystems, SystemDef } from "@/src/game/config";', 'import { baseStats, SystemDef } from "@/src/game/config";'),
    ('type Mode = "play" | "levelup" | "paused" | "over";', 'type Mode = "play" | "levelup" | "paused" | "over" | "path";'),
    ('  const [highlight, setHighlight] = useState<string | null>(null);', '  const [highlight, setHighlight] = useState<string | null>(null);\n  const [pathOpts, setPathOpts] = useState<WaveModId[]>([]);'),
    ('size.current.h, difficulty(p.difficulty));', 'size.current.h, difficulty(p.difficulty));\n    setupLoadout(game.current, { mode: p.mode, weapon: p.weapon, ability: p.ability, cls: p.shipClass });'),
    ('submitScore(next, g.wave, g.kills)', 'submitScore(next, g.wave, g.kills, boardKey(g))'),
    ('pickSystems(3)', 'levelChoices(g)', 'all'),
    ('applySystem(g, sys.id);', 'applyChoice(g, sys.id);'),
    ('      } else if (g.pendingLevelUps > 0) {', '      } else if (g.pathPending) {\n        setPathOpts(pathOptions());\n        setMode("path");\n      } else if (g.pendingLevelUps > 0) {'),
    ('        {g ? <ArenaView g={g} skin={look.skin} trail={look.trail} /> : null}', '        {g ? <ArenaView g={g} skin={look.skin} trail={look.trail} /> : null}\n        {g && mode === "play" ? <AbilityButton g={g} onPress={() => activateAbility(g)} /> : null}'),
    ('      {mode === "paused" ?', '      {g && mode === "path" ? <PathOverlay wide={wide} wave={g.wave} options={pathOpts} onPick={(id) => { g.nextMod = id; g.pathPending = false; setMode("play"); }} /> : null}\n      {mode === "paused" ?'),
])
patch('/app/backend/server.py', [
    ('    difficulty: Literal["casual", "normal", "hard", "extreme"] = "normal"', '    difficulty: str = Field("normal", pattern=r"^[a-z0-9-]{3,24}$")'),
    ('                      difficulty: Literal["casual", "normal", "hard", "extreme"] = "normal",', '                      difficulty: str = Query("normal", pattern=r"^[a-z0-9-]{3,24}$"),'),
])
print("patched all")
