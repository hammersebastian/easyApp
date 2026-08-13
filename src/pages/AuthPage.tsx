import { IonButton, IonContent, IonPage, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { useState, type FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import { appConfig } from '../config/appConfig';
import { useAuth } from '../contexts/AuthContext';
import { authSchema, registrationSchema } from '../domain/schemas';

type Mode = 'login' | 'register' | 'reset';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp, requestReset } = useAuth();
  const history = useHistory();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'reset') {
        const parsed = authSchema.pick({ email: true }).parse({ email });
        await requestReset(parsed.email);
        setMessage('Wenn ein Konto existiert, wurde eine E-Mail zum Zurücksetzen versendet.');
      } else if (mode === 'register') {
        const parsed = registrationSchema.parse({ email, password, displayName });
        const result = await signUp(parsed);
        if (result.needsVerification) {
          setMessage('Bitte bestätige deine E-Mail-Adresse und melde dich anschließend an.');
          setMode('login');
        } else {
          history.replace('/home');
        }
      } else {
        const parsed = authSchema.parse({ email, password });
        await signIn(parsed.email, parsed.password);
        history.replace('/home');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Die Anfrage konnte nicht verarbeitet werden.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <main className="page-container auth-layout">
          <section className="surface auth-card" aria-labelledby="auth-title">
            <img className="auth-logo" src={`${import.meta.env.BASE_URL}assets/logo.png`} alt={appConfig.productName} />
            <IonSegment
              value={mode === 'reset' ? 'login' : mode}
              onIonChange={(event) => setMode(event.detail.value as Mode)}
              aria-label="Zugang wählen"
            >
              <IonSegmentButton value="login"><IonLabel>Anmelden</IonLabel></IonSegmentButton>
              <IonSegmentButton value="register"><IonLabel>Registrieren</IonLabel></IonSegmentButton>
            </IonSegment>
            <form className="form-grid" onSubmit={submit} style={{ marginTop: 22 }} noValidate>
              <div>
                <span className="eyebrow">{mode === 'register' ? 'Neues Konto' : mode === 'reset' ? 'Kontozugang' : 'Willkommen zurück'}</span>
                <h1 id="auth-title">{mode === 'register' ? 'Konto erstellen' : mode === 'reset' ? 'Passwort zurücksetzen' : 'Einloggen'}</h1>
              </div>
              {mode === 'register' && (
                <label className="field">Anzeigename
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" required />
                </label>
              )}
              <label className="field">E-Mail-Adresse
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </label>
              {mode !== 'reset' && (
                <label className="field">Passwort
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required />
                  {mode === 'register' && <span className="field-hint">Mindestens 8 Zeichen</span>}
                </label>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}
              {message && <p className="success-text" role="status">{message}</p>}
              <IonButton type="submit" expand="block" disabled={busy}>
                {busy ? 'Bitte warten …' : mode === 'register' ? 'Kostenlos registrieren' : mode === 'reset' ? 'Link anfordern' : 'Einloggen'}
              </IonButton>
              {mode === 'login' && <IonButton fill="clear" type="button" onClick={() => setMode('reset')}>Passwort vergessen?</IonButton>}
              {mode === 'reset' && <IonButton fill="clear" type="button" onClick={() => setMode('login')}>Zurück zum Login</IonButton>}
              {appConfig.demoMode && (
                <p className="field-hint">Demo: Beliebige Zugangsdaten funktionieren. Für die Adminansicht eine E-Mail mit <code>admin+</code> beginnen.</p>
              )}
            </form>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}
