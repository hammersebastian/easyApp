import { IonIcon } from '@ionic/react';
import { flaskOutline } from 'ionicons/icons';
import { appConfig } from '../config/appConfig';

export function DemoBanner() {
  if (!appConfig.demoMode) return null;
  return (
    <div className="demo-banner" role="note">
      <IonIcon icon={flaskOutline} aria-hidden="true" />
      Demo-Modus: Alle Fragen sind technische Testdaten und nicht fachlich geprüft.
    </div>
  );
}
