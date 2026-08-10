begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_table('public', 'questions', 'questions table exists');
select has_table('public', 'answer_attempts', 'answer attempts table exists');
select has_function('public', 'start_quiz_session', array['text', 'text[]'], 'quiz start RPC exists');
select has_function('public', 'submit_quiz_answer', array['uuid', 'uuid', 'integer', 'uuid'], 'idempotent answer RPC exists');
select results_eq('select count(*)::bigint from public.areas', array[5::bigint], 'five canonical areas');
select results_eq('select count(*)::bigint from public.subjects', array[16::bigint], 'canonical subjects seeded');
select throws_ok(
  $$insert into public.questions(subject_id, answers_json) values ('subject-pflegeversicherung', '["A","B","C"]')$$,
  '23514', null, 'four-answer constraint enforced'
);
select ok(not has_table_privilege('authenticated', 'public.questions', 'INSERT'), 'authenticated cannot insert questions directly');
select ok(not has_table_privilege('authenticated', 'public.quiz_session_questions', 'SELECT'), 'learner cannot read snapshots containing solutions');

select * from finish();
rollback;
