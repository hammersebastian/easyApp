-- Technische Entwürfe zur Prüfung von Taxonomie und Adminoberfläche.
-- Sie sind absichtlich NICHT veröffentlicht und fachlich nicht freigegeben.
insert into public.questions (
  id, subject_id, prompt, answers_json, correct_index, explanation, status, version, test_data
) values
  ('00000000-0000-4000-8000-00000000000a', 'subject-gesetzliche-rentenversicherung', '[TESTDATEN] Technische Entwurfsfrage A', '["Test A","Test B","Test C","Test D"]', 0, 'Keine fachliche Aussage.', 'draft', 1, true),
  ('00000000-0000-4000-8000-00000000000b', 'subject-private-krankenversicherung', '[TESTDATEN] Technische Entwurfsfrage B', '["Test A","Test B","Test C","Test D"]', 1, 'Keine fachliche Aussage.', 'draft', 1, true),
  ('00000000-0000-4000-8000-00000000000c', 'subject-vermittlerrecht', '[TESTDATEN] Technische Entwurfsfrage C', '["Test A","Test B","Test C","Test D"]', 2, 'Keine fachliche Aussage.', 'draft', 1, true),
  ('00000000-0000-4000-8000-00000000000d', 'subject-wohngebaudeversicherung', '[TESTDATEN] Technische Entwurfsfrage D', '["Test A","Test B","Test C","Test D"]', 3, 'Keine fachliche Aussage.', 'draft', 1, true),
  ('00000000-0000-4000-8000-00000000000e', 'subject-haftpflichtversicherung', '[TESTDATEN] Technische Entwurfsfrage E', '["Test A","Test B","Test C","Test D"]', 0, 'Keine fachliche Aussage.', 'draft', 1, true)
on conflict (id) do nothing;
