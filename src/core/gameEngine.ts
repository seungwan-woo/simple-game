import { pipe } from 'fp-ts/function';
import { BattleOutcome, Command, GameSimulationResult, GameState, TunableGameConfig, TurnEvent } from './types';
import { GAME_SYSTEM_CONSTANTS } from './constants';
import { clamp } from './utils';

const isAttackAction = (command: Command): boolean =>
  command === 'MID_ATTACK' || command === 'LOW_ATTACK';

const isBlockAction = (command: Command): boolean =>
  command === 'MID_BLOCK' || command === 'LOW_BLOCK';

const isMatchingBlock = (attack: Command, block: Command): boolean =>
  (attack === 'MID_ATTACK' && block === 'MID_BLOCK') ||
  (attack === 'LOW_ATTACK' && block === 'LOW_BLOCK');

export const resolveOutcome = (actorCommand: Command, opponentCommand: Command): BattleOutcome => {
  if (isAttackAction(actorCommand)) {
    return isMatchingBlock(actorCommand, opponentCommand) ? 'BLOCKED' : 'HIT';
  }

  if (actorCommand === 'THROW') {
    return isBlockAction(opponentCommand) || opponentCommand === 'CHARGE' ? 'THROW_BREAK' : 'WHIFF';
  }

  if (actorCommand === 'CHARGE') {
    return opponentCommand === 'THROW' ? 'THROW_CAUGHT' : 'CHARGE';
  }

  if (isBlockAction(actorCommand)) {
    if (opponentCommand === 'THROW') return 'THROW_CAUGHT';
    return isMatchingBlock(opponentCommand, actorCommand) ? 'COUNTER' : 'NONE';
  }

  return 'NONE';
};

export const calculateDamage = (
  config: TunableGameConfig,
  actorCommand: Command,
  outcome: BattleOutcome,
  chargeStack: number
): number => {
  switch (outcome) {
    case 'HIT':
      return isAttackAction(actorCommand)
        ? config.BASE_ATTACK_DAMAGE + (config.CHARGE_BONUS_CURVE[chargeStack] ?? 0)
        : 0;
    case 'COUNTER':
      return isBlockAction(actorCommand) ? config.COUNTER_DAMAGE : 0;
    case 'THROW_BREAK':
      return actorCommand === 'THROW' ? config.THROW_DAMAGE : 0;
    default:
      return 0;
  }
};

export const getNextChargeCount = (
  config: TunableGameConfig,
  command: Command,
  current: number
): number =>
  pipe(
    command === 'CHARGE' ? current + 1 : isAttackAction(command) ? 0 : current,
    clamp(0, config.MAX_CHARGE_STACK)
  );

const resolveCommandAt = (commands: Command[], turnIndex: number): Command =>
  commands[turnIndex] ?? GAME_SYSTEM_CONSTANTS.DEFAULT_SLOT_COMMAND;

export const runSingleTurn =
  (config: TunableGameConfig) =>
  (state: GameState): GameSimulationResult => {
    const { playerA, playerB, turnIndex } = state;

    if (turnIndex >= config.TOTAL_COMMAND_SLOTS || playerA.hp <= 0 || playerB.hp <= 0) {
      return { nextState: state, event: null };
    }

    const commandA = resolveCommandAt(playerA.commands, turnIndex);
    const commandB = resolveCommandAt(playerB.commands, turnIndex);

    const outcomeA = resolveOutcome(commandA, commandB);
    const outcomeB = resolveOutcome(commandB, commandA);

    const damageToB = calculateDamage(config, commandA, outcomeA, playerA.chargeCount);
    const damageToA = calculateDamage(config, commandB, outcomeB, playerB.chargeCount);

    const hpAAfter = pipe(playerA.hp - damageToA, clamp(0, config.MAX_HP));
    const hpBAfter = pipe(playerB.hp - damageToB, clamp(0, config.MAX_HP));
    const chargeAAfter = getNextChargeCount(config, commandA, playerA.chargeCount);
    const chargeBAfter = getNextChargeCount(config, commandB, playerB.chargeCount);

    const event: TurnEvent = {
      turnIndex,
      commandA,
      commandB,
      outcomeA,
      outcomeB,
      damageToA,
      damageToB,
      hpAAfter,
      hpBAfter,
      chargeAAfter,
      chargeBAfter,
    };

    return {
      nextState: {
        playerA: { ...playerA, hp: hpAAfter, chargeCount: chargeAAfter },
        playerB: { ...playerB, hp: hpBAfter, chargeCount: chargeBAfter },
        turnIndex: turnIndex + 1,
        replay: { events: [...(state.replay?.events ?? []), event] },
      },
      event,
    };
  };
