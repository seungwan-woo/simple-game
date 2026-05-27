import { pipe } from 'fp-ts/function';
import * as A from 'fp-ts/Array';
import { GAME_SYSTEM_CONSTANTS } from './constants';
import { runSingleTurn } from './gameEngine';
import { Command, GameState, ParsedTeam, TunableGameConfig } from './types';

export type MatchMode =
  | 'FIXED_TURN_REMAINING_HP'
  | 'UNTIL_ZERO_HP_WITH_TURN_CAP'
  | 'ENDURANCE_30_TURNS_REMAINING_HP';

export type MatchWinner = 'A' | 'B' | 'DRAW' | 'UNDECIDED';

export interface MatchModeConfig {
  mode: MatchMode;
  maxTurns: number;
  initialHp: number;
  stopOnZeroHp: boolean;
}

export interface MatchSummary {
  winner: MatchWinner;
  finalHpA: number;
  finalHpB: number;
  totalDamageToA: number;
  totalDamageToB: number;
  totalTurns: number;
  isFinished: boolean;
}

export const MATCH_MODE_CONFIGS: Record<MatchMode, MatchModeConfig> = {
  FIXED_TURN_REMAINING_HP: {
    mode: 'FIXED_TURN_REMAINING_HP',
    maxTurns: GAME_SYSTEM_CONSTANTS.DEFAULT_TOTAL_COMMAND_SLOTS,
    initialHp: GAME_SYSTEM_CONSTANTS.DEFAULT_MAX_HP,
    stopOnZeroHp: true,
  },
  UNTIL_ZERO_HP_WITH_TURN_CAP: {
    mode: 'UNTIL_ZERO_HP_WITH_TURN_CAP',
    maxTurns: 30,
    initialHp: GAME_SYSTEM_CONSTANTS.DEFAULT_MAX_HP,
    stopOnZeroHp: true,
  },
  ENDURANCE_30_TURNS_REMAINING_HP: {
    mode: 'ENDURANCE_30_TURNS_REMAINING_HP',
    maxTurns: 30,
    initialHp: 300,
    stopOnZeroHp: false,
  },
};

export const createRepeatedCommands = (commands: Command[], maxTurns: number): Command[] =>
  Array.from({ length: maxTurns }, (_, index) =>
    commands[index % commands.length] ?? GAME_SYSTEM_CONSTANTS.DEFAULT_SLOT_COMMAND
  );

export const createGameStateForMatch = (
  teamA: ParsedTeam,
  teamB: ParsedTeam,
  modeConfig: MatchModeConfig
): GameState => ({
  playerA: {
    hp: modeConfig.initialHp,
    chargeCount: 0,
    commands: createRepeatedCommands(teamA.commands, modeConfig.maxTurns),
  },
  playerB: {
    hp: modeConfig.initialHp,
    chargeCount: 0,
    commands: createRepeatedCommands(teamB.commands, modeConfig.maxTurns),
  },
  turnIndex: 0,
  replay: { events: [] },
});

export const createConfigForMode = (
  baseConfig: TunableGameConfig,
  modeConfig: MatchModeConfig
): TunableGameConfig => ({
  ...baseConfig,
  MAX_HP: modeConfig.initialHp,
  TOTAL_COMMAND_SLOTS: modeConfig.maxTurns,
});

export const isGameFinished = (
  state: GameState,
  modeConfig: MatchModeConfig
): boolean =>
  state.turnIndex >= modeConfig.maxTurns ||
  (modeConfig.stopOnZeroHp && (state.playerA.hp <= 0 || state.playerB.hp <= 0));

export const getWinner = (state: GameState, isFinished: boolean): MatchWinner => {
  if (!isFinished) return 'UNDECIDED';
  if (state.playerA.hp > state.playerB.hp) return 'A';
  if (state.playerB.hp > state.playerA.hp) return 'B';
  return 'DRAW';
};

export const createMatchSummary = (
  state: GameState,
  modeConfig: MatchModeConfig
): MatchSummary => {
  const isFinished = isGameFinished(state, modeConfig);
  const totalDamageToA = pipe(
    state.replay.events,
    A.reduce(0, (acc, event) => acc + event.damageToA)
  );
  const totalDamageToB = pipe(
    state.replay.events,
    A.reduce(0, (acc, event) => acc + event.damageToB)
  );

  return {
    winner: getWinner(state, isFinished),
    finalHpA: state.playerA.hp,
    finalHpB: state.playerB.hp,
    totalDamageToA,
    totalDamageToB,
    totalTurns: state.replay.events.length,
    isFinished,
  };
};

export const runFullMatch = (
  config: TunableGameConfig,
  modeConfig: MatchModeConfig
) =>
  (initialState: GameState): GameState => {
    const effectiveConfig = createConfigForMode(config, modeConfig);

    const run = (state: GameState): GameState =>
      isGameFinished(state, modeConfig)
        ? state
        : run(runSingleTurn(effectiveConfig)(state).nextState);

    return run(initialState);
  };
