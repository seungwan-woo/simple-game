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

## Local 2-Player Secret Entry

The local two-player flow supports offline play on one shared browser.

1. Player A selects every command slot.
2. Player A confirms the queue.
3. Player A's commands are masked on screen.
4. Player B selects every command slot.
5. Player B confirms the queue.
6. Both queues are locked and the local match can start.

The UI intentionally masks submitted commands with placeholder bullets so players can share one screen without revealing the first player's strategy.

## Auto Play

The playable MVP supports auto play:

- Auto play advances one turn every 2 seconds.
- Auto play stops automatically when the match is finished.
- Manual `Run Full Match` stops auto play first and then resolves the remaining match immediately.

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
Preset Teams / Secret Local Input / CSV Input
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

- Local 2-player secret command entry
- Team A / Team B preset selection
- Match mode selection
- Start Match / Next Turn / Run Full Match / Reset controls
- 2-second Auto Play
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
| Local playability | Secret command entry enables two players to play on one shared browser. |
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
