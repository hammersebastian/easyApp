import { describe, expect, it } from 'vitest';
import { normalizeText, previewQuestionImport } from './importNormalizer';

const validQuestion = {
  frage: 'Welche Testantwort gilt?',
  antworten: ['A', 'B', 'C', 'D'],
  richtige_antwort: 0,
  sparte: 'Pflegeversicherung',
  erklärung: 'Nur technische Testdaten.',
  änderungsanfällig: false,
};

describe('Importnormalisierung', () => {
  it('repariert bekannte Mojibake-Muster und meldet die Änderung', () => {
    expect(normalizeText('begÃ¼nstigten')).toEqual({ value: 'begünstigten', changed: true });
  });

  it('akzeptiert Einzelobjekte und ordnet kanonische Sparten zu', () => {
    const preview = previewQuestionImport(JSON.stringify(validQuestion));
    expect(preview.valid).toBe(true);
    expect(preview.items[0]?.normalized.subjectId).toBe('subject-pflegeversicherung');
  });

  it('akzeptiert fünf Antwortmöglichkeiten', () => {
    const preview = previewQuestionImport(JSON.stringify({ ...validQuestion, antworten: ['A', 'B', 'C', 'D', 'E'], richtige_antwort: 4 }));
    expect(preview.valid).toBe(true);
  });

  it('lehnt den gesamten Batch bei einem fehlerhaften Datensatz ab', () => {
    const preview = previewQuestionImport(JSON.stringify([validQuestion, { ...validQuestion, antworten: ['A', 'B'] }]));
    expect(preview.valid).toBe(false);
    expect(preview.items[1]?.errors.length).toBeGreaterThan(0);
  });

  it('verändert korrekt kodierten fachlichen Wortlaut nicht', () => {
    expect(normalizeText('Der Satz bleibt so.')).toEqual({ value: 'Der Satz bleibt so.', changed: false });
  });
});
