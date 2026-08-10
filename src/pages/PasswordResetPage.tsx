import { IonButton } from '@ionic/react';
import { useState, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import { AppPage } from '../components/AppPage';
import { useAuth } from '../contexts/AuthContext';

export function PasswordResetPage() {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { updatePassword } = useAuth();
  const history = useHistory();
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (password.length < 8) return setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
    if (password !== repeat) return setError('Die Passwörter stimmen nicht überein.');
    setBusy(true);
    try { await updatePassword(password); history.replace('/home'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Passwort konnte nicht geändert werden.'); }
    finally { setBusy(false); }
  };
  return <AppPage title="Neues Passwort"><div className="page-container--narrow"><section className="surface"><h1>Neues Passwort festlegen</h1><form className="form-grid" onSubmit={submit}><label className="field">Neues Passwort<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="field">Passwort wiederholen<input type="password" autoComplete="new-password" value={repeat} onChange={(event) => setRepeat(event.target.value)} /></label>{error && <p className="form-error">{error}</p>}<IonButton type="submit" disabled={busy}>{busy ? 'Speichert …' : 'Passwort ändern'}</IonButton></form></section></div></AppPage>;
}
