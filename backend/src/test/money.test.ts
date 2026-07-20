import { describe, expect, it } from 'vitest';
import { formatCurrency, moneyDto, parseDhToCentimes } from '../utils/money';

describe('DH boundary conversion', () => {
  it.each([['0',0],['0.01',1],['12.3',1230],['12,34',1234],[99,9900]])('converts %s exactly', (input, expected) => {
    expect(parseDhToCentimes(input)).toBe(expected);
  });
  it.each(['1.001','-1','NaN','1,2.3',''])('rejects ambiguous or invalid DH input %s', input => {
    expect(() => parseDhToCentimes(input)).toThrow();
  });
  it('returns DH DTO values and the DH label', () => {
    expect(moneyDto(1234)).toBe(12.34);
    expect(formatCurrency(1234, true)).toContain('DH');
    expect(formatCurrency(1234, true)).not.toContain('MAD');
  });
});
