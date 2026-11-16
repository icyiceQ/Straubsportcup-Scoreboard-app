# Unihockey Scoreboard (Electron)

Desktop-App für die Unihockey-Meisterschaft (Straub Sport Cup): Startmenü, Ligen und Teams,
Spielabende mit Spielplan, Matchuhr mit Pause, 2-Min-Strafen und Scoreboard für Beamer/TV.

## Benutzen

| System | Datei | Start |
|---|---|---|
| Windows 10/11 (Intel/AMD) | `Unihockey-Scoreboard-Windows-x64.exe` | Doppelklick, keine Installation |
| Windows 11 auf ARM | `Unihockey-Scoreboard-Windows-arm64.exe` | Doppelklick, keine Installation |
| macOS Apple Silicon (M1–M4) | `Unihockey-Scoreboard-macOS-arm64.dmg` | DMG öffnen, App in „Programme“ ziehen |

Die Windows-Dateien entstehen lokal mit `npm run dist` in `dist\`. Alle Dateien baut GitHub Actions bei
jedem Push automatisch (GitHub → Actions → letzter Lauf → „Artifacts“); bei einem Tag `v…` zusätzlich als Release.

**macOS:** Die App ist nicht von Apple beglaubigt. Meldet macOS beim ersten Start „beschädigt“ oder
„kann nicht geöffnet werden“, einmal im Terminal ausführen:

```
xattr -cr "/Applications/Unihockey Scoreboard.app"
```

Danach startet sie normal (alternativ: Rechtsklick → Öffnen, bzw. Systemeinstellungen → Datenschutz & Sicherheit → „Trotzdem öffnen“).

Beim Start erscheint das **Menü**:

- **Neue Runde** – Liga wählen, Datum und Startzeit setzen, die Teams des Abends ankreuzen
  (Teams mit spielfrei abwählen, normalerweise 3) und den Spielplan erfassen (6–7 Spiele).
  Die Zeiten werden aus Startzeit + Spieldauer + Pause berechnet. „Runde starten“ öffnet das Control Panel.
- **Bestehende Runde fortsetzen** – öffnet die gespeicherte Runde wieder (auch nach einem Neustart).
- **Einstellungen** – Name der Meisterschaft, Spieldauer (Standard 18 Min), Pause (Standard 2 Min),
  automatischer Start nach der Pause, Ligen und Teams (ein Team pro Zeile).

Ablauf im Control Panel: Spiel starten (▶ oder Leertaste) → nach Ablauf Horn → Pause mit
Countdown (auch auf dem Scoreboard) → nächstes Spiel startet automatisch mit Horn.
Nach dem letzten Spiel zeigt das Scoreboard „Spielabend beendet“.

- Das Scoreboard öffnet sich automatisch im Vollbild auf dem anderen Bildschirm (Beamer/TV).
- **🖥 Bildschirme** im Control Panel: Bildschirm für das Scoreboard wählen, identifizieren, Vollbild ein/aus.
- Zeigt Windows beide Bildschirme gleich: **Win + P → „Erweitern“**.

Runde, Resultate und Einstellungen werden automatisch gespeichert (`%APPDATA%\Unihockey Scoreboard`).

## Entwickeln

Benötigt Node.js (LTS).

```
npm install          # einmalig
npm start            # App starten
npm run selftest     # automatischer Test (unsichtbar, eigene Testdaten)
npm run dist         # Windows x64 + ARM64 bauen (dist\*.exe)
npm run dist:mac     # macOS Apple Silicon (nur auf einem Mac, sonst über GitHub Actions)
```

Workflow: `.github/workflows/build.yml` (Windows- und macOS-Runner).

Hinweis: In einem VS-Code-Terminal ist `ELECTRON_RUN_AS_NODE=1` gesetzt. Dann startet
Electron nicht richtig – vorher in PowerShell `Remove-Item Env:ELECTRON_RUN_AS_NODE` ausführen.

## Aufbau

- `main.js` – Fenster, Bildschirm-Zuteilung, Nachrichten zwischen den Fenstern, Selbsttest
- `preload.js` – Schnittstelle zwischen Seiten und `main.js`
- `app/menu.html` – Startmenü
- `app/setup.html` – Neue Runde (Liga, Teams, Spielplan)
- `app/settings.html` – Einstellungen (Spieldauer, Pause, Ligen, Teams)
- `app/control.html` – Control Panel während der Runde
- `app/scoreboard.html` – Anzeige für Beamer/TV
- `app/js/leagues.js` – Standard-Ligen und Teams (Saison 26/27 von straubsportcup.ch)
- `app/js/sync.js` – Speichern/Laden von Einstellungen und Runde, Zeitformate, Nachrichten
- `app/css/common.css` – gemeinsame Styles der Bedienseiten
- `build/icon.png` – App-Icon für die exe (Quelle: `build/icon-source.html`), Kopie als `app/icon.png` für die Fenster

## Lizenz

[MIT](LICENSE) © 2026 Kjell Ita

Die mitgelieferten Schriften stehen unter der SIL Open Font License 1.1:
Inter ([app/fonts/OFL-Inter.txt](app/fonts/OFL-Inter.txt)) und Orbitron ([app/fonts/OFL-Orbitron.txt](app/fonts/OFL-Orbitron.txt)).
