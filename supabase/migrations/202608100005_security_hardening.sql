begin;

revoke all on public.profiles, public.areas, public.subjects, public.questions, public.question_sources,
  public.question_versions, public.quiz_sessions, public.quiz_session_questions, public.answer_attempts,
  public.user_question_stats, public.admin_audit_log from anon, authenticated;
revoke all on public.admin_questions_view from anon, authenticated;

revoke execute on function public.get_taxonomy() from public, anon;
revoke execute on function public.count_available_questions(text[]) from public, anon;
revoke execute on function public.get_active_session() from public, anon;
revoke execute on function public.start_quiz_session(text, text[]) from public, anon;
revoke execute on function public.get_current_question(uuid) from public, anon;
revoke execute on function public.submit_quiz_answer(uuid, uuid, integer, uuid) from public, anon;
revoke execute on function public.advance_quiz_session(uuid) from public, anon;
revoke execute on function public.abandon_quiz_session(uuid) from public, anon;
revoke execute on function public.get_session_result(uuid) from public, anon;
revoke execute on function public.get_learning_progress() from public, anon;
revoke execute on function public.delete_own_account() from public, anon;
revoke execute on function public.admin_save_question(jsonb) from public, anon;
revoke execute on function public.admin_archive_question(uuid, text) from public, anon;
revoke execute on function public.admin_import_questions(jsonb) from public, anon;
revoke execute on function public.admin_export_questions(jsonb) from public, anon;
revoke execute on function public.admin_confirm_review(uuid, text, text) from public, anon;

grant select on public.areas, public.subjects to authenticated;
grant select, update(display_name) on public.profiles to authenticated;
grant select on public.quiz_sessions, public.answer_attempts, public.user_question_stats to authenticated;
grant select on public.questions, public.question_sources, public.question_versions, public.admin_audit_log to authenticated;
grant select on public.admin_questions_view to authenticated;

grant execute on function public.get_taxonomy() to authenticated;
grant execute on function public.count_available_questions(text[]) to authenticated;
grant execute on function public.get_active_session() to authenticated;
grant execute on function public.start_quiz_session(text, text[]) to authenticated;
grant execute on function public.get_current_question(uuid) to authenticated;
grant execute on function public.submit_quiz_answer(uuid, uuid, integer, uuid) to authenticated;
grant execute on function public.advance_quiz_session(uuid) to authenticated;
grant execute on function public.abandon_quiz_session(uuid) to authenticated;
grant execute on function public.get_session_result(uuid) to authenticated;
grant execute on function public.get_learning_progress() to authenticated;
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.admin_save_question(jsonb) to authenticated;
grant execute on function public.admin_archive_question(uuid, text) to authenticated;
grant execute on function public.admin_import_questions(jsonb) to authenticated;
grant execute on function public.admin_export_questions(jsonb) to authenticated;
grant execute on function public.admin_confirm_review(uuid, text, text) to authenticated;

commit;
