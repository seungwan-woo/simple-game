import { describe, expect, it } from 'vitest';
import { buildAnimationTimeline } from '../simulationTimeline';
import { TurnEvent } from '../types';

const event: TurnEvent = {
  turnIndex: 0,
  commandA: 'MID_ATTACK',
  commandB: 'MID_BLOCK',
  outcomeA: 'BLOCKED',
  outcomeB: 'COUNTER',
  damageToA: 7,
  damageToB: 0,
  hpAAfter: 93,
  hpBAfter: 100,
  chargeAAfter: 0,
  chargeBAfter: 0,
};

describe('Code Striker Simulation Timeline', () => {
  it('converts a turn event into a UI animation timeline', () => {
    const timeline = buildAnimationTimeline(event);
    expect(timeline[0]).toMatchObject({ type: 'COMMAND_REVEAL', turnIndex: 0, commandA: 'MID_ATTACK', commandB: 'MID_BLOCK' });
    expect(timeline).toContainEqual({ type: 'DAMAGE_APPLY', target: 'A', damage: 7, hpAfter: 93, delayMs: 300 });
    expect(timeline).toContainEqual({ type: 'HP_GHOST_CHASE', target: 'A', hpAfter: 93, delayMs: 700 });
  });

  it('does not create damage events for targets without damage', () => {
    const timeline = buildAnimationTimeline(event);
    expect(timeline.some((animation) => animation.type === 'DAMAGE_APPLY' && animation.target === 'B')).toBe(false);
  });
});
