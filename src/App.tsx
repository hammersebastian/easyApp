import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingState } from './components/LoadingState';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { ExamIntroPage } from './pages/ExamIntroPage';
import { HomePage } from './pages/HomePage';
import { LegalPage } from './pages/LegalPage';
import { ProfilePage } from './pages/ProfilePage';
import { PasswordResetPage } from './pages/PasswordResetPage';
import { ProgressPage } from './pages/ProgressPage';
import { QuizPage } from './pages/QuizPage';
import { ResultPage } from './pages/ResultPage';
import { SplashPage } from './pages/SplashPage';
import { TrainingComposerPage } from './pages/TrainingComposerPage';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { platformAdapter } from './platform/platformAdapter';

function NativeLinkHandler() {
  const history = useHistory();
  useEffect(() => platformAdapter.onDeepLink((url) => {
    if (url.includes('password-reset')) history.push('/auth/password-reset');
  }), [history]);
  return null;
}

function ProtectedRoute({ component: Component, admin = false, ...rest }: any) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState label="Sitzung wird geprüft …" />;
  return (
    <Route
      {...rest}
      render={(props) =>
        !user ? <Redirect to="/auth" /> : admin && user.role !== 'admin' ? <Redirect to="/home" /> : <Component {...props} />
      }
    />
  );
}

export default function App() {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter basename={import.meta.env.BASE_URL}>
          <NativeLinkHandler />
          <IonRouterOutlet>
            <Route exact path="/splash" component={SplashPage} />
            <Route exact path="/auth" component={AuthPage} />
            <Route exact path="/auth/password-reset" component={PasswordResetPage} />
            <ProtectedRoute exact path="/home" component={HomePage} />
            <ProtectedRoute exact path="/training" component={TrainingComposerPage} />
            <ProtectedRoute exact path="/exam" component={ExamIntroPage} />
            <ProtectedRoute exact path="/quiz/:sessionId" component={QuizPage} />
            <ProtectedRoute exact path="/results/:sessionId" component={ResultPage} />
            <ProtectedRoute exact path="/progress" component={ProgressPage} />
            <ProtectedRoute exact path="/profile" component={ProfilePage} />
            <ProtectedRoute exact path="/legal/:document" component={LegalPage} />
            <ProtectedRoute path="/admin" component={AdminPage} admin />
            <Redirect exact from="/" to="/splash" />
            <Redirect to="/home" />
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}
