# Delta for Learning Progress

## ADDED Requirements

### Requirement: PRG-001 Persistente Antwortversuche
Das System MUSS jede verbindlich abgegebene oder abgelaufene Antwort unveränderlich mit Nutzer, Sitzung, Frageversion, Ergebnis und Antwortzeit speichern.

#### Scenario: Antwort speichern
- **GIVEN** eine aktive, unbeantwortete Sitzungsfrage
- **WHEN** der Lernende eine Antwort verbindlich abgibt
- **THEN** speichert das System genau einen Versuch mit ausgewähltem Index, Richtig/Falsch, Zeitpunkt und Reaktionszeit
- **AND** ist der Versuch nach erneutem Login weiterhin vorhanden

### Requirement: PRG-002 Getrennte Trefferquote und Lernstand
Die App MUSS Trefferquote und Lernstand als getrennte Kennzahlen berechnen und eindeutig beschriften.

#### Scenario: Mehrere Versuche derselben Frage
- **GIVEN** eine Frage wurde zunächst falsch und später richtig beantwortet
- **WHEN** der Lernstand berechnet wird
- **THEN** fließen beide Versuche in die Trefferquote ein
- **AND** zählt die Frage für den aktuellen Lernstand als zuletzt richtig

### Requirement: PRG-003 Bereichs- und Spartenwerte
Die App MUSS den Lernstand und die Trefferquote insgesamt sowie je bearbeitetem Bereich und je bearbeiteter Sparte ausweisen.

#### Scenario: Lernstand aufschlüsseln
- **GIVEN** gespeicherte Versuche in mehreren Bereichen und Sparten
- **WHEN** der Nutzer seine Lernstandansicht öffnet
- **THEN** zeigt die App Gesamtwerte
- **AND** zeigt sie Werte je betroffenem Bereich
- **AND** erlaubt eine weitere Aufschlüsselung nach Sparte

### Requirement: PRG-004 Abdeckung des Fragenbestands
Die App MUSS die Anzahl unterschiedlicher bearbeiteter Fragen und deren Anteil am aktuell veröffentlichten Fragenbestand anzeigen.

#### Scenario: Abdeckung berechnen
- **GIVEN** 20 unterschiedliche bearbeitete Fragen und 100 aktuell veröffentlichte Fragen
- **WHEN** die Abdeckung angezeigt wird
- **THEN** zeigt die App „20 von 100“ und „20 %“

### Requirement: PRG-005 Rundenauswertung
Die App MUSS nach einer abgeschlossenen Trainings- oder Fehlerunde Punktzahl, Prozentwert, richtige und falsche Antworten, Gesamtzeit, durchschnittliche Antwortzeit und Aufschlüsselung nach Bereich und Sparte anzeigen.

#### Scenario: Zehn-Fragen-Runde abschließen
- **GIVEN** eine abgeschlossene Runde mit sieben richtigen und drei falschen Antworten
- **WHEN** die Auswertung geladen wird
- **THEN** zeigt sie „7 von 10“ und „70 %“
- **AND** zeigt sie Zeit- und Bereichswerte aus den gespeicherten Versuchen

### Requirement: PRG-006 Fehlerdetails in der Auswertung
Die App MUSS in der Rundenauswertung jede falsche oder abgelaufene Frage mit gewählter Antwort, richtiger Antwort und Erklärung anzeigen.

#### Scenario: Fehlerliste öffnen
- **GIVEN** eine abgeschlossene Runde mit mindestens einem Fehler
- **WHEN** der Nutzer die Fehlerdetails öffnet
- **THEN** sieht er für jeden Fehler Fragetext, eigene Auswahl oder „Zeit abgelaufen“, richtige Antwort und Erklärung

### Requirement: PRG-007 Rundenhistorie
Die App MUSS abgeschlossene Runden mit Datum, Modus, Punktzahl, Quote und Dauer im Nutzerkonto speichern und erneut öffnen lassen.

#### Scenario: Historische Runde öffnen
- **GIVEN** mehrere abgeschlossene Runden
- **WHEN** der Nutzer eine Runde aus der Historie auswählt
- **THEN** zeigt die App die unveränderte Auswertung auf Basis der damals verwendeten Frageversionen

### Requirement: PRG-008 Hauptmenü-Zusammenfassung
Das Hauptmenü MUSS einen kompakten, aktuellen Überblick aus Gesamtlernstand, bearbeiteten Fragen und Zahl aktiver Fehler anzeigen.

#### Scenario: Lernstand nach Antwort aktualisieren
- **GIVEN** ein Lernender beendet eine Runde
- **WHEN** er zum Hauptmenü zurückkehrt
- **THEN** spiegeln die Zusammenfassung und der Fehlerzähler die gespeicherten Antworten wider

### Requirement: PRG-009 Leere und unzureichende Daten
Die App MUSS bei fehlenden oder wenigen Versuchen einen neutralen Lernhinweis statt einer irreführenden Bestehensprognose anzeigen.

#### Scenario: Noch keine Antworten
- **GIVEN** ein neu registrierter Lernender ohne Versuche
- **WHEN** er den Lernstand öffnet
- **THEN** zeigt die App einen motivierenden Leerzustand und keine erfundene Prozentzahl
- **AND** bietet sie den Start eines Trainings an
