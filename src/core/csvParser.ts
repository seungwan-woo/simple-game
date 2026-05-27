import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import { Command, ParsedTeam, RawCsvRow } from './types';
import { GAME_SYSTEM_CONSTANTS } from './constants';
import { chunkArray, delayTask } from './utils';

const COMMAND_MAP: Record<string, Command> = {
  '중단 공격': 'MID_ATTACK',
  '하단 공격': 'LOW_ATTACK',
  '중단 막기': 'MID_BLOCK',
  '하단 막기': 'LOW_BLOCK',
  '기 모으기': 'CHARGE',
  '던지기': 'THROW',
};

export const parseRowToTeam = (row: RawCsvRow): ParsedTeam => ({
  teamName: row['팀명'] || 'Unknown Team',
  commands: pipe(
    [
      row['1번째 커맨드'],
      row['2번째 커맨드'],
      row['3번째 커맨드'],
      row['4번째 커맨드'],
      row['5번째 커맨드'],
      row['6번째 커맨드'],
      row['7번째 커맨드'],
    ],
    A.map((cmdStr) => COMMAND_MAP[cmdStr] ?? GAME_SYSTEM_CONSTANTS.DEFAULT_SLOT_COMMAND)
  ),
});

const processBatchesSequentially = (
  batches: RawCsvRow[][],
  onChunkLoaded: (teams: ParsedTeam[]) => void
) =>
  (index: number): T.Task<void> =>
    index >= batches.length
      ? T.of(undefined)
      : pipe(
          batches[index],
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

export const parseCsvProgressively = (
  rawRows: RawCsvRow[],
  onChunkLoaded: (teams: ParsedTeam[]) => void
): TE.TaskEither<Error, void> =>
  pipe(
    rawRows,
    chunkArray(GAME_SYSTEM_CONSTANTS.ASYNC_CHUNK_SIZE),
    (batches) => TE.fromTask(processBatchesSequentially(batches, onChunkLoaded)(0))
  );
