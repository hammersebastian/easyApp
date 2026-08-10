# Delta for Question Administration

## ADDED Requirements

### Requirement: ADM-001 Geschützte Adminoberfläche
Das System MUSS eine ausschließlich für serverseitig bestätigte Admins zugängliche Oberfläche zur Verwaltung des Fragenbestands bereitstellen.

#### Scenario: Adminübersicht öffnen
- **GIVEN** ein angemeldeter Admin
- **WHEN** er die Adminoberfläche öffnet
- **THEN** sieht er Fragenbestand, Statusfilter, Bereiche, Sparten und fällige Prüfhinweise

#### Scenario: Zugriff ohne Adminrolle
- **GIVEN** ein anonymer Nutzer oder Lernender
- **WHEN** er die Adminoberfläche oder deren Datenendpunkte direkt aufruft
- **THEN** verweigert das System den Zugriff

### Requirement: ADM-002 Fragen erstellen und bearbeiten
Ein Admin MUSS Fragen mit allen fachlichen, taxonomischen, Quellen-, Versions- und Reviewfeldern als Entwurf erstellen und bearbeiten können.

#### Scenario: Entwurf speichern
- **GIVEN** ein Admin mit einem noch unvollständigen Fragentext
- **WHEN** er „Als Entwurf speichern“ wählt
- **THEN** speichert das System den Entwurf
- **AND** bietet ihn Lernenden nicht an

#### Scenario: Antwortreihenfolge ändern
- **GIVEN** ein Fragenentwurf mit richtiger Antwort 0
- **WHEN** ein Admin Antwortkarten neu sortiert
- **THEN** aktualisiert die Oberfläche den richtigen Index so, dass dieselbe inhaltliche Antwort richtig bleibt

### Requirement: ADM-003 Veröffentlichung validieren
Das System MUSS vor Veröffentlichung alle Single-Choice-, Taxonomie-, Quellen-, Freigabe- und Reviewbedingungen validieren.

#### Scenario: Veröffentlichung mit Fehlern
- **GIVEN** ein Entwurf mit mindestens einem ungültigen Pflichtfeld
- **WHEN** ein Admin die Veröffentlichung anfordert
- **THEN** bleibt die Frage unveröffentlicht
- **AND** zeigt die Oberfläche alle erkannten Fehler feldbezogen an

### Requirement: ADM-004 JSON-Import mit Vorschau
Ein Admin MUSS ein einzelnes Fragenobjekt oder einen Fragenarray als JSON importieren, normalisieren und vor dem Speichern in einer Vorschau prüfen können.

#### Scenario: Gültiger Batch
- **GIVEN** eine gültige JSON-Datei mit mehreren Fragen
- **WHEN** der Admin sie hochlädt
- **THEN** zeigt die App normalisierte Werte, erkannte Sparten, Warnungen und geplanten Status
- **AND** speichert sie erst nach ausdrücklicher Bestätigung

#### Scenario: Ungültiger Batch
- **GIVEN** mindestens ein ungültiger Datensatz in einem Importbatch
- **WHEN** die Validierung abgeschlossen ist
- **THEN** nennt die App Datensatz, Feld und Fehlerursache
- **AND** veröffentlicht sie keinen Teil des Batches

### Requirement: ADM-005 JSON-Export
Ein Admin MUSS gefilterte Fragen einschließlich der sechs deutschen Kernfelder und erlaubter Metadaten als korrektes UTF-8-JSON exportieren können.

#### Scenario: Fragen exportieren
- **GIVEN** ein Admin filtert veröffentlichte Fragen aus Bereich B
- **WHEN** er den Export startet
- **THEN** erhält er eine UTF-8-JSON-Datei mit ausschließlich den gefilterten Fragen
- **AND** enthält jeder Datensatz `frage`, `antworten`, `richtige_antwort`, `sparte`, `erklärung` und `änderungsanfällig`

### Requirement: ADM-006 Änderungsanfällige Zahlenfragen begrenzen
Das System MUSS das Flag `änderungsanfällig` ausschließlich bei Fragen aus Bereich A oder B zulassen, die ausdrücklich zeitabhängige genaue Zahlen enthalten oder nach solchen fragen.

#### Scenario: Zulässige Zahlenfrage
- **GIVEN** eine Frage aus Bereich A mit `contains_time_sensitive_numbers = true`, Quelle und nächstem Prüfdatum
- **WHEN** ein Admin `änderungsanfällig` aktiviert
- **THEN** akzeptiert das System das Flag

#### Scenario: Frage aus Bereich C
- **GIVEN** eine Frage aus Bereich C
- **WHEN** ein Admin `änderungsanfällig` aktivieren will
- **THEN** verhindert das System die Aktivierung
- **AND** erklärt, dass Prüfhinweise im MVP nur für A und B vorgesehen sind

#### Scenario: Keine zeitabhängige genaue Zahl
- **GIVEN** eine Frage aus Bereich B mit `contains_time_sensitive_numbers = false`
- **WHEN** ein Admin `änderungsanfällig` aktivieren will
- **THEN** verhindert das System die Aktivierung

### Requirement: ADM-007 Fällige Prüfhinweise
Die Adminoberfläche MUSS fällige und überfällige Prüfhinweise für zulässige änderungsanfällige Fragen anzeigen, ohne sie Lernenden offenzulegen.

#### Scenario: Prüfung wird fällig
- **GIVEN** eine veröffentlichte änderungsanfällige Frage aus A oder B mit `nächste_prüfung_am` gleich dem heutigen Datum
- **WHEN** ein Admin das Dashboard öffnet
- **THEN** erscheint die Frage in der Liste „Prüfung fällig“
- **AND** bleibt der Hinweis in Lernendenansichten unsichtbar

#### Scenario: Prüfung bestätigen
- **GIVEN** eine fällige Frage und eine fachlich durchgeführte Prüfung
- **WHEN** der Admin Quelle, Ergebnis und Prüfer bestätigt
- **THEN** aktualisiert das System das letzte Prüfdatum
- **AND** schlägt ein nächstes Prüfdatum ein Jahr später vor
- **AND** protokolliert die Aktion

### Requirement: ADM-008 Versionen und Änderungsgrund
Das System MUSS bei einer inhaltlichen Änderung einer veröffentlichten Frage einen Änderungsgrund verlangen und eine neue Version mit Vorher-/Nachher-Nachweis erzeugen.

#### Scenario: Inhaltliche Änderung speichern
- **GIVEN** eine veröffentlichte Frage
- **WHEN** ein Admin eine inhaltliche Änderung mit Änderungsgrund veröffentlicht
- **THEN** erhöht das System die Version um eins
- **AND** hält vorherigen Snapshot, neuen Snapshot, Actor und Grund fest

### Requirement: ADM-009 Archivieren statt hart löschen
Admins MÜSSEN veröffentlichte Fragen mit Historie archivieren können; das System DARF solche Fragen nicht hart löschen.

#### Scenario: Frage mit Versuchen entfernen
- **GIVEN** eine veröffentlichte Frage mit mindestens einem Versuch
- **WHEN** ein Admin „Archivieren“ bestätigt
- **THEN** erhält die Frage den Status `archived`
- **AND** bleibt ihre Historie referenziell intakt

### Requirement: ADM-010 Audit-Log
Das System MUSS sicherheits- und inhaltsrelevante Adminaktionen mit Actor, Aktion, Ziel, Zeitpunkt und Änderung protokollieren.

#### Scenario: Veröffentlichung protokollieren
- **GIVEN** ein Admin veröffentlicht eine Frage
- **WHEN** die Transaktion erfolgreich abgeschlossen ist
- **THEN** enthält das Audit-Log einen unveränderlichen Eintrag zur Veröffentlichung

### Requirement: ADM-011 Filter und Suche
Die Adminoberfläche MUSS Fragen nach Freitext, Bereich, Sparte, Status, Änderungsanfälligkeit und Prüfstatus filtern können.

#### Scenario: Überfällige Fragen in A suchen
- **GIVEN** ein gemischter Fragenbestand
- **WHEN** ein Admin Bereich A und Prüfstatus „überfällig“ auswählt
- **THEN** zeigt die Liste ausschließlich passende Fragen
