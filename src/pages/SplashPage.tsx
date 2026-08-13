import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { appConfig } from '../config/appConfig';
import { useAuth } from '../contexts/AuthContext';

export function SplashPage() {
  const { user, loading } = useAuth();
  const history = useHistory();

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => history.replace(user ? '/home' : '/auth'), 650);
    return () => window.clearTimeout(timer);
  }, [history, loading, user]);

  return (
    <IonPage className="splash-page">
      <IonContent fullscreen>
        <div className="splash" role="status" aria-live="polite">
          <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt={appConfig.productName} />
          <p>Gut vorbereitet. Schritt für Schritt.</p>
          <IonSpinner name="crescent" aria-label="App wird gestartet" />
        </div>
      </IonContent>
    </IonPage>
  );
}
