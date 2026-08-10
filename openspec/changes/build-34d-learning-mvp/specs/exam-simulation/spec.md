# Delta for Exam Simulation

## ADDED Requirements

### Requirement: EXM-001 Verfügbarkeit der Simulation
Die App MUSS die Prüfungssimulation nur starten, wenn in jedem Bereich A–E mindestens zehn veröffentlichte Fragen verfügbar sind.

#### Scenario: Ausreichender Bestand
- **GIVEN** mindestens zehn veröffentlichte Fragen in jedem der fünf Bereiche
- **WHEN** der Nutzer die Prüfungssimulation startet
- **THEN** erstellt das System eine Sitzung mit 50 Fragen

#### Scenario: Fehlender Bestand
- **GIVEN** in mindestens einem Bereich weniger als zehn veröffentlichte Fragen
- **WHEN** der Nutzer die Simulation öffnen will
- **THEN** startet keine Sitzung
- **AND** zeigt die App einen sachlichen Hinweis, dass derzeit nicht genügend geprüfte Fragen verfügbar sind

### Requirement: EXM-002 Zehn Fragen je Bereich
Das System MUSS für eine Simulation zufällig und ohne Duplikate genau zehn Fragen aus jedem Bereich auswählen und die 50 Fragen in gemischter Reihenfolge fixieren.

#### Scenario: Simulation zusammenstellen
- **GIVEN** ausreichender Fragenbestand
- **WHEN** eine Simulation erstellt wird
- **THEN** enthält sie genau zehn eindeutige Fragen aus A, zehn aus B, zehn aus C, zehn aus D und zehn aus E
- **AND** enthält sie insgesamt 50 Fragen

### Requirement: EXM-003 Antwortzeit
Die Simulation MUSS für jede Frage dieselbe autoritative Antwortzeit von 45 Sekunden und dieselbe Progress-Bar-Semantik wie das Training verwenden.

#### Scenario: Timeout in Simulation
- **GIVEN** eine unbeantwortete Simulationsfrage
- **WHEN** ihre Deadline verstreicht
- **THEN** speichert das System einen falschen Timeout-Versuch
- **AND** fährt mit der nächsten Frage fort, ohne die Lösung anzuzeigen

### Requirement: EXM-004 Zurückgehaltenes Feedback
Die App DARF während einer laufenden Prüfungssimulation weder Richtig/Falsch noch richtige Antwort oder Erklärung anzeigen.

#### Scenario: Antwort in Simulation abgeben
- **GIVEN** eine aktive Simulationsfrage
- **WHEN** der Lernende eine Antwort abgibt
- **THEN** bestätigt die App neutral die Speicherung
- **AND** zeigt anschließend die nächste Frage
- **AND** legt keine Lösung offen

### Requirement: EXM-005 Bereichsauswertung
Das System MUSS nach Abschluss die richtige Punktzahl und den Prozentwert für jeden Bereich A–E getrennt berechnen.

#### Scenario: Bereich mit fünf richtigen Antworten
- **GIVEN** zehn beantwortete Fragen in Bereich C mit fünf richtigen Antworten
- **WHEN** die Simulation ausgewertet wird
- **THEN** erhält Bereich C `5/10` und `50 %`

### Requirement: EXM-006 50/30-Bestehensregel
Das System MUSS eine abgeschlossene Simulation genau dann als bestanden bewerten, wenn mindestens vier der fünf Bereiche jeweils mindestens 50 Prozent und jeder verbleibende Bereich mindestens 30 Prozent erreicht.

#### Scenario: Vier Bereiche über 50 und einer genau 30
- **GIVEN** Bereichswerte von 50, 60, 70, 80 und 30 Prozent
- **WHEN** die Simulation ausgewertet wird
- **THEN** lautet das Ergebnis „bestanden“

#### Scenario: Alle fünf Bereiche über 50
- **GIVEN** alle fünf Bereichswerte sind mindestens 50 Prozent
- **WHEN** die Simulation ausgewertet wird
- **THEN** lautet das Ergebnis „bestanden“

#### Scenario: Drei Bereiche über 50
- **GIVEN** nur drei Bereichswerte sind mindestens 50 Prozent und die übrigen liegen bei mindestens 30 Prozent
- **WHEN** die Simulation ausgewertet wird
- **THEN** lautet das Ergebnis „nicht bestanden“

#### Scenario: Verbleibender Bereich unter 30
- **GIVEN** vier Bereichswerte sind mindestens 50 Prozent und der fünfte liegt unter 30 Prozent
- **WHEN** die Simulation ausgewertet wird
- **THEN** lautet das Ergebnis „nicht bestanden“

### Requirement: EXM-007 Prüfungsauswertung
Die App MUSS nach Abschluss Gesamtergebnis, Bestanden/Nicht bestanden, Punktzahl je Bereich, Gesamtzeit und vollständige Fehlerdetails anzeigen.

#### Scenario: Auswertung öffnen
- **GIVEN** eine vollständig abgeschlossene Simulation
- **WHEN** die Ergebnisansicht erscheint
- **THEN** zeigt sie die Entscheidung und alle fünf Bereichswerte
- **AND** erklärt sie die 50/30-Regel
- **AND** erlaubt das Öffnen der richtigen Antworten und Erklärungen

### Requirement: EXM-008 Transparenter Simulationshinweis
Die App MUSS vor Start und in der Auswertung darauf hinweisen, dass der Modus eine Single-Choice-Lernsimulation und keine originale IHK-Prüfung oder Bestehensgarantie ist.

#### Scenario: Hinweis vor Start
- **GIVEN** der Nutzer öffnet die Einführung zur Simulation
- **WHEN** die Startaktion angeboten wird
- **THEN** ist der Hinweis zur vereinfachten Frageform und fehlenden Bestehensgarantie sichtbar

### Requirement: EXM-009 Abbruch ohne Ergebnis
Eine vorzeitig beendete Simulation DARF kein Bestanden/Nicht-bestanden-Ergebnis erhalten.

#### Scenario: Simulation abbrechen
- **GIVEN** eine aktive, unvollständige Simulation
- **WHEN** der Nutzer den Abbruch bestätigt
- **THEN** markiert das System sie als abgebrochen
- **AND** weist weder „bestanden“ noch „nicht bestanden“ zu
