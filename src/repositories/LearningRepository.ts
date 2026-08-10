import type {
  AdminQuestion,
  AnswerResolution,
  Area,
  ImportPreview,
  LearnerQuestion,
  ProgressSummary,
  QuestionFilters,
  QuizMode,
  QuizSession,
  SessionResult,
  UserProfile,
} from '../domain/types';

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

export interface SaveQuestionInput extends Omit<AdminQuestion, 'id' | 'updatedAt' | 'testData'> {
  id?: string;
  changeReason?: string;
}

export interface LearningRepository {
  getCurrentUser(): Promise<UserProfile | null>;
  onAuthChange(listener: (user: UserProfile | null) => void): () => void;
  signUp(input: SignUpInput): Promise<{ needsVerification: boolean }>;
  signIn(email: string, password: string): Promise<UserProfile>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  updateDisplayName(displayName: string): Promise<UserProfile>;
  deleteAccount(): Promise<void>;

  getTaxonomy(): Promise<Area[]>;
  countAvailableQuestions(subjectIds: string[]): Promise<number>;
  getActiveSession(): Promise<QuizSession | null>;
  startSession(mode: QuizMode, subjectIds?: string[]): Promise<QuizSession>;
  getCurrentQuestion(sessionId: string): Promise<LearnerQuestion | null>;
  submitAnswer(sessionId: string, questionId: string, selectedIndex: number | null, idempotencyKey: string): Promise<AnswerResolution>;
  advanceSession(sessionId: string): Promise<QuizSession>;
  abandonSession(sessionId: string): Promise<void>;
  getSessionResult(sessionId: string): Promise<SessionResult>;
  getProgress(): Promise<ProgressSummary>;

  listQuestions(filters?: QuestionFilters): Promise<AdminQuestion[]>;
  getQuestion(id: string): Promise<AdminQuestion>;
  saveQuestion(question: SaveQuestionInput): Promise<AdminQuestion>;
  archiveQuestion(id: string, reason: string): Promise<void>;
  previewImport(rawJson: string): Promise<ImportPreview>;
  commitImport(preview: ImportPreview): Promise<number>;
  exportQuestions(filters?: QuestionFilters): Promise<string>;
  confirmReview(id: string, reviewer: string, notes: string): Promise<AdminQuestion>;
}
