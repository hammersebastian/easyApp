# Delta for Question Catalog

## ADDED Requirements

### Requirement: CAT-001 Kanonische Prüfungstaxonomie
Das System MUSS die fünf Bereiche A–E und die festgelegten Sparten als kanonische, hierarchische Taxonomie bereitstellen.

#### Scenario: Taxonomie laden
- **GIVEN** ein angemeldeter Lernender
- **WHEN** die Auswahl für ein Training geladen wird
- **THEN** erscheinen die Bereiche A–E in definierter Reihenfolge
- **AND** jeder Bereich enthält ausschließlich seine festgelegten Sparten

### Requirement: CAT-002 Eindeutige Zuordnung
Jede Frage MUSS genau einer kanonischen Sparte und dadurch genau einem Bereich zugeordnet sein.

#### Scenario: Widersprüchliche Zuordnung verhindern
- **GIVEN** eine Sparte aus Bereich A
- **WHEN** ein Import oder Adminversuch dieselbe Frage zusätzlich Bereich B zuordnet
- **THEN** lehnt das System die widersprüchliche Zuordnung ab

### Requirement: CAT-003 Single-Choice-Vertrag
Jede veröffentlichte Frage MUSS einen nicht leeren Fragetext, exakt vier unterschiedliche nicht leere Antworten, genau einen richtigen nullbasierten Antwortindex von 0 bis 3, eine Sparte und eine nicht leere Erklärung besitzen.

#### Scenario: Gültige Frage veröffentlichen
- **GIVEN** eine Frage mit allen Pflichtfeldern, vier Antworten und `richtige_antwort = 0`
- **WHEN** ein Admin die fachliche Freigabe und Veröffentlichung bestätigt
- **THEN** wird die Frage als veröffentlicht gespeichert
- **AND** Antwort 0 gilt als einzig richtige Antwort

#### Scenario: Ungültige Antwortanzahl
- **GIVEN** eine Frage mit drei oder fünf Antworten
- **WHEN** eine Veröffentlichung versucht wird
- **THEN** lehnt das System die Veröffentlichung mit einem Feldfehler ab

#### Scenario: Ungültiger richtiger Index
- **GIVEN** eine Frage mit `richtige_antwort = -1` oder `richtige_antwort = 4`
- **WHEN** eine Veröffentlichung versucht wird
- **THEN** lehnt das System die Veröffentlichung ab

### Requirement: CAT-004 Veröffentlichungsstatus
Das System MUSS Fragen als Entwurf, veröffentlicht oder archiviert verwalten und Lernenden nur veröffentlichte Fragen für neue Runden anbieten.

#### Scenario: Entwurf bleibt unsichtbar
- **GIVEN** eine Frage im Status `draft`
- **WHEN** ein Lernender eine geeignete Runde startet
- **THEN** wird die Entwurfsfrage nicht ausgewählt

#### Scenario: Archivierte Frage
- **GIVEN** eine zuvor veröffentlichte Frage mit historischen Versuchen
- **WHEN** ein Admin sie archiviert
- **THEN** wird sie für neue Runden nicht mehr ausgewählt
- **AND** bleiben historische Ergebnisse auswertbar

### Requirement: CAT-005 Quellen und Fachprüfung
Eine Frage MUSS vor Veröffentlichung eine Quelle, ein Datum der letzten fachlichen Prüfung, eine positive Versionsnummer und einen Prüfverantwortlichen besitzen.

#### Scenario: Fehlende Quelle
- **GIVEN** ein vollständiger Fragenentwurf ohne Quellenangabe
- **WHEN** ein Admin ihn veröffentlichen will
- **THEN** verhindert das System die Veröffentlichung
- **AND** nennt die fehlende Quellenangabe

### Requirement: CAT-006 Versionstreue
Das System MUSS bei jeder inhaltlichen Änderung einer veröffentlichten Frage eine neue Version erzeugen und frühere Antwortversuche der damals verwendeten Version zuordnen.

#### Scenario: Veröffentlichte Frage ändern
- **GIVEN** eine veröffentlichte Frage in Version 3 mit vorhandenen Versuchen
- **WHEN** ein Admin Fragetext, Antworten, richtige Antwort, Erklärung, Sparte oder Quelle ändert und erneut veröffentlicht
- **THEN** speichert das System einen unveränderlichen Snapshot von Version 3
- **AND** veröffentlicht die Änderung als Version 4
- **AND** belässt alte Versuche bei Version 3

### Requirement: CAT-007 Lösungsschutz
Das System DARF einem Lernenden vor verbindlicher Abgabe keine richtige Antwort oder Erklärung über Client-Payloads offenlegen.

#### Scenario: Frage anzeigen
- **GIVEN** eine aktive, noch unbeantwortete Sitzungsfrage
- **WHEN** der Client die Frage abruft
- **THEN** enthält die Antwort Fragetext und vier Antwortmöglichkeiten
- **AND** enthält sie weder richtigen Index noch Erklärung

### Requirement: CAT-008 UTF-8-Normalisierung
Das System MUSS importierte Fragentexte und Antworten als korrektes Unicode speichern und bekannte Mojibake-Sequenzen in einer bestätigbaren Vorschau reparieren.

#### Scenario: Mojibake reparieren
- **GIVEN** ein Importfeld mit dem Text `begÃ¼nstigten`
- **WHEN** der Import validiert wird
- **THEN** schlägt die Vorschau `begünstigten` als normalisierten Wert vor
- **AND** speichert das System die Änderung erst nach Bestätigung durch den Admin

#### Scenario: Keine fachliche Umformulierung
- **GIVEN** ein korrekt kodierter, aber grammatikalisch verbesserungsfähiger Fragetext
- **WHEN** der Import normalisiert wird
- **THEN** verändert das System den fachlichen Wortlaut nicht automatisch
