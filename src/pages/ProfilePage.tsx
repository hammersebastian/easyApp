import { IonAlert, IonButton } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppPage } from '../components/AppPage';
import { appConfig } from '../config/appConfig';
import { useAuth } from '../contexts/AuthContext';

export function ProfilePage() {
  const { user, updateDisplayName, signOut, deleteAccount } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const history = useHistory();
  const profileSchema = z.object({ displayName: z.string().trim().min(2, 'Bitte mindestens zwei Zeichen eingeben.').max(80) });
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema), defaultValues: { displayName: user?.displayName ?? '' },
  });
  const save = async ({ displayName }: z.infer<typeof profileSchema>) => {
    setError('');
    try { await updateDisplayName(displayName); setMessage('Profil gespeichert.'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Profil konnte nicht gespeichert werden.'); }
  };
  const logout = async () => { await signOut(); history.replace('/auth'); };
  const remove = async () => { await deleteAccount(); history.replace('/auth'); };
  return (
    <AppPage title="Profil & Einstellungen" backHref="/home">
      <div className="page-container--narrow stack">
        <section className="surface">
          <span className="eyebrow">Persönliche Daten</span><h1>{user?.displayName}</h1><p className="muted">{user?.email}</p>
          <form className="form-grid" onSubmit={handleSubmit(save)}>
            <label className="field">Anzeigename<input {...register('displayName')} maxLength={80} /></label>
            {errors.displayName && <p className="error-text">{errors.displayName.message}</p>}
            {error && <p className="form-error">{error}</p>}{message && <p className="success-text">{message}</p>}
            <IonButton type="submit">Änderung speichern</IonButton>
          </form>
        </section>
        {user?.role === 'admin' && <section className="surface spread"><div><strong>Adminbereich</strong><p className="muted">Fragenbestand und Reviews verwalten</p></div><IonButton routerLink="/admin">Öffnen</IonButton></section>}
        <section className="surface stack">
          <h2>Rechtliches & Hilfe</h2>
          <IonButton fill="outline" routerLink="/legal/privacy">Datenschutz</IonButton>
          <IonButton fill="outline" routerLink="/legal/imprint">Impressum</IonButton>
          <IonButton fill="outline" routerLink="/legal/terms">Nutzungsbedingungen</IonButton>
          <IonButton fill="outline" routerLink="/legal/disclaimer">Lernhinweis</IonButton>
          <p className="field-hint">Kontakt: {appConfig.supportEmail}</p>
        </section>
        <section className="surface stack">
          <IonButton fill="outline" onClick={logout}>Ausloggen</IonButton>
          <IonButton color="danger" fill="clear" onClick={() => setConfirmDelete(true)}>Konto und Lernhistorie löschen</IonButton>
        </section>
      </div>
      <IonAlert isOpen={confirmDelete} onDidDismiss={() => setConfirmDelete(false)} header="Konto endgültig löschen?" message="Profil und personenbezogene Lernhistorie werden gelöscht oder anonymisiert. Dieser Vorgang kann nicht rückgängig gemacht werden." buttons={[{ text: 'Abbrechen', role: 'cancel' }, { text: 'Endgültig löschen', role: 'destructive', handler: () => void remove() }]} />
    </AppPage>
  );
}
