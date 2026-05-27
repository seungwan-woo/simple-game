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
  -> Pure Game Engine
  -> GameSimulationResult
       -> nextState
       -> TurnEvent
  -> Replay Log
  -> Simulation Timeline
  -> React UI
```

## Quality Attribute Impact

| Attribute | Impact |
|---|---|
| Testability | Pure functions are tested independently with Vitest. |
| Modifiability | Semantic outcomes separate rule meaning from damage policy. |
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
