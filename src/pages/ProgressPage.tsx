import { IonButton } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AppPage } from '../components/AppPage';
import { LoadingState } from '../components/LoadingState';
import { StatCard } from '../components/StatCard';
import { learningRepository } from '../repositories';

export function ProgressPage() {
  const progress = useQuery({ queryKey: ['progress'], queryFn: () => learningRepository.getProgress() });
  if (progress.isLoading) return <AppPage title="Lernstand" backHref="/home"><LoadingState /></AppPage>;
  if (!progress.data) return <AppPage title="Lernstand" backHref="/home"><p className="form-error">Lernstand konnte nicht geladen werden.</p></AppPage>;
  const data = progress.data;
  if (!data.totalAttempts) return (
    <AppPage title="Lernstand" backHref="/home"><div className="page-container--narrow"><section className="surface center-state"><h1>Dein Lernweg beginnt hier</h1><p>Noch sind keine Antworten gespeichert. Nach deiner ersten Runde siehst du hier deinen persönlichen Fortschritt.</p><IonButton routerLink="/training">Erstes Training starten</IonButton></section></div></AppPage>
  );
  return (
    <AppPage title="Lernstand" backHref="/home">
      <div className="stack">
        <div className="stats-grid">
          <StatCard label="Lernstand" value={`${data.learningLevel ?? 0} %`} helper="Aktuell veröffentlichte Fragen" />
          <StatCard label="Trefferquote" value={`${data.accuracy ?? 0} %`} helper="Alle Versuche" />
          <StatCard label="Abdeckung" value={`${data.coverage ?? 0} %`} helper={`${data.attemptedQuestions} verschiedene Fragen`} />
          <StatCard label="Fehlerpool" value={`${data.mistakeCount}`} helper="Letzter Versuch falsch" />
        </div>
        <section className="surface">
          <h2>Bereiche</h2>
          <div className="progress-list">{data.areas.map((area) => (
            <div className="progress-row" key={area.id}><span>{area.label}</span><div className="progress-bar"><span style={{ width: `${area.learningLevel ?? 0}%` }} /></div><strong>{area.learningLevel === null ? '–' : `${area.learningLevel} %`}</strong></div>
          ))}</div>
        </section>
        <section className="surface">
          <h2>Sparten</h2>
          <div className="progress-list">{data.subjects.map((subject) => (
            <div className="progress-row" key={subject.id}><span>{subject.label}</span><div className="progress-bar"><span style={{ width: `${subject.learningLevel ?? 0}%` }} /></div><strong>{subject.learningLevel === null ? '–' : `${subject.learningLevel} %`}</strong></div>
          ))}</div>
        </section>
        <section className="surface">
          <h2>Letzte Runden</h2>
          {data.recentSessions.length ? <div className="admin-list">{data.recentSessions.map((session) => (
            <Link className="admin-row" to={`/results/${session.sessionId}`} key={session.sessionId}><span><strong>{session.mode === 'exam' ? 'Simulation' : session.mode === 'mistakes' ? 'Fehlertraining' : 'Training'}</strong><br /><small className="muted">{session.completedAt ? new Date(session.completedAt).toLocaleString('de-DE') : ''}</small></span><strong>{session.percentage} %</strong></Link>
          ))}</div> : <p className="muted">Noch keine abgeschlossenen Runden.</p>}
        </section>
      </div>
    </AppPage>
  );
}
