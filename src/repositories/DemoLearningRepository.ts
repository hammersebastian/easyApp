import { appConfig } from '../config/appConfig';
import { catalogQuestions } from '../data/catalogQuestions';
import { previewQuestionImport } from '../domain/importNormalizer';
import { adminQuestionSchema } from '../domain/schemas';
import { summarizeAnswers } from '../domain/scoring';
import { shuffleWith } from '../domain/randomization';
import { findAreaForSubject, findSubject, taxonomy } from '../domain/taxonomy';
import type {
  AdminQuestion,
  AnswerDetail,
  AnswerResolution,
  Area,
  ImportPreview,
  ProgressBreakdown,
  ProgressSummary,
  QuestionFilters,
  QuizMode,
  QuizSession,
  SessionResult,
  UserProfile,
} from '../domain/types';
import type { LearningRepository, SaveQuestionInput, SignUpInput } from './LearningRepository';

interface StoredAttempt extends AnswerResolution {
  questionId: string;
  idempotencyKey: string;
  responseMs: number;
}

interface StoredSession extends QuizSession {
  questionIds: string[];
  deadlineAt: string;
  attempts: StoredAttempt[];
  completedAt: string | null;
  abandonedAt: string | null;
}

interface QuestionStat {
  attempts: number;
  correct: number;
  incorrect: number;
  lastWasCorrect: boolean;
  lastAttemptAt: string;
}

interface DemoState {
  user: UserProfile | null;
  questions: AdminQuestion[];
  sessions: StoredSession[];
  stats: Record<string, QuestionStat>;
}

const STORAGE_KEY = '34d-demo-state-v3';
const LEGACY_STORAGE_KEY = '34d-demo-state-v2';

const initialState = (): DemoState => ({
  user: null,
  questions: structuredClone(catalogQuestions),
  sessions: [],
  stats: {},
});

const loadState = (): DemoState => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) return JSON.parse(value) as DemoState;
    const legacyValue = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyValue) return initialState();
    const legacy = JSON.parse(legacyValue) as DemoState;
    return { ...initialState(), user: legacy.user };
  } catch {
    return initialState();
  }
};

const addSeconds = (date: Date, seconds: number) => new Date(date.getTime() + seconds * 1000).toISOString();

export class DemoLearningRepository implements LearningRepository {
  private state = loadState();
  private listeners = new Set<(user: UserProfile | null) => void>();

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  private requireUser() {
    if (!this.state.user) throw new Error('Bitte erneut anmelden.');
    return this.state.user;
  }

  private requireAdmin() {
    const user = this.requireUser();
    if (user.role !== 'admin') throw new Error('Keine Adminberechtigung.');
    return user;
  }

  async getCurrentUser() {
    return this.state.user;
  }

  onAuthChange(listener: (user: UserProfile | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitAuth() {
    this.listeners.forEach((listener) => listener(this.state.user));
  }

  async signUp(input: SignUpInput) {
    const user: UserProfile = {
      id: crypto.randomUUID(),
      email: input.email,
      displayName: input.displayName,
      role: input.email.toLocaleLowerCase('de-DE').startsWith('admin+') ? 'admin' : 'learner',
    };
    this.state.user = user;
    this.persist();
    this.emitAuth();
    return { needsVerification: false };
  }

  async signIn(email: string, _password: string) {
    const existing = this.state.user;
    const user: UserProfile = existing?.email === email
      ? existing
      : {
          id: crypto.randomUUID(),
          email,
          displayName: email.split('@')[0] || 'Lernende Person',
          role: email.toLocaleLowerCase('de-DE').startsWith('admin+') ? 'admin' : 'learner',
        };
    this.state.user = user;
    this.persist();
    this.emitAuth();
    return user;
  }

  async requestPasswordReset(_email: string) {
    return Promise.resolve();
  }

  async updatePassword(_password: string) {
    return Promise.resolve();
  }

  async signOut() {
    this.state.user = null;
    this.persist();
    this.emitAuth();
  }

  async updateDisplayName(displayName: string) {
    const user = this.requireUser();
    const updated: UserProfile = { ...user, displayName: displayName.trim() };
    this.state.user = updated;
    this.persist();
    this.emitAuth();
    return updated;
  }

  async deleteAccount() {
    this.state = initialState();
    this.persist();
    this.emitAuth();
  }

  async getTaxonomy(): Promise<Area[]> {
    return taxonomy.map((area) => ({
      ...area,
      subjects: area.subjects.map((subject) => ({
        ...subject,
        publishedCount: this.state.questions.filter(
          (question) => question.subjectId === subject.id && question.status === 'published',
        ).length,
      })),
    }));
  }

  async countAvailableQuestions(subjectIds: string[]) {
    return this.state.questions.filter(
      (question) => question.status === 'published' && subjectIds.includes(question.subjectId),
    ).length;
  }

  async getActiveSession() {
    this.requireUser();
    const session = [...this.state.sessions].reverse().find((candidate) => candidate.status === 'active');
    return session ? this.publicSession(session) : null;
  }

  async startSession(mode: QuizMode, subjectIds: string[] = []) {
    this.requireUser();
    if (this.state.sessions.some((session) => session.status === 'active')) {
      throw new Error('Es gibt bereits eine aktive Runde.');
    }
    const published = this.state.questions.filter((question) => question.status === 'published');
    let selected: AdminQuestion[];
    if (mode === 'training') {
      const candidates = published.filter((question) => subjectIds.includes(question.subjectId));
      if (candidates.length < 10) throw new Error('Für diese Auswahl sind weniger als zehn Fragen verfügbar.');
      selected = shuffleWith(candidates).slice(0, 10);
    } else if (mode === 'mistakes') {
      const candidates = published.filter((question) => this.state.stats[question.id]?.lastWasCorrect === false);
      if (!candidates.length) throw new Error('Dein Fehlerpool ist leer.');
      selected = shuffleWith(candidates).slice(0, 10);
    } else {
      selected = taxonomy.flatMap((area) => {
        const candidates = published.filter((question) => findAreaForSubject(question.subjectId)?.code === area.code);
        if (candidates.length < 10) throw new Error(`Für Bereich ${area.code} fehlen Fragen.`);
        return shuffleWith(candidates).slice(0, 10);
      });
      selected = shuffleWith(selected);
    }
    const now = new Date();
    const session: StoredSession = {
      id: crypto.randomUUID(),
      mode,
      status: 'active',
      position: 0,
      total: selected.length,
      startedAt: now.toISOString(),
      questionIds: selected.map((question) => question.id),
      deadlineAt: addSeconds(now, appConfig.answerSeconds),
      attempts: [],
      completedAt: null,
      abandonedAt: null,
    };
    this.state.sessions.push(session);
    this.persist();
    return this.publicSession(session);
  }

  async getCurrentQuestion(sessionId: string) {
    this.requireUser();
    const session = this.findSession(sessionId);
    if (session.status !== 'active') return null;
    const questionId = session.questionIds[session.position];
    if (!questionId) return null;
    const question = this.state.questions.find((candidate) => candidate.id === questionId);
    if (!question) throw new Error('Frage nicht gefunden.');
    const area = findAreaForSubject(question.subjectId);
    const subject = findSubject(question.subjectId);
    if (!area || !subject) throw new Error('Ungültige Taxonomie.');
    return {
      id: question.id,
      version: question.version,
      areaCode: area.code,
      areaName: area.name,
      subjectId: subject.id,
      subjectName: subject.name,
      prompt: question.prompt,
      answers: question.answers,
      position: session.position + 1,
      total: session.total,
      deadlineAt: session.deadlineAt,
      serverNow: new Date().toISOString(),
    };
  }

  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedIndex: number | null,
    idempotencyKey: string,
  ) {
    this.requireUser();
    const session = this.findSession(sessionId);
    const existing = session.attempts.find(
      (attempt) => attempt.questionId === questionId || attempt.idempotencyKey === idempotencyKey,
    );
    if (existing) return this.publicResolution(existing, session.mode);
    if (session.status !== 'active' || session.questionIds[session.position] !== questionId) {
      throw new Error('Diese Frage ist nicht mehr aktiv.');
    }
    const question = this.state.questions.find((candidate) => candidate.id === questionId);
    if (!question) throw new Error('Frage nicht gefunden.');
    const now = new Date();
    const timedOut = selectedIndex === null || now.getTime() > Date.parse(session.deadlineAt);
    const effectiveIndex = timedOut ? null : selectedIndex;
    const isCorrect = effectiveIndex === question.correctIndex;
    const attempt: StoredAttempt = {
      attemptId: crypto.randomUUID(),
      questionId,
      idempotencyKey,
      isCorrect,
      timedOut,
      selectedIndex: effectiveIndex,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      answerAt: now.toISOString(),
      responseMs: Math.max(0, appConfig.answerSeconds * 1000 - (Date.parse(session.deadlineAt) - now.getTime())),
    };
    session.attempts.push(attempt);
    const stats = this.state.stats[questionId] ?? {
      attempts: 0,
      correct: 0,
      incorrect: 0,
      lastWasCorrect: false,
      lastAttemptAt: now.toISOString(),
    };
    stats.attempts += 1;
    stats.correct += isCorrect ? 1 : 0;
    stats.incorrect += isCorrect ? 0 : 1;
    stats.lastWasCorrect = isCorrect;
    stats.lastAttemptAt = now.toISOString();
    this.state.stats[questionId] = stats;
    this.persist();
    return this.publicResolution(attempt, session.mode);
  }

  async advanceSession(sessionId: string) {
    const session = this.findSession(sessionId);
    const questionId = session.questionIds[session.position];
    if (!questionId || !session.attempts.some((attempt) => attempt.questionId === questionId)) {
      throw new Error('Die aktuelle Frage wurde noch nicht beantwortet.');
    }
    if (session.position + 1 >= session.total) {
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
    } else {
      session.position += 1;
      session.deadlineAt = addSeconds(new Date(), appConfig.answerSeconds);
    }
    this.persist();
    return this.publicSession(session);
  }

  async abandonSession(sessionId: string) {
    const session = this.findSession(sessionId);
    session.status = 'abandoned';
    session.abandonedAt = new Date().toISOString();
    this.persist();
  }

  async getSessionResult(sessionId: string) {
    this.requireUser();
    const session = this.findSession(sessionId);
    return this.resultFor(session);
  }

  async getProgress(): Promise<ProgressSummary> {
    this.requireUser();
    const published = this.state.questions.filter((question) => question.status === 'published');
    const statsEntries = Object.entries(this.state.stats);
    const totalAttempts = statsEntries.reduce((sum, [, stat]) => sum + stat.attempts, 0);
    const correctAttempts = statsEntries.reduce((sum, [, stat]) => sum + stat.correct, 0);
    const attemptedQuestions = statsEntries.length;
    const lastCorrect = statsEntries.filter(([, stat]) => stat.lastWasCorrect).length;
    const breakdown = (questions: AdminQuestion[], id: string, label: string): ProgressBreakdown => {
      const ids = new Set(questions.map((question) => question.id));
      const entries = statsEntries.filter(([questionId]) => ids.has(questionId));
      const attempts = entries.reduce((sum, [, stat]) => sum + stat.attempts, 0);
      const correct = entries.reduce((sum, [, stat]) => sum + stat.correct, 0);
      return {
        id,
        label,
        accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
        learningLevel: entries.length
          ? Math.round((entries.filter(([, stat]) => stat.lastWasCorrect).length / questions.length) * 100)
          : null,
        attempted: entries.length,
        total: questions.length,
      };
    };
    const areas = taxonomy.map((area) =>
      breakdown(
        published.filter((question) => findAreaForSubject(question.subjectId)?.code === area.code),
        area.id,
        `Bereich ${area.code}: ${area.name}`,
      ),
    );
    const subjects = taxonomy.flatMap((area) =>
      area.subjects.map((subject) =>
        breakdown(
          published.filter((question) => question.subjectId === subject.id),
          subject.id,
          subject.name,
        ),
      ),
    );
    const recentSessions = this.state.sessions
      .filter((session) => session.status === 'completed')
      .slice(-5)
      .reverse()
      .map((session) => this.resultFor(session));
    return {
      accuracy: totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : null,
      learningLevel: attemptedQuestions ? Math.round((lastCorrect / published.length) * 100) : null,
      attemptedQuestions,
      publishedQuestions: published.length,
      coverage: published.length ? Math.round((attemptedQuestions / published.length) * 100) : null,
      mistakeCount: statsEntries.filter(([, stat]) => !stat.lastWasCorrect).length,
      totalAttempts,
      areas,
      subjects,
      recentSessions,
    };
  }

  async listQuestions(filters: QuestionFilters = {}) {
    this.requireAdmin();
    const today = new Date().toISOString().slice(0, 10);
    return this.state.questions.filter((question) => {
      const area = findAreaForSubject(question.subjectId);
      const searchable = `${question.prompt} ${question.answers.join(' ')}`.toLocaleLowerCase('de-DE');
      return (
        (!filters.search || searchable.includes(filters.search.toLocaleLowerCase('de-DE'))) &&
        (!filters.areaCode || area?.code === filters.areaCode) &&
        (!filters.subjectId || question.subjectId === filters.subjectId) &&
        (!filters.status || question.status === filters.status) &&
        (filters.changeSensitive === undefined || question.changeSensitive === filters.changeSensitive) &&
        (!filters.review ||
          filters.review === 'all' ||
          (filters.review === 'due' && question.nextReviewAt === today) ||
          (filters.review === 'overdue' && !!question.nextReviewAt && question.nextReviewAt < today))
      );
    });
  }

  async getQuestion(id: string) {
    this.requireAdmin();
    const question = this.state.questions.find((candidate) => candidate.id === id);
    if (!question) throw new Error('Frage nicht gefunden.');
    return structuredClone(question);
  }

  async saveQuestion(input: SaveQuestionInput) {
    this.requireAdmin();
    const validation = adminQuestionSchema.safeParse(input);
    if (input.status === 'published' && !validation.success) {
      throw new Error(validation.error.issues.map((issue) => issue.message).join(' '));
    }
    if (!findSubject(input.subjectId)) throw new Error('Bitte eine gültige Sparte wählen.');
    const existingIndex = input.id
      ? this.state.questions.findIndex((candidate) => candidate.id === input.id)
      : -1;
    const existing = existingIndex >= 0 ? this.state.questions[existingIndex] : undefined;
    if (existing?.status === 'published' && !input.changeReason?.trim()) {
      throw new Error('Für Änderungen an veröffentlichten Fragen ist ein Änderungsgrund erforderlich.');
    }
    const question: AdminQuestion = {
      ...input,
      id: existing?.id ?? crypto.randomUUID(),
      version: existing?.status === 'published' ? existing.version + 1 : input.version,
      updatedAt: new Date().toISOString(),
      testData: false,
    };
    if (existingIndex >= 0) this.state.questions[existingIndex] = question;
    else this.state.questions.push(question);
    this.persist();
    return structuredClone(question);
  }

  async archiveQuestion(id: string, reason: string) {
    this.requireAdmin();
    if (!reason.trim()) throw new Error('Bitte einen Archivierungsgrund angeben.');
    const question = this.state.questions.find((candidate) => candidate.id === id);
    if (!question) throw new Error('Frage nicht gefunden.');
    question.status = 'archived';
    question.updatedAt = new Date().toISOString();
    this.persist();
  }

  async previewImport(rawJson: string) {
    this.requireAdmin();
    return previewQuestionImport(rawJson);
  }

  async commitImport(preview: ImportPreview) {
    this.requireAdmin();
    if (!preview.valid) throw new Error('Der Import enthält Fehler.');
    const created = preview.items.map((item) => ({
      ...(item.normalized as Omit<AdminQuestion, 'id' | 'updatedAt' | 'testData'>),
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      testData: false,
    }));
    this.state.questions.push(...created);
    this.persist();
    return created.length;
  }

  async exportQuestions(filters: QuestionFilters = {}) {
    const questions = await this.listQuestions(filters);
    const payload = questions.map((question) => ({
      frage: question.prompt,
      antworten: question.answers,
      richtige_antwort: question.correctIndex,
      sparte: findSubject(question.subjectId)?.name ?? question.subjectId,
      erklärung: question.explanation,
      änderungsanfällig: question.changeSensitive,
      contains_time_sensitive_numbers: question.containsTimeSensitiveNumbers,
      quelle: question.source
        ? { titel: question.source.title, url: question.source.url, stand: question.source.sourceDate }
        : undefined,
      zuletzt_geprüft_am: question.lastReviewedAt,
      nächste_prüfung_am: question.nextReviewAt,
      version: question.version,
      prüfverantwortlich: question.reviewer,
    }));
    return JSON.stringify(payload, null, 2);
  }

  async confirmReview(id: string, reviewer: string, notes: string) {
    this.requireAdmin();
    if (!reviewer.trim() || !notes.trim()) throw new Error('Prüfer und Prüfergebnis sind erforderlich.');
    const question = this.state.questions.find((candidate) => candidate.id === id);
    if (!question) throw new Error('Frage nicht gefunden.');
    const reviewed = new Date();
    const next = new Date(reviewed);
    next.setFullYear(next.getFullYear() + 1);
    question.lastReviewedAt = reviewed.toISOString().slice(0, 10);
    question.nextReviewAt = next.toISOString().slice(0, 10);
    question.reviewer = reviewer.trim();
    question.updatedAt = reviewed.toISOString();
    this.persist();
    return structuredClone(question);
  }

  private findSession(id: string) {
    const session = this.state.sessions.find((candidate) => candidate.id === id);
    if (!session) throw new Error('Runde nicht gefunden.');
    return session;
  }

  private publicSession(session: StoredSession): QuizSession {
    const { id, mode, status, position, total, startedAt } = session;
    return { id, mode, status, position, total, startedAt };
  }

  private publicResolution(attempt: StoredAttempt, mode: QuizMode): AnswerResolution {
    return {
      attemptId: attempt.attemptId,
      isCorrect: mode === 'exam' ? null : attempt.isCorrect,
      timedOut: attempt.timedOut,
      selectedIndex: attempt.selectedIndex,
      correctIndex: mode === 'exam' ? null : attempt.correctIndex,
      explanation: mode === 'exam' ? null : attempt.explanation,
      answerAt: attempt.answerAt,
    };
  }

  private resultFor(session: StoredSession): SessionResult {
    const details: AnswerDetail[] = session.attempts.map((attempt) => {
      const question = this.state.questions.find((candidate) => candidate.id === attempt.questionId)!;
      const area = findAreaForSubject(question.subjectId)!;
      return {
        questionId: question.id,
        prompt: question.prompt,
        answers: question.answers,
        selectedIndex: attempt.selectedIndex,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        isCorrect: attempt.isCorrect === true,
        timedOut: attempt.timedOut,
        responseMs: attempt.responseMs,
        areaCode: area.code,
        subjectName: findSubject(question.subjectId)?.name ?? '',
      };
    });
    return summarizeAnswers(
      session.id,
      session.mode,
      session.status,
      session.startedAt,
      session.completedAt,
      details,
    );
  }
}
