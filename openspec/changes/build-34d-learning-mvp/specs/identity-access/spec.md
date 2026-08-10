# Delta for Identity and Access

## ADDED Requirements

### Requirement: AUTH-001 Registrierung
Die App MUSS einem neuen Lernenden die Registrierung mit E-Mail-Adresse, Passwort und Anzeigename ermöglichen und vor Nutzung geschützter Funktionen die E-Mail-Adresse verifizieren.

#### Scenario: Erfolgreiche Registrierung
- **GIVEN** eine noch nicht registrierte E-Mail-Adresse und gültige Eingaben
- **WHEN** der Nutzer die Registrierung absendet
- **THEN** erstellt das System ein Konto mit der Rolle `learner`
- **AND** versendet eine Verifikationsnachricht
- **AND** gewährt erst nach erfolgreicher Verifikation Zugriff auf das Hauptmenü

#### Scenario: Ungültige Registrierung
- **GIVEN** eine ungültige E-Mail-Adresse, ein zu schwaches Passwort oder einen leeren Anzeigenamen
- **WHEN** der Nutzer die Registrierung absendet
- **THEN** erstellt das System kein Konto
- **AND** zeigt feldnahe, verständliche Fehlermeldungen auf Deutsch

### Requirement: AUTH-002 Login und Sitzung
Die App MUSS verifizierte Nutzer sicher anmelden, ihre Sitzung über App-Neustarts hinweg wiederherstellen und sie abmelden können.

#### Scenario: Gültige Sitzung beim Appstart
- **GIVEN** ein zuvor angemeldeter Nutzer mit gültiger Sitzung
- **WHEN** die App nach dem Splashscreen startet
- **THEN** stellt sie die Sitzung wieder her
- **AND** öffnet das Hauptmenü ohne erneute Passworteingabe

#### Scenario: Ungültige Anmeldedaten
- **GIVEN** eine unbekannte E-Mail-Adresse oder ein falsches Passwort
- **WHEN** ein Login versucht wird
- **THEN** verweigert das System den Zugriff
- **AND** zeigt eine generische Meldung, die nicht verrät, ob die E-Mail-Adresse existiert

#### Scenario: Logout
- **GIVEN** ein angemeldeter Nutzer
- **WHEN** er sich abmeldet
- **THEN** wird die lokale Sitzung beendet
- **AND** geschützte Ansichten sind ohne erneuten Login nicht erreichbar

### Requirement: AUTH-003 Passwort zurücksetzen
Die App MUSS einen sicheren Prozess zum Zurücksetzen eines vergessenen Passworts anbieten.

#### Scenario: Passwortreset anfordern
- **GIVEN** eine syntaktisch gültige E-Mail-Adresse
- **WHEN** der Nutzer einen Passwortreset anfordert
- **THEN** zeigt die App unabhängig vom Kontobestand dieselbe Bestätigung
- **AND** sendet der Authentifizierungsdienst bei vorhandenem Konto einen zeitlich begrenzten Reset-Link

### Requirement: AUTH-004 Profil und Begrüßung
Die App MUSS den Anzeigenamen speichern und den angemeldeten Nutzer im Hauptmenü damit begrüßen lassen.

#### Scenario: Begrüßung anzeigen
- **GIVEN** ein angemeldeter Nutzer mit Anzeigename „Mara“
- **WHEN** das Hauptmenü geladen wird
- **THEN** zeigt die App eine Begrüßung mit „Mara“

#### Scenario: Anzeigename ändern
- **GIVEN** ein angemeldeter Nutzer
- **WHEN** er einen gültigen neuen Anzeigenamen speichert
- **THEN** erscheint der neue Name ab der nächsten erfolgreichen Aktualisierung in der Begrüßung

### Requirement: AUTH-005 Rollenbasierter Zugriff
Das System MUSS die Rollen `learner` und `admin` serverseitig durchsetzen und Adminfunktionen ausschließlich Admins erlauben.

#### Scenario: Lernender ruft Adminroute auf
- **GIVEN** ein angemeldeter Nutzer mit Rolle `learner`
- **WHEN** er eine Adminroute direkt oder über einen Backendaufruf anspricht
- **THEN** verweigert das System den Zugriff
- **AND** werden keine Admin- oder unveröffentlichten Fragedaten offengelegt

#### Scenario: Admin öffnet Verwaltung
- **GIVEN** ein angemeldeter Nutzer mit serverseitig bestätigter Rolle `admin`
- **WHEN** er die Adminoberfläche öffnet
- **THEN** erhält er Zugriff auf die erlaubten Verwaltungsfunktionen

### Requirement: AUTH-006 Datenschutz und Kontolöschung
Die App MUSS Datenschutzhinweise zugänglich machen und einem angemeldeten Nutzer die Löschung seines Kontos ermöglichen.

#### Scenario: Konto löschen
- **GIVEN** ein angemeldeter Nutzer, der die Sicherheitsabfrage bestätigt
- **WHEN** er die Kontolöschung auslöst
- **THEN** beendet das System alle Sitzungen
- **AND** löscht oder anonymisiert seine personenbezogenen Profildaten und Lernhistorie nach der dokumentierten Aufbewahrungsregel
- **AND** verhindert einen weiteren Zugriff mit dem gelöschten Konto

### Requirement: AUTH-007 Datenisolation
Das System MUSS Lernfortschritt, Quizsitzungen und Antwortversuche strikt dem jeweiligen Nutzer zuordnen.

#### Scenario: Zugriff auf fremde Lerndaten
- **GIVEN** zwei unterschiedliche Lernende
- **WHEN** einer versucht, über manipulierte IDs Daten des anderen abzurufen oder zu ändern
- **THEN** verweigert das Backend den Zugriff unabhängig von der Clientoberfläche
