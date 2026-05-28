import * as E from 'fp-ts/Either';
import { RawCsvRow } from './types';

const stripBom = (text: string): string => text.replace(/^\uFEFF/, '');

const normalizeLineBreaks = (text: string): string => text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let isInQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && isInQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      isInQuotes = !isInQuotes;
    } else if (char === ',' && !isInQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
};

const normalizeHeader = (header: string): string => header.trim().toLowerCase();

const isSupportedTeamHeader = (header: string): boolean =>
  normalizeHeader(header) === 'team' || header === '팀명';

const toRow = (headers: string[]) => (cells: string[]): RawCsvRow =>
  headers.reduce<RawCsvRow>((row, header, index) => ({
    ...row,
    [header]: cells[index] ?? '',
  }), { '팀명': '', team: cells[headers.findIndex(isSupportedTeamHeader)] ?? '' });

export const parseCsvText = (text: string): E.Either<Error, RawCsvRow[]> => {
  const lines = normalizeLineBreaks(stripBom(text))
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return E.left(new Error('CSV 내용이 비어 있습니다.'));
  }

  const [headerLine, ...dataLines] = lines;
  const headers = splitCsvLine(headerLine).map((header) => header.trim());

  if (!headers.some(isSupportedTeamHeader)) {
    return E.left(new Error('CSV 헤더에 "team" 컬럼이 필요합니다.'));
  }

  return E.right(dataLines.map((line) => toRow(headers)(splitCsvLine(line))));
};

export const csvTextToRowsOrThrow = (text: string): RawCsvRow[] => {
  const result = parseCsvText(text);

  if (E.isLeft(result)) {
    throw result.left;
  }

  return result.right;
};
