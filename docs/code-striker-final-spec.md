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

Recommended CSV columns use short English names to reduce typo risk:

```csv
team,cmd1,cmd2,cmd3,cmd4,cmd5,cmd6,cmd7
alpha,charge,mid_attack,throw,low_block,low_attack,charge,mid_attack
beta,low_block,low_block,mid_block,low_attack,charge,throw,mid_block
```

Supported command values:

- `mid_attack`
- `low_attack`
- `mid_block`
- `low_block`
- `charge`
- `throw`

Legacy Korean headers and command labels are still accepted for compatibility, but the downloaded sample template uses the short English format.

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

## Timeline Playback

Each completed turn produces an animation timeline. The UI replays the timeline as a broadcast sequence without mutating the deterministic game engine.

Playback order:

1. `COMMAND_REVEAL` — show both selected commands.
2. `OUTCOME_LABEL` — show the semantic battle outcome.
3. `DAMAGE_APPLY` — show damage and resulting HP for affected players.
4. `HP_GHOST_CHASE` — show the delayed HP trail settling.

The playback timer is isolated inside the React presentation component. The core game engine remains pure and replayable.

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
  -> Timeline Playback UI
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
- Timeline playback broadcast panel
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
