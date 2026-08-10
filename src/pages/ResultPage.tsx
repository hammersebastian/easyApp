import { IonButton, IonIcon } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { checkmarkCircle, closeCircle, timeOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { AppPage } from '../components/AppPage';
import { LoadingState } from '../components/LoadingState';
import { learningRepository } from '../repositories';

const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} Min.`;

export function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const result = useQuery({ queryKey: ['session-result', sessionId], queryFn: () => learningRepository.getSessionResult(sessionId) });
  if (result.isLoading) return <AppPage title="Auswertung" backHref="/home"><LoadingState label="Auswertung wird geladen …" /></AppPage>;
  if (result.error || !result.data) return <AppPage title="Auswertung" backHref="/home"><p className="form-error">Auswertung konnte nicht geladen werden.</p></AppPage>;
  const data = result.data;
  return (
    <AppPage title="Auswertung" backHref="/home">
      <div className="page-container--narrow stack">
        <section className="surface result-score">
          <span className="eyebrow">{data.mode === 'exam' ? 'Prüfungssimulation' : 'Runde abgeschlossen'}</span>
          {data.mode === 'exam' && <h1>{data.passed ? 'Simulation bestanden' : 'Simulation nicht bestanden'}</h1>}
          <strong>{data.percentage} %</strong>
          <p>{data.correct} von {data.total} Fragen richtig</p>
        </section>
        <div className="stats-grid">
          <article className="stat-card"><span className="muted">Richtig</span><strong>{data.correct}</strong></article>
          <article className="stat-card"><span className="muted">Falsch</span><strong>{data.incorrect}</strong></article>
          <article className="stat-card"><span className="muted">Gesamtzeit</span><strong>{formatDuration(data.durationSeconds)}</strong></article>
          <article className="stat-card"><span className="muted">Ø Antwort</span><strong>{data.averageResponseSeconds} s</strong></article>
        </div>
        {data.mode === 'exam' && (
          <section className="surface">
            <h2>Ergebnis nach Bereichen</h2>
            <div className="progress-list">{Object.entries(data.areaScores).map(([code, score]) => (
              <div className="progress-row" key={code}><span>Bereich {code}</span><div className="progress-bar"><span style={{ width: `${score}%` }} /></div><strong>{score} %</strong></div>
            ))}</div>
            <p className="field-hint">Interne Lernstandssimulation nach 50/30-Logik. Keine originale IHK-Prüfung oder Bestehensgarantie.</p>
          </section>
        )}
        <section>
          <h2 className="section-title">Antwortdetails</h2>
          <div className="detail-list">{data.answers.map((answer, index) => (
            <article className={`surface answer-detail ${answer.isCorrect ? 'answer-detail--correct' : ''}`} key={`${answer.questionId}-${index}`}>
              <div className="cluster"><IonIcon icon={answer.isCorrect ? checkmarkCircle : closeCircle} /><strong>Frage {index + 1} · Bereich {answer.areaCode}</strong>{answer.timedOut && <span className="badge"><IonIcon icon={timeOutline} /> Timeout</span>}</div>
              <h3>{answer.prompt}</h3>
              <p><strong>Deine Antwort:</strong> {answer.selectedIndex === null ? 'Keine Antwort' : answer.answers[answer.selectedIndex]}</p>
              {!answer.isCorrect && <p><strong>Richtige Antwort:</strong> {answer.answers[answer.correctIndex]}</p>}
              <p className="muted">{answer.explanation}</p>
            </article>
          ))}</div>
        </section>
        <IonButton expand="block" routerLink="/home">Zurück zur Übersicht</IonButton>
      </div>
    </AppPage>
  );
}
