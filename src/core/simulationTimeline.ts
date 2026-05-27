import { TurnEvent } from './types';

export type AnimationEvent =
  | { type: 'COMMAND_REVEAL'; turnIndex: number; commandA: string; commandB: string; delayMs: number }
  | { type: 'OUTCOME_LABEL'; label: string; delayMs: number }
  | { type: 'DAMAGE_APPLY'; target: 'A' | 'B'; damage: number; hpAfter: number; delayMs: number }
  | { type: 'HP_GHOST_CHASE'; target: 'A' | 'B'; hpAfter: number; delayMs: number };

const buildOutcomeLabel = (event: TurnEvent): string => `${event.outcomeA} / ${event.outcomeB}`;

const buildDamageEvents = (event: TurnEvent): AnimationEvent[] =>
  [
    event.damageToA > 0
      ? { type: 'DAMAGE_APPLY' as const, target: 'A' as const, damage: event.damageToA, hpAfter: event.hpAAfter, delayMs: 300 }
      : undefined,
    event.damageToB > 0
      ? { type: 'DAMAGE_APPLY' as const, target: 'B' as const, damage: event.damageToB, hpAfter: event.hpBAfter, delayMs: 300 }
      : undefined,
  ].filter((value): value is AnimationEvent => value !== undefined);

export const buildAnimationTimeline = (event: TurnEvent): AnimationEvent[] => [
  { type: 'COMMAND_REVEAL', turnIndex: event.turnIndex, commandA: event.commandA, commandB: event.commandB, delayMs: 0 },
  { type: 'OUTCOME_LABEL', label: buildOutcomeLabel(event), delayMs: 150 },
  ...buildDamageEvents(event),
  { type: 'HP_GHOST_CHASE', target: 'A', hpAfter: event.hpAAfter, delayMs: 700 },
  { type: 'HP_GHOST_CHASE', target: 'B', hpAfter: event.hpBAfter, delayMs: 700 },
];
