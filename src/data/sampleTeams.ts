import { ParsedTeam } from '../core/types';

export const sampleTeams: ParsedTeam[] = [
  {
    teamName: 'Alpha Chargers',
    commands: ['CHARGE', 'MID_ATTACK', 'THROW', 'LOW_BLOCK', 'LOW_ATTACK', 'CHARGE', 'MID_ATTACK'],
  },
  {
    teamName: 'Beta Guards',
    commands: ['LOW_BLOCK', 'LOW_BLOCK', 'MID_BLOCK', 'LOW_ATTACK', 'CHARGE', 'THROW', 'MID_BLOCK'],
  },
  {
    teamName: 'Gamma Rush',
    commands: ['MID_ATTACK', 'LOW_ATTACK', 'MID_ATTACK', 'THROW', 'LOW_ATTACK', 'MID_BLOCK', 'MID_ATTACK'],
  },
  {
    teamName: 'Delta Mindgame',
    commands: ['CHARGE', 'CHARGE', 'LOW_BLOCK', 'THROW', 'MID_ATTACK', 'LOW_ATTACK', 'MID_BLOCK'],
  },
];
