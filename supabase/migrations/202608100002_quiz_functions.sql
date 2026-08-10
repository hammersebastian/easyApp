begin;

drop policy if exists session_questions_own_read on public.quiz_session_questions;
create policy session_questions_admin_read on public.quiz_session_questions for select to authenticated using (public.is_admin());

create or replace function public.get_taxonomy() returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'code', a.code, 'name', a.name, 'sortOrder', a.sort_order,
    'subjects', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'areaId', s.area_id, 'name', s.name, 'slug', s.slug, 'sortOrder', s.sort_order,
      'publishedCount', (select count(*) from public.questions q where q.subject_id = s.id and q.status = 'published')
    ) order by s.sort_order), '[]'::jsonb) from public.subjects s where s.area_id = a.id and s.active)
  ) order by a.sort_order), '[]'::jsonb) from public.areas a
$$;

create or replace function public.count_available_questions(p_subject_ids text[]) returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.questions q where q.status = 'published' and q.subject_id = any(p_subject_ids)
$$;

create or replace function public.get_active_session() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', s.id, 'mode', s.mode, 'status', s.status, 'position', s.current_position, 'total', s.total_questions, 'startedAt', s.started_at)
  from public.quiz_sessions s where s.user_id = auth.uid() and s.status = 'active' order by s.started_at desc limit 1
$$;

create or replace function public.start_quiz_session(p_mode text, p_subject_ids text[] default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_ids uuid[] := '{}';
  v_area record;
  v_area_ids uuid[];
  v_session public.quiz_sessions;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_mode not in ('training', 'mistakes', 'exam') then raise exception 'invalid quiz mode'; end if;
  if exists(select 1 from public.quiz_sessions where user_id = v_user and status = 'active') then raise exception 'Es gibt bereits eine aktive Runde.'; end if;

  if p_mode = 'training' then
    select coalesce(array_agg(id), '{}') into v_ids from (
      select q.id from public.questions q where q.status = 'published' and q.subject_id = any(p_subject_ids) order by random() limit 10
    ) selected;
    if cardinality(v_ids) <> 10 then raise exception 'Für diese Auswahl sind weniger als zehn Fragen verfügbar.'; end if;
  elsif p_mode = 'mistakes' then
    select coalesce(array_agg(id), '{}') into v_ids from (
      select q.id from public.questions q join public.user_question_stats u on u.question_id = q.id and u.user_id = v_user
      where q.status = 'published' and not u.last_was_correct order by random() limit 10
    ) selected;
    if cardinality(v_ids) = 0 then raise exception 'Dein Fehlerpool ist leer.'; end if;
  else
    for v_area in select id, code from public.areas order by sort_order loop
      select coalesce(array_agg(id), '{}') into v_area_ids from (
        select q.id from public.questions q join public.subjects sub on sub.id = q.subject_id
        where q.status = 'published' and sub.area_id = v_area.id order by random() limit 10
      ) selected;
      if cardinality(v_area_ids) <> 10 then raise exception 'Für Bereich % fehlen veröffentlichte Fragen.', v_area.code; end if;
      v_ids := v_ids || v_area_ids;
    end loop;
    select array_agg(id) into v_ids from (select unnest(v_ids) id order by random()) mixed;
  end if;

  insert into public.quiz_sessions(user_id, mode, total_questions, selection_json)
  values (v_user, p_mode, cardinality(v_ids), jsonb_build_object('subjectIds', p_subject_ids)) returning * into v_session;

  insert into public.quiz_session_questions(session_id, question_id, question_version, position, snapshot, deadline_at)
  select v_session.id, q.id, q.version, ids.ordinality - 1,
    jsonb_build_object(
      'id', q.id, 'version', q.version, 'subjectId', q.subject_id, 'subjectName', sub.name,
      'areaCode', a.code, 'areaName', a.name, 'prompt', q.prompt, 'answers', q.answers_json,
      'correctIndex', q.correct_index, 'explanation', q.explanation
    ),
    case when ids.ordinality = 1 then now() + interval '45 seconds' else null end
  from unnest(v_ids) with ordinality ids(id, ordinality)
  join public.questions q on q.id = ids.id
  join public.subjects sub on sub.id = q.subject_id
  join public.areas a on a.id = sub.area_id;

  return jsonb_build_object('id', v_session.id, 'mode', v_session.mode, 'status', v_session.status, 'position', 0, 'total', v_session.total_questions, 'startedAt', v_session.started_at);
end $$;

create or replace function public.get_current_question(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_session public.quiz_sessions; v_item public.quiz_session_questions; v_now timestamptz := now();
begin
  select * into v_session from public.quiz_sessions where id = p_session_id and user_id = auth.uid();
  if not found then raise exception 'Runde nicht gefunden.'; end if;
  if v_session.status <> 'active' then return null; end if;
  select * into v_item from public.quiz_session_questions where session_id = p_session_id and position = v_session.current_position for update;
  if not found then return null; end if;
  if v_item.deadline_at is null then
    update public.quiz_session_questions set deadline_at = v_now + interval '45 seconds' where session_id = p_session_id and position = v_session.current_position returning * into v_item;
  end if;
  return jsonb_build_object(
    'id', v_item.question_id, 'version', v_item.question_version,
    'areaCode', v_item.snapshot ->> 'areaCode', 'areaName', v_item.snapshot ->> 'areaName',
    'subjectId', v_item.snapshot ->> 'subjectId', 'subjectName', v_item.snapshot ->> 'subjectName',
    'prompt', v_item.snapshot ->> 'prompt', 'answers', v_item.snapshot -> 'answers',
    'position', v_item.position + 1, 'total', v_session.total_questions,
    'deadlineAt', v_item.deadline_at, 'serverNow', v_now
  );
end $$;

create or replace function public.submit_quiz_answer(
  p_session_id uuid, p_question_id uuid, p_selected_index integer, p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_session public.quiz_sessions; v_item public.quiz_session_questions; v_attempt public.answer_attempts;
  v_now timestamptz := now(); v_timed_out boolean; v_correct boolean; v_correct_index integer;
begin
  if p_selected_index is not null and p_selected_index not between 0 and 3 then raise exception 'invalid answer index'; end if;
  select * into v_session from public.quiz_sessions where id = p_session_id and user_id = auth.uid() for update;
  if not found then raise exception 'Runde nicht gefunden.'; end if;
  select * into v_attempt from public.answer_attempts where session_id = p_session_id and (question_id = p_question_id or idempotency_key = p_idempotency_key) limit 1;
  if found then
    select * into v_item from public.quiz_session_questions where session_id = p_session_id and question_id = v_attempt.question_id;
    return jsonb_build_object('attemptId', v_attempt.id, 'isCorrect', case when v_session.mode = 'exam' then null else v_attempt.is_correct end,
      'timedOut', v_attempt.timed_out, 'selectedIndex', v_attempt.selected_index,
      'correctIndex', case when v_session.mode = 'exam' then null else (v_item.snapshot ->> 'correctIndex')::integer end,
      'explanation', case when v_session.mode = 'exam' then null else v_item.snapshot ->> 'explanation' end, 'answerAt', v_attempt.answered_at);
  end if;
  if v_session.status <> 'active' then raise exception 'Runde ist nicht aktiv.'; end if;
  select * into v_item from public.quiz_session_questions where session_id = p_session_id and question_id = p_question_id and position = v_session.current_position for update;
  if not found or v_item.deadline_at is null then raise exception 'Diese Frage ist nicht aktiv.'; end if;
  v_correct_index := (v_item.snapshot ->> 'correctIndex')::integer;
  v_timed_out := p_selected_index is null or v_now > v_item.deadline_at;
  v_correct := not v_timed_out and p_selected_index = v_correct_index;
  insert into public.answer_attempts(session_id, question_id, question_version, idempotency_key, selected_index, is_correct, timed_out, answered_at, response_ms)
  values (p_session_id, p_question_id, v_item.question_version, p_idempotency_key, case when v_timed_out then null else p_selected_index end,
    v_correct, v_timed_out, v_now, greatest(0, extract(epoch from (v_now - (v_item.deadline_at - interval '45 seconds'))) * 1000)::integer)
  on conflict (session_id, question_id) do nothing returning * into v_attempt;
  if not found then select * into v_attempt from public.answer_attempts where session_id = p_session_id and question_id = p_question_id; end if;

  insert into public.user_question_stats(user_id, question_id, attempts, correct_attempts, incorrect_attempts, last_was_correct, last_attempt_at)
  values (auth.uid(), p_question_id, 1, case when v_correct then 1 else 0 end, case when v_correct then 0 else 1 end, v_correct, v_now)
  on conflict (user_id, question_id) do update set
    attempts = public.user_question_stats.attempts + 1,
    correct_attempts = public.user_question_stats.correct_attempts + case when v_correct then 1 else 0 end,
    incorrect_attempts = public.user_question_stats.incorrect_attempts + case when v_correct then 0 else 1 end,
    last_was_correct = v_correct, last_attempt_at = v_now;

  return jsonb_build_object('attemptId', v_attempt.id, 'isCorrect', case when v_session.mode = 'exam' then null else v_correct end,
    'timedOut', v_timed_out, 'selectedIndex', v_attempt.selected_index,
    'correctIndex', case when v_session.mode = 'exam' then null else v_correct_index end,
    'explanation', case when v_session.mode = 'exam' then null else v_item.snapshot ->> 'explanation' end, 'answerAt', v_now);
end $$;

create or replace function public.advance_quiz_session(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_session public.quiz_sessions; v_question_id uuid;
begin
  select * into v_session from public.quiz_sessions where id = p_session_id and user_id = auth.uid() for update;
  if not found or v_session.status <> 'active' then raise exception 'Runde ist nicht aktiv.'; end if;
  select question_id into v_question_id from public.quiz_session_questions where session_id = p_session_id and position = v_session.current_position;
  if not exists(select 1 from public.answer_attempts where session_id = p_session_id and question_id = v_question_id) then raise exception 'Aktuelle Frage wurde noch nicht beantwortet.'; end if;
  if v_session.current_position + 1 >= v_session.total_questions then
    update public.quiz_sessions set status = 'completed', completed_at = now() where id = p_session_id returning * into v_session;
  else
    update public.quiz_sessions set current_position = current_position + 1 where id = p_session_id returning * into v_session;
    update public.quiz_session_questions set deadline_at = now() + interval '45 seconds' where session_id = p_session_id and position = v_session.current_position and deadline_at is null;
  end if;
  return jsonb_build_object('id', v_session.id, 'mode', v_session.mode, 'status', v_session.status, 'position', v_session.current_position, 'total', v_session.total_questions, 'startedAt', v_session.started_at);
end $$;

create or replace function public.abandon_quiz_session(p_session_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.quiz_sessions set status = 'abandoned', abandoned_at = now()
  where id = p_session_id and user_id = auth.uid() and status = 'active';
  if not found then raise exception 'Runde ist nicht aktiv.'; end if;
end $$;

grant execute on function public.get_taxonomy() to authenticated;
grant execute on function public.count_available_questions(text[]) to authenticated;
grant execute on function public.get_active_session() to authenticated;
grant execute on function public.start_quiz_session(text, text[]) to authenticated;
grant execute on function public.get_current_question(uuid) to authenticated;
grant execute on function public.submit_quiz_answer(uuid, uuid, integer, uuid) to authenticated;
grant execute on function public.advance_quiz_session(uuid) to authenticated;
grant execute on function public.abandon_quiz_session(uuid) to authenticated;

commit;
