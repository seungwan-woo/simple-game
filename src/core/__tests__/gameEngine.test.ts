import { describe, expect, it } from 'vitest';
import { calculateDamage, getNextChargeCount, resolveOutcome, runSingleTurn } from '../gameEngine';
import { Command, GameState, TunableGameConfig } from '../types';

const mockConfig: TunableGameConfig = {
  MAX_HP: 100,
  TOTAL_COMMAND_SLOTS: 7,
  BASE_ATTACK_DAMAGE: 10,
  COUNTER_DAMAGE: 7,
  THROW_DAMAGE: 14,
  MAX_CHARGE_STACK: 4,
  CHARGE_BONUS_CURVE: [0, 6, 11, 17, 24],
};

const createMockState = (commandsA: Command[], commandsB: Command[], chargeA = 0, chargeB = 0): GameState => ({
  playerA: { hp: 100, chargeCount: chargeA, commands: commandsA },
  playerB: { hp: 100, chargeCount: chargeB, commands: commandsB },
  turnIndex: 0,
  replay: { events: [] },
});

describe('Code Striker Core Engine - semantic outcome model', () => {
  it('records HIT outcome and 10 damage for a normal attack', () => {
    const result = runSingleTurn(mockConfig)(createMockState(['MID_ATTACK'], ['CHARGE']));
    expect(result.event?.outcomeA).toBe('HIT');
    expect(result.event?.damageToB).toBe(10);
    expect(result.nextState.playerB.hp).toBe(90);
    expect(result.nextState.replay.events).toHaveLength(1);
  });

  it('records BLOCKED/COUNTER and applies 7 counter damage for a correct block', () => {
    const result = runSingleTurn(mockConfig)(createMockState(['MID_ATTACK'], ['MID_BLOCK']));
    expect(result.event?.outcomeA).toBe('BLOCKED');
    expect(result.event?.outcomeB).toBe('COUNTER');
    expect(result.event?.damageToA).toBe(7);
    expect(result.nextState.playerA.hp).toBe(93);
    expect(result.nextState.playerB.hp).toBe(100);
  });

  it('allows a wrong block to be hit', () => {
    const result = runSingleTurn(mockConfig)(createMockState(['MID_ATTACK'], ['LOW_BLOCK']));
    expect(result.event?.outcomeA).toBe('HIT');
    expect(result.nextState.playerB.hp).toBe(90);
  });

  it('applies charge bonus and resets charge on attack', () => {
    const charged = runSingleTurn(mockConfig)(createMockState(['CHARGE', 'MID_ATTACK'], ['LOW_BLOCK', 'LOW_BLOCK'])).nextState;
    expect(charged.playerA.chargeCount).toBe(1);
    const result = runSingleTurn(mockConfig)(charged);
    expect(result.event?.damageToB).toBe(16);
    expect(result.nextState.playerB.hp).toBe(84);
    expect(result.nextState.playerA.chargeCount).toBe(0);
  });

  it('throw breaks block and charge while charge survives being hit', () => {
    const blockResult = runSingleTurn(mockConfig)(createMockState(['THROW'], ['MID_BLOCK']));
    expect(blockResult.event?.outcomeA).toBe('THROW_BREAK');
    expect(blockResult.nextState.playerB.hp).toBe(86);

    const chargeResult = runSingleTurn(mockConfig)(createMockState(['THROW'], ['CHARGE']));
    expect(chargeResult.event?.outcomeA).toBe('THROW_BREAK');
    expect(chargeResult.nextState.playerB.hp).toBe(86);
    expect(chargeResult.nextState.playerB.chargeCount).toBe(1);
  });

  it('does not consume charge with throw or block', () => {
    expect(getNextChargeCount(mockConfig, 'THROW', 3)).toBe(3);
    expect(getNextChargeCount(mockConfig, 'MID_BLOCK', 3)).toBe(3);
    expect(getNextChargeCount(mockConfig, 'MID_ATTACK', 3)).toBe(0);
  });

  it('returns null event on terminal state', () => {
    const state = { ...createMockState(['MID_ATTACK'], ['CHARGE']), turnIndex: 7 };
    const result = runSingleTurn(mockConfig)(state);
    expect(result.event).toBeNull();
    expect(result.nextState).toBe(state);
  });

  it('separates semantic outcome resolution from damage policy', () => {
    expect(resolveOutcome('MID_ATTACK', 'MID_BLOCK')).toBe('BLOCKED');
    expect(resolveOutcome('MID_BLOCK', 'MID_ATTACK')).toBe('COUNTER');
    expect(calculateDamage(mockConfig, 'MID_BLOCK', 'COUNTER', 0)).toBe(7);
  });
});
