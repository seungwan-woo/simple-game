import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import { Command, ParsedTeam, RawCsvRow } from './types';
import { GAME_SYSTEM_CONSTANTS } from './constants';
import { chunkArray, delayTask } from './utils';

const normalizeCommandKey = (value: string | undefined): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const COMMAND_MAP: Record<string, Command> = {
  mid_attack: 'MID_ATTACK',
  low_attack: 'LOW_ATTACK',
  mid_block: 'MID_BLOCK',
  low_block: 'LOW_BLOCK',
  charge: 'CHARGE',
  throw: 'THROW',
  중단_공격: 'MID_ATTACK',
  하단_공격: 'LOW_ATTACK',
  중단_막기: 'MID_BLOCK',
  하단_막기: 'LOW_BLOCK',
  기_모으기: 'CHARGE',
  던지기: 'THROW',
};

const parseCommand = (value: string | undefined): Command =>
  COMMAND_MAP[normalizeCommandKey(value)] ?? GAME_SYSTEM_CONSTANTS.DEFAULT_SLOT_COMMAND;

const readTeamName = (row: RawCsvRow): string =>
  row.team || row.Team || row.TEAM || row['팀명'] || 'Unknown Team';

const readCommandSlot = (row: RawCsvRow, slot: number): string | undefined =>
  row[`cmd${slot}`] ??
  row[`CMD${slot}`] ??
  row[`Cmd${slot}`] ??
  row[`${slot}번째 커맨드`];

export const parseRowToTeam = (row: RawCsvRow): ParsedTeam => ({
  teamName: readTeamName(row),
  commands: pipe(
    [1, 2, 3, 4, 5, 6, 7],
    A.map((slot) => parseCommand(readCommandSlot(row, slot)))
  ),
});

const processBatchesSequentially = (
  batches: RawCsvRow[][],
  onChunkLoaded: (teams: ParsedTeam[]) => void
) =>
  (index: number): T.Task<void> => {
    const batch = batches[index];

    return batch === undefined
      ? T.of(undefined)
      : pipe(
          batch,
          A.map(parseRowToTeam),
          (parsedBatch) => () => {
            onChunkLoaded(parsedBatch);
            return Promise.resolve();
          },
          T.chain(() =>
            index === batches.length - 1 ? T.of(undefined) : delayTask(GAME_SYSTEM_CONSTANTS.RENDER_YIELD_DELAY_MS)
          ),
          T.chain(() => processBatchesSequentially(batches, onChunkLoaded)(index + 1))
        );
  };

export const parseCsvProgressively = (
  rawRows: RawCsvRow[],
  onChunkLoaded: (teams: ParsedTeam[]) => void
): TE.TaskEither<Error, void> =>
  pipe(
    rawRows,
    chunkArray(GAME_SYSTEM_CONSTANTS.ASYNC_CHUNK_SIZE),
    (batches) => TE.fromTask(processBatchesSequentially(batches, onChunkLoaded)(0))
  );
