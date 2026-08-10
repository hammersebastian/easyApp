import type { Area, AnswerDetail, SessionResult } from './types';

export const calculateExamPassed = (scores: Record<Area['code'], number>): boolean => {
  const values = Object.values(scores);
  const atLeastFifty = values.filter((score) => score >= 50).length;
  return atLeastFifty >= 4 && values.every((score) => score >= 30);
};

export const summarizeAnswers = (
  sessionId: string,
  mode: SessionResult['mode'],
  status: SessionResult['status'],
  startedAt: string,
  completedAt: string | null,
  answers: AnswerDetail[],
): SessionResult => {
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const total = answers.length;
  const areaCodes: Area['code'][] = ['A', 'B', 'C', 'D', 'E'];
  const areaScores = Object.fromEntries(
    areaCodes.map((code) => {
      const areaAnswers = answers.filter((answer) => answer.areaCode === code);
      const percent = areaAnswers.length
        ? Math.round((areaAnswers.filter((answer) => answer.isCorrect).length / areaAnswers.length) * 100)
        : 0;
      return [code, percent];
    }),
  ) as Record<Area['code'], number>;
  const durationSeconds = completedAt
    ? Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 1000))
    : 0;

  return {
    sessionId,
    mode,
    status,
    correct,
    incorrect: total - correct,
    total,
    percentage: total ? Math.round((correct / total) * 100) : 0,
    durationSeconds,
    averageResponseSeconds: total
      ? Math.round(answers.reduce((sum, answer) => sum + answer.responseMs, 0) / total / 100) / 10
      : 0,
    passed: mode === 'exam' && status === 'completed' ? calculateExamPassed(areaScores) : null,
    areaScores,
    answers,
    completedAt,
  };
};
