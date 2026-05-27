export type Command = 'MID_ATTACK' | 'LOW_ATTACK' | 'MID_BLOCK' | 'LOW_BLOCK' | 'CHARGE' | 'THROW';

export type BattleOutcome = 'HIT' | 'BLOCKED' | 'COUNTER' | 'THROW_BREAK' | 'THROW_CAUGHT' | 'WHIFF' | 'CHARGE' | 'NONE';

export interface PlayerState {
  hp: number;
  chargeCount: number;
  commands: Command[];
}

export interface TurnEvent {
  turnIndex: number;
  commandA: Command;
  commandB: Command;
  outcomeA: BattleOutcome;
  outcomeB: BattleOutcome;
  damageToA: number;
  damageToB: number;
  hpAAfter: number;
  hpBAfter: number;
  chargeAAfter: number;
  chargeBAfter: number;
}

export interface GameReplay {
  events: TurnEvent[];
}

export interface GameState {
  playerA: PlayerState;
  playerB: PlayerState;
  turnIndex: number;
  replay: GameReplay;
}

export interface GameSimulationResult {
  nextState: GameState;
  event: TurnEvent | null;
}

export interface TunableGameConfig {
  MAX_HP: number;
  TOTAL_COMMAND_SLOTS: number;
  BASE_ATTACK_DAMAGE: number;
  COUNTER_DAMAGE: number;
  THROW_DAMAGE: number;
  MAX_CHARGE_STACK: number;
  CHARGE_BONUS_CURVE: number[];
}

export interface RawCsvRow {
  '팀명': string;
  [key: string]: string;
}

export interface ParsedTeam {
  teamName: string;
  commands: Command[];
}

export type TeamId = string;

export interface NormalizedTeams {
  teamIds: TeamId[];
  teamsById: Record<TeamId, ParsedTeam>;
}
