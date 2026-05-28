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

## CSV Import

The app supports CSV import for workshop/team-building operation.

Required CSV columns:

```csv
팀명,1번째 커맨드,2번째 커맨드,3번째 커맨드,4번째 커맨드,5번째 커맨드,6번째 커맨드,7번째 커맨드
```

Supported Korean command values:

- `중단 공격`
- `하단 공격`
- `중단 막기`
- `하단 막기`
- `기 모으기`
- `던지기`

CSV import behavior:

- UTF-8 BOM is ignored.
- Blank lines are ignored.
- Header-based rows are converted to `RawCsvRow`.
- Missing cells are filled with empty strings and later fall back to the default command.
- Imported rows are progressively parsed in chunks through the existing async parser.
- The UI shows `로딩 중... loaded / total` and `로딩 완료 loaded / total` status.
- After import completes, the first two teams are selected automatically and the match state is reset.

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

- CSV team import
- Sample CSV download
- Progressive loading status badge
- Local 2-player secret command entry
- Team A / Team B preset/imported team selection
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
| Operability | CSV import and sample template support workshop operation. |
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
