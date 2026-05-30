import { GAME_SYSTEM_CONSTANTS } from './constants';
import { Command, ParsedTeam } from './types';

export type SecretEntryPhase = 'PLAYER_A_INPUT' | 'PLAYER_B_INPUT' | 'READY';

export interface CommandOption {
  command: Command;
  label: string;
  shortLabel: string;
  emoji: string;
  hint: string;
}

export const COMMAND_OPTIONS: CommandOption[] = [
  { command: 'MID_ATTACK', label: '중단 공격', shortLabel: '중공', emoji: '👊', hint: '중단을 때립니다' },
  { command: 'LOW_ATTACK', label: '하단 공격', shortLabel: '하공', emoji: '🦶', hint: '하단을 찌릅니다' },
  { command: 'MID_BLOCK', label: '중단 막기', shortLabel: '중막', emoji: '🛡️', hint: '중단 공격을 반격합니다' },
  { command: 'LOW_BLOCK', label: '하단 막기', shortLabel: '하막', emoji: '🧱', hint: '하단 공격을 반격합니다' },
  { command: 'CHARGE', label: '기 모으기', shortLabel: '기', emoji: '⚡', hint: '다음 공격을 강화합니다' },
  { command: 'THROW', label: '던지기', shortLabel: '잡기', emoji: '🤼', hint: '막기와 기 모으기를 깹니다' },
];

const commandSet = new Set<Command>(COMMAND_OPTIONS.map(({ command }) => command));

export const getCommandOption = (command: Command): CommandOption =>
  COMMAND_OPTIONS.find((option) => option.command === command) ?? COMMAND_OPTIONS[0];

export const createDefaultCommandDraft = (
  slotCount: number = GAME_SYSTEM_CONSTANTS.DEFAULT_TOTAL_COMMAND_SLOTS
): Command[] =>
  Array.from({ length: slotCount }, () => GAME_SYSTEM_CONSTANTS.DEFAULT_SLOT_COMMAND);

export const setDraftCommand = (
  draft: Command[],
  index: number,
  command: Command
): Command[] =>
  draft.map((current, currentIndex) => (currentIndex === index ? command : current));

export const isCommandDraftComplete = (draft: Command[], slotCount: number): boolean =>
  draft.length === slotCount && draft.every((command) => commandSet.has(command));

export const createLocalPlayerTeam = (
  teamName: string,
  commands: Command[]
): ParsedTeam => ({
  teamName,
  commands,
});

export const maskSubmittedCommands = (commands: Command[]): string[] =>
  commands.map(() => '••••');

export const getNextSecretEntryPhase = (phase: SecretEntryPhase): SecretEntryPhase => {
  switch (phase) {
    case 'PLAYER_A_INPUT':
      return 'PLAYER_B_INPUT';
    case 'PLAYER_B_INPUT':
      return 'READY';
    case 'READY':
      return 'READY';
  }
};
