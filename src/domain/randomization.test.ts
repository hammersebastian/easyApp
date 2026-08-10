import { describe, expect, it } from 'vitest';
import { selectRandomUnique, shuffleWith } from './randomization';

describe('deterministische Zufallsauswahl', () => {
  it('wählt die gewünschte Zahl ohne Duplikate', () => {
    const selected = selectRandomUnique([1, 2, 3, 4, 5], 4, () => 0.25);
    expect(selected).toHaveLength(4);
    expect(new Set(selected)).toHaveSize(4);
  });

  it('liefert bei kontrolliertem Zufall reproduzierbare Reihenfolge', () => {
    expect(shuffleWith(['a', 'b', 'c'], () => 0)).toEqual(['b', 'c', 'a']);
  });

  it('lehnt eine zu große Auswahl ab', () => {
    expect(() => selectRandomUnique([1], 2)).toThrow('Nicht genügend');
  });
});
