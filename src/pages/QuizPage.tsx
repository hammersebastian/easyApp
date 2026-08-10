import { IonAlert, IonButton, IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle, closeOutline, cloudOfflineOutline } from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { AppPage } from '../components/AppPage';
import { LoadingState } from '../components/LoadingState';
import type { AnswerResolution, LearnerQuestion, QuizMode } from '../domain/types';
import { getTimerState } from '../domain/timer';
import { platformAdapter } from '../platform/platformAdapter';
import { learningRepository } from '../repositories';

const answerLabels = ['A', 'B', 'C', 'D'];

function Timer({ question, stopped, onTimeout }: { question: LearnerQuestion; stopped: boolean; onTimeout: () => void }) {
  const initialMs = Math.max(0, Date.parse(question.deadlineAt) - Date.parse(question.serverNow));
  const startRef = useRef(performance.now());
  const [remainingMs, setRemainingMs] = useState(initialMs);
  const timeoutSent = useRef(false);

  useEffect(() => {
    startRef.current = performance.now();
    setRemainingMs(initialMs);
    timeoutSent.current = false;
  }, [initialMs, question.id]);

  useEffect(() => {
    if (stopped) return;
    const tick = () => {
      const next = Math.max(0, initialMs - (performance.now() - startRef.current));
      setRemainingMs(next);
      if (next === 0 && !timeoutSent.current) {
        timeoutSent.current = true;
        onTimeout();
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    const removeResume = platformAdapter.onResume(tick);
    return () => { window.clearInterval(interval); removeResume(); };
  }, [initialMs, onTimeout, stopped]);

  const { seconds, percent, urgency } = getTimerState(remainingMs, 0);
  return (
    <div className={`timer timer--${urgency}`} aria-live={seconds <= 15 ? 'polite' : 'off'}>
      <div className="timer__labels"><span>{seconds <= 15 ? 'Zeit wird knapp' : 'Antwortzeit'}</span><span>{seconds} Sekunden</span></div>
      <div className="timer__track" role="progressbar" aria-label="Verbleibende Antwortzeit" aria-valuenow={seconds} aria-valuemin={0} aria-valuemax={45}>
        <div className="timer__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function QuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const history = useHistory();
  const [question, setQuestion] = useState<LearnerQuestion | null>(null);
  const [mode, setMode] = useState<QuizMode>('training');
  const [resolution, setResolution] = useState<AnswerResolution | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectionLocked, setSelectionLocked] = useState(false);
  const [pendingKey, setPendingKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showClose, setShowClose] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(''); setResolution(null); setSelected(null); setSelectionLocked(false); setPendingKey('');
    try {
      const active = await learningRepository.getActiveSession();
      if (!active || active.id !== sessionId) {
        history.replace(`/results/${sessionId}`); return;
      }
      setMode(active.mode);
      const current = await learningRepository.getCurrentQuestion(sessionId);
      if (!current) history.replace(`/results/${sessionId}`); else setQuestion(current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Frage konnte nicht geladen werden.');
    } finally { setLoading(false); }
  }, [history, sessionId]);

  useEffect(() => { void load(); }, [load]);

  const submit = useCallback(async (index: number | null, retryKey?: string) => {
    if (!question || submitting || resolution) return;
    const key = retryKey || crypto.randomUUID();
    setSelected(index); setSelectionLocked(true); setPendingKey(key); setSubmitting(true); setError('');
    try {
      const result = await learningRepository.submitAnswer(sessionId, question.id, index, key);
      setResolution(result);
      if (result.isCorrect) void platformAdapter.hapticSuccess();
      if (mode === 'exam') {
        window.setTimeout(async () => {
          const session = await learningRepository.advanceSession(sessionId);
          if (session.status === 'completed') history.replace(`/results/${sessionId}`); else void load();
        }, 450);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Antwort konnte nicht gespeichert werden.');
    } finally { setSubmitting(false); }
  }, [history, load, mode, question, resolution, sessionId, submitting]);

  const timeout = useCallback(() => void submit(null), [submit]);
  const next = async () => {
    setSubmitting(true);
    try {
      const session = await learningRepository.advanceSession(sessionId);
      if (session.status === 'completed') history.replace(`/results/${sessionId}`); else await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Runde konnte nicht fortgesetzt werden.'); }
    finally { setSubmitting(false); }
  };
  const abandon = async () => {
    await learningRepository.abandonSession(sessionId);
    history.replace('/home');
  };

  const answerClass = useCallback((index: number) => {
    if (!resolution) return selected === index ? 'answer-card--selected' : '';
    if (resolution.correctIndex === index) return 'answer-card--correct';
    if (resolution.selectedIndex === index && !resolution.isCorrect) return 'answer-card--incorrect';
    return '';
  }, [resolution, selected]);
  const title = useMemo(() => mode === 'exam' ? 'Prüfungssimulation' : mode === 'mistakes' ? 'Fehler wiederholen' : 'Training', [mode]);

  if (loading) return <AppPage title={title}><LoadingState label="Frage wird vorbereitet …" /></AppPage>;
  if (!question) return <AppPage title={title}><p className="form-error">{error || 'Keine aktive Frage gefunden.'}</p></AppPage>;

  return (
    <AppPage title={title} actions={<IonButton fill="clear" onClick={() => setShowClose(true)} aria-label="Runde schließen"><IonIcon icon={closeOutline} /></IonButton>}>
      <div className="quiz-layout">
        <div className="quiz-meta"><span>Frage {question.position} von {question.total}</span><span>Bereich {question.areaCode} · {question.subjectName}</span></div>
        <Timer question={question} stopped={!!resolution || submitting} onTimeout={timeout} />
        <section className="surface question-card">
          <span className="eyebrow">{question.subjectName}</span>
          <h1>{question.prompt}</h1>
        </section>
        <div className="answer-list" role="group" aria-label="Antwortmöglichkeiten">
          {question.answers.map((answer, index) => (
            <button key={index} className={`answer-card ${answerClass(index)}`} disabled={submitting || !!resolution || selectionLocked} onClick={() => void submit(index)}>
              <span className="answer-key">{answerLabels[index]}</span><span>{answer}</span>
              {resolution?.correctIndex === index && <IonIcon icon={checkmarkCircle} aria-label="Richtige Antwort" />}
              {resolution?.selectedIndex === index && !resolution.isCorrect && <IonIcon icon={closeCircle} aria-label="Falsche Auswahl" />}
            </button>
          ))}
        </div>
        {submitting && <p className="muted" role="status">Antwort wird verbindlich gespeichert …</p>}
        {error && <section className="surface feedback feedback--danger" role="alert"><IonIcon icon={cloudOfflineOutline} /><p>{error}</p>{pendingKey && <IonButton onClick={() => void submit(selected, pendingKey)}>Erneut versuchen</IonButton>}</section>}
        {resolution && mode !== 'exam' && (
          <section className={`surface feedback ${resolution.isCorrect ? 'feedback--success' : 'feedback--danger'}`} aria-live="polite">
            <h2>{resolution.isCorrect ? 'Richtig beantwortet!' : resolution.timedOut ? 'Zeit abgelaufen' : 'Noch nicht ganz'}</h2>
            {resolution.explanation && <p>{resolution.explanation}</p>}
            <IonButton expand="block" onClick={next} disabled={submitting}>Weiter</IonButton>
          </section>
        )}
        {resolution && mode === 'exam' && <p className="surface" role="status">Antwort gespeichert. Die Auflösung folgt in der Auswertung.</p>}
      </div>
      <IonAlert isOpen={showClose} onDidDismiss={() => setShowClose(false)} header="Runde beenden?" message="Gespeicherte Antworten bleiben im Lernstand. Eine vollständige Auswertung wird nicht erstellt." buttons={[{ text: 'Weiterlernen', role: 'cancel' }, { text: 'Runde beenden', role: 'destructive', handler: () => void abandon() }]} />
    </AppPage>
  );
}
