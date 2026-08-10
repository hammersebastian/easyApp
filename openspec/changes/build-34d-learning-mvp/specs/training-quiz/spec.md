# Delta for Training Quiz

## ADDED Requirements

### Requirement: TRN-001 Hierarchische Trainingsauswahl
Die App MUSS Lernenden erlauben, ganze Bereiche, einzelne Sparten oder eine Kombination daraus auszuwählen.

#### Scenario: Ganzen Bereich auswählen
- **GIVEN** ein noch nicht ausgewählter Bereich A
- **WHEN** der Nutzer Bereich A auswählt
- **THEN** gelten alle Sparten aus Bereich A als ausgewählt
- **AND** kann der Nutzer einzelne Sparten anschließend abwählen

#### Scenario: Bereiche und Sparten kombinieren
- **GIVEN** ausgewählte Sparten aus mehreren Bereichen
- **WHEN** die Auswahl bestätigt wird
- **THEN** bildet die Vereinigung aller ausgewählten Sparten den Fragenfilter

### Requirement: TRN-002 Bestand vor Start prüfen
Die App MUSS vor Start eines normalen Trainings die Zahl geeigneter veröffentlichter Fragen anzeigen und genau zehn Fragen verlangen.

#### Scenario: Genügend Fragen
- **GIVEN** mindestens zehn geeignete veröffentlichte Fragen in der Auswahl
- **WHEN** der Nutzer „Training starten“ wählt
- **THEN** startet eine Runde mit genau zehn Fragen

#### Scenario: Zu wenige Fragen
- **GIVEN** weniger als zehn geeignete veröffentlichte Fragen in der Auswahl
- **WHEN** der Nutzer die Auswahl betrachtet
- **THEN** ist der Start deaktiviert
- **AND** zeigt die App die verfügbare Zahl und einen Hinweis zur Erweiterung der Auswahl

### Requirement: TRN-003 Zufällige Auswahl ohne Duplikate
Das System MUSS für jede Trainingsrunde zehn unterschiedliche Fragen zufällig aus der effektiven Auswahl bestimmen und deren Reihenfolge für die Sitzung fixieren.

#### Scenario: Runde zusammenstellen
- **GIVEN** mindestens zehn geeignete Fragen
- **WHEN** eine Trainingsrunde erstellt wird
- **THEN** enthält sie zehn eindeutige Frage-IDs
- **AND** stammen alle Fragen aus den ausgewählten Sparten
- **AND** bleibt ihre Reihenfolge bei Sitzungswiederherstellung unverändert

### Requirement: TRN-004 45-Sekunden-Timer
Die App MUSS für jede angezeigte Frage eine serverseitig autorisierte Antwortzeit von 45 Sekunden mit einer linear ablaufenden Progress Bar und verbleibenden Sekunden darstellen.

#### Scenario: Timer startet
- **GIVEN** eine neu angezeigte Frage
- **WHEN** der Server ihre Deadline bestätigt
- **THEN** startet die visuelle Progress Bar bei 45 Sekunden vollständig gefüllt
- **AND** endet sie zur Deadline bei null

#### Scenario: App im Hintergrund
- **GIVEN** eine aktive Frage mit laufender Deadline
- **WHEN** die App in den Hintergrund wechselt und nach der Deadline zurückkehrt
- **THEN** wird die Frage als Zeitüberschreitung behandelt
- **AND** der Timer wird nicht durch den Hintergrundaufenthalt verlängert

### Requirement: TRN-005 Verbindliche Antwortauswahl
Die App MUSS die erste ausgewählte Antwort sofort verbindlich sperren und jede Änderung verhindern.

#### Scenario: Antwort antippen
- **GIVEN** eine aktive, unbeantwortete Frage
- **WHEN** der Nutzer Antwort 2 antippt
- **THEN** wird Antwort 2 verbindlich übermittelt
- **AND** sind alle vier Antwortkarten gegen weitere Auswahl gesperrt

#### Scenario: Mehrfaches Tippen
- **GIVEN** eine bereits abgegebene Sitzungsfrage
- **WHEN** der Nutzer erneut eine Antwort antippt oder die Anfrage wiederholt wird
- **THEN** entsteht kein zweiter Antwortversuch
- **AND** das zuerst gespeicherte Ergebnis bleibt maßgeblich

### Requirement: TRN-006 Sofortige Auflösung falscher Antworten
Die App MUSS im Trainings- und Fehlermodus eine falsche Antwort sofort als falsch markieren, die richtige Antwort hervorheben und die Erklärung vollständig anzeigen.

#### Scenario: Falsche Antwort
- **GIVEN** eine Trainingsfrage mit richtiger Antwort 0
- **WHEN** der Nutzer Antwort 2 auswählt
- **THEN** zeigt die App Antwort 2 als falsch und Antwort 0 als richtig
- **AND** zeigt sie die Erklärung
- **AND** setzt sie die Runde erst nach „Weiter“ fort

#### Scenario: Zeitüberschreitung
- **GIVEN** eine unbeantwortete Trainingsfrage
- **WHEN** die 45 Sekunden ablaufen
- **THEN** speichert das System einen falschen Versuch mit Timeout-Kennzeichnung
- **AND** zeigt die App die richtige Antwort und Erklärung

### Requirement: TRN-007 Rückmeldung bei richtiger Antwort
Die App MUSS im Trainings- und Fehlermodus eine richtige Antwort positiv markieren und darf die Erklärung auf Wunsch aufklappbar anbieten.

#### Scenario: Richtige Antwort
- **GIVEN** eine Trainingsfrage mit richtiger Antwort 1
- **WHEN** der Nutzer Antwort 1 auswählt
- **THEN** zeigt die App eine kurze positive Antwortanimation
- **AND** markiert Antwort 1 als richtig
- **AND** bietet eine „Weiter“-Aktion

### Requirement: TRN-008 Persönlicher Fehlerpool
Das System MUSS jede falsch oder nicht rechtzeitig beantwortete Frage in den aktiven Fehlerpool des Lernenden aufnehmen.

#### Scenario: Fehler aufnehmen
- **GIVEN** eine veröffentlichte Frage, deren letzter Versuch richtig oder nicht vorhanden ist
- **WHEN** der Lernende sie falsch beantwortet oder die Zeit überschreitet
- **THEN** gilt ihr letzter Versuch als falsch
- **AND** erscheint sie im aktiven Fehlerpool dieses Lernenden

### Requirement: TRN-009 Fehler erneut üben
Die App MUSS aus dem aktiven Fehlerpool eine Runde mit einer bis zehn Fragen starten können.

#### Scenario: Drei offene Fehler
- **GIVEN** ein Lernender mit drei veröffentlichten Fragen im aktiven Fehlerpool
- **WHEN** er „Fehler wiederholen“ startet
- **THEN** beginnt eine Runde mit genau diesen drei Fragen in zufälliger Reihenfolge

#### Scenario: Fehler richtig wiederholen
- **GIVEN** eine Frage im aktiven Fehlerpool
- **WHEN** der Lernende sie in einer späteren Runde richtig beantwortet
- **THEN** wird sie aus dem aktiven Fehlerpool entfernt
- **AND** bleiben frühere Fehlversuche in der Historie erhalten

#### Scenario: Leerer Fehlerpool
- **GIVEN** kein aktiver Fehler
- **WHEN** der Lernende die Fehlerkachel betrachtet
- **THEN** zeigt die App den Leerzustand
- **AND** kann keine leere Fehlerunde gestartet werden

### Requirement: TRN-010 Sitzungswiederherstellung
Die App MUSS eine aktive Runde nach einem Neustart oder einer erneuten Anmeldung mit ihrer fixierten Reihenfolge und bereits gespeicherten Antworten wiederherstellen.

#### Scenario: Aktive Runde wiederaufnehmen
- **GIVEN** eine aktive Runde mit vier gespeicherten Antworten
- **WHEN** der Nutzer die App neu startet und sich authentifiziert
- **THEN** bietet die App die Fortsetzung bei der nächsten offenen Frage an
- **AND** werden die vier Antworten nicht erneut gestellt

### Requirement: TRN-011 Kontrollierter Abbruch
Die App MUSS vor dem Verlassen einer aktiven Runde eine Bestätigung verlangen und einen bestätigten Abbruch als solchen speichern.

#### Scenario: Runde abbrechen
- **GIVEN** eine aktive Runde
- **WHEN** der Nutzer „Runde beenden“ bestätigt
- **THEN** markiert das System die Sitzung als abgebrochen
- **AND** zeigt keine vollständige Rundenauswertung
- **AND** bleiben bereits gespeicherte Einzelversuche im Lernstand erhalten
