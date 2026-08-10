export const shuffleWith = <T>(values: readonly T[], random: () => number = Math.random): T[] => {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
  }
  return copy;
};

export const selectRandomUnique = <T>(values: readonly T[], count: number, random: () => number = Math.random): T[] => {
  if (count < 0 || count > values.length) throw new Error('Nicht genügend eindeutige Elemente.');
  return shuffleWith(values, random).slice(0, count);
};
