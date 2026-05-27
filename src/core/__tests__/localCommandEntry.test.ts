import { describe, expect, it } from 'vitest';
import {
  createDefaultCommandDraft,
  createLocalPlayerTeam,
  getNextSecretEntryPhase,
  isCommandDraftComplete,
  maskSubmittedCommands,
  setDraftCommand,
} from '../localCommandEntry';


describe('Local secret command entry helpers', () => {
  it('creates a default seven-slot command draft', () => {
    expect(createDefaultCommandDraft()).toEqual([
      'MID_BLOCK',
      'MID_BLOCK',
      'MID_BLOCK',
      'MID_BLOCK',
      'MID_BLOCK',
      'MID_BLOCK',
      'MID_BLOCK',
    ]);
  });

  it('updates one command slot immutably', () => {
    const draft = createDefaultCommandDraft(3);
    const next = setDraftCommand(draft, 1, 'THROW');

    expect(next).toEqual(['MID_BLOCK', 'THROW', 'MID_BLOCK']);
    expect(draft).toEqual(['MID_BLOCK', 'MID_BLOCK', 'MID_BLOCK']);
  });

  it('validates draft completeness by slot count and command validity', () => {
    expect(isCommandDraftComplete(['MID_ATTACK', 'THROW'], 2)).toBe(true);
    expect(isCommandDraftComplete(['MID_ATTACK'], 2)).toBe(false);
  });

  it('creates local player teams from submitted commands', () => {
    expect(createLocalPlayerTeam('Player A', ['MID_ATTACK'])).toEqual({
      teamName: 'Player A',
      commands: ['MID_ATTACK'],
    });
  });

  it('masks submitted commands after confirmation', () => {
    expect(maskSubmittedCommands(['MID_ATTACK', 'THROW'])).toEqual(['••••', '••••']);
  });

  it('advances secret entry phase from A to B to ready', () => {
    expect(getNextSecretEntryPhase('PLAYER_A_INPUT')).toBe('PLAYER_B_INPUT');
    expect(getNextSecretEntryPhase('PLAYER_B_INPUT')).toBe('READY');
    expect(getNextSecretEntryPhase('READY')).toBe('READY');
  });
});
