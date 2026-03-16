# Serpent Surge

A roguelike Snake game built with TypeScript + HTML5 Canvas. Power-ups, hazards, wave progression, and retro CRT aesthetics.

![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Vite](https://img.shields.io/badge/Vite-8-646CFF)
![PWA](https://img.shields.io/badge/PWA-installable-green)

## Gameplay

Navigate a neon snake through increasingly dangerous arenas. Eat food to grow, clear waves, and choose power-ups to shape your run.

- **Wave System** — 3 waves per arena with escalating food quotas
- **Arena Progression** — Speed and hazard count increase each arena
- **10 Power-Ups** — Ghost Mode, Wall Wrap, Dash, Rewind, Singularity, and more
- **Hazards** — Wall Blocks, Spike Traps (toggle on/off), Poison Trails (decay over time)
- **Extended Food** — Golden Apples (+50 pts), Shrink Pellets (-2 length)
- **Persistence** — High scores and settings saved via IndexedDB

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Rendering | HTML5 Canvas API (no framework) |
| Build | Vite |
| Audio | Tone.js (synthesized retro SFX) |
| Storage | IndexedDB via idb-keyval |
| Testing | Vitest |
| PWA | Service worker + manifest |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Production build
npm run build
```

## Controls

| Input | Action |
|-------|--------|
| Arrow keys / WASD | Change direction |
| Tap / Swipe | Mobile controls |
| Double-tap direction | Dash (with power-up) |

## Project Structure

```
src/
├── audio/          # Tone.js synthesized SFX
├── data/           # Power-up and hazard definitions
├── game/           # Core game logic (snake, food, collision, arena)
├── rendering/      # Canvas renderer, particles, effects, HUD
├── screens/        # Title, death, power-up selection screens
├── utils/          # Constants, math helpers, storage
└── main.ts         # Entry point
```

## Power-Ups

| Power-Up | Rarity | Effect |
|----------|--------|--------|
| Ghost Mode | Common | Phase through tail for 3s after eating |
| Wall Wrap | Common | Exit one side, enter the opposite |
| Venom Trail | Common | Tail leaves poison for 3 ticks |
| Head Bash | Common | Destroy 1 wall block per wave |
| Iron Gut | Common | +2 length per food instead of +1 |
| Scavenger | Common | 2 food items on grid at once |
| Dash | Uncommon | Double-tap to skip 3 cells |
| Time Dilation | Uncommon | 30% slowdown for 2s on near-miss |
| Rewind | Rare | Undo death, rewind 3s (1x per arena) |
| Singularity | Rare | Nearby food drifts toward you |
