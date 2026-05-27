# Code Striker Final Specification & Architecture Design

## Product Specification

Code Striker is a static web SPA for turn-based command battle simulation. It targets GitHub Pages hosting and runs entirely on the client.

## Commands

- `MID_ATTACK`
- `LOW_ATTACK`
- `MID_BLOCK`
- `LOW_BLOCK`
- `CHARGE`
- `THROW`

## Damage Rules

- Base attack damage: `10`
- Correct block counter damage: `7`
- Throw break damage: `14`
- Attack consumes charge regardless of hit or block.
- Block and throw preserve charge.
- Being hit while charging does not destroy charge.

## Match Modes

Code Striker supports three match modes.

| Mode | Rule | Default setup |
|---|---|---|
| `FIXED_TURN_REMAINING_HP` | After the configured number of turns, the player with more remaining energy wins. | 7 turns, 100 energy |
| `UNTIL_ZERO_HP_WITH_TURN_CAP` | Repeat until one player reaches zero energy, but stop at the hard turn cap to avoid endless matches. | max 30 turns, 100 energy |
| `ENDURANCE_30_TURNS_REMAINING_HP` | Start with a larger energy pool and always evaluate remaining energy after 30 turns. | 30 turns, 300 energy |

## Charge Curve

| Stack | Bonus | Final attack damage |
|---:|---:|---:|
| 0 | +0 | 10 |
| 1 | +6 | 16 |
| 2 | +11 | 21 |
| 3 | +17 | 27 |
| 4 | +24 | 34 |

## Architecture

```text
CSV / Sample Input
  -> ParsedTeam[]
  -> Zustand Store
  -> Match Mode Config
  -> Pure Game Engine
  -> GameSimulationResult
       -> nextState
       -> TurnEvent
  -> Replay Log
  -> Simulation Timeline
  -> React UI
```

## Playable MVP UI

The playable MVP provides:

- Team A / Team B selection
- Match mode selection
- Start Match / Next Turn / Run Full Match / Reset controls
- Dual-layer HP bar
- Command queue visualization
- Latest turn event panel
- Replay log

## Quality Attribute Impact

| Attribute | Impact |
|---|---|
| Testability | Pure functions are tested independently with Vitest. |
| Modifiability | Semantic outcomes and match modes separate rule meaning from damage policy. |
| Replayability | TurnEvent log enables deterministic replay. |
| UX extensibility | Timeline events separate logical time from render time. |
| Deployability | Vite base path and GitHub Pages workflow are included. |

## GitHub Pages

The Vite config uses:

```ts
base: '/simple-game/'
```

This is required for asset resolution under:

```text
https://seungwan-woo.github.io/simple-game/
```

The deployment workflow runs on pushes to `main`, executes tests, builds the app, and deploys `dist` using GitHub Pages Actions.
