# Unihockey Scoreboard

Anzeige und Steuerung für die Spielabende der Unihockey-Meisterschaft (Straub Sport Cup):
Spieluhr, Resultate, Strafen und ein grosses Scoreboard für Beamer oder TV.

## Was du brauchst

- Einen Windows-PC (Windows 10 oder 11)
- Zwei Bildschirme: den Laptop-Bildschirm für die Bedienung und einen Beamer oder TV für das Scoreboard
- Kein Internet nötig

| PC | Datei |
|---|---|
| Normaler Windows-PC (Intel/AMD) | `Unihockey-Scoreboard-Windows-x64.exe` |
| Windows-PC mit ARM-Prozessor (z.B. Snapdragon) | `Unihockey-Scoreboard-Windows-arm64.exe` |

Die Datei per Doppelklick starten – eine Installation ist nicht nötig.
Fragt Windows beim ersten Start nach („Der Computer wurde durch Windows geschützt“):
**Weitere Informationen → Trotzdem ausführen**.

## Bildschirme einrichten

1. Beamer/TV anschliessen und einschalten.
2. **Windows-Taste + P → „Erweitern“** wählen (nicht „Duplizieren“).
3. App starten: Das Scoreboard öffnet sich automatisch im Vollbild auf dem Beamer/TV.

Erscheint das Scoreboard auf dem falschen Bildschirm, im Control Panel oben rechts auf **🖥 Bildschirme**
klicken und den richtigen Bildschirm wählen. Die Wahl wird gespeichert. Wird der Beamer kurz
ab- und wieder angesteckt, kehrt das Scoreboard von selbst dorthin zurück.

## Startmenü

Nach dem Start erscheint das Menü mit drei Knöpfen:

- **Neue Runde** – einen Spielabend vorbereiten (siehe unten)
- **Bestehende Runde fortsetzen** – die zuletzt gespielte Runde wieder öffnen, z.B. nach einem Neustart des PCs
- **Einstellungen** – Spieldauer, Pause, Ligen und Teams

## Neue Runde vorbereiten

1. **Liga** wählen, **Datum** und **Startzeit** des ersten Spiels prüfen.
2. **Teams des Abends**: Alle Teams der Liga sind angekreuzt. Bei den Teams mit spielfrei
   (normalerweise 3) den Haken entfernen.
3. **Spielplan** erfassen: pro Spiel Team 1 und Team 2 auswählen (6 oder 7 Spiele).
   Mit „+ Spiel“ kommt eine Zeile dazu, mit ↑ ↓ ändert man die Reihenfolge.
   Die Zeiten rechnet die App selbst aus (Spieldauer + Pause).
   Unten sieht man, wie viele Spiele jedes Team hat. Hinweise erscheinen, wenn ein Team
   zweimal hintereinander spielt oder eine Begegnung doppelt vorkommt.
4. **Runde starten** – das Control Panel öffnet sich.

## Während des Spielabends (Control Panel)

- **▶ Start / ⏸ Stop** startet und stoppt die Spieluhr (oder die **Leertaste**).
- **+ / −** unter den Teamnamen ändert den Spielstand.
- Läuft die Zeit ab, ertönt das **Horn**. Danach läuft automatisch die **Pause** (Standard 2 Minuten)
  – auch auf dem Scoreboard sichtbar. Nach der Pause startet das nächste Spiel automatisch mit Horn.
  Mit **„Spiel jetzt starten“** kann die Pause übersprungen werden.
- **📯 Horn** spielt das Horn jederzeit von Hand.
- **Zeit setzen** stellt die Uhr auf eine bestimmte Zeit; **⇄ Teams tauschen** vertauscht die Seiten.
- **◀ Zurück / Weiter ▶** oder **▶** im Spielplan springt zu einem anderen Spiel.
- **✎** im Spielplan korrigiert ein Resultat nachträglich.
- Nach dem letzten Spiel zeigt das Scoreboard **„Spielabend beendet“**.
- **☰ Menü** führt zurück ins Startmenü. Alles bleibt gespeichert.

### Strafen

| Knopf | Bedeutung |
|---|---|
| **+ 2'** | 2-Minuten-Strafe |
| **+ 2+2'** | zwei 2-Minuten-Strafen hintereinander (jede einzeln löschbar) |
| **+ 2+10'** | 2 Minuten, danach läuft die persönliche 10-Minuten-Strafe |

Mehrere 2-Minuten-Strafen eines Teams laufen nacheinander; wartende Strafen sind abgedunkelt.
Mit **✕** wird eine Strafe gelöscht (z.B. nach einem Tor in Überzahl). Die Strafen laufen nur,
wenn die Spieluhr läuft, und erscheinen gross links und rechts neben der Uhr auf dem Scoreboard.

## Einstellungen

- **Name der Meisterschaft** – erscheint oben auf dem Scoreboard
- **Spieldauer** (Standard 18 Minuten) und **Pause** zwischen den Spielen (Standard 2 Minuten)
- **Automatischer Start nach der Pause** ein/aus
- **Ligen und Teams** – ein Team pro Zeile; Ligen hinzufügen, umbenennen, löschen.
  „Standard-Ligen wiederherstellen“ lädt die Teams der Saison 26/27 von straubsportcup.ch.

## Gut zu wissen

- Runde, Resultate und Einstellungen werden laufend automatisch gespeichert – auch wenn die App
  oder der PC abstürzt, geht nichts verloren.
- Beim Schliessen des Control Panels fragt die App nach, ob sie wirklich beendet werden soll.

## Lizenz

[MIT](LICENSE) © 2026 Kjell Ita. Die mitgelieferten Schriften Inter und Orbitron stehen unter der
SIL Open Font License 1.1 ([app/fonts/OFL-Inter.txt](app/fonts/OFL-Inter.txt),
[app/fonts/OFL-Orbitron.txt](app/fonts/OFL-Orbitron.txt)).
