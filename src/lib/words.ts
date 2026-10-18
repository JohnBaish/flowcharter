// Numbers in running text: one to nine as words, 10 and above as digits (John's rule).

const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];

/** 2 → "two", 12 → "12". */
export const numberWord = (n: number): string => (Number.isInteger(n) && n >= 0 && n <= 9 ? NUMBERS[n] : String(n));

/** 1 → "first", 12 → "12th". */
export function ordinalWord(n: number): string {
  if (Number.isInteger(n) && n >= 0 && n <= 9) return ORDINALS[n];
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** First letter capitalised, for the start of a sentence. */
export const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
