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

## Backlog
- P1: Sound effects & music; more enemy types / bosses
- P1: Server-side score sanity checks
- P2: Daily challenge seed, cosmetics shop, achievements
