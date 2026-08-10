import { IonButton, IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, timerOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AppPage } from '../components/AppPage';
import { appConfig } from '../config/appConfig';
import { learningRepository } from '../repositories';

export function ExamIntroPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();

  const start = async () => {
    setBusy(true); setError('');
    try {
      const session = await learningRepository.startSession('exam');
      history.push(`/quiz/${session.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Simulation konnte nicht gestartet werden.');
    } finally { setBusy(false); }
  };

  return (
    <AppPage title="Prüfungssimulation" backHref="/home">
      <div className="page-container--narrow stack">
        <section className="surface">
          <span className="eyebrow">Lernstandssimulation</span>
          <h1>50 Fragen. Fünf Bereiche. Ein klarer Überblick.</h1>
          <p className="lead">Du erhältst zehn zufällige Fragen aus jedem Bereich. Während der Simulation zeigen wir keine Lösungen; die vollständige Auflösung folgt am Ende.</p>
        </section>
        <section className="surface stack">
          <div className="cluster"><IonIcon icon={timerOutline} /><div><strong>45 Sekunden je Frage</strong><br /><span className="muted">Ein Timeout zählt als falsche Antwort.</span></div></div>
          <div className="cluster"><IonIcon icon={checkmarkCircleOutline} /><div><strong>Interne 50/30-Logik</strong><br /><span className="muted">Mindestens vier Bereiche mit 50 %; kein weiterer unter 30 %.</span></div></div>
          <div className="cluster"><IonIcon icon={alertCircleOutline} /><div><strong>Keine originale IHK-Prüfung</strong><br /><span className="muted">Die App nutzt nur Single-Choice-Fragen und einen Lernspiel-Timer.</span></div></div>
        </section>
        {!appConfig.examEnabled && <p className="form-error">Die Simulation bleibt bis zu zehn fachlich freigegebenen Fragen je Bereich deaktiviert.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <IonButton expand="block" onClick={start} disabled={!appConfig.examEnabled || busy}>{busy ? 'Simulation wird vorbereitet …' : 'Simulation starten'}</IonButton>
      </div>
    </AppPage>
  );
}
