// The wording for repeated answer names (fresh look 7.2). The rules are in chartOps.
import { answerPlace, repeatedAnswers } from './chartOps.ts';
import { capitalise, numberWord, ordinalWord } from './words.ts';

/** Under a question's answers (List and the cards' answers card): one sentence
 *  for each name used more than once, e.g. Two answers are both called “Yes”. */
export function repeatedNameNotes(labels: string[]): string[] {
  return repeatedAnswers(labels).map(({ name, count }) =>
    `${capitalise(numberWord(count))} answers are ${count === 2 ? 'both' : 'all'} called “${name}”.`);
}

/** On a card that asks about one answer, where the name alone doesn't say
 *  which it is, e.g. (Two answers are called Yes. This is the first of them.) */
export function cardRepeatNote(labels: string[], index: number): string | null {
  const place = answerPlace(labels, index);
  if (!place) return null;
  return `(${capitalise(numberWord(place.count))} answers are called ${labels[index].trim()}. This is the ${ordinalWord(place.nth)} of them.)`;
}
