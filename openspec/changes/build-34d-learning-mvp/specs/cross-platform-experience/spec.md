# Delta for Cross-Platform Experience

## ADDED Requirements

### Requirement: UI-001 Plattformabdeckung
Das Produkt MUSS aus einer gemeinsamen Ionic-React-/TypeScript-Codebasis als installierbare PWA und über Capacitor als iOS- und Android-App bereitgestellt werden.

#### Scenario: Kernablauf auf jeder Plattform
- **GIVEN** ein unterstütztes iOS-Gerät, Android-Gerät oder ein unterstützter Browser
- **WHEN** ein Lernender sich anmeldet und ein Training beendet
- **THEN** stehen Auswahl, Quiz, Feedback und Auswertung funktional gleichwertig zur Verfügung

### Requirement: UI-002 Splashscreen und Sitzungsrouting
Die App MUSS beim Start einen Splashscreen mit dem bereitgestellten Logo zeigen und anschließend abhängig vom Sitzungsstatus zu Authentifizierung oder Hauptmenü navigieren.

#### Scenario: Start ohne Sitzung
- **GIVEN** keine gültige Nutzersitzung
- **WHEN** der Splashscreen abgeschlossen und der Authstatus geklärt ist
- **THEN** öffnet die App Login und Registrierung

#### Scenario: Start mit Sitzung
- **GIVEN** eine gültige Nutzersitzung
- **WHEN** der Splashscreen abgeschlossen ist
- **THEN** öffnet die App das Hauptmenü

### Requirement: UI-003 Eigenständiger Markenauftritt
Die App MUSS das bereitgestellte Logo sowie Lime `#BFE560` und Dunkelgrün `#3C806B` als Ausgangspunkt eines eigenständigen Designsystems verwenden.

#### Scenario: Markenfarben einsetzen
- **GIVEN** eine primäre Lernendenansicht
- **WHEN** sie gerendert wird
- **THEN** werden Markenfarben konsistent über Design Tokens angewendet
- **AND** erfüllen Text- und Interaktionskontraste die festgelegten Barrierefreiheitsziele

### Requirement: UI-004 Karten- und Antwortinteraktionen
Die App MUSS Fragen und Antworten in klar getrennten Karten, Quizfortschritt als sichtbare Anzeige und Zustandswechsel mit kurzen Antwortanimationen darstellen.

#### Scenario: Antwortzustand wechselt
- **GIVEN** eine Antwortkarte im neutralen Zustand
- **WHEN** das Trainingsergebnis eintrifft
- **THEN** wechselt die Karte animiert in einen semantisch eindeutigen Richtig- oder Falschzustand
- **AND** wird der Zustand zusätzlich durch Text oder Icon vermittelt

### Requirement: UI-005 Responsive Layout
Alle Lernendenabläufe MÜSSEN auf kleinen Smartphones, Tablets und Desktopbrowsern ohne horizontales Scrollen oder Verlust wesentlicher Aktionen nutzbar sein.

#### Scenario: Langer Fragetext auf kleinem Display
- **GIVEN** ein schmales Smartphone und ein langer Fragetext
- **WHEN** die Frage angezeigt wird
- **THEN** bleibt der Text vollständig vertikal erreichbar
- **AND** bleiben Timer, Fortschritt und Antwortaktionen bedienbar

### Requirement: UI-006 Barrierearme Bedienung
Die App MUSS Kernabläufe mit Screenreader, Tastatur auf Web, vergrößerter Schrift und reduzierter Bewegung unterstützen und darf Information nicht ausschließlich über Farbe vermitteln.

#### Scenario: Reduzierte Bewegung
- **GIVEN** die Systempräferenz „Bewegung reduzieren“
- **WHEN** eine Antwort ausgewertet oder der Timer kritisch wird
- **THEN** werden nicht notwendige Bewegungsanimationen reduziert oder entfernt
- **AND** bleiben alle Zustände verständlich

#### Scenario: Tastaturbedienung in der PWA
- **GIVEN** ein Nutzer bedient die PWA ohne Zeigegerät
- **WHEN** er durch ein Quiz navigiert
- **THEN** sind alle vier Antworten, Weiter- und Abbruchaktionen in logischer Reihenfolge fokussierbar und auslösbar

### Requirement: UI-007 PWA-Installation und Wiederaufruf
Die Webanwendung MUSS die technischen Voraussetzungen einer installierbaren PWA erfüllen und gültige Routen bei Wiederaufruf korrekt herstellen.

#### Scenario: PWA installieren
- **GIVEN** ein unterstützter Browser
- **WHEN** die Webanwendung die Installationskriterien erfüllt
- **THEN** kann der Nutzer sie mit Icon, Anzeigename und Start-URL installieren

#### Scenario: Ergebnisroute neu laden
- **GIVEN** ein authentifizierter Nutzer mit Berechtigung für eine historische Ergebnisroute
- **WHEN** der Browser diese Route direkt neu lädt
- **THEN** stellt die App Authentifizierung und Ergebnisansicht ohne 404 wieder her

### Requirement: UI-008 Hauptmenü-Funktionen
Das Hauptmenü MUSS Trainieren, Fehler wiederholen und Prüfungssimulation als nutzbare Funktionen sowie „Gegen Freunde spielen“ als deaktivierte „Demnächst verfügbar“-Funktion zeigen.

#### Scenario: Freunde-Kachel auswählen
- **GIVEN** das MVP-Hauptmenü
- **WHEN** der Nutzer die Freunde-Kachel auswählt
- **THEN** startet kein Multiplayerablauf
- **AND** zeigt die App einen kurzen Hinweis „Demnächst verfügbar“

### Requirement: UI-009 Rechtlicher Lernhinweis
Die App MUSS gut auffindbar erklären, dass sie der Prüfungsvorbereitung dient, keine Rechts- oder Versicherungsberatung leistet und keine Bestehensgarantie gibt.

#### Scenario: Hinweis aufrufen
- **GIVEN** ein Nutzer befindet sich in Onboarding, Profil oder Prüfungssimulation
- **WHEN** er den Lernhinweis öffnet
- **THEN** sind Zweck, fachliche Grenzen und fehlende Bestehensgarantie verständlich dargestellt

### Requirement: UI-010 Konfigurierbarer Produktname
Das System MUSS sichtbaren Produktnamen, App-Titel und Plattformmetadaten konfigurierbar halten, bis die Namensfreigabe erfolgt.

#### Scenario: Namen vor Release ändern
- **GIVEN** ein neuer freigegebener Produktname
- **WHEN** die Releasekonfiguration aktualisiert wird
- **THEN** verwenden iOS, Android und PWA den neuen Namen ohne Änderung der Quizfachlogik
