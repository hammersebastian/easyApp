import { IonSpinner } from '@ionic/react';

export function LoadingState({ label = 'Wird geladen …' }: { label?: string }) {
  return (
    <div className="center-state" role="status" aria-live="polite">
      <IonSpinner name="crescent" />
      <p>{label}</p>
    </div>
  );
}
