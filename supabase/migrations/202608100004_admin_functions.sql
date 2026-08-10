begin;

revoke insert, update, delete on public.questions, public.question_sources, public.question_versions from authenticated;
revoke insert, update, delete on public.quiz_sessions, public.quiz_session_questions, public.answer_attempts, public.user_question_stats from authenticated;

create or replace function public.prevent_audit_mutation() returns trigger language plpgsql as $$
begin raise exception 'audit log is immutable'; end $$;
create trigger admin_audit_immutable before update or delete on public.admin_audit_log for each row execute procedure public.prevent_audit_mutation();

create or replace view public.admin_questions_view with (security_invoker = true) as
select
  q.id, q.subject_id as "subjectId", q.prompt, q.answers_json as answers, q.correct_index as "correctIndex",
  q.explanation, q.status, q.version, q.change_sensitive as "changeSensitive",
  q.contains_time_sensitive_numbers as "containsTimeSensitiveNumbers",
  q.last_reviewed_at as "lastReviewedAt", q.next_review_at as "nextReviewAt", q.reviewer,
  case when src.question_id is null then null else jsonb_build_object(
    'title', src.title, 'url', src.url, 'sourceDate', src.source_date, 'notes', src.notes
  ) end as source,
  q.updated_at as "updatedAt", q.test_data as "testData", a.code as "areaCode"
from public.questions q
join public.subjects sub on sub.id = q.subject_id
join public.areas a on a.id = sub.area_id
left join public.question_sources src on src.question_id = q.id;

grant select on public.admin_questions_view to authenticated;

create or replace function public.admin_save_question(p_question jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid(); v_id uuid; v_existing public.questions; v_before jsonb; v_after jsonb;
  v_subject text := p_question ->> 'subjectId'; v_status text := coalesce(p_question ->> 'status', 'draft');
  v_answers jsonb := coalesce(p_question -> 'answers', '["", "", "", ""]'::jsonb);
  v_correct integer := coalesce((p_question ->> 'correctIndex')::integer, 0);
  v_change_sensitive boolean := coalesce((p_question ->> 'changeSensitive')::boolean, false);
  v_contains_numbers boolean := coalesce((p_question ->> 'containsTimeSensitiveNumbers')::boolean, false);
  v_area_code text; v_source jsonb := p_question -> 'source'; v_version integer := coalesce((p_question ->> 'version')::integer, 1);
begin
  if not public.is_admin() then raise exception 'admin authorization required'; end if;
  if v_status not in ('draft', 'published', 'archived') then raise exception 'Ungültiger Status.'; end if;
  if not exists(select 1 from public.subjects where id = v_subject) then raise exception 'Bitte eine gültige Sparte wählen.'; end if;
  if jsonb_typeof(v_answers) <> 'array' or jsonb_array_length(v_answers) <> 4 then raise exception 'Exakt vier Antworten sind erforderlich.'; end if;
  if v_correct not between 0 and 3 then raise exception 'Ungültiger richtiger Antwortindex.'; end if;
  select a.code into v_area_code from public.subjects sub join public.areas a on a.id = sub.area_id where sub.id = v_subject;

  if v_status = 'published' then
    if length(trim(coalesce(p_question ->> 'prompt', ''))) = 0 then raise exception 'Fragetext ist erforderlich.'; end if;
    if length(coalesce(p_question ->> 'prompt', '')) > 2000 then raise exception 'Fragetext ist zu lang.'; end if;
    if length(trim(coalesce(p_question ->> 'explanation', ''))) = 0 then raise exception 'Erklärung ist erforderlich.'; end if;
    if exists(select 1 from jsonb_array_elements(v_answers) a(value) where jsonb_typeof(value) <> 'string') then raise exception 'Antworten müssen Textwerte sein.'; end if;
    if exists(select 1 from jsonb_array_elements_text(v_answers) a(value) where length(trim(value)) = 0 or length(value) > 500) then raise exception 'Alle vier Antworten müssen ausgefüllt und höchstens 500 Zeichen lang sein.'; end if;
    if (select count(distinct lower(trim(value))) from jsonb_array_elements_text(v_answers) a(value)) <> 4 then raise exception 'Alle Antworten müssen verschieden sein.'; end if;
    if v_source is null or length(trim(coalesce(v_source ->> 'title', ''))) = 0 then raise exception 'Eine Quelle ist erforderlich.'; end if;
    if nullif(v_source ->> 'url', '') is not null and (v_source ->> 'url') !~ '^https://' then raise exception 'Quellen-URLs müssen HTTPS verwenden.'; end if;
    if nullif(p_question ->> 'lastReviewedAt', '') is null then raise exception 'Ein Prüfdatum ist erforderlich.'; end if;
    if length(trim(coalesce(p_question ->> 'reviewer', ''))) = 0 then raise exception 'Ein Prüfverantwortlicher ist erforderlich.'; end if;
  end if;
  if v_change_sensitive and (v_area_code not in ('A', 'B') or not v_contains_numbers or v_source is null or nullif(p_question ->> 'nextReviewAt', '') is null) then
    raise exception 'Änderungsanfällig ist nur für Zahlenfragen in A/B mit Quelle und nächstem Prüfdatum zulässig.';
  end if;

  if nullif(p_question ->> 'id', '') is not null then
    v_id := (p_question ->> 'id')::uuid;
    select * into v_existing from public.questions where id = v_id for update;
    if not found then raise exception 'Frage nicht gefunden.'; end if;
    if v_existing.test_data and v_status = 'published' then raise exception 'Technische Testdaten dürfen nicht veröffentlicht werden.'; end if;
    v_before := to_jsonb(v_existing) || jsonb_build_object('source', (select to_jsonb(s) from public.question_sources s where s.question_id = v_id));
    if v_existing.status = 'published' then
      if length(trim(coalesce(p_question ->> 'changeReason', ''))) = 0 then raise exception 'Ein Änderungsgrund ist erforderlich.'; end if;
      insert into public.question_versions(question_id, version, snapshot, changed_by, change_reason)
      values (v_id, v_existing.version, v_before, v_actor, p_question ->> 'changeReason') on conflict (question_id, version) do nothing;
      v_version := v_existing.version + 1;
    else
      v_version := v_existing.version;
    end if;
    update public.questions set
      subject_id = v_subject, prompt = coalesce(p_question ->> 'prompt', ''), answers_json = v_answers,
      correct_index = v_correct, explanation = coalesce(p_question ->> 'explanation', ''), status = v_status,
      version = v_version, change_sensitive = v_change_sensitive, contains_time_sensitive_numbers = v_contains_numbers,
      last_reviewed_at = nullif(p_question ->> 'lastReviewedAt', '')::date,
      next_review_at = nullif(p_question ->> 'nextReviewAt', '')::date,
      reviewer = nullif(trim(p_question ->> 'reviewer'), ''), updated_by = v_actor, updated_at = now()
    where id = v_id;
  else
    insert into public.questions(subject_id, prompt, answers_json, correct_index, explanation, status, version,
      change_sensitive, contains_time_sensitive_numbers, last_reviewed_at, next_review_at, reviewer, created_by, updated_by)
    values (v_subject, coalesce(p_question ->> 'prompt', ''), v_answers, v_correct, coalesce(p_question ->> 'explanation', ''), v_status, v_version,
      v_change_sensitive, v_contains_numbers, nullif(p_question ->> 'lastReviewedAt', '')::date,
      nullif(p_question ->> 'nextReviewAt', '')::date, nullif(trim(p_question ->> 'reviewer'), ''), v_actor, v_actor)
    returning id into v_id;
  end if;

  if v_source is null or length(trim(coalesce(v_source ->> 'title', ''))) = 0 then
    delete from public.question_sources where question_id = v_id;
  else
    insert into public.question_sources(question_id, title, url, source_date, notes)
    values (v_id, v_source ->> 'title', nullif(v_source ->> 'url', ''), nullif(v_source ->> 'sourceDate', '')::date, nullif(v_source ->> 'notes', ''))
    on conflict (question_id) do update set title = excluded.title, url = excluded.url, source_date = excluded.source_date, notes = excluded.notes;
  end if;
  select to_jsonb(v) into v_after from public.admin_questions_view v where v.id = v_id;
  insert into public.admin_audit_log(actor_id, action, entity_type, entity_id, before_json, after_json)
  values (v_actor, case when v_before is null then 'question.created' when v_status = 'published' then 'question.published' else 'question.updated' end, 'question', v_id::text, v_before, v_after);
  return v_after;
end $$;

create or replace function public.admin_archive_question(p_question_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_before jsonb; v_after jsonb;
begin
  if not public.is_admin() then raise exception 'admin authorization required'; end if;
  if length(trim(coalesce(p_reason, ''))) = 0 then raise exception 'Archivierungsgrund erforderlich.'; end if;
  select to_jsonb(v) into v_before from public.admin_questions_view v where v.id = p_question_id;
  if v_before is null then raise exception 'Frage nicht gefunden.'; end if;
  update public.questions set status = 'archived', updated_by = auth.uid(), updated_at = now() where id = p_question_id;
  select to_jsonb(v) into v_after from public.admin_questions_view v where v.id = p_question_id;
  insert into public.admin_audit_log(actor_id, action, entity_type, entity_id, before_json, after_json)
  values (auth.uid(), 'question.archived', 'question', p_question_id::text, v_before, v_after || jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.admin_import_questions(p_questions jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_item jsonb; v_count integer := 0;
begin
  if not public.is_admin() then raise exception 'admin authorization required'; end if;
  if jsonb_typeof(p_questions) <> 'array' then raise exception 'array required'; end if;
  for v_item in select value from jsonb_array_elements(p_questions) loop
    perform public.admin_save_question(v_item || jsonb_build_object('status', 'draft'));
    v_count := v_count + 1;
  end loop;
  insert into public.admin_audit_log(actor_id, action, entity_type, entity_id, after_json)
  values (auth.uid(), 'questions.imported', 'question_batch', gen_random_uuid()::text, jsonb_build_object('count', v_count));
  return v_count;
end $$;

create or replace function public.admin_export_questions(p_filters jsonb default '{}'::jsonb) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when public.is_admin() then coalesce(jsonb_agg(jsonb_build_object(
    'frage', v.prompt, 'antworten', v.answers, 'richtige_antwort', v."correctIndex", 'sparte', sub.name,
    'erklärung', v.explanation, 'änderungsanfällig', v."changeSensitive",
    'contains_time_sensitive_numbers', v."containsTimeSensitiveNumbers", 'quelle', v.source,
    'zuletzt_geprüft_am', v."lastReviewedAt", 'nächste_prüfung_am', v."nextReviewAt",
    'version', v.version, 'prüfverantwortlich', v.reviewer
  )), '[]'::jsonb) else null end
  from public.admin_questions_view v join public.subjects sub on sub.id = v."subjectId"
  join public.areas a on a.id = sub.area_id
  where (nullif(p_filters ->> 'search', '') is null or v.prompt ilike '%' || (p_filters ->> 'search') || '%')
    and (nullif(p_filters ->> 'areaCode', '') is null or a.code = p_filters ->> 'areaCode')
    and (nullif(p_filters ->> 'subjectId', '') is null or v."subjectId" = p_filters ->> 'subjectId')
    and (nullif(p_filters ->> 'status', '') is null or v.status = p_filters ->> 'status')
$$;

create or replace function public.admin_confirm_review(p_question_id uuid, p_reviewer text, p_notes text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_today date := current_date; v_after jsonb;
begin
  if not public.is_admin() then raise exception 'admin authorization required'; end if;
  if length(trim(coalesce(p_reviewer, ''))) = 0 or length(trim(coalesce(p_notes, ''))) = 0 then raise exception 'Prüfer und Ergebnis sind erforderlich.'; end if;
  update public.questions set last_reviewed_at = v_today, next_review_at = (v_today + interval '1 year')::date,
    reviewer = trim(p_reviewer), updated_by = auth.uid(), updated_at = now() where id = p_question_id and change_sensitive;
  if not found then raise exception 'Änderungsanfällige Frage nicht gefunden.'; end if;
  select to_jsonb(v) into v_after from public.admin_questions_view v where v.id = p_question_id;
  insert into public.admin_audit_log(actor_id, action, entity_type, entity_id, after_json)
  values (auth.uid(), 'question.review_confirmed', 'question', p_question_id::text, v_after || jsonb_build_object('reviewNotes', p_notes));
  return v_after;
end $$;

grant execute on function public.admin_save_question(jsonb) to authenticated;
grant execute on function public.admin_archive_question(uuid, text) to authenticated;
grant execute on function public.admin_import_questions(jsonb) to authenticated;
grant execute on function public.admin_export_questions(jsonb) to authenticated;
grant execute on function public.admin_confirm_review(uuid, text, text) to authenticated;

commit;
