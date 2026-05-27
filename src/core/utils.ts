import * as A from 'fp-ts/Array';
import * as T from 'fp-ts/Task';
import { pipe } from 'fp-ts/function';

export const clamp = (min: number, max: number) => (value: number): number =>
  Math.max(min, Math.min(max, value));

export const chunkArray = <A>(size: number) => (array: A[]): A[][] =>
  pipe(array, A.chunksOf(size));

export const delayTask = (ms: number): T.Task<void> =>
  () => new Promise((resolve) => setTimeout(resolve, ms));
