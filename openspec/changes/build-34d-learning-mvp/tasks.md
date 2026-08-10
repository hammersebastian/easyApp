# Tasks: 34d-Lernapp MVP

## 1. Repository and Delivery Foundations

- [ ] 1.1 Ionic-React-Projekt mit TypeScript, Vite und Strict Mode initialisieren; Capacitor konfigurieren und die nativen Projekte für iOS und Android hinzufügen. (`UI-001`)
- [ ] 1.2 Umgebungen `local`, `staging` und `production` mit getrennten Supabase-Konfigurationen und geheimnisfreier Build-Konfiguration einrichten.
- [ ] 1.3 CI für pnpm-Lockfile, Formatierung, ESLint, TypeScript-Prüfung, Vitest-/React-Testing-Library-Tests, Playwright, Vite-Webbuild, Capacitor-Synchronisierung sowie Xcode-/Gradle-Smoke-Builds einrichten.
- [ ] 1.4 OpenSpec-Artefakte in das App-Repository übernehmen und den Change vor Implementierungsbeginn validieren.
- [ ] 1.5 Konfigurierbare Platzhalter für Produktname, Bundle Identifier, Android Application ID, PWA-Metadaten und öffentliche URLs schaffen. (`UI-010`)
- [ ] 1.6 Ionic, React, React Router und Capacitor in gegenseitig kompatiblen stabilen Versionen festlegen, im Lockfile fixieren und unabhängige Router-Upgrades durch eine Dependency-Regel verhindern.

## 2. Design System and Application Shell

- [ ] 2.1 Das gelieferte Logo als optimierte, korrekt skalierte Assets für Splash, Header und PWA einbinden; Original unverändert aufbewahren. (`UI-002`, `UI-003`)
- [ ] 2.2 Ionic Theme Variables und eigene CSS Custom Properties mit `#BFE560`, `#3C806B`, semantischen Erfolgs-/Fehler-/Warnfarben, Typografie, Abständen, Radien, Safe Areas und Elevation definieren und Kontrast automatisiert prüfen. (`UI-003`)
- [ ] 2.3 Wiederverwendbare Ionic-React-Komponenten für Frage-, Antwort-, Menü-, Statistik- und Feedbackkarten implementieren; jede Route korrekt mit Ionic-Seitenstruktur aufbauen. (`UI-004`)
- [ ] 2.4 Navigation mit `IonReactRouter`, `IonRouterOutlet`, der kompatiblen React-Router-Version, Auth-Guards und Routen für Splash, Auth, Hauptmenü, Training, Fehlertraining, Simulation, Ergebnis, Profil und Adminbereich einrichten. (`UI-002`, `AUTH-005`)
- [ ] 2.5 Responsive Breakpoints, Tastaturfokus, Screenreader-Semantik, große Schrift und Reduced Motion in Komponenten und Tests abdecken. (`UI-005`, `UI-006`)
- [ ] 2.6 PWA-Manifest, Icons, versionierten Service Worker, Start-URL und serverseitigen History-Fallback konfigurieren; Auth-, Quiz- und Lösungspayloads ausdrücklich vom Cache ausschließen und Installierbarkeit testen. (`UI-007`)
- [ ] 2.7 Capacitor-Plattformadapter für App-Lebenszyklus, Deep Links, Netzwerkstatus, Hardware-Zurück und optionale Haptik implementieren; direkte Pluginaufrufe aus Seiten verhindern.

## 3. Supabase Schema, Security and Seed Data

- [ ] 3.1 Migrationen für `profiles`, `areas`, `subjects`, `questions`, `question_sources`, `question_versions`, `quiz_sessions`, `quiz_session_questions`, `answer_attempts`, `user_question_stats` und `admin_audit_log` erstellen.
- [ ] 3.2 Datenbank-Constraints für vier Antworten, richtigen Index 0–3, Statuswerte, Versionen, eindeutige Versuche und referenzielle Integrität implementieren. (`CAT-002`, `CAT-003`, `PRG-001`)
- [ ] 3.3 Die fünf Bereiche und alle vorgegebenen Sparten in stabiler Reihenfolge seeden. (`CAT-001`)
- [ ] 3.4 RLS-Policies für anonym, learner und admin erstellen; fremde Lerndaten, Adminfelder und unveröffentlichte Fragen sperren. (`AUTH-005`, `AUTH-007`, `ADM-001`)
- [ ] 3.5 Automatisierte RLS-Matrixtests für direkte Tabellen- und Funktionsaufrufe schreiben.
- [ ] 3.6 Audit-Log unveränderlich machen und sensible Payloads von technischem Logging ausschließen. (`ADM-010`)

## 4. Identity, Profile and Privacy

- [ ] 4.1 Registrierung mit E-Mail, Passwort, Anzeigename, E-Mail-Verifikation und deutscher Validierung umsetzen. (`AUTH-001`)
- [ ] 4.2 Login, Sessionwiederherstellung, Logout und Auth-Guards umsetzen; native Tokens über einen geprüften Keychain-/Keystore-Adapter und Websessions über die vorgesehene Supabase-Persistenz speichern. (`AUTH-002`)
- [ ] 4.3 Passwortreset über Web-URLs, Universal/App Links und den Capacitor-App-Lebenszyklus für iOS, Android und PWA umsetzen. (`AUTH-003`)
- [ ] 4.4 Profilansicht mit Anzeigenamenänderung und personalisierter Begrüßung umsetzen. (`AUTH-004`)
- [ ] 4.5 Rollenclaim/-profil serverseitig prüfen und Adminroute doppelt durch UI-Guard und Backendautorisierung absichern. (`AUTH-005`)
- [ ] 4.6 Datenschutz-, Impressums-, Nutzungs- und Lernhinweis-Seiten als konfigurierbare Inhalte integrieren. (`AUTH-006`, `UI-009`)
- [ ] 4.7 Kontolöschungsprozess mit erneuter Bestätigung, Sessionwiderruf und dokumentierter Lösch-/Anonymisierungsfunktion implementieren und testen. (`AUTH-006`)

## 5. Question Domain and Learner-safe API

- [ ] 5.1 Strikte TypeScript-Domainmodelle, Zod-Schemas und DTO-Mapper für Bereich, Sparte, lernendensichere Frage, Trainingsauflösung und Frageversion implementieren. (`CAT-001`–`CAT-007`)
- [ ] 5.2 Serverfunktion zum Abruf einer Sitzungsfrage implementieren, die richtigen Index und Erklärung vor Abgabe entfernt. (`CAT-007`)
- [ ] 5.3 Veröffentlichungs-, Archivierungs- und Versionslogik mit unveränderlichen Snapshots implementieren. (`CAT-004`–`CAT-006`)
- [ ] 5.4 Tests beweisen lassen, dass Lernendenpayloads, Logs und Browsernetzwerkantworten vor Abgabe keine Lösung enthalten. (`CAT-007`)
- [ ] 5.5 Entwicklungs-Seed mit fachlich eindeutig als Testdaten gekennzeichneten Fragen erstellen; keine Testfrage als fachlich freigegeben behandeln.

## 6. Training Composer and Session Creation

- [ ] 6.1 Bereichs-/Sparten-Accordion mit Bereichsauswahl, Teilzustand, Einzelauswahl und live verfügbarem Fragenbestand implementieren. (`TRN-001`, `TRN-002`)
- [ ] 6.2 Serverseitige Trainingsauswahl mit exakt zehn eindeutigen, veröffentlichten Fragen aus der effektiven Filtermenge implementieren. (`TRN-002`, `TRN-003`)
- [ ] 6.3 Randomisierung deterministisch testbar kapseln und Ausschluss von Duplikaten sowie fremden Sparten testen. (`TRN-003`)
- [ ] 6.4 Verständlichen Zustand für weniger als zehn verfügbare Fragen implementieren. (`TRN-002`)
- [ ] 6.5 Sitzungsstart transaktional machen, Reihenfolge fixieren und Doppelklick/Doppelstart verhindern.

## 7. Quiz Engine, Timer and Feedback

- [ ] 7.1 Quizansicht mit Ionic React, Fragenfortschritt, langen Texten und vier barrierearmen Antwortkarten implementieren. (`TRN-004`, `TRN-005`, `UI-004`–`UI-006`)
- [ ] 7.2 Autoritative 45-Sekunden-Deadline, Serverzeitsynchronisierung, Progress Bar, Sekundenanzeige und Warnzustände implementieren. (`TRN-004`)
- [ ] 7.3 Hintergrund-/Vordergrund-, Browser-Tabwechsel- und Neustartfälle über Web Visibility API und Capacitor App Events ohne Timerverlängerung implementieren und testen. (`TRN-004`, `TRN-010`)
- [ ] 7.4 Idempotente serverseitige Antwortabgabe mit eindeutiger Idempotency-ID und genau einem Versuch pro Sitzungsfrage implementieren. (`TRN-005`, `PRG-001`)
- [ ] 7.5 Richtige Trainingsantwort mit positiver Animation, optionaler Erklärung und explizitem „Weiter“ darstellen. (`TRN-007`)
- [ ] 7.6 Falsche Antwort und Timeout mit eigener Markierung, richtiger Antwort, Erklärung und „Weiter“ darstellen. (`TRN-006`)
- [ ] 7.7 Netzwerkfehler zwischen Auswahl und Serverantwort als gesperrten, wiederholbaren Zustand behandeln und gespeichertes Ergebnis wiederherstellen.
- [ ] 7.8 Kontrollierten Abbruch und Fortsetzung aktiver Sitzungen implementieren. (`TRN-010`, `TRN-011`)

## 8. Mistake Pool

- [ ] 8.1 `user_question_stats` atomar nach jedem Versuch aktualisieren und falsche/abgelaufene letzte Versuche als aktiven Fehlerpool abbilden. (`TRN-008`)
- [ ] 8.2 Hauptmenü-Kachel mit Fehleranzahl, Leerzustand und Startaktion implementieren. (`TRN-009`, `PRG-008`)
- [ ] 8.3 Serverseitige Auswahl von einer bis zehn veröffentlichten Fehlerfragen ohne Duplikate implementieren. (`TRN-009`)
- [ ] 8.4 Richtige Wiederholung aus aktivem Pool entfernen, ohne historische Versuche zu löschen, und Regressionstests ergänzen. (`TRN-009`)

## 9. Learning Progress and Results

- [ ] 9.1 Aggregationen für Trefferquote, Lernstand, bearbeitete Fragen, Abdeckung, Fehlerzahl, Bereich und Sparte implementieren. (`PRG-002`–`PRG-004`)
- [ ] 9.2 Hauptmenü-Lernstandskarte und ausführliches Lernstand-Dashboard mit neutralen Leerzuständen implementieren. (`PRG-003`, `PRG-004`, `PRG-008`, `PRG-009`)
- [ ] 9.3 Rundenauswertung mit Punktzahl, Quote, Zeit, Durchschnittszeit sowie Bereichs-/Spartenaufschlüsselung implementieren. (`PRG-005`)
- [ ] 9.4 Fehlerdetails mit damaliger Frageversion, eigener Auswahl, richtiger Antwort und Erklärung implementieren. (`PRG-006`)
- [ ] 9.5 Rundenhistorie und direkt neu ladbare Ergebnisrouten implementieren. (`PRG-007`, `UI-007`)
- [ ] 9.6 Unit- und Integrationsfälle für Mehrfachversuche, archivierte Fragen, Versionswechsel und leere Datenbestände schreiben.

## 10. Exam Simulation

- [ ] 10.1 Einführungsseite mit Umfang, 45-Sekunden-Regel, 50/30-Logik und Abgrenzung zur offiziellen Prüfung implementieren. (`EXM-003`, `EXM-008`)
- [ ] 10.2 Bestandsprüfung und serverseitige Auswahl von exakt zehn eindeutigen Fragen je Bereich umsetzen. (`EXM-001`, `EXM-002`)
- [ ] 10.3 Quizmodus so erweitern, dass er während der Simulation keine Lösung oder Richtig/Falsch-Rückmeldung zeigt. (`EXM-004`)
- [ ] 10.4 Bereichsberechnung und 50/30-Bestehensentscheidung als reine, vollständig unit-getestete Fachfunktion implementieren. (`EXM-005`, `EXM-006`)
- [ ] 10.5 Mindestens die Grenzfälle `50/50/50/50/30`, `50/50/50/50/29`, `50/50/50/49/49`, `100/100/100/100/100` und drei Bereiche über 50 automatisiert prüfen. (`EXM-006`)
- [ ] 10.6 Prüfungsauswertung mit Entscheidung, fünf Bereichswerten, Zeiten, Fehlerdetails und Disclaimer implementieren. (`EXM-007`, `EXM-008`)
- [ ] 10.7 Abbruch ohne Bestehensentscheidung implementieren und testen. (`EXM-009`)

## 11. Admin Question Management

- [ ] 11.1 Admin-Dashboard mit Bestandszahlen, Freitextsuche, Bereichs-/Sparten-/Status-/Reviewfiltern und fälligen Hinweisen implementieren. (`ADM-001`, `ADM-007`, `ADM-011`)
- [ ] 11.2 Frageeditor mit vier festen Antwortfeldern, visueller Auswahl der richtigen Antwort, Taxonomie, Erklärung, Quelle, Version, Prüfer und Reviewfeldern implementieren. (`ADM-002`, `ADM-003`)
- [ ] 11.3 Sicheres Umsortieren der Antworten bei Erhalt der inhaltlich richtigen Antwort implementieren und testen. (`ADM-002`)
- [ ] 11.4 Draft-/Publish-/Archive-Aktionen mit serverseitiger Validierung, Änderungsgrund, Versionierung und Audit-Log implementieren. (`ADM-003`, `ADM-008`–`ADM-010`)
- [ ] 11.5 JSON-Parser für Einzelobjekt und Array mit deutschem Kernvertrag, NFC-Normalisierung, Steuerzeichenbehandlung und Mojibake-Reparatur implementieren. (`CAT-008`, `ADM-004`)
- [ ] 11.6 Importvorschau mit Vorher/Nachher, Spartenmapping, Duplikatwarnung und feldbezogenen Fehlern implementieren; Batch atomar speichern. (`ADM-004`)
- [ ] 11.7 UTF-8-JSON-Export nach aktiven Filtern implementieren und Roundtrip-Tests ergänzen. (`ADM-005`)
- [ ] 11.8 `änderungsanfällig` server- und clientseitig auf Bereich A/B plus zeitabhängige Zahlen, Quelle und nächstes Prüfdatum begrenzen. (`ADM-006`)
- [ ] 11.9 Fällige/überfällige Reviewanzeige und „Prüfung bestätigen“ mit Jahresvorschlag implementieren. (`ADM-007`)
- [ ] 11.10 End-to-End-Sicherheitstest durchführen, der Admin-APIs mit learner-Token und ohne Token ablehnt. (`ADM-001`)

## 12. Menu, Legal Boundaries and Deferred Multiplayer

- [ ] 12.1 Hauptmenü mit Begrüßung, Lernstand, Training, Fehlertraining, Simulation und deaktivierter Freunde-Kachel fertigstellen. (`AUTH-004`, `PRG-008`, `UI-008`)
- [ ] 12.2 „Gegen Freunde spielen“ ausschließlich als „Demnächst verfügbar“ darstellen; keine leeren Multiplayerdienste oder Datenmodelle implementieren. (`UI-008`)
- [ ] 12.3 Lernhinweis in Onboarding, Profil und Prüfungssimulation einbinden. (`UI-009`, `EXM-008`)
- [ ] 12.4 UI-Texte rechtlich und redaktionell prüfen lassen; keine IHK-Zugehörigkeit oder Bestehensgarantie suggerieren.

## 13. Quality, Security and Release Readiness

- [ ] 13.1 Vollständige Playwright-PWA- und Capacitor-Native-Smoke-Wege für Registrierung → Training → Auswertung → Logout → Login → gespeicherter Lernstand automatisieren.
- [ ] 13.2 E2E-Weg für Fehler → Fehlerpool → richtige Wiederholung → entfernter aktiver Fehler automatisieren.
- [ ] 13.3 E2E-Weg für 50-Fragen-Simulation und beide Ergebnisentscheidungen automatisieren.
- [ ] 13.4 Accessibility-Audit mit axe sowie Tastatur-, VoiceOver-/TalkBack- und Schriftgrößen-Smoke-Tests der Kernansichten durchführen. (`UI-005`, `UI-006`)
- [ ] 13.5 Sicherheitsreview für RLS, Rollen, Lösungsschutz, Service-Worker-Caches, native Tokenablage, Account Enumeration, Logging, Deep Links und Kontolöschung durchführen.
- [ ] 13.6 Performancebudgets für mobilen Warmstart und PWA-Ladezeit definieren, messen und offensichtliche Asset-/Bundleprobleme beheben.
- [ ] 13.7 Backup-, Migration-, Rollback- und Fragenarchivierungsprozess in Staging testen.
- [ ] 13.8 Finalen Produktnamen, App-IDs, Domains, Rechtstexte, Supportkontakt, EU-Region und Storeassets als Release-Gate bestätigen.
- [ ] 13.9 Mindestens zehn fachlich freigegebene Produktionsfragen je Bereich sicherstellen; ohne diesen Bestand die Prüfungssimulation per Feature Flag deaktiviert lassen. (`EXM-001`)
- [ ] 13.10 Alle OpenSpec-Szenarien gegen Tests und manuelle Abnahme rückverfolgen, offene Abweichungen dokumentieren und erst danach den Change archivieren.
