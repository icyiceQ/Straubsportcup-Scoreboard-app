// ── Unihockey Scoreboard – Electron main process ──
// Manages the windows (Control Panel, Scoreboard), relays messages
// between them and places the scoreboard fullscreen on the chosen display.

const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Horn must play without a click in the window first
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Automated self-test (npm run selftest): invisible windows, separate data folder
const SELFTEST = process.env.SCOREBOARD_SELFTEST === '1';
if (SELFTEST) {
  const dir = path.join(app.getPath('temp'), 'unihockey-scoreboard-selftest');
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  app.setPath('userData', dir);
}

let controlWin = null;
let scoreboardWin = null;
let quitting = false;

// ── Settings (chosen scoreboard display) ──
let settings = { scoreboardDisplayId: null, scoreboardDisplayLabel: null };

function settingsFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  try {
    settings = Object.assign(settings, JSON.parse(fs.readFileSync(settingsFile(), 'utf8')));
  } catch (e) { /* first start */ }
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  } catch (e) { console.error('Could not save settings', e); }
}

// ── Helpers ──
function page(name) {
  return path.join(__dirname, 'app', name + '.html');
}

const ICON = path.join(__dirname, 'app', 'icon.png');

function webPrefs() {
  return {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false
  };
}

function alive(win) {
  return win && !win.isDestroyed();
}

// Displays sorted left to right, numbered like "Bildschirm 1, 2, ..."
function sortedDisplays() {
  return screen.getAllDisplays().slice().sort((a, b) => (a.bounds.x - b.bounds.x) || (a.bounds.y - b.bounds.y));
}

function displayOf(win) {
  return alive(win) ? screen.getDisplayMatching(win.getBounds()) : null;
}

// Which display should show the scoreboard?
function pickScoreboardDisplay() {
  const displays = sortedDisplays();
  const primary = screen.getPrimaryDisplay();
  // 1. the display chosen in the Control Panel (by id, else by name – ids can change between sessions)
  let d = displays.find(x => x.id === settings.scoreboardDisplayId);
  if (!d && settings.scoreboardDisplayLabel) d = displays.find(x => x.label && x.label === settings.scoreboardDisplayLabel);
  if (d) return d;
  // 2. any display that is not the one with the Control Panel / not the primary one
  const ctrl = displayOf(controlWin) || primary;
  d = displays.find(x => x.id !== ctrl.id);
  return d || primary;
}

// Move a window to a display; fullscreen there unless it is the Control Panel's display
async function moveToDisplay(win, display) {
  if (!alive(win) || SELFTEST) return;
  const ctrl = displayOf(controlWin);
  const full = !ctrl || ctrl.id !== display.id;
  if (win.isFullScreen()) {
    await new Promise(resolve => {
      win.once('leave-full-screen', resolve);
      win.setFullScreen(false);
      setTimeout(resolve, 600);
    });
  }
  const wa = display.workArea;
  const w = Math.min(1280, wa.width), h = Math.min(720, wa.height);
  win.setBounds({ x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + Math.round((wa.height - h) / 2), width: w, height: h });
  if (full) win.setFullScreen(true);
  notifyDisplays();
}

// ── Windows ──
function createControl() {
  const primary = screen.getPrimaryDisplay().workArea;
  controlWin = new BrowserWindow({
    x: primary.x + 40, y: primary.y + 20,
    width: Math.min(1100, primary.width - 80), height: Math.min(1000, primary.height - 40),
    title: 'Control Panel',
    backgroundColor: '#0d1120',
    autoHideMenuBar: true,
    icon: ICON,
    show: !SELFTEST,
    webPreferences: webPrefs()
  });
  controlWin.loadFile(page('menu'));      // start menu: Neue Runde / Fortsetzen / Einstellungen
  controlWin.webContents.once('did-finish-load', () => openScoreboard());

  // Closing the Control Panel ends the whole app – ask first
  controlWin.on('close', (e) => {
    if (quitting) return;
    const choice = dialog.showMessageBoxSync(controlWin, {
      type: 'question',
      buttons: ['Beenden', 'Abbrechen'],
      defaultId: 1,
      cancelId: 1,
      title: 'Scoreboard beenden',
      message: 'Scoreboard wirklich beenden?',
      detail: 'Alle Fenster werden geschlossen. Spielstand, Spielplan und Einstellungen bleiben gespeichert.'
    });
    if (choice !== 0) { e.preventDefault(); return; }
    quitting = true;
    app.quit();
  });
}

function openScoreboard() {
  if (alive(scoreboardWin)) {
    moveToDisplay(scoreboardWin, pickScoreboardDisplay());
    scoreboardWin.showInactive();
    return;
  }
  const display = pickScoreboardDisplay();
  const wa = display.workArea;
  scoreboardWin = new BrowserWindow({
    x: wa.x + 40, y: wa.y + 40, width: Math.min(1280, wa.width - 80), height: Math.min(720, wa.height - 80),
    title: 'Scoreboard',
    backgroundColor: '#060b18',
    autoHideMenuBar: true,
    icon: ICON,
    show: false,
    webPreferences: webPrefs()
  });
  scoreboardWin.loadFile(page('scoreboard'));
  scoreboardWin.once('ready-to-show', async () => {
    if (SELFTEST) return;
    await moveToDisplay(scoreboardWin, display);
    scoreboardWin.showInactive();     // don't steal focus from the Control Panel
    if (alive(controlWin)) controlWin.focus();
  });
  scoreboardWin.on('closed', () => { scoreboardWin = null; notifyDisplays(); });
  scoreboardWin.on('enter-full-screen', notifyDisplays);
  scoreboardWin.on('leave-full-screen', notifyDisplays);
  scoreboardWin.on('moved', notifyDisplays);
}

// Show a big number on every display for a few seconds
function identifyDisplays() {
  sortedDisplays().forEach((d, i) => {
    const size = 360;
    const w = new BrowserWindow({
      x: d.bounds.x + Math.round((d.bounds.width - size) / 2),
      y: d.bounds.y + Math.round((d.bounds.height - size) / 2),
      width: size, height: size,
      frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
      focusable: false, resizable: false, show: false
    });
    const html = `<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
      background:rgba(0,119,182,0.92);border-radius:40px;color:#fff;font:700 220px Segoe UI,Arial,sans-serif;">${i + 1}</body></html>`;
    w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    w.once('ready-to-show', () => w.showInactive());
    setTimeout(() => { if (alive(w)) w.close(); }, 3500);
  });
}

// ── Display info for the Control Panel ──
function displayInfo() {
  const primary = screen.getPrimaryDisplay();
  const ctrl = displayOf(controlWin);
  const sb = displayOf(scoreboardWin);
  return {
    displays: sortedDisplays().map((d, i) => ({
      id: d.id,
      number: i + 1,
      label: d.label || '',
      width: Math.round(d.size.width * d.scaleFactor),
      height: Math.round(d.size.height * d.scaleFactor),
      primary: d.id === primary.id,
      control: !!ctrl && d.id === ctrl.id,
      scoreboard: !!sb && d.id === sb.id,
      chosen: d.id === settings.scoreboardDisplayId
    })),
    scoreboardOpen: alive(scoreboardWin),
    scoreboardFullscreen: alive(scoreboardWin) && scoreboardWin.isFullScreen(),
    chosenAvailable: screen.getAllDisplays().some(d => d.id === settings.scoreboardDisplayId ||
      (settings.scoreboardDisplayLabel && d.label === settings.scoreboardDisplayLabel)),
    chosenLabel: settings.scoreboardDisplayLabel
  };
}

let notifyTimer = null;
function notifyDisplays() {
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    if (alive(controlWin)) controlWin.webContents.send('displays-changed', displayInfo());
  }, 150);
}

// Display plugged in / unplugged / resolution changed
let screenTimer = null;
function onScreenChange() {
  clearTimeout(screenTimer);
  screenTimer = setTimeout(() => {
    if (alive(scoreboardWin)) moveToDisplay(scoreboardWin, pickScoreboardDisplay());
    notifyDisplays();
  }, 800);
}

// ── IPC ──
// Relay messages from one window to all others (replaces BroadcastChannel/postMessage)
ipcMain.on('sb-msg', (e, data) => {
  BrowserWindow.getAllWindows().forEach(w => {
    if (!w.isDestroyed() && w.webContents !== e.sender) w.webContents.send('sb-msg', data);
  });
});

ipcMain.handle('open-window', (e, name) => {
  if (name === 'scoreboard') openScoreboard();
  return displayInfo();
});

ipcMain.handle('get-displays', () => displayInfo());

ipcMain.handle('set-scoreboard-display', (e, id) => {
  const d = screen.getAllDisplays().find(x => x.id === id);
  if (!d) return displayInfo();
  settings.scoreboardDisplayId = d.id;
  settings.scoreboardDisplayLabel = d.label || null;
  saveSettings();
  if (alive(scoreboardWin)) moveToDisplay(scoreboardWin, d);
  else openScoreboard();
  return displayInfo();
});

ipcMain.handle('identify-displays', () => { identifyDisplays(); return true; });

ipcMain.handle('scoreboard-fullscreen', (e, on) => {
  if (alive(scoreboardWin)) scoreboardWin.setFullScreen(!!on);
  return displayInfo();
});

// ── Self-test ──
// Menu -> Neue Runde (league, teams, schedule) -> Control Panel -> match, break, next match, end of evening
async function runSelfTest() {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const ctl = js => controlWin.webContents.executeJavaScript(js);
  const sb = js => scoreboardWin.webContents.executeJavaScript(js);
  const navigate = async (js) => {
    const loaded = new Promise(r => controlWin.webContents.once('did-finish-load', r));
    await ctl(`setTimeout(() => { ${js} }, 20); true`);
    await loaded;
    await wait(300);
  };
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });
  try {
    for (let i = 0; i < 40 && !alive(scoreboardWin); i++) await wait(250);
    await wait(1000);
    check('scoreboard window opened', alive(scoreboardWin));
    const info = displayInfo();
    check('displays detected', info.displays.length >= 1, info.displays.map(d => `${d.number}:${d.label}:${d.width}x${d.height}`).join(', '));

    // start menu
    const menu = await ctl('JSON.stringify({ url: location.pathname.split("/").pop(), cont: document.getElementById("continueBtn").disabled })');
    check('app starts with menu, no round yet', JSON.parse(menu).url === 'menu.html' && JSON.parse(menu).cont === true, menu);

    // settings page shows the default leagues
    await navigate('location.href = "settings.html?from=menu"');
    const leagues = await ctl('JSON.stringify(leagues.map(l => l.name + ":" + l.teams.length))');
    check('default leagues in settings', JSON.parse(leagues).length === 5 && /Herren 1\. Stärkeklasse:8/.test(leagues), leagues);
    await navigate('leave()');

    // new round: Herren 2. Stärkeklasse, 3 teams free, 3 matches
    await navigate('location.href = "setup.html"');
    await ctl(`
      const l = config.leagues.find(x => x.name === 'Herren 2. Stärkeklasse');
      leagueSel.value = l.id; selectLeague(l.id);
      [7, 8, 9].forEach(i => toggleTeam(i, false));
      rows = [{ home: l.teams[0], away: l.teams[1] }, { home: l.teams[2], away: l.teams[3] }, { home: l.teams[4], away: l.teams[0] }];
      renderSchedule(); true`);
    const sum = await ctl('document.getElementById("teamSummary").textContent');
    check('setup: 7 teams play, 3 free', /^7 Teams spielen · spielfrei \(3\)/.test(sum), sum);
    const blocked = await ctl(`rows.push({ home: config.leagues[1].teams[8], away: config.leagues[1].teams[0] }); const e = renderChecks(); rows.pop(); renderSchedule(); e.length`);
    check('setup: free team in schedule is an error', blocked > 0, String(blocked));
    await navigate('startRound()');
    const ctlInfo = await ctl('JSON.stringify({ url: location.pathname.split("/").pop(), n: state.schedule.length, t: state.schedule.map(s => s.time), free: state.freeTeams.length })');
    check('round started -> control panel', JSON.parse(ctlInfo).url === 'control.html' && JSON.parse(ctlInfo).n === 3 && JSON.parse(ctlInfo).free === 3, ctlInfo);
    check('times every 20 min', JSON.stringify(JSON.parse(ctlInfo).t) === '["19:00","19:20","19:40"]', ctlInfo);

    // match start + sync to scoreboard
    await ctl('toggleClock(); changeScore("home", 1); true');
    await wait(2200);
    const sbClock = await sb('document.getElementById("clock").textContent');
    const sbHome = await sb('document.getElementById("homeScore").textContent + "/" + document.getElementById("homeTeamName").textContent + "/" + document.getElementById("tournamentTitle").textContent');
    check('18 min clock runs on scoreboard', /^17:5\d$/.test(sbClock), sbClock);
    check('score + team + league on scoreboard', /^1\/TV Langnau\/.*Herren 2\. Stärkeklasse$/.test(sbHome), sbHome);

    // penalties: 2+2 run one after the other, 2+10: 10' waits for its 2'
    await ctl('addPenalty("home", "2+10"); addPenalty("away", "2+2"); true');
    await wait(1500);
    const pen = JSON.parse(await ctl('JSON.stringify({ h: state.homePenalties.map(p => Math.ceil(p.timeLeft)), a: state.awayPenalties.map(p => Math.ceil(p.timeLeft)) })'));
    check('2+10: 2\' runs, 10\' waits', pen.h.length === 2 && pen.h[0] < 120 && pen.h[1] === 600, JSON.stringify(pen.h));
    check('2+2: second 2\' waits', pen.a.length === 2 && pen.a[0] < 120 && pen.a[1] === 120, JSON.stringify(pen.a));
    await ctl('removePenalty("home", state.homePenalties[0].id); removePenalty("away", state.awayPenalties[0].id); true');
    await wait(1500);
    const pen2 = JSON.parse(await ctl('JSON.stringify({ h: state.homePenalties.map(p => p.duration + ":" + Math.ceil(p.timeLeft)), a: state.awayPenalties.map(p => Math.ceil(p.timeLeft)) })'));
    check('deleted 2\' -> 10\' starts, next 2\' starts', pen2.h.length === 1 && /^600:59\d$/.test(pen2.h[0]) && pen2.a.length === 1 && pen2.a[0] < 120, JSON.stringify(pen2));
    const sbPen = await sb('[...document.querySelectorAll(".penalty-duration-badge")].map(e => e.textContent).join(",")');
    check('scoreboard shows 10 MIN and 2 MIN', /10 MIN/.test(sbPen) && /2 MIN/.test(sbPen), sbPen);

    // match end -> 2 min break -> next match starts
    await ctl('state.timeLeft = 0.2; true');
    await wait(1200);
    const brk = await ctl('JSON.stringify({ cur: state.current, phase: state.phase, running: state.running, res: state.schedule[0].homeScore + ":" + state.schedule[0].awayScore })');
    check('after match: break before next match', JSON.parse(brk).cur === 1 && JSON.parse(brk).phase === 'break' && JSON.parse(brk).running && JSON.parse(brk).res === '1:0', brk);
    const sbBreak = await sb('document.getElementById("clockLabel").textContent + " " + document.getElementById("clock").textContent');
    check('scoreboard shows break countdown', /^Pause 0[12]:\d\d$/.test(sbBreak), sbBreak);
    await ctl('state.breakLeft = 0.2; true');
    await wait(1200);
    const nextM = await ctl('JSON.stringify({ cur: state.current, phase: state.phase, running: state.running })');
    check('after break: next match runs', JSON.parse(nextM).cur === 1 && JSON.parse(nextM).phase === 'match' && JSON.parse(nextM).running, nextM);

    // last match -> end of the evening
    await ctl('goTo(2, "match"); startClock(); state.timeLeft = 0.2; true');
    await wait(1200);
    const done = await ctl('state.phase');
    const sbDone = await sb('document.getElementById("banner").textContent');
    check('end of evening after last match', done === 'done' && sbDone === 'SPIELABEND BEENDET', done + ' / ' + sbDone);

    // back to the menu -> round can be continued
    await navigate('toMenu()');
    const cont = await ctl('document.getElementById("continueBtn").disabled + " " + document.getElementById("continueSub").textContent');
    check('menu offers to continue the round', /^false Herren 2\. Stärkeklasse/.test(cont), cont);

    // scoreboard scaling
    const scale = await sb('document.body.style.transform');
    check('scoreboard scaled to window', /^scale\(/.test(scale), scale);
  } catch (e) {
    check('exception', false, String(e && e.stack || e));
  }
  const ok = results.every(r => r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  [' + r.detail + ']' : '')));
  console.log(ok ? 'SELFTEST OK' : 'SELFTEST FAILED');
  quitting = true;
  app.exit(ok ? 0 : 1);
}

// ── App lifecycle ──
app.whenReady().then(() => {
  loadSettings();
  createControl();
  if (SELFTEST) runSelfTest();
  screen.on('display-added', onScreenChange);
  screen.on('display-removed', onScreenChange);
  screen.on('display-metrics-changed', onScreenChange);
});

app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => app.quit());
