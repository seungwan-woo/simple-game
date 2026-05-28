import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/Either';
import { parseCsvText } from '../csvTextParser';

const validCsv = `팀명,1번째 커맨드,2번째 커맨드,3번째 커맨드,4번째 커맨드,5번째 커맨드,6번째 커맨드,7번째 커맨드
Alpha,기 모으기,중단 공격,던지기,하단 막기,하단 공격,기 모으기,중단 공격
Beta,하단 막기,하단 막기,중단 막기,하단 공격,기 모으기,던지기,중단 막기`;

describe('csvTextParser', () => {
  it('parses header-based csv rows', () => {
    const result = parseCsvText(validCsv);

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toHaveLength(2);
      expect(result.right[0]['팀명']).toBe('Alpha');
      expect(result.right[0]['1번째 커맨드']).toBe('기 모으기');
      expect(result.right[1]['7번째 커맨드']).toBe('중단 막기');
    }
  });

  it('removes UTF-8 BOM before parsing headers', () => {
    const result = parseCsvText(`\uFEFF${validCsv}`);

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right[0]['팀명']).toBe('Alpha');
    }
  });

  it('ignores blank lines', () => {
    const result = parseCsvText(`\n${validCsv}\n\n`);

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toHaveLength(2);
    }
  });

  it('supports quoted comma cells', () => {
    const result = parseCsvText('팀명,1번째 커맨드\n"Alpha, One",기 모으기');

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right[0]['팀명']).toBe('Alpha, One');
      expect(result.right[0]['1번째 커맨드']).toBe('기 모으기');
    }
  });

  it('safely fills missing columns with empty strings', () => {
    const result = parseCsvText('팀명,1번째 커맨드,2번째 커맨드\nAlpha,기 모으기');

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right[0]['2번째 커맨드']).toBe('');
    }
  });

  it('fails when team name header is missing', () => {
    const result = parseCsvText('name,1번째 커맨드\nAlpha,기 모으기');

    expect(E.isLeft(result)).toBe(true);
  });
});
