import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import type { ReactNode } from 'react';

interface AppPageProps {
  title: string;
  children: ReactNode;
  backHref?: string;
  actions?: ReactNode;
  className?: string;
}

export function AppPage({ title, children, backHref, actions, className }: AppPageProps) {
  return (
    <IonPage className={className}>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          {backHref && (
            <IonButtons slot="start">
              <IonBackButton defaultHref={backHref} text="" aria-label="Zurück" />
            </IonButtons>
          )}
          <IonTitle>{title}</IonTitle>
          {actions && <IonButtons slot="end">{actions}</IonButtons>}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <main className="page-container">{children}</main>
      </IonContent>
    </IonPage>
  );
}
