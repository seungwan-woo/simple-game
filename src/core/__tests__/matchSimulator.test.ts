import { describe, expect, it } from 'vitest';
import {
  createConfigForMode,
  createGameStateForMatch,
  createMatchSummary,
  createRepeatedCommands,
  getWinner,
  isGameFinished,
  MATCH_MODE_CONFIGS,
  runFullMatch,
} from '../matchSimulator';
import { ParsedTeam, TunableGameConfig } from '../types';

const mockConfig: TunableGameConfig = {
  MAX_HP: 100,
  TOTAL_COMMAND_SLOTS: 7,
  BASE_ATTACK_DAMAGE: 10,
  COUNTER_DAMAGE: 7,
  THROW_DAMAGE: 14,
  MAX_CHARGE_STACK: 4,
  CHARGE_BONUS_CURVE: [0, 6, 11, 17, 24],
};

const attacker: ParsedTeam = {
  teamName: 'Attacker',
  commands: ['MID_ATTACK', 'MID_ATTACK', 'MID_ATTACK', 'MID_ATTACK', 'MID_ATTACK', 'MID_ATTACK', 'MID_ATTACK'],
};

const charger: ParsedTeam = {
  teamName: 'Charger',
  commands: ['CHARGE', 'CHARGE', 'CHARGE', 'CHARGE', 'CHARGE', 'CHARGE', 'CHARGE'],
};

const blocker: ParsedTeam = {
  teamName: 'Blocker',
  commands: ['MID_BLOCK', 'MID_BLOCK', 'MID_BLOCK', 'MID_BLOCK', 'MID_BLOCK', 'MID_BLOCK', 'MID_BLOCK'],
};

describe('Code Striker Match Simulator', () => {
  it('repeats short command queues up to the requested max turn count', () => {
    expect(createRepeatedCommands(['MID_ATTACK', 'LOW_ATTACK'], 5)).toEqual([
      'MID_ATTACK',
      'LOW_ATTACK',
      'MID_ATTACK',
      'LOW_ATTACK',
      'MID_ATTACK',
    ]);
  });

  it('fills default commands when the source command queue is empty', () => {
    expect(createRepeatedCommands([], 3)).toEqual(['MID_BLOCK', 'MID_BLOCK', 'MID_BLOCK']);
  });

  it('mode 1 ends at the configured 7 turns and remaining energy decides the winner', () => {
    const modeConfig = MATCH_MODE_CONFIGS.FIXED_TURN_REMAINING_HP;
    const initial = createGameStateForMatch(attacker, charger, modeConfig);
    const finalState = runFullMatch(mockConfig, modeConfig)(initial);
    const summary = createMatchSummary(finalState, modeConfig);

    expect(summary.totalTurns).toBe(7);
    expect(summary.winner).toBe('A');
    expect(summary.finalHpA).toBeGreaterThan(summary.finalHpB);
  });

  it('mode 2 stops when a player reaches zero energy before the 30 turn cap', () => {
    const modeConfig = MATCH_MODE_CONFIGS.UNTIL_ZERO_HP_WITH_TURN_CAP;
    const initial = createGameStateForMatch(attacker, charger, modeConfig);
    const finalState = runFullMatch(mockConfig, modeConfig)(initial);
    const summary = createMatchSummary(finalState, modeConfig);

    expect(summary.isFinished).toBe(true);
    expect(summary.totalTurns).toBeLessThanOrEqual(30);
    expect(summary.finalHpB).toBe(0);
    expect(summary.winner).toBe('A');
  });

  it('mode 3 always runs the full 30 turns with a large energy pool', () => {
    const modeConfig = MATCH_MODE_CONFIGS.ENDURANCE_30_TURNS_REMAINING_HP;
    const initial = createGameStateForMatch(attacker, charger, modeConfig);
    const finalState = runFullMatch(mockConfig, modeConfig)(initial);
    const summary = createMatchSummary(finalState, modeConfig);

    expect(summary.totalTurns).toBe(30);
    expect(summary.isFinished).toBe(true);
    expect(summary.finalHpA).toBeGreaterThan(0);
    expect(summary.winner).toBe('A');
  });

  it('returns DRAW when finished players have the same remaining energy', () => {
    const modeConfig = MATCH_MODE_CONFIGS.FIXED_TURN_REMAINING_HP;
    const initial = createGameStateForMatch(blocker, blocker, modeConfig);
    const finalState = runFullMatch(mockConfig, modeConfig)(initial);

    expect(getWinner(finalState, isGameFinished(finalState, modeConfig))).toBe('DRAW');
  });

  it('creates a mode-specific engine config without mutating the base config', () => {
    const modeConfig = MATCH_MODE_CONFIGS.ENDURANCE_30_TURNS_REMAINING_HP;
    const effectiveConfig = createConfigForMode(mockConfig, modeConfig);

    expect(effectiveConfig.MAX_HP).toBe(300);
    expect(effectiveConfig.TOTAL_COMMAND_SLOTS).toBe(30);
    expect(mockConfig.MAX_HP).toBe(100);
    expect(mockConfig.TOTAL_COMMAND_SLOTS).toBe(7);
  });
});
