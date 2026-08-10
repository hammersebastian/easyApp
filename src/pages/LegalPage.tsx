import { useParams } from 'react-router-dom';
import { AppPage } from '../components/AppPage';
import { appConfig } from '../config/appConfig';

const documents = {
  privacy: { title: 'Datenschutz', body: <>Diese Seite ist ein konfigurierbarer Platzhalter. Vor einer öffentlichen Veröffentlichung müssen Datenverarbeitung, Rechtsgrundlagen, Empfänger, EU-Hosting, Löschfristen und Betroffenenrechte rechtlich geprüft ergänzt werden.</> },
  imprint: { title: 'Impressum', body: <>Betreiber: <strong>{appConfig.legalProvider}</strong><br />Kontakt: {appConfig.supportEmail}<br /><br />Alle gesetzlich erforderlichen Anbieterangaben sind vor Veröffentlichung zu ergänzen.</> },
  terms: { title: 'Nutzungsbedingungen', body: <>Diese Anwendung unterstützt eigenverantwortliches Lernen. Verfügbarkeit, zulässige Nutzung, Haftungsgrenzen und Kontoregeln werden vor Veröffentlichung ergänzt und rechtlich geprüft.</> },
  disclaimer: { title: 'Lernhinweis', body: <>Die App verwendet ausschließlich Single-Choice-Fragen und bildet die echte IHK-Prüfung weder in Aufgabenarten noch Zeitvorgaben originalgetreu ab. Inhalte können sich ändern. Die Anwendung gibt keine Bestehensgarantie und ist kein Angebot der IHK.</> },
};

export function LegalPage() {
  const { document } = useParams<{ document: keyof typeof documents }>();
  const content = documents[document] ?? documents.disclaimer;
  return <AppPage title={content.title} backHref="/profile"><div className="page-container--narrow"><article className="surface"><span className="eyebrow">Stand: Platzhalter</span><h1>{content.title}</h1><p className="lead">{content.body}</p></article></div></AppPage>;
}
