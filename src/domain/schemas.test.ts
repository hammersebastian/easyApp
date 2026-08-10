import { describe, expect, it } from 'vitest';
import { adminQuestionSchema } from './schemas';

const base = {
  subjectId: 'subject-pflegeversicherung', prompt: 'Test?', answers: ['A', 'B', 'C', 'D'], correctIndex: 0,
  explanation: 'Test.', status: 'published', version: 1, changeSensitive: false,
  containsTimeSensitiveNumbers: false, lastReviewedAt: '2026-08-10', nextReviewAt: null,
  reviewer: 'Redaktion', source: { title: 'Quelle', url: 'https://example.org', sourceDate: '2026-08-10', notes: null },
} as const;

describe('Fragenvertrag', () => {
  it('akzeptiert eine vollständige Single-Choice-Frage', () => expect(adminQuestionSchema.safeParse(base).success).toBe(true));
  it('lehnt doppelte Antworten ab', () => expect(adminQuestionSchema.safeParse({ ...base, answers: ['A', 'A', 'C', 'D'] }).success).toBe(false));
  it('begrenzt änderungsanfällige Fragen auf A/B und Zahlen', () => {
    expect(adminQuestionSchema.safeParse({ ...base, subjectId: 'subject-vermittlerrecht', changeSensitive: true, containsTimeSensitiveNumbers: true, nextReviewAt: '2027-08-10' }).success).toBe(false);
  });
});
