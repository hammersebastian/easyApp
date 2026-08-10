begin;

create or replace function public.get_session_result(p_session_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_session public.quiz_sessions; v_answers jsonb; v_correct integer; v_count integer;
  v_area_scores jsonb := '{}'::jsonb; v_area record; v_area_correct integer; v_area_total integer;
  v_at_least_fifty integer := 0; v_all_thirty boolean := true; v_passed boolean;
begin
  select * into v_session from public.quiz_sessions where id = p_session_id and user_id = auth.uid();
  if not found then raise exception 'Auswertung nicht gefunden.'; end if;

  select count(*)::integer, count(*) filter (where aa.is_correct)::integer,
    coalesce(jsonb_agg(jsonb_build_object(
      'questionId', sq.question_id, 'prompt', sq.snapshot ->> 'prompt', 'answers', sq.snapshot -> 'answers',
      'selectedIndex', aa.selected_index, 'correctIndex', (sq.snapshot ->> 'correctIndex')::integer,
      'explanation', sq.snapshot ->> 'explanation', 'isCorrect', aa.is_correct, 'timedOut', aa.timed_out,
      'responseMs', aa.response_ms, 'areaCode', sq.snapshot ->> 'areaCode', 'subjectName', sq.snapshot ->> 'subjectName'
    ) order by sq.position), '[]'::jsonb)
  into v_count, v_correct, v_answers
  from public.quiz_session_questions sq join public.answer_attempts aa on aa.session_id = sq.session_id and aa.question_id = sq.question_id
  where sq.session_id = p_session_id;

  for v_area in select code from public.areas order by sort_order loop
    select count(*)::integer, count(*) filter (where aa.is_correct)::integer into v_area_total, v_area_correct
    from public.quiz_session_questions sq join public.answer_attempts aa on aa.session_id = sq.session_id and aa.question_id = sq.question_id
    where sq.session_id = p_session_id and sq.snapshot ->> 'areaCode' = v_area.code;
    v_area_scores := v_area_scores || jsonb_build_object(v_area.code, case when v_area_total > 0 then round(v_area_correct * 100.0 / v_area_total) else 0 end);
    if v_area_total > 0 then
      if round(v_area_correct * 100.0 / v_area_total) >= 50 then v_at_least_fifty := v_at_least_fifty + 1; end if;
      if round(v_area_correct * 100.0 / v_area_total) < 30 then v_all_thirty := false; end if;
    elsif v_session.mode = 'exam' then v_all_thirty := false;
    end if;
  end loop;
  v_passed := case when v_session.mode = 'exam' and v_session.status = 'completed' then v_at_least_fifty >= 4 and v_all_thirty else null end;

  return jsonb_build_object(
    'sessionId', v_session.id, 'mode', v_session.mode, 'status', v_session.status,
    'correct', v_correct, 'incorrect', v_count - v_correct, 'total', v_count,
    'percentage', case when v_count > 0 then round(v_correct * 100.0 / v_count) else 0 end,
    'durationSeconds', case when v_session.completed_at is not null then greatest(0, extract(epoch from (v_session.completed_at - v_session.started_at))::integer) else 0 end,
    'averageResponseSeconds', case when v_count > 0 then (select round(avg(response_ms) / 1000.0, 1) from public.answer_attempts where session_id = p_session_id) else 0 end,
    'passed', v_passed, 'areaScores', v_area_scores, 'answers', v_answers, 'completedAt', v_session.completed_at
  );
end $$;

create or replace function public.get_learning_progress() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid(); v_published integer; v_attempted integer; v_attempts integer; v_correct integer; v_last_correct integer; v_mistakes integer;
  v_areas jsonb; v_subjects jsonb; v_recent jsonb;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select count(*)::integer into v_published from public.questions where status = 'published';
  select count(*)::integer, coalesce(sum(attempts), 0)::integer, coalesce(sum(correct_attempts), 0)::integer,
    count(*) filter (where last_was_correct)::integer, count(*) filter (where not last_was_correct)::integer
  into v_attempted, v_attempts, v_correct, v_last_correct, v_mistakes
  from public.user_question_stats u join public.questions q on q.id = u.question_id where u.user_id = v_user and q.status = 'published';

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'label', 'Bereich ' || a.code || ': ' || a.name,
    'accuracy', case when coalesce(x.attempts, 0) > 0 then round(x.correct_attempts * 100.0 / x.attempts) else null end,
    'learningLevel', case when coalesce(x.total, 0) > 0 and coalesce(x.attempted, 0) > 0 then round(x.last_correct * 100.0 / x.total) else null end,
    'attempted', coalesce(x.attempted, 0), 'total', coalesce(x.total, 0)
  ) order by a.sort_order), '[]'::jsonb) into v_areas
  from public.areas a left join lateral (
    select count(q.id)::integer total, count(u.question_id)::integer attempted,
      coalesce(sum(u.attempts), 0)::integer attempts, coalesce(sum(u.correct_attempts), 0)::integer correct_attempts,
      count(u.question_id) filter (where u.last_was_correct)::integer last_correct
    from public.subjects sub join public.questions q on q.subject_id = sub.id and q.status = 'published'
    left join public.user_question_stats u on u.question_id = q.id and u.user_id = v_user where sub.area_id = a.id
  ) x on true;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', sub.id, 'label', sub.name,
    'accuracy', case when coalesce(x.attempts, 0) > 0 then round(x.correct_attempts * 100.0 / x.attempts) else null end,
    'learningLevel', case when coalesce(x.total, 0) > 0 and coalesce(x.attempted, 0) > 0 then round(x.last_correct * 100.0 / x.total) else null end,
    'attempted', coalesce(x.attempted, 0), 'total', coalesce(x.total, 0)
  ) order by a.sort_order, sub.sort_order), '[]'::jsonb) into v_subjects
  from public.subjects sub join public.areas a on a.id = sub.area_id left join lateral (
    select count(q.id)::integer total, count(u.question_id)::integer attempted,
      coalesce(sum(u.attempts), 0)::integer attempts, coalesce(sum(u.correct_attempts), 0)::integer correct_attempts,
      count(u.question_id) filter (where u.last_was_correct)::integer last_correct
    from public.questions q left join public.user_question_stats u on u.question_id = q.id and u.user_id = v_user
    where q.subject_id = sub.id and q.status = 'published'
  ) x on true;

  select coalesce(jsonb_agg(public.get_session_result(s.id) order by s.completed_at desc), '[]'::jsonb) into v_recent
  from (select id, completed_at from public.quiz_sessions where user_id = v_user and status = 'completed' order by completed_at desc limit 5) s;

  return jsonb_build_object(
    'accuracy', case when v_attempts > 0 then round(v_correct * 100.0 / v_attempts) else null end,
    'learningLevel', case when v_attempted > 0 and v_published > 0 then round(v_last_correct * 100.0 / v_published) else null end,
    'attemptedQuestions', v_attempted, 'publishedQuestions', v_published,
    'coverage', case when v_published > 0 then round(v_attempted * 100.0 / v_published) else null end,
    'mistakeCount', v_mistakes, 'totalAttempts', v_attempts, 'areas', v_areas, 'subjects', v_subjects, 'recentSessions', v_recent
  );
end $$;

create or replace function public.delete_own_account() returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication required'; end if;
  delete from auth.users where id = v_user;
end $$;

grant execute on function public.get_session_result(uuid) to authenticated;
grant execute on function public.get_learning_progress() to authenticated;
grant execute on function public.delete_own_account() to authenticated;

commit;
