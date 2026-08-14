import rawQuestions from './quizfragen_versicherungen.json';
import type { AdminQuestion, AnswerOptions } from '../domain/types';

interface RawQuestion {
  frage: string;
  antworten: string[];
  richtige_antwort: number;
  sparte: string;
  erklärung: string;
  änderungsanfällig: boolean;
  quelle: { titel: string; url?: string; stand?: string };
  zuletzt_geprüft_am?: string | null;
  nächste_prüfung_am?: string | null;
  version?: number;
  prüfverantwortlich?: string | null;
}

const subjectIds: Record<string, string> = {
  'Betriebliche Altersversorgung': 'subject-betriebliche-altersversorgung-bav',
  'Gesetzliche Rentenversicherung': 'subject-gesetzliche-rentenversicherung',
  'Kranken- und Pflegeversicherung': 'subject-private-krankenversicherung',
  Lebensversicherung: 'subject-lebensversicherung',
  Rechtsgrundlagen: 'subject-rechtliche-rahmenbedingungen-fur-die-beratung',
  Unfallversicherung: 'subject-unfallversicherung',
  Hausratversicherung: 'subject-hausratversicherung',
  Wohngebäudeversicherung: 'subject-wohngebaudeversicherung',
  'Private Haftpflichtversicherung': 'subject-haftpflichtversicherung',
  'Kfz-Versicherung': 'subject-kraftfahrtversicherung',
  Rechtsschutzversicherung: 'subject-rechtsschutzversicherung',
};

const asAnswerOptions = (answers: string[]): AnswerOptions => {
  if (answers.length !== 4 && answers.length !== 5) {
    throw new Error(`Fragen benötigen vier oder fünf Antworten, erhalten: ${answers.length}`);
  }
  return answers as AnswerOptions;
};

export const catalogQuestions: AdminQuestion[] = (rawQuestions as RawQuestion[]).map((question, index) => {
  const subjectId = subjectIds[question.sparte];
  if (!subjectId) throw new Error(`Unbekannte Sparte im Fragenkatalog: ${question.sparte}`);
  const reviewedAt = question.zuletzt_geprüft_am ?? question.quelle.stand ?? null;

  return {
    id: `catalog-${String(index + 1).padStart(3, '0')}`,
    subjectId,
    prompt: question.frage,
    answers: asAnswerOptions(question.antworten),
    correctIndex: question.richtige_antwort,
    explanation: question.erklärung,
    status: 'published',
    version: question.version ?? 1,
    changeSensitive: question.änderungsanfällig,
    containsTimeSensitiveNumbers: false,
    lastReviewedAt: reviewedAt,
    nextReviewAt: question.nächste_prüfung_am ?? null,
    reviewer: question.prüfverantwortlich ?? null,
    source: {
      title: question.quelle.titel,
      url: question.quelle.url?.startsWith('https://') ? question.quelle.url : null,
      sourceDate: question.quelle.stand ?? null,
      notes: null,
    },
    updatedAt: reviewedAt ? `${reviewedAt}T00:00:00.000Z` : '2026-08-14T00:00:00.000Z',
    testData: false,
  };
});
