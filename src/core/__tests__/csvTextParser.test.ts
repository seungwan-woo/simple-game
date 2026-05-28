import { describe, expect, it } from 'vitest';
import * as E from 'fp-ts/Either';
import { parseCsvText } from '../csvTextParser';

const validCsv = `team,cmd1,cmd2,cmd3,cmd4,cmd5,cmd6,cmd7
alpha,charge,mid_attack,throw,low_block,low_attack,charge,mid_attack
beta,low_block,low_block,mid_block,low_attack,charge,throw,mid_block`;

describe('csvTextParser', () => {
  it('parses short english header-based csv rows', () => {
    const result = parseCsvText(validCsv);

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toHaveLength(2);
      expect(result.right[0].team).toBe('alpha');
      expect(result.right[0].cmd1).toBe('charge');
      expect(result.right[1].cmd7).toBe('mid_block');
    }
  });

  it('removes UTF-8 BOM before parsing headers', () => {
    const result = parseCsvText(`\uFEFF${validCsv}`);

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right[0].team).toBe('alpha');
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
    const result = parseCsvText('team,cmd1\n"alpha, one",charge');

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right[0].team).toBe('alpha, one');
      expect(result.right[0].cmd1).toBe('charge');
    }
  });

  it('safely fills missing columns with empty strings', () => {
    const result = parseCsvText('team,cmd1,cmd2\nalpha,charge');

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right[0].cmd2).toBe('');
    }
  });

  it('fails when team header is missing', () => {
    const result = parseCsvText('name,cmd1\nalpha,charge');

    expect(E.isLeft(result)).toBe(true);
  });
});
