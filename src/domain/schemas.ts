import { z } from 'zod';
import { findAreaForSubject } from './taxonomy';

export const authSchema = z.object({
  email: z.string().email('Bitte eine gültige E-Mail-Adresse eingeben.'),
  password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein.'),
});

export const registrationSchema = authSchema.extend({
  displayName: z.string().trim().min(2, 'Bitte mindestens 2 Zeichen eingeben.').max(80),
});

const answerSchema = z.string().trim().min(1, 'Antwort darf nicht leer sein.').max(500);

export const adminQuestionSchema = z
  .object({
    subjectId: z.string().min(1, 'Bitte eine Sparte wählen.'),
    prompt: z.string().trim().min(1, 'Frage darf nicht leer sein.').max(2000),
    answers: z.tuple([answerSchema, answerSchema, answerSchema, answerSchema]),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().trim().min(1, 'Erklärung darf nicht leer sein.').max(4000),
    status: z.enum(['draft', 'published', 'archived']),
    version: z.number().int().positive(),
    changeSensitive: z.boolean(),
    containsTimeSensitiveNumbers: z.boolean(),
    lastReviewedAt: z.string().nullable(),
    nextReviewAt: z.string().nullable(),
    reviewer: z.string().trim().nullable(),
    source: z
      .object({
        title: z.string().trim().min(1),
        url: z
          .union([
            z
              .string()
              .url('Bitte eine gültige URL eingeben.')
              .refine((value) => value.startsWith('https://'), 'Quellen-URLs müssen HTTPS verwenden.'),
            z.literal(''),
          ])
          .nullable(),
        sourceDate: z.string().nullable(),
        notes: z.string().nullable(),
      })
      .nullable(),
  })
  .superRefine((question, ctx) => {
    if (new Set(question.answers.map((answer) => answer.toLocaleLowerCase('de-DE'))).size !== 4) {
      ctx.addIssue({ code: 'custom', path: ['answers'], message: 'Alle Antworten müssen verschieden sein.' });
    }
    if (question.status === 'published') {
      if (!question.source) ctx.addIssue({ code: 'custom', path: ['source'], message: 'Eine Quelle ist zur Veröffentlichung erforderlich.' });
      if (!question.lastReviewedAt) ctx.addIssue({ code: 'custom', path: ['lastReviewedAt'], message: 'Ein Prüfdatum ist erforderlich.' });
      if (!question.reviewer) ctx.addIssue({ code: 'custom', path: ['reviewer'], message: 'Ein Prüfverantwortlicher ist erforderlich.' });
    }
    if (question.changeSensitive) {
      const area = findAreaForSubject(question.subjectId);
      if (!area || !['A', 'B'].includes(area.code)) ctx.addIssue({ code: 'custom', path: ['changeSensitive'], message: 'Nur in Bereich A oder B zulässig.' });
      if (!question.containsTimeSensitiveNumbers) ctx.addIssue({ code: 'custom', path: ['containsTimeSensitiveNumbers'], message: 'Zeitabhängige genaue Zahlen müssen bestätigt werden.' });
      if (!question.nextReviewAt) ctx.addIssue({ code: 'custom', path: ['nextReviewAt'], message: 'Ein nächstes Prüfdatum ist erforderlich.' });
      if (!question.source) ctx.addIssue({ code: 'custom', path: ['source'], message: 'Eine belastbare Quelle ist erforderlich.' });
    }
  });

export const importQuestionSchema = z.object({
  frage: z.string().trim().min(1).max(2000),
  antworten: z.tuple([answerSchema, answerSchema, answerSchema, answerSchema]),
  richtige_antwort: z.number().int().min(0).max(3),
  sparte: z.string().trim().min(1),
  erklärung: z.string().trim().min(1).max(4000),
  änderungsanfällig: z.boolean(),
  contains_time_sensitive_numbers: z.boolean().optional().default(false),
  quelle: z
    .object({ titel: z.string(), url: z.string().optional(), stand: z.string().optional() })
    .optional(),
  zuletzt_geprüft_am: z.string().nullable().optional(),
  nächste_prüfung_am: z.string().nullable().optional(),
  version: z.number().int().positive().optional().default(1),
  prüfverantwortlich: z.string().nullable().optional(),
});
