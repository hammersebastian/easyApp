# Lokales Entwicklungs-Runbook

Stand: 13. August 2026

Diese Datei sammelt projektspezifische Erkenntnisse, die für die weitere lokale Entwicklung wichtig sind. Keine Secrets oder echten Passwörter eintragen.

## Umgebung

- Node ist über Homebrew unter `/opt/homebrew/bin/node` installiert.
- Das Projekt erwartet `pnpm@11.16.0`, `pnpm` ist auf dem Mac aber nicht global installiert.
- Befehle deshalb mit `npx --yes pnpm@11.16.0 ...` ausführen oder pnpm global installieren.
- Docker Desktop wird für die lokale Supabase-Instanz benötigt.
- Xcode-Version beim letzten erfolgreichen Build: 26.1.

## Lokale Supabase-Instanz

`.env.local` ist für die lokale Instanz konfiguriert:

- `VITE_DEMO_MODE=false`
- API: `http://127.0.0.1:54321`
- Der lokale öffentliche Anon-Key ist gesetzt.

Der iOS-Simulator kann `127.0.0.1` des Macs erreichen. Ein echtes iPhone kann das nicht; dafür muss in einem separaten Geräte-Build die LAN-IP des Macs verwendet werden.

Supabase starten:

```bash
open -a Docker
npx --yes supabase@latest start
```

Status prüfen:

```bash
npx --yes supabase@latest status
curl -sS http://127.0.0.1:54321/auth/v1/health
```

Lokale Daten bleiben beim normalen Stoppen und Starten erhalten. `supabase db reset` setzt die lokale Datenbank zurück und ist destruktiv.

Lokale E-Mail-Bestätigung ist in `supabase/config.toml` deaktiviert. Es gibt keine fest eingebauten Test-Zugangsdaten. Benutzer werden über **Registrieren** angelegt.

## Web- und iOS-Builds

Der normale Produktions-Build verwendet `.env.production` und darf nicht für lokale Supabase-Tests verwendet werden.

Lokalen Web-Build erzeugen und nach iOS synchronisieren:

```bash
npx --yes pnpm@11.16.0 cap:sync:local
```

Das Script verwendet den Vite-Modus `development`, weil Vite 8 den Modusnamen `local` reserviert. `development` lädt weiterhin `.env.local`.

Produktions-Build synchronisieren:

```bash
npx --yes pnpm@11.16.0 cap:sync
```

Capacitor lädt in iOS die kopierten Dateien aus `ios/App/App/public`, nicht direkt aus `src` oder `dist`. Nach Web-Änderungen ist deshalb immer ein Sync erforderlich.

## Xcode und Simulator

Projekt öffnen:

```bash
open ios/App/App.xcodeproj
```

Dann in Xcode einen Simulator auswählen und mit `Cmd+R` starten.

Wichtig: Simulator-Builds nicht mit `CODE_SIGNING_ALLOWED=NO` installieren. Supabase speichert seine Sitzung über `capacitor-secure-storage-plugin` im iOS-Keychain. Ein unsignierter Build kann beim Speichern mit dem nichtssagenden Fehler `{message: "error"}` scheitern, obwohl Supabase den Login bereits mit HTTP 200 akzeptiert hat.

CLI-Build für einen bestimmten Simulator daher normal signiert ausführen:

```bash
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS Simulator,id=<SIMULATOR-UDID>' \
  build
```

Verfügbare Simulatoren und UDIDs:

```bash
xcrun simctl list devices available
```

Die zuletzt verwendete Simulator-Bezeichnung war `34d iPhone 17 Pro`. Die UDID nicht dauerhaft voraussetzen, da Simulatoren neu angelegt werden können.

## Bekannte iOS-Projektbesonderheiten

- `SceneDelegate.swift` erzeugt `CAPBridgeViewController` programmgesteuert.
- Das alte `Main.storyboard` war redundant und mit Xcode 26.1 nicht kompilierbar. Seine Projekt- und `Info.plist`-Verweise wurden entfernt.
- `LaunchScreen.storyboard` bleibt aktiv.
- Die Login-/Registrierungsansicht verwendet zusätzlich zur Safe Area 20 px oberen Abstand, damit die Karte nicht an der Dynamic Island klebt.
- Ionic wird in `src/main.tsx` explizit mit `mode: 'md'` gestartet, damit PWA und native App dieselben Ionic-Stile verwenden.
- iOS berücksichtigt Safe Areas und kann durch den System-Dark-Mode anders als eine PWA im Light-Mode aussehen.

## Logs und Fehlersuche

Supabase-Auth live verfolgen:

```bash
docker logs -f --tail 100 supabase_auth_34d-learning-app
```

Alle Requests über das lokale Supabase-Gateway:

```bash
docker logs -f --tail 100 supabase_kong_34d-learning-app
```

Datenbank-Logs:

```bash
docker logs -f --tail 100 supabase_db_34d-learning-app
```

Die Live-Anzeige jeweils mit `Ctrl+C` beenden.

WebView untersuchen:

1. In Safari unter **Einstellungen → Erweitert** das Entwickler-Menü aktivieren.
2. **Entwickler → <Simulator> → localhost/App** öffnen.
3. In **Konsole** und **Netzwerk** den Fehler reproduzieren.

Native Logs sind in Xcode über `Shift+Cmd+Y` sichtbar. Alternativ:

```bash
xcrun simctl spawn booted log stream --style compact --predicate 'process == "App"'
```

Haptik-Meldungen über eine fehlende `hapticpatternlibrary.plist` sind im Simulator bekannt und für Login/API-Fehler nicht relevant.

## Bekannte Build-Hinweise

- In `src/domain/randomization.test.ts` wird für Sets `expect(set.size).toBe(...)` verwendet. `toHaveSize` war in der vorhandenen Vitest-Typisierung nicht verfügbar und blockierte `tsc -b`.
- npm kann vor `strict-peer-dependencies` warnen. Diese Warnung blockiert den Build nicht.
- pnpm 11 warnt, dass das Feld `pnpm.overrides` in `package.json` nicht mehr gelesen wird. Das ist derzeit nur eine Warnung, sollte bei einer späteren Dependency-Wartung aber in die aktuelle pnpm-Konfiguration migriert werden.

## Schneller lokaler Ablauf

```bash
open -a Docker
npx --yes supabase@latest start
npx --yes pnpm@11.16.0 cap:sync:local
open ios/App/App.xcodeproj
```

Anschließend in Xcode den Simulator auswählen und mit `Cmd+R` starten.
