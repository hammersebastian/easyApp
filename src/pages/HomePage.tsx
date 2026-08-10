import { IonButton, IonIcon } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import {
  alertCircleOutline,
  arrowForwardOutline,
  barChartOutline,
  peopleOutline,
  playOutline,
  refreshOutline,
  schoolOutline,
  settingsOutline,
} from 'ionicons/icons';
import { Link, useHistory } from 'react-router-dom';
import { AppPage } from '../components/AppPage';
import { DemoBanner } from '../components/DemoBanner';
import { LoadingState } from '../components/LoadingState';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { learningRepository } from '../repositories';

export function HomePage() {
  const { user } = useAuth();
  const history = useHistory();
  const progress = useQuery({ queryKey: ['progress'], queryFn: () => learningRepository.getProgress() });
  const active = useQuery({ queryKey: ['active-session'], queryFn: () => learningRepository.getActiveSession() });

  const startMistakes = async () => {
    const session = await learningRepository.startSession('mistakes');
    history.push(`/quiz/${session.id}`);
  };

  return (
    <AppPage
      title="Übersicht"
      actions={<IonButton fill="clear" routerLink="/profile" aria-label="Profil öffnen"><IonIcon icon={settingsOutline} /></IonButton>}
    >
      <DemoBanner />
      <section className="surface home-hero">
        <span className="eyebrow">Dein Lernraum</span>
        <h1>Hallo, {user?.displayName}.</h1>
        <p>Eine gute Vorbereitung entsteht nicht auf einmal – sondern mit jeder beantworteten Frage.</p>
      </section>

      {progress.isLoading ? <LoadingState /> : progress.data ? (
        <section aria-labelledby="summary-title">
          <div className="spread">
            <h2 id="summary-title" className="section-title">Dein Lernstand</h2>
            <Link to="/progress">Alle Details</Link>
          </div>
          <div className="stats-grid">
            <StatCard label="Lernstand" value={progress.data.learningLevel === null ? '–' : `${progress.data.learningLevel} %`} helper="Letzter Versuch richtig" icon={<IonIcon icon={schoolOutline} />} />
            <StatCard label="Trefferquote" value={progress.data.accuracy === null ? '–' : `${progress.data.accuracy} %`} helper={`${progress.data.totalAttempts} Versuche`} icon={<IonIcon icon={barChartOutline} />} />
            <StatCard label="Bearbeitet" value={`${progress.data.attemptedQuestions}`} helper={`von ${progress.data.publishedQuestions} Fragen`} icon={<IonIcon icon={playOutline} />} />
            <StatCard label="Offene Fehler" value={`${progress.data.mistakeCount}`} helper="Gezielt wiederholen" icon={<IonIcon icon={alertCircleOutline} />} />
          </div>
        </section>
      ) : null}

      {active.data && (
        <section className="surface spread" style={{ marginTop: 20 }}>
          <div><span className="eyebrow">Offene Runde</span><h2 style={{ margin: '5px 0' }}>Dort weitermachen, wo du warst</h2></div>
          <IonButton onClick={() => history.push(`/quiz/${active.data!.id}`)}>Fortsetzen</IonButton>
        </section>
      )}

      <h2 className="section-title">Was möchtest du tun?</h2>
      <nav className="menu-grid" aria-label="Lernmodi">
        <Link className="menu-card" to="/training">
          <span className="menu-card__icon"><IonIcon icon={playOutline} /></span>
          <span><h3>Trainieren</h3><p>Stelle deine persönliche Runde aus Bereichen und Sparten zusammen.</p></span>
          <IonIcon icon={arrowForwardOutline} />
        </Link>
        <button className="menu-card" onClick={startMistakes} disabled={!progress.data?.mistakeCount}>
          <span className="menu-card__icon"><IonIcon icon={refreshOutline} /></span>
          <span><h3>Fehler wiederholen</h3><p>{progress.data?.mistakeCount ? `${progress.data.mistakeCount} offene Fragen warten auf dich.` : 'Gerade keine offenen Fehler – stark!'}</p></span>
          <IonIcon icon={arrowForwardOutline} />
        </button>
        <Link className="menu-card" to="/exam">
          <span className="menu-card__icon"><IonIcon icon={schoolOutline} /></span>
          <span><h3>Prüfungssimulation</h3><p>50 Fragen, zehn je Bereich, mit Auswertung am Ende.</p></span>
          <IonIcon icon={arrowForwardOutline} />
        </Link>
        <div className="menu-card menu-card--disabled" aria-disabled="true">
          <span className="menu-card__icon"><IonIcon icon={peopleOutline} /></span>
          <span><h3>Gegen Freunde spielen</h3><p>Gemeinsam lernen und vergleichen.</p></span>
          <span className="badge">Demnächst verfügbar</span>
        </div>
      </nav>
    </AppPage>
  );
}
