import { IonIcon } from '@ionic/react';
import { flaskOutline } from 'ionicons/icons';
import { appConfig } from '../config/appConfig';

export function DemoBanner() {
  if (!appConfig.demoMode) return null;
  return (
    <div className="demo-banner" role="note">
      <IonIcon icon={flaskOutline} aria-hidden="true" />
      Demo-Modus: Deine Daten bleiben lokal auf diesem Gerät.
    </div>
  );
}
