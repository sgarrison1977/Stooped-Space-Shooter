# EMBERDEEP (Hypershift rebuild) – PRD

## Original problem statement
User built "Hypershift" (in-game title EMBERDEEP) on Base44 and wants it rebuilt as an Expo mobile app, copied from 8 screenshots. Small blue dots in the arena are experience points that get collected.

## Architecture
- Expo Router: `/` (Home: Muster + Armoury), `/play` (game), `/leaderboard`
- Game engine: `src/game/engine.ts` (pure TS, rAF loop, View-based rendering)
- Profile (name, coins, stats, upgrades) stored on device via `@/src/utils/storage`
- FastAPI + Mongo: `POST /api/scores`, `GET /api/leaderboard`
- Fonts: Cinzel + DM Sans (local TTFs); Lucide icons; dark ember theme

## Implemented (Nov 2026)
- Home: pilot naming, stat tiles, Damage/Resistance/Max Health, Enter the Deep
- Armoury: Cannon Array / Deflector Screen / Hull Plating with scaling coin costs
- Gameplay: drag-to-move, auto-fire at nearest, waves every 25s, elites every 5th wave, XP gems, coins, damage numbers, haptics
- Level-up "Choose a System" (8 systems, 3 random)
- Pause (also on background / Android back), game over with rank, Dive Again, share challenge
- Global leaderboard

## Iteration 2
- Boss every 3rd wave (10s in): ring + aimed shots, health bar, warning banner, big coin reward
- Ice-glide movement with virtual thumbstick (tuned twice for less glide)
- Ship turns toward nearest enemy (7 rad/s) and only fires from its nose when lined up
- Landscape support for home, game, overlays, leaderboard
- New SVG ships (player, raider, elite, boss), nebula + parallax starfield, explosions, exhaust, screen shake
- Difficulty rebalanced (slower/fewer enemies, weaker bosses, regen + wave heal, longer i-frames)
- Pending: full testing-agent pass (user asked to wait)

## Iteration 3
- Business model: premium paid app on Google Play ($1.99), no ads, no IAP; all cosmetics bought with in-game coins
- Procedural SFX (laser, explosion, boss explosion, hit, boss warning, level-up, pickup) + 30s ember soundtrack loop (expo-audio); mute toggle on home + pause; mic permission disabled in app.json
- 8 named bosses with unique SVG art + attack patterns (ring, spiral, fan+escorts, 3-stream rotor, telegraphed charge, summoner+homing orbs, slag mines, twin-spiral storm); boss every 3rd wave
- Hangar shop: 7 hull skins + 6 engine trails (preview, buy, equip)
- Difficulty: Casual / Normal / Hard / Extreme (hp/dmg/speed/spawn/regen modifiers, 0.75x–2.2x coins), separate leaderboards per difficulty
- Pending: testing-agent pass (user asked to wait until told)

## Iteration 4
- Boss Gallery (/bosses): 8 cards, locked silhouettes until beaten; beaten shows art, attack pattern, fastest kill (m:ss.d), kill count, difficulty of record
- Boss kill timing tracked in sim; merged into profile.bossRecords at run end; game-over shows "First kill / New fastest" line
- Pending: testing-agent pass (user asked to wait until told)

## Iteration 5
- 8 regular enemy types with unique SVG art + behaviour, unlocked by wave: Raider (w1), Needle Dart (w2, fast weaving), Slag Brute (w4, armoured, no knockback), Marauder elite (w4), Shardling (w5, splits into 2 Shards), Phantom (w6, blinks next to you), Ember Gunner (w7, keeps distance, shoots), Juggernaut (w8, fortress)
- Health bars on tanky enemies; "New threat" intro card the first time each type appears in a run
- Tougher spawns arrive less often (spawn interval scaled by sqrt(hp multiplier)); bot sim Normal reaches waves 6-9
- Pending: testing-agent pass (user asked to wait until told)

## Iteration 6 (bug fix)
- Enemy flood fix: per-difficulty cap on enemies alive (Casual 18 / Normal 26 / Hard 34 / Extreme 42, ramp min(cap, 10+2*wave)); boss minions respect ramped cap; slower spawn burst + 0.7s interval floor; Casual spawn 0.6x
- Verified by testing agent (iteration_2) incl. headless sim tests_sim/sim_cap_test.ts
- Minor: difficulty chips fit at 390px, pause button 44px, lint purity fixes

## Backlog
- P1: Sound effects & music; more enemy types / bosses
- P1: Server-side score sanity checks
- P2: Daily challenge seed, cosmetics shop, achievements
