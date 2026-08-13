# 34d-Lernapp

Ionic-React-MVP zur Vorbereitung auf den schriftlichen Teil der Sachkundeprüfung Versicherungsvermittlung nach § 34d GewO. Eine Codebasis liefert PWA, iOS- und Android-App; Supabase übernimmt Authentifizierung, PostgreSQL, RLS und die serverautoritativ bewerteten Quizabläufe.

> Der Produktname, die App-IDs und sämtliche Rechtstexte sind Platzhalter. Die enthaltenen Entwicklungsfragen sind ausdrücklich keine fachlich geprüften Inhalte.

## Umgesetzter Umfang

- Registrierung, E-Mail-Verifikation, Login, Passwortreset, persistente Sitzung, Profil, Logout und Kontolöschung
- geschützte Rollen `learner` und `admin` mit serverseitiger Durchsetzung
- kanonische Bereiche A–E mit allen festgelegten Sparten
- Training aus frei kombinierten Sparten mit exakt zehn eindeutigen Fragen
- serverautoritatives Zeitfenster von 45 Sekunden und idempotente Antwortabgabe
- unmittelbare Auflösung im Training, zurückgehaltene Lösung in der Simulation
- persönlicher Fehlerpool und gezielte Wiederholung von einer bis zehn Fragen
- Trefferquote, Lernstand, Abdeckung, Bereichs-/Spartenwerte, Rundenhistorie und versionstreue Details
- Prüfungssimulation mit zehn Fragen je Bereich und vollständig getesteter 50/30-Logik
- responsive Adminoberfläche mit Entwürfen, Veröffentlichung, Archivierung, Versionen, Quellen, Reviewhinweisen, JSON-Importvorschau und UTF-8-Export
- installierbare PWA, Capacitor-Plattformadapter, Deep Links, Netzwerk-/Lifecycle-Behandlung, Reduced Motion und WCAG-orientierte Semantik
- SQL-Migrationen, RLS-Policies, Audit-Log, pgTAP-Tests, Vitest, Playwright sowie Web-/Datenbank-/Native-CI

Die fachliche Quelle der Wahrheit liegt unter [`openspec/changes/build-34d-learning-mvp`](openspec/changes/build-34d-learning-mvp). Der Change bleibt bis zu einer erfolgreichen CI- und manuellen Abnahme unarchiviert.

## Voraussetzungen auf einem Entwicklungsrechner

- Node.js 24
- pnpm 11.16
- Docker-kompatible Runtime und Supabase CLI für das lokale Backend
- Xcode für iOS beziehungsweise JDK 21 und Android SDK für Android

In diesem Repository wurden bei der Erstellung bewusst keine Projektabhängigkeiten lokal installiert. Deshalb wird der Lockfile beim ersten Setup auf dem Prüf-/CI-Rechner erzeugt; sämtliche direkten Abhängigkeiten sind in `package.json` exakt gepinnt. Nach der ersten erfolgreichen CI-Ausführung sollte `pnpm-lock.yaml` committed und CI auf `pnpm install --frozen-lockfile` umgestellt werden.

## Lokaler Start auf einem anderen Rechner

```bash
pnpm install --no-frozen-lockfile
cp .env.example .env.local
supabase start
supabase db reset
pnpm dev:supabase
```

Supabase gibt nach `supabase start` die lokale URL und den Anon-Key aus. Beide Werte gehören in `.env.local`. Geheimnisse und Service-Role-Keys dürfen nicht mit `VITE_` veröffentlicht oder committed werden.

`pnpm dev` startet ohne Konfiguration den klar gekennzeichneten Demo-Modus. `pnpm dev:supabase` verwendet `.env.local` und prüft die echte Supabase-Integration.

## Kunden-Demo über GitHub Pages

Der Workflow `.github/workflows/deploy-pages.yml` veröffentlicht bei jedem Push auf `main` automatisch den Demo-Modus. Im GitHub-Repository einmalig unter **Settings → Pages → Build and deployment → Source** den Eintrag **GitHub Actions** auswählen. Anschließend ist die App unter `https://<github-name>.github.io/<repository>/` erreichbar. Alternativ lässt sich der Workflow im Tab **Actions** manuell starten.

Die Demo verwendet ausschließlich technische Testdaten und speichert Änderungen lokal im Browser. Beliebige Zugangsdaten funktionieren; eine mit `admin+` beginnende E-Mail schaltet die Demo-Adminansicht frei.

### Lokalen Admin freischalten

Nach der Registrierung kann ein lokaler Nutzer ausschließlich über die Datenbank zur Adminrolle hochgestuft werden:

```sql
update public.profiles set role = 'admin' where user_id = '<AUTH-USER-UUID>';
```

Im Demo-Modus erhält eine Adresse, die mit `admin+` beginnt, ausschließlich zu UI-Testzwecken die Adminrolle.

## Konfiguration

| Variable | Zweck |
|---|---|
| `VITE_DEMO_MODE` | Nicht produktiver In-Browser-Adapter mit technischen Testdaten |
| `VITE_PRODUCT_NAME` | Sichtbarer, austauschbarer Produktname |
| `VITE_SUPABASE_URL` | API-URL des jeweiligen Supabase-Projekts |
| `VITE_SUPABASE_ANON_KEY` | Veröffentlichbarer Anon-Key; niemals Service Role |
| `VITE_PUBLIC_WEB_URL` | Basis für Passwortreset und direkte Webrouten |
| `VITE_SUPPORT_EMAIL` | Supportkontakt in Profil und Rechtstexten |
| `VITE_LEGAL_PROVIDER` | Betreiber-Platzhalter im Impressum |
| `VITE_EXAM_ENABLED` | Release-Gate für den fachlich freigegebenen 50-Fragen-Bestand |
| `CAPACITOR_APP_ID` | Bundle Identifier und Android Application ID |
| `CAPACITOR_APP_NAME` | Nativer Anzeigename |

Staging und Produktion starten absichtlich mit deaktivierter Prüfungssimulation. Die Freischaltung ist erst nach mindestens zehn fachlich freigegebenen Fragen pro Bereich zulässig.

## Fragenimport

Die Adminoberfläche akzeptiert ein einzelnes Objekt oder ein Array. Jeder Datensatz enthält mindestens:

```json
{
  "frage": "Fragetext",
  "antworten": ["Antwort A", "Antwort B", "Antwort C", "Antwort D"],
  "richtige_antwort": 0,
  "sparte": "Pflegeversicherung",
  "erklärung": "Begründung",
  "änderungsanfällig": false
}
```

Importe werden normalisiert und atomar als Entwürfe gespeichert. Veröffentlichung verlangt zusätzlich Quelle, Prüfdatum, positive Version und Prüfverantwortung. Änderungsanfällige genaue Zahlen sind nur in A/B mit Quelle und nächstem Prüfdatum zulässig.

## Sicherheitsmodell

- Der Client liest keine Lösungen aus der Fragentabelle. `get_current_question` liefert ausschließlich lernendensichere Daten.
- `quiz_session_questions` enthält versionierte Snapshots, ist aber für Lernende per RLS und Tabellenprivileg gesperrt.
- Training liefert Lösung und Erklärung erst nach einer verbindlichen Antwort. Im Prüfungsmodus bleiben sie bis zum Sitzungsabschluss verborgen.
- Antwortabgabe ist durch `(session_id, question_id)` und einen Idempotency-Key gegen Doppeltipps und Retries abgesichert.
- Alle Schreiboperationen an Quiz- und Adminobjekten laufen über `security definer`-Funktionen mit expliziter Nutzer-/Rollenprüfung.
- Native Supabase-Sitzungen verwenden Keychain/Android Keystore über `capacitor-secure-storage-plugin`; die PWA verwendet die vorgesehene Browserpersistenz.
- Der Service Worker precacht nur App-Shell und statische Assets. Auth-, Quiz-, Lösungs- und personenbezogene API-Antworten haben keine Runtime-Cache-Regel.
- Technisches Logging enthält keine E-Mail-Adressen, Fragen, Antworten oder Tokens.

## Qualität und CI

```bash
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm build
pnpm test:e2e
supabase test db
```

`ci.yml` prüft TypeScript, ESLint, Unit-/Coverage-Tests, Produktionsbuild, Playwright in Chromium und WebKit sowie Migrationen und pgTAP-Sicherheitstests. `native-smoke.yml` erzeugt die Capacitor-Plattformprojekte reproduzierbar und führt Gradle-/Xcode-Smoke-Builds aus.

## Release-Gates

- finaler Name, Markenfreigabe, Bundle-/App-IDs, Domains und Deep Links
- Supabase-Projekt in bestätigter EU-Region und Datenschutzvertrag
- juristisch geprüfte Datenschutz-, Impressums- und Nutzungsinhalte sowie Supportkontakt
- mindestens zehn fachlich freigegebene Fragen je Bereich
- Store-Icons, Screenshots, Signierung und Veröffentlichungskonten
- erfolgreiche CI, Geräte-Smoke-Tests, Screenreader-/Tastaturprüfung und Security Review

Die Simulation ist eine Lernstandssimulation mit ausschließlich Single-Choice-Fragen. Sie ist keine originalgetreue IHK-Prüfungssoftware und gibt keine Bestehensgarantie.
