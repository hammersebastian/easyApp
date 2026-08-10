import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { appConfig } from '../config/appConfig';
import { previewQuestionImport } from '../domain/importNormalizer';
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
import type { LearningRepository, SaveQuestionInput, SignUpInput } from './LearningRepository';
import { authStorage } from '../platform/authStorage';

const profileFromRow = (row: any, email = ''): UserProfile => ({
  id: row.user_id,
  email,
  displayName: row.display_name,
  role: row.role,
});

export class SupabaseLearningRepository implements LearningRepository {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: authStorage,
      },
    });
  }

  async getCurrentUser() {
    const { data } = await this.client.auth.getUser();
    if (!data.user) return null;
    const { data: profile, error } = await this.client
      .from('profiles')
      .select('user_id,display_name,role')
      .eq('user_id', data.user.id)
      .single();
    if (error) throw error;
    return profileFromRow(profile, data.user.email ?? '');
  }

  onAuthChange(listener: (user: UserProfile | null) => void) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      if (!session) listener(null);
      else void this.getCurrentUser().then(listener).catch(() => listener(null));
    });
    return () => data.subscription.unsubscribe();
  }

  async signUp(input: SignUpInput) {
    const { data, error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { display_name: input.displayName } },
    });
    if (error) throw error;
    return { needsVerification: !data.session };
  }

  async signIn(email: string, password: string) {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.');
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Profil konnte nicht geladen werden.');
    return user;
  }

  async requestPasswordReset(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${appConfig.publicWebUrl}/auth/password-reset`,
    });
    if (error) throw new Error('Die Anfrage konnte nicht verarbeitet werden.');
  }

  async updatePassword(password: string) {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) throw new Error('Das Passwort konnte nicht geändert werden.');
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async updateDisplayName(displayName: string) {
    const { data, error } = await this.client
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .select('user_id,display_name,role')
      .single();
    if (error) throw error;
    const auth = await this.client.auth.getUser();
    return profileFromRow(data, auth.data.user?.email ?? '');
  }

  async deleteAccount() {
    const { error } = await this.client.rpc('delete_own_account');
    if (error) throw error;
    await this.client.auth.signOut();
  }

  async getTaxonomy() {
    const { data, error } = await this.client.rpc('get_taxonomy');
    if (error) throw error;
    return data as Area[];
  }

  async countAvailableQuestions(subjectIds: string[]) {
    const { data, error } = await this.client.rpc('count_available_questions', { p_subject_ids: subjectIds });
    if (error) throw error;
    return Number(data);
  }

  async getActiveSession() {
    const { data, error } = await this.client.rpc('get_active_session');
    if (error) throw error;
    return (data ?? null) as QuizSession | null;
  }

  async startSession(mode: QuizMode, subjectIds: string[] = []) {
    const { data, error } = await this.client.rpc('start_quiz_session', {
      p_mode: mode,
      p_subject_ids: subjectIds,
    });
    if (error) throw error;
    return data as QuizSession;
  }

  async getCurrentQuestion(sessionId: string) {
    const { data, error } = await this.client.rpc('get_current_question', { p_session_id: sessionId });
    if (error) throw error;
    return data as LearnerQuestion | null;
  }

  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedIndex: number | null,
    idempotencyKey: string,
  ) {
    const { data, error } = await this.client.rpc('submit_quiz_answer', {
      p_session_id: sessionId,
      p_question_id: questionId,
      p_selected_index: selectedIndex,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    return data as AnswerResolution;
  }

  async advanceSession(sessionId: string) {
    const { data, error } = await this.client.rpc('advance_quiz_session', { p_session_id: sessionId });
    if (error) throw error;
    return data as QuizSession;
  }

  async abandonSession(sessionId: string) {
    const { error } = await this.client.rpc('abandon_quiz_session', { p_session_id: sessionId });
    if (error) throw error;
  }

  async getSessionResult(sessionId: string) {
    const { data, error } = await this.client.rpc('get_session_result', { p_session_id: sessionId });
    if (error) throw error;
    return data as SessionResult;
  }

  async getProgress() {
    const { data, error } = await this.client.rpc('get_learning_progress');
    if (error) throw error;
    return data as ProgressSummary;
  }

  async listQuestions(filters: QuestionFilters = {}) {
    let query = this.client.from('admin_questions_view').select('*').order('updated_at', { ascending: false });
    if (filters.search) query = query.or(`prompt.ilike.%${filters.search}%,explanation.ilike.%${filters.search}%`);
    if (filters.areaCode) query = query.eq('areaCode', filters.areaCode);
    if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.changeSensitive !== undefined) query = query.eq('change_sensitive', filters.changeSensitive);
    const today = new Date().toISOString().slice(0, 10);
    if (filters.review === 'due') query = query.eq('nextReviewAt', today);
    if (filters.review === 'overdue') query = query.lt('nextReviewAt', today);
    const { data, error } = await query;
    if (error) throw error;
    return data as AdminQuestion[];
  }

  async getQuestion(id: string) {
    const { data, error } = await this.client.from('admin_questions_view').select('*').eq('id', id).single();
    if (error) throw error;
    return data as AdminQuestion;
  }

  async saveQuestion(question: SaveQuestionInput) {
    const { data, error } = await this.client.rpc('admin_save_question', { p_question: question });
    if (error) throw error;
    return data as AdminQuestion;
  }

  async archiveQuestion(id: string, reason: string) {
    const { error } = await this.client.rpc('admin_archive_question', { p_question_id: id, p_reason: reason });
    if (error) throw error;
  }

  async previewImport(rawJson: string): Promise<ImportPreview> {
    return previewQuestionImport(rawJson);
  }

  async commitImport(preview: ImportPreview) {
    const { data, error } = await this.client.rpc('admin_import_questions', {
      p_questions: preview.items.map((item) => item.normalized),
    });
    if (error) throw error;
    return Number(data);
  }

  async exportQuestions(filters: QuestionFilters = {}) {
    const { data, error } = await this.client.rpc('admin_export_questions', { p_filters: filters });
    if (error) throw error;
    return JSON.stringify(data, null, 2);
  }

  async confirmReview(id: string, reviewer: string, notes: string) {
    const { data, error } = await this.client.rpc('admin_confirm_review', {
      p_question_id: id,
      p_reviewer: reviewer,
      p_notes: notes,
    });
    if (error) throw error;
    return data as AdminQuestion;
  }
}
