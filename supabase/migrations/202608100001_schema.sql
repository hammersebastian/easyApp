begin;

create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  role text not null default 'learner' check (role in ('learner', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.areas (
  id text primary key,
  code text not null unique check (code in ('A', 'B', 'C', 'D', 'E')),
  name text not null,
  sort_order smallint not null unique check (sort_order between 1 and 5)
);

create table public.subjects (
  id text primary key,
  area_id text not null references public.areas(id) on delete restrict,
  name text not null unique,
  slug text not null unique,
  sort_order smallint not null check (sort_order > 0),
  active boolean not null default true,
  unique (area_id, sort_order)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects(id) on delete restrict,
  prompt text not null default '' check (char_length(prompt) <= 2000),
  answers_json jsonb not null default '["", "", "", ""]'::jsonb,
  correct_index smallint not null default 0 check (correct_index between 0 and 3),
  explanation text not null default '' check (char_length(explanation) <= 4000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  version integer not null default 1 check (version > 0),
  change_sensitive boolean not null default false,
  contains_time_sensitive_numbers boolean not null default false,
  last_reviewed_at date,
  next_review_at date,
  reviewer text,
  test_data boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_four_answers check (jsonb_typeof(answers_json) = 'array' and jsonb_array_length(answers_json) = 4),
  constraint questions_review_order check (next_review_at is null or last_reviewed_at is null or next_review_at >= last_reviewed_at)
);

create table public.question_sources (
  question_id uuid primary key references public.questions(id) on delete cascade,
  title text not null,
  url text check (url is null or url ~ '^https://'),
  source_date date,
  notes text
);

create table public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete restrict,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  change_reason text not null check (char_length(trim(change_reason)) > 0),
  created_at timestamptz not null default now(),
  unique (question_id, version)
);

create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('training', 'mistakes', 'exam')),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  current_position integer not null default 0 check (current_position >= 0),
  total_questions integer not null check (total_questions between 1 and 50),
  selection_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz,
  constraint session_terminal_dates check (
    (status = 'active' and completed_at is null and abandoned_at is null)
    or (status = 'completed' and completed_at is not null and abandoned_at is null)
    or (status = 'abandoned' and abandoned_at is not null and completed_at is null)
  )
);

create unique index quiz_sessions_one_active_per_user on public.quiz_sessions(user_id) where status = 'active';

create table public.quiz_session_questions (
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  question_version integer not null check (question_version > 0),
  position integer not null check (position >= 0),
  snapshot jsonb not null,
  deadline_at timestamptz,
  primary key (session_id, question_id),
  unique (session_id, position)
);

create table public.answer_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  question_version integer not null check (question_version > 0),
  idempotency_key uuid not null,
  selected_index smallint check (selected_index between 0 and 3),
  is_correct boolean not null,
  timed_out boolean not null default false,
  answered_at timestamptz not null default now(),
  response_ms integer not null check (response_ms >= 0),
  unique (session_id, question_id),
  unique (session_id, idempotency_key),
  constraint timeout_has_no_selection check (not timed_out or selected_index is null)
);

create table public.user_question_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  attempts integer not null default 0 check (attempts >= 0),
  correct_attempts integer not null default 0 check (correct_attempts >= 0),
  incorrect_attempts integer not null default 0 check (incorrect_attempts >= 0),
  last_was_correct boolean not null,
  last_attempt_at timestamptz not null,
  primary key (user_id, question_id),
  constraint stats_add_up check (attempts = correct_attempts + incorrect_attempts)
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index questions_subject_status_idx on public.questions(subject_id, status);
create index sessions_user_started_idx on public.quiz_sessions(user_id, started_at desc);
create index attempts_session_idx on public.answer_attempts(session_id, answered_at);
create index stats_user_last_idx on public.user_question_stats(user_id, last_attempt_at desc);
create index questions_review_idx on public.questions(next_review_at) where change_sensitive and status <> 'archived';

insert into public.areas (id, code, name, sort_order) values
  ('area-a', 'A', 'Private Vorsorge & AV', 1),
  ('area-b', 'B', 'Kranken- und Unfallversicherung', 2),
  ('area-c', 'C', 'Rechtliche Grundlagen', 3),
  ('area-d', 'D', 'Sachversicherungen I', 4),
  ('area-e', 'E', 'Sachversicherungen II & Haftpflicht', 5);

insert into public.subjects (id, area_id, name, slug, sort_order) values
  ('subject-gesetzliche-rentenversicherung', 'area-a', 'Gesetzliche Rentenversicherung', 'gesetzliche-rentenversicherung', 1),
  ('subject-private-rentenversicherung', 'area-a', 'Private Rentenversicherung', 'private-rentenversicherung', 2),
  ('subject-lebensversicherung', 'area-a', 'Lebensversicherung', 'lebensversicherung', 3),
  ('subject-betriebliche-altersversorgung-bav', 'area-a', 'Betriebliche Altersversorgung (bAV)', 'betriebliche-altersversorgung-bav', 4),
  ('subject-private-krankenversicherung', 'area-b', 'Private Krankenversicherung', 'private-krankenversicherung', 1),
  ('subject-pflegeversicherung', 'area-b', 'Pflegeversicherung', 'pflegeversicherung', 2),
  ('subject-unfallversicherung', 'area-b', 'Unfallversicherung', 'unfallversicherung', 3),
  ('subject-versicherungsvertragsgesetz-vvg', 'area-c', 'Versicherungsvertragsgesetz (VVG)', 'versicherungsvertragsgesetz-vvg', 1),
  ('subject-vermittlerrecht', 'area-c', 'Vermittlerrecht', 'vermittlerrecht', 2),
  ('subject-wettbewerbsrecht', 'area-c', 'Wettbewerbsrecht', 'wettbewerbsrecht', 3),
  ('subject-rechtliche-rahmenbedingungen-fur-die-beratung', 'area-c', 'Rechtliche Rahmenbedingungen für die Beratung', 'rechtliche-rahmenbedingungen-fur-die-beratung', 4),
  ('subject-wohngebaudeversicherung', 'area-d', 'Wohngebäudeversicherung', 'wohngebaudeversicherung', 1),
  ('subject-hausratversicherung', 'area-d', 'Hausratversicherung', 'hausratversicherung', 2),
  ('subject-haftpflichtversicherung', 'area-e', 'Haftpflichtversicherung', 'haftpflichtversicherung', 1),
  ('subject-rechtsschutzversicherung', 'area-e', 'Rechtsschutzversicherung', 'rechtsschutzversicherung', 2),
  ('subject-kraftfahrtversicherung', 'area-e', 'Kraftfahrtversicherung', 'kraftfahrtversicherung', 3);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id, display_name)
  values (new.id, left(case
    when length(trim(coalesce(new.raw_user_meta_data ->> 'display_name', ''))) >= 2 then trim(new.raw_user_meta_data ->> 'display_name')
    when length(trim(coalesce(split_part(new.email, '@', 1), ''))) >= 2 then trim(split_part(new.email, '@', 1))
    else 'Lernende Person' end, 80));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where user_id = auth.uid() and role = 'admin' and deleted_at is null)
$$;

create or replace function public.protect_profile_role() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role <> old.role and not public.is_admin() then raise exception 'role changes require admin'; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger protect_profile_role before update on public.profiles for each row execute procedure public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.areas enable row level security;
alter table public.subjects enable row level security;
alter table public.questions enable row level security;
alter table public.question_sources enable row level security;
alter table public.question_versions enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_session_questions enable row level security;
alter table public.answer_attempts enable row level security;
alter table public.user_question_stats enable row level security;
alter table public.admin_audit_log enable row level security;

create policy profiles_self_select on public.profiles for select using (user_id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy taxonomy_read_areas on public.areas for select to authenticated using (true);
create policy taxonomy_read_subjects on public.subjects for select to authenticated using (true);
create policy questions_admin_all on public.questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy sources_admin_all on public.question_sources for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy versions_admin_read on public.question_versions for select to authenticated using (public.is_admin());
create policy sessions_own_read on public.quiz_sessions for select to authenticated using (user_id = auth.uid());
create policy session_questions_own_read on public.quiz_session_questions for select to authenticated using (exists(select 1 from public.quiz_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy attempts_own_read on public.answer_attempts for select to authenticated using (exists(select 1 from public.quiz_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy stats_own_read on public.user_question_stats for select to authenticated using (user_id = auth.uid());
create policy audit_admin_read on public.admin_audit_log for select to authenticated using (public.is_admin());

revoke insert, update, delete on public.admin_audit_log from authenticated, anon;
revoke all on public.questions, public.question_sources, public.question_versions from anon;

commit;
