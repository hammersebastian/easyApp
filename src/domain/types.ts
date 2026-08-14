export type Role = 'learner' | 'admin';
export type QuizMode = 'training' | 'mistakes' | 'exam';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type QuestionStatus = 'draft' | 'published' | 'archived';
export type AnswerOptions =
  | [string, string, string, string]
  | [string, string, string, string, string];

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface Area {
  id: string;
  code: 'A' | 'B' | 'C' | 'D' | 'E';
  name: string;
  sortOrder: number;
  subjects: Subject[];
}

export interface Subject {
  id: string;
  areaId: string;
  name: string;
  slug: string;
  sortOrder: number;
  publishedCount: number;
}

export interface LearnerQuestion {
  id: string;
  version: number;
  areaCode: Area['code'];
  areaName: string;
  subjectId: string;
  subjectName: string;
  prompt: string;
  answers: Readonly<AnswerOptions>;
  position: number;
  total: number;
  deadlineAt: string;
  serverNow: string;
}

export interface AnswerResolution {
  attemptId: string;
  isCorrect: boolean | null;
  timedOut: boolean;
  selectedIndex: number | null;
  correctIndex: number | null;
  explanation: string | null;
  answerAt: string;
}

export interface QuizSession {
  id: string;
  mode: QuizMode;
  status: SessionStatus;
  position: number;
  total: number;
  startedAt: string;
}

export interface AnswerDetail {
  questionId: string;
  prompt: string;
  answers: Readonly<AnswerOptions>;
  selectedIndex: number | null;
  correctIndex: number;
  explanation: string;
  isCorrect: boolean;
  timedOut: boolean;
  responseMs: number;
  areaCode: Area['code'];
  subjectName: string;
}

export interface SessionResult {
  sessionId: string;
  mode: QuizMode;
  status: SessionStatus;
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
  durationSeconds: number;
  averageResponseSeconds: number;
  passed: boolean | null;
  areaScores: Record<Area['code'], number>;
  answers: AnswerDetail[];
  completedAt: string | null;
}

export interface ProgressBreakdown {
  id: string;
  label: string;
  accuracy: number | null;
  learningLevel: number | null;
  attempted: number;
  total: number;
}

export interface ProgressSummary {
  accuracy: number | null;
  learningLevel: number | null;
  attemptedQuestions: number;
  publishedQuestions: number;
  coverage: number | null;
  mistakeCount: number;
  totalAttempts: number;
  areas: ProgressBreakdown[];
  subjects: ProgressBreakdown[];
  recentSessions: SessionResult[];
}

export interface QuestionSource {
  title: string;
  url: string | null;
  sourceDate: string | null;
  notes: string | null;
}

export interface AdminQuestion {
  id: string;
  subjectId: string;
  prompt: string;
  answers: AnswerOptions;
  correctIndex: number;
  explanation: string;
  status: QuestionStatus;
  version: number;
  changeSensitive: boolean;
  containsTimeSensitiveNumbers: boolean;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  reviewer: string | null;
  source: QuestionSource | null;
  updatedAt: string;
  testData: boolean;
}

export interface QuestionFilters {
  search?: string;
  areaCode?: Area['code'];
  subjectId?: string;
  status?: QuestionStatus;
  review?: 'due' | 'overdue' | 'all';
  changeSensitive?: boolean;
}

export interface ImportPreviewItem {
  index: number;
  original: unknown;
  normalized: Partial<AdminQuestion>;
  changes: string[];
  warnings: string[];
  errors: { field: string; message: string }[];
}

export interface ImportPreview {
  items: ImportPreviewItem[];
  valid: boolean;
}
