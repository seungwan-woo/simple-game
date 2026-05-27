import { GAME_SYSTEM_CONSTANTS } from './constants';
import { Command, ParsedTeam } from './types';

export type SecretEntryPhase = 'PLAYER_A_INPUT' | 'PLAYER_B_INPUT' | 'READY';

export const COMMAND_OPTIONS: { command: Command; label: string }[] = [
  { command: 'MID_ATTACK', label: '중단 공격' },
  { command: 'LOW_ATTACK', label: '하단 공격' },
  { command: 'MID_BLOCK', label: '중단 막기' },
  { command: 'LOW_BLOCK', label: '하단 막기' },
  { command: 'CHARGE', label: '기 모으기' },
  { command: 'THROW', label: '던지기' },
];

const commandSet = new Set<Command>(COMMAND_OPTIONS.map(({ command }) => command));

export const createDefaultCommandDraft = (
  slotCount = GAME_SYSTEM_CONSTANTS.DEFAULT_TOTAL_COMMAND_SLOTS
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
