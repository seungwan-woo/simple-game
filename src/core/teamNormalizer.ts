import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import { NormalizedTeams, ParsedTeam, TeamId } from './types';

const sanitizeTeamName = (teamName: string): string =>
  teamName.trim().replace(/\s+/g, '-').toLowerCase();

export const createTeamId = (team: ParsedTeam, index: number): TeamId =>
  `${sanitizeTeamName(team.teamName)}-${index}`;

export const normalizeTeams = (teams: ParsedTeam[], startIndex = 0): NormalizedTeams =>
  pipe(
    teams,
    A.reduceWithIndex({ teamIds: [], teamsById: {} } as NormalizedTeams, (index, acc, team) => {
      const id = createTeamId(team, startIndex + index);
      return { teamIds: [...acc.teamIds, id], teamsById: { ...acc.teamsById, [id]: team } };
    })
  );

export const mergeNormalizedTeams = (current: NormalizedTeams, next: NormalizedTeams): NormalizedTeams => ({
  teamIds: [...current.teamIds, ...next.teamIds],
  teamsById: { ...current.teamsById, ...next.teamsById },
});

export const selectTeams = (normalized: NormalizedTeams): ParsedTeam[] =>
  pipe(normalized.teamIds, A.map((id) => normalized.teamsById[id]));
