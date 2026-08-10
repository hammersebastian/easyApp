import { taxonomy } from '../domain/taxonomy';
import type { AdminQuestion } from '../domain/types';

const now = '2026-08-10T00:00:00.000Z';

/**
 * Deliberately non-authoritative test fixtures. They exist only to exercise all UI flows.
 * They must never be imported into staging or production as reviewed content.
 */
export const demoQuestions: AdminQuestion[] = taxonomy.flatMap((area) =>
  Array.from({ length: 10 }, (_, index) => {
    const subject = area.subjects[index % area.subjects.length]!;
    return {
      id: `demo-${area.code.toLowerCase()}-${index + 1}`,
      subjectId: subject.id,
      prompt: `[TESTDATEN – NICHT FACHLICH GEPRÜFT] Welche Testantwort ist für Beispielszenario ${area.code}${index + 1} vorgesehen?`,
      answers: [
        'Testantwort A',
        'Testantwort B',
        'Testantwort C',
        'Testantwort D',
      ],
      correctIndex: index % 4,
      explanation: `Dies ist eine technische Testfrage für Bereich ${area.code}, Sparte „${subject.name}“. Sie enthält keine fachliche Aussage.`,
      status: 'published',
      version: 1,
      changeSensitive: false,
      containsTimeSensitiveNumbers: false,
      lastReviewedAt: null,
      nextReviewAt: null,
      reviewer: null,
      source: null,
      updatedAt: now,
      testData: true,
    } satisfies AdminQuestion;
  }),
);
