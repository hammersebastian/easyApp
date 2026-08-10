import { describe, expect, it } from 'vitest';
import { getTimerState } from './timer';

describe('Timerzustand', () => {
  it('beginnt vollständig und normal', () => expect(getTimerState(45_000, 0)).toMatchObject({ seconds: 45, percent: 100, urgency: 'normal' }));
  it('wechselt zusätzlich zur Farbe in einen Warnzustand', () => expect(getTimerState(45_000, 31_000)).toMatchObject({ seconds: 14, urgency: 'warning' }));
  it('läuft im Hintergrund anhand verstrichener Zeit weiter', () => expect(getTimerState(45_000, 46_000)).toMatchObject({ seconds: 0, expired: true }));
});
