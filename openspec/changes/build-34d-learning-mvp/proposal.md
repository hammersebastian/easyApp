# Proposal: 34d-Lernapp MVP entwickeln

## Why

Prüflinge der Sachkundeprüfung Versicherungsvermittlung nach § 34d GewO benötigen eine leicht zugängliche, motivierende Möglichkeit, prüfungsrelevante Inhalte nach Bereichen und Sparten zu trainieren, ihren Lernstand zu verstehen und Wissenslücken gezielt zu wiederholen. Die Anwendung soll den schnellen, kartenbasierten Spielfluss bekannter Quiz-Apps nutzen, dabei aber eine eigenständige Marke und eine fachlich nachvollziehbare Fragenverwaltung erhalten.

## What Changes

- Eine neue Ionic-React-/TypeScript-Anwendung wird als PWA und über Capacitor als iOS- und Android-App aufgebaut.
- Registrierung, E-Mail-Verifikation, Login, Passwortzurücksetzung, persistente Sitzungen und Kontolöschung werden eingeführt.
- Nutzer können die fünf Prüfungsbereiche A–E und deren Sparten hierarchisch kombinieren und daraus Trainingsrunden mit zehn Fragen erstellen.
- Jede Frage bietet exakt vier Antworten, genau eine richtige Antwort und 45 Sekunden Antwortzeit mit visueller Fortschrittsleiste.
- Falsche Antworten und Zeitüberschreitungen werden im Training sofort mit richtiger Antwort und Erklärung aufgelöst.
- Falsch beantwortete Fragen werden in einem persönlichen Fehlerpool gespeichert und können gezielt erneut geübt werden.
- Nach jeder Runde und im persönlichen Lernstand werden Gesamtquote, Bereichs- und Spartenwerte, Zeit und Fehler angezeigt.
- Eine prüfungsnahe Simulation mit zehn Fragen je Bereich und der gesetzlichen 50/30-Bestehenslogik wird eingeführt.
- Eine rollenbasierte Adminoberfläche ermöglicht Erstellen, Bearbeiten, Versionieren, Prüfen, Importieren, Veröffentlichen und Archivieren von Fragen.
- Änderungsanfällige Zahlenfragen erhalten ausschließlich in den Bereichen A und B einen internen Prüfhinweis im Adminbereich.
- Das gelieferte Logo und seine Farben bilden die Grundlage eines eigenständigen, barrierearmen Designsystems.
- Die Hauptnavigation zeigt „Gegen Freunde spielen“ als deaktivierte Funktion mit dem Hinweis „Demnächst verfügbar“.

## Capabilities

### New Capabilities

- `identity-access`: Nutzerkonten, Sitzungen, Rollen, Datenschutz und Begrüßungsprofil.
- `question-catalog`: Prüfungstaxonomie, Single-Choice-Datenvertrag und veröffentlichter Fragenbestand.
- `training-quiz`: freie Zusammenstellung, Zufallsauswahl, Timer, Antwortauflösung und Fehlertraining.
- `learning-progress`: persistenter Lernstand, Rundenauswertung, Bereichswerte und Fehlerhistorie.
- `exam-simulation`: 50-Fragen-Simulation, zurückgehaltenes Feedback und 50/30-Bestehenslogik.
- `question-administration`: geschützte Pflege, Import, Quellen, Versionen, Review-Hinweise und Audit-Log.
- `cross-platform-experience`: Splashscreen, Navigation, Markenauftritt, Responsive Design, PWA und Barrierefreiheit.

### Modified Capabilities

Keine. Es handelt sich um ein Greenfield-MVP.

## Impact

- Neue Ionic-React-Codebasis, Capacitor-Projekte und Build-Pipelines für Web, iOS und Android.
- Neues Supabase-Projekt mit Authentifizierung, Datenbankmigrationen, RLS-Regeln und serverseitigen Quizfunktionen.
- Neue Verarbeitung personenbezogener Daten wie E-Mail-Adresse, Anzeigename und Lernhistorie.
- Neuer redaktioneller Prozess für Fragenquellen, fachliche Freigabe und turnusmäßige Prüfung.
- Neue Store-, PWA-, Datenschutz- und Impressumsanforderungen vor öffentlicher Veröffentlichung.

## Out of Scope

- Multiplayer, Freundeslisten, Einladungen, Live-Duelle und Chat.
- Abonnements, In-App-Käufe, Werbung und Zahlungsabwicklung.
- Social Login, Single Sign-on und Unternehmensmandanten.
- Push-Benachrichtigungen, Gamification mit Ranglisten, Avataren oder Achievements.
- Vollständige Offline-Nutzung von Quiz und Lernfortschritt.
- Praktischer Prüfungsteil beziehungsweise Simulation eines Kundenberatungsgesprächs.
- Mehrfachauswahl, freie Texteingaben und Rechenfelder.
- Automatische fachliche oder juristische Aktualisierung von Fragen durch KI.

## Success Criteria

- Ein neu registrierter Nutzer kann ohne Adminhilfe eine Sparte auswählen, zehn Fragen beantworten und eine gespeicherte Auswertung wieder aufrufen.
- Jede gespeicherte Antwort erscheint nach erneutem Login konsistent im Lernstand.
- Eine falsche Antwort erscheint im Fehlerpool und verschwindet dort nach erfolgreicher Wiederholung, ohne die Historie zu löschen.
- Die Simulation bewertet alle relevanten Grenzfälle der 50/30-Regel korrekt.
- Ein Admin kann einen gültigen JSON-Fragenbestand importieren, fachlich freigeben und veröffentlichen, ohne die Datenbank direkt zu bearbeiten.
- Ein Nicht-Admin kann weder über die Oberfläche noch über direkte Backendaufrufe auf Adminfunktionen oder richtige Antworten vor Abgabe zugreifen.
- Die Kernabläufe funktionieren automatisiert getestet auf iOS, Android und in mindestens einem Chromium- und einem WebKit-basierten Browser.

## Product Assumptions Requiring Later Confirmation

- Der endgültige Produktname, Bundle Identifier, Android Application ID und die Store-Einträge werden vor Release festgelegt.
- Supabase wird in einer EU-Region betrieben; konkrete Region und Auftragsverarbeitung werden vor Produktionsstart bestätigt.
- Im Training folgt nach einer richtigen Antwort eine kurze positive Animation und anschließend eine explizite „Weiter“-Aktion; Erklärungen sind dort bei richtigen Antworten optional aufklappbar.
- In der Prüfungssimulation wird kein unmittelbares Richtig/Falsch-Feedback gezeigt, damit nachfolgende Antworten nicht beeinflusst werden.
- Die Simulation verwendet ebenfalls 45 Sekunden je Frage und ist ausdrücklich keine zeit- oder formatidentische Reproduktion der offiziellen Prüfung.
