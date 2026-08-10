import { IonButton, IonIcon } from '@ionic/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { arrowDownOutline, arrowUpOutline, downloadOutline, trashOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppPage } from '../components/AppPage';
import { LoadingState } from '../components/LoadingState';
import { findAreaForSubject, taxonomy } from '../domain/taxonomy';
import type { AdminQuestion, ImportPreview, QuestionFilters, QuestionStatus } from '../domain/types';
import { learningRepository } from '../repositories';
import type { SaveQuestionInput } from '../repositories/LearningRepository';

type Tab = 'questions' | 'import' | 'reviews';

const blankQuestion = (): SaveQuestionInput => ({
  subjectId: '', prompt: '', answers: ['', '', '', ''], correctIndex: 0, explanation: '', status: 'draft', version: 1,
  changeSensitive: false, containsTimeSensitiveNumbers: false, lastReviewedAt: null, nextReviewAt: null,
  reviewer: null, source: null,
});

const statusLabel: Record<QuestionStatus, string> = { draft: 'Entwurf', published: 'Veröffentlicht', archived: 'Archiviert' };

function QuestionEditor({ selected, onSaved }: { selected: AdminQuestion | null; onSaved: () => void }) {
  const [form, setForm] = useState<SaveQuestionInput>(blankQuestion());
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setForm(selected ? {
      id: selected.id, subjectId: selected.subjectId, prompt: selected.prompt, answers: [...selected.answers],
      correctIndex: selected.correctIndex, explanation: selected.explanation, status: selected.status, version: selected.version,
      changeSensitive: selected.changeSensitive, containsTimeSensitiveNumbers: selected.containsTimeSensitiveNumbers,
      lastReviewedAt: selected.lastReviewedAt, nextReviewAt: selected.nextReviewAt, reviewer: selected.reviewer,
      source: selected.source, changeReason: '',
    } : blankQuestion());
    setError(''); setMessage('');
  }, [selected]);

  const updateAnswer = (index: number, value: string) => setForm((current) => {
    const answers = [...current.answers] as [string, string, string, string]; answers[index] = value; return { ...current, answers };
  });
  const moveAnswer = (index: number, direction: -1 | 1) => setForm((current) => {
    const target = index + direction; if (target < 0 || target > 3) return current;
    const answers = [...current.answers] as [string, string, string, string];
    [answers[index], answers[target]] = [answers[target]!, answers[index]!];
    let correctIndex = current.correctIndex;
    if (correctIndex === index) correctIndex = target; else if (correctIndex === target) correctIndex = index;
    return { ...current, answers, correctIndex };
  });
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await learningRepository.saveQuestion(form); setMessage('Frage gespeichert.'); onSaved(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Frage konnte nicht gespeichert werden.'); }
    finally { setBusy(false); }
  };
  return (
    <section className="surface">
      <span className="eyebrow">{selected ? `Version ${selected.version}` : 'Neue Frage'}</span>
      <h2>{selected ? 'Frage bearbeiten' : 'Entwurf erstellen'}</h2>
      <form className="form-grid" onSubmit={submit}>
        <label className="field">Sparte<select value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })}><option value="">Bitte wählen</option>{taxonomy.map((area) => <optgroup key={area.id} label={`${area.code} · ${area.name}`}>{area.subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</optgroup>)}</select></label>
        <label className="field">Frage<textarea value={form.prompt} maxLength={2000} onChange={(event) => setForm({ ...form, prompt: event.target.value })} /></label>
        <fieldset className="form-grid" style={{ border: 0, padding: 0 }}><legend><strong>Antworten</strong></legend>{form.answers.map((answer, index) => (
          <div className="cluster" key={index} style={{ flexWrap: 'nowrap' }}>
            <input type="radio" name="correct" checked={form.correctIndex === index} onChange={() => setForm({ ...form, correctIndex: index })} aria-label={`Antwort ${index + 1} als richtig markieren`} />
            <label className="field" style={{ flex: 1 }}><span className="field-hint">Antwort {index + 1}</span><input value={answer} maxLength={500} onChange={(event) => updateAnswer(index, event.target.value)} /></label>
            <IonButton fill="clear" size="small" type="button" disabled={index === 0} onClick={() => moveAnswer(index, -1)} aria-label="Antwort nach oben"><IonIcon icon={arrowUpOutline} /></IonButton>
            <IonButton fill="clear" size="small" type="button" disabled={index === 3} onClick={() => moveAnswer(index, 1)} aria-label="Antwort nach unten"><IonIcon icon={arrowDownOutline} /></IonButton>
          </div>
        ))}</fieldset>
        <label className="field">Erklärung<textarea value={form.explanation} maxLength={4000} onChange={(event) => setForm({ ...form, explanation: event.target.value })} /></label>
        <div className="cluster">
          <label className="check-row"><input type="checkbox" checked={form.containsTimeSensitiveNumbers} onChange={(event) => setForm({ ...form, containsTimeSensitiveNumbers: event.target.checked })} />Enthält zeitabhängige genaue Zahlen</label>
          <label className="check-row"><input type="checkbox" checked={form.changeSensitive} onChange={(event) => setForm({ ...form, changeSensitive: event.target.checked })} />Änderungsanfällig</label>
        </div>
        <label className="field">Quellentitel<input value={form.source?.title ?? ''} onChange={(event) => setForm({ ...form, source: { title: event.target.value, url: form.source?.url ?? null, sourceDate: form.source?.sourceDate ?? null, notes: form.source?.notes ?? null } })} /></label>
        <label className="field">Quellen-URL (HTTPS)<input type="url" value={form.source?.url ?? ''} onChange={(event) => setForm({ ...form, source: { title: form.source?.title ?? '', url: event.target.value || null, sourceDate: form.source?.sourceDate ?? null, notes: form.source?.notes ?? null } })} /></label>
        <div className="cluster">
          <label className="field" style={{ flex: 1 }}>Zuletzt geprüft<input type="date" value={form.lastReviewedAt ?? ''} onChange={(event) => setForm({ ...form, lastReviewedAt: event.target.value || null })} /></label>
          <label className="field" style={{ flex: 1 }}>Nächste Prüfung<input type="date" value={form.nextReviewAt ?? ''} onChange={(event) => setForm({ ...form, nextReviewAt: event.target.value || null })} /></label>
        </div>
        <label className="field">Prüfverantwortlich<input value={form.reviewer ?? ''} onChange={(event) => setForm({ ...form, reviewer: event.target.value || null })} /></label>
        <label className="field">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as QuestionStatus })}><option value="draft">Entwurf</option><option value="published">Veröffentlicht</option><option value="archived">Archiviert</option></select></label>
        {selected?.status === 'published' && <label className="field">Änderungsgrund<input value={form.changeReason ?? ''} onChange={(event) => setForm({ ...form, changeReason: event.target.value })} required /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="success-text">{message}</p>}
        <IonButton type="submit" disabled={busy}>{busy ? 'Speichert …' : form.status === 'published' ? 'Prüfen und veröffentlichen' : 'Als Entwurf speichern'}</IonButton>
      </form>
    </section>
  );
}

function ImportPanel({ onImported }: { onImported: () => void }) {
  const [json, setJson] = useState(''); const [preview, setPreview] = useState<ImportPreview | null>(null); const [message, setMessage] = useState('');
  const inspect = async () => { setPreview(await learningRepository.previewImport(json)); setMessage(''); };
  const commit = async () => { if (!preview) return; const count = await learningRepository.commitImport(preview); setMessage(`${count} Fragen als Entwurf importiert.`); setJson(''); setPreview(null); onImported(); };
  return <section className="surface stack"><div><span className="eyebrow">Atomarer JSON-Import</span><h2>Fragen prüfen und importieren</h2><p className="muted">Einzelobjekt oder Array. Normalisierung und Fehler werden vor dem Speichern angezeigt.</p></div>
    <label className="field">JSON<textarea value={json} onChange={(event) => setJson(event.target.value)} style={{ minHeight: 260 }} placeholder='{"frage":"…","antworten":["…","…","…","…"],…}' /></label>
    <IonButton onClick={inspect} disabled={!json.trim()}>Vorschau erstellen</IonButton>
    {preview && <div className="stack">{preview.items.map((item) => <article className="surface" key={item.index}><strong>Datensatz {item.index + 1}</strong><p className={item.errors.length ? 'error-text' : 'success-text'}>{item.errors.length ? `${item.errors.length} Fehler` : 'Gültig als Entwurf'}</p>{item.changes.length > 0 && <p className="muted">Normalisiert: {item.changes.join(', ')}</p>}{item.warnings.map((warning) => <p className="muted" key={warning}>Warnung: {warning}</p>)}{item.errors.map((error) => <p className="form-error" key={`${error.field}-${error.message}`}><strong>{error.field}:</strong> {error.message}</p>)}</article>)}<IonButton onClick={commit} disabled={!preview.valid}>Import verbindlich speichern</IonButton></div>}
    {message && <p className="success-text">{message}</p>}
  </section>;
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('questions');
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [selected, setSelected] = useState<AdminQuestion | null>(null);
  const queryClient = useQueryClient();
  const questions = useQuery({ queryKey: ['admin-questions', filters], queryFn: () => learningRepository.listQuestions(filters) });
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ['admin-questions'] }); setSelected(null); };
  const reviewQuestions = useMemo(() => questions.data?.filter((question) => question.nextReviewAt && question.nextReviewAt <= new Date().toISOString().slice(0, 10)) ?? [], [questions.data]);
  const exportJson = async () => {
    const json = await learningRepository.exportQuestions(filters); const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'fragen-export.json'; anchor.click(); URL.revokeObjectURL(url);
  };
  const archive = async (question: AdminQuestion) => { const reason = window.prompt('Archivierungsgrund'); if (!reason) return; await learningRepository.archiveQuestion(question.id, reason); refresh(); };
  const confirmReview = async (question: AdminQuestion) => { const reviewer = window.prompt('Prüfverantwortliche Person', question.reviewer ?? '') ?? ''; const notes = window.prompt('Ergebnis / Notiz der fachlichen Prüfung') ?? ''; if (!reviewer || !notes) return; await learningRepository.confirmReview(question.id, reviewer, notes); refresh(); };

  return <AppPage title="Fragenverwaltung" backHref="/home">
    <div className="tabs" role="tablist"><button role="tab" aria-selected={tab === 'questions'} onClick={() => setTab('questions')}>Fragenbestand</button><button role="tab" aria-selected={tab === 'import'} onClick={() => setTab('import')}>JSON-Import</button><button role="tab" aria-selected={tab === 'reviews'} onClick={() => { setTab('reviews'); setFilters({ review: 'all' }); }}>Prüfhinweise ({reviewQuestions.length})</button></div>
    {tab === 'import' ? <div style={{ marginTop: 18 }}><ImportPanel onImported={refresh} /></div> : tab === 'reviews' ? <section className="surface" style={{ marginTop: 18 }}><h2>Fällige und überfällige Prüfungen</h2>{reviewQuestions.length ? <div className="admin-list">{reviewQuestions.map((question) => <article className="admin-row" key={question.id}><div><h3>{question.prompt}</h3><p>{question.nextReviewAt} · Bereich {findAreaForSubject(question.subjectId)?.code}</p></div><IonButton onClick={() => void confirmReview(question)}>Prüfung bestätigen</IonButton></article>)}</div> : <p className="muted">Keine Prüfhinweise fällig.</p>}</section> : (
      <div className="admin-layout" style={{ marginTop: 18 }}>
        <section className="stack">
          <div className="surface stack">
            <div className="spread"><div><span className="eyebrow">Bestand</span><h2 style={{ margin: 0 }}>{questions.data?.length ?? 0} Fragen</h2></div><IonButton fill="outline" onClick={() => void exportJson()}><IonIcon slot="start" icon={downloadOutline} />Export</IonButton></div>
            <div className="admin-toolbar">
              <label className="field">Suche<input value={filters.search ?? ''} onChange={(event) => setFilters({ ...filters, search: event.target.value || undefined })} /></label>
              <label className="field">Bereich<select value={filters.areaCode ?? ''} onChange={(event) => setFilters({ ...filters, areaCode: (event.target.value || undefined) as QuestionFilters['areaCode'] })}><option value="">Alle</option>{taxonomy.map((area) => <option key={area.code} value={area.code}>{area.code}</option>)}</select></label>
              <label className="field">Status<select value={filters.status ?? ''} onChange={(event) => setFilters({ ...filters, status: (event.target.value || undefined) as QuestionStatus | undefined })}><option value="">Alle</option><option value="draft">Entwurf</option><option value="published">Veröffentlicht</option><option value="archived">Archiviert</option></select></label>
            </div>
            <IonButton fill="outline" onClick={() => setSelected(null)}>Neue Frage</IonButton>
          </div>
          {questions.isLoading ? <LoadingState /> : <div className="admin-list">{questions.data?.map((question) => <article className="surface admin-row" key={question.id}><button style={{ border: 0, background: 'transparent', color: 'inherit', textAlign: 'left' }} onClick={() => setSelected(question)}><h3>{question.prompt || 'Unvollständiger Entwurf'}</h3><p>Bereich {findAreaForSubject(question.subjectId)?.code ?? '–'} · V{question.version} · <span className="status">{statusLabel[question.status]}</span>{question.testData ? ' · TESTDATEN' : ''}</p></button>{question.status !== 'archived' && <IonButton color="danger" fill="clear" onClick={() => void archive(question)} aria-label="Frage archivieren"><IonIcon icon={trashOutline} /></IonButton>}</article>)}</div>}
        </section>
        <QuestionEditor selected={selected} onSaved={refresh} />
      </div>
    )}
  </AppPage>;
}
