// ── Gemeinsame Funktionen für Unihockey Scoreboard ──
// Zwei gespeicherte Datensätze (localStorage im App-Datenordner):
//   CONFIG_KEY – Einstellungen: Spieldauer, Pause, Ligen + Teams (bleibt dauerhaft)
//   ROUND_KEY  – die aktuelle Runde (Spielabend): Liga, Teams, Spielplan, Resultate, Uhr

const CONFIG_KEY = 'unihockey-config';
const ROUND_KEY = 'unihockey-round';
const STORAGE_KEY = ROUND_KEY;   // vom Scoreboard für den Abgleich verwendet

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Einstellungen ──
function getDefaultLeagues() {
  return (typeof DEFAULT_LEAGUES !== 'undefined' ? DEFAULT_LEAGUES : [])
    .map(l => ({ id: newId(), name: l.name, teams: l.teams.slice() }));
}

function getDefaultConfig() {
  return {
    competitionName: (typeof DEFAULT_COMPETITION_NAME !== 'undefined' ? DEFAULT_COMPETITION_NAME : 'Meisterschaft'),
    matchDurationMin: 18,
    breakDurationMin: 2,
    autoStartAfterBreak: true,
    lastStartTime: '19:00',
    lastLeagueId: null,
    leagues: getDefaultLeagues()
  };
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const c = Object.assign(getDefaultConfig(), JSON.parse(raw));
      c.leagues = (c.leagues || []).map(l => ({
        id: l.id || newId(),
        name: String(l.name || '').trim() || 'Liga',
        teams: (l.teams || []).map(t => String(t).trim()).filter(Boolean)
      }));
      return c;
    }
  } catch (e) { /* ignore */ }
  const c = getDefaultConfig();
  saveConfig(c);
  return c;
}

function saveConfig(config) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch (e) { /* ignore */ }
}

// ── Runde (Spielabend) ──
function makeScheduleItem(src) {
  src = src || {};
  return {
    id: src.id || newId(),
    time: src.time || '',
    home: src.home || '',
    away: src.away || '',
    homeScore: typeof src.homeScore === 'number' ? src.homeScore : null,
    awayScore: typeof src.awayScore === 'number' ? src.awayScore : null
  };
}

function getEmptyRound() {
  return {
    competitionName: '',
    leagueId: null,
    leagueName: '',
    date: '',
    startTime: '',
    teams: [],                  // Teams, die an diesem Abend spielen
    freeTeams: [],              // Teams der Liga mit spielfrei
    schedule: [],               // [{ id, time, home, away, homeScore, awayScore }]
    current: 0,                 // Index im Spielplan
    phase: 'match',             // 'match' | 'break' (Pause vor dem aktuellen Spiel) | 'done'
    homeTeam: '',
    awayTeam: '',
    homeScore: 0,
    awayScore: 0,
    matchDuration: 18 * 60,     // Sekunden
    breakDuration: 2 * 60,      // Sekunden
    timeLeft: 18 * 60,          // Restzeit Spiel
    breakLeft: 0,               // Restzeit Pause
    running: false,
    started: false,
    homePenalties: [],          // 2-Min-Strafen { id, duration, timeLeft }
    awayPenalties: []
  };
}

function hasRound(round) {
  return !!(round && round.schedule && round.schedule.length);
}

function loadRound() {
  try {
    const raw = localStorage.getItem(ROUND_KEY);
    if (raw) {
      const r = Object.assign(getEmptyRound(), JSON.parse(raw), { running: false });
      r.schedule = (r.schedule || []).map(makeScheduleItem);
      return r;
    }
  } catch (e) { /* ignore */ }
  return getEmptyRound();
}

function saveRound(round) {
  try { localStorage.setItem(ROUND_KEY, JSON.stringify(round)); } catch (e) { /* ignore */ }
}

function clearRound() {
  try { localStorage.removeItem(ROUND_KEY); } catch (e) { /* ignore */ }
}

// Geplante Startzeiten: Startzeit + Index × (Spieldauer + Pause)
function addMinutes(hhmm, minutes) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return '';
  let t = (parseInt(m[1]) * 60 + parseInt(m[2]) + Math.round(minutes)) % (24 * 60);
  if (t < 0) t += 24 * 60;
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
}

function recomputeTimes(round) {
  const slot = (round.matchDuration + round.breakDuration) / 60;
  round.schedule.forEach((it, i) => { it.time = addMinutes(round.startTime, i * slot); });
}

function currentItem(state) {
  return state.schedule[state.current] || null;
}

function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : (iso || '');
}

// ── Strafen ──
// penalty = { id, duration: 120 | 600, timeLeft, label, waitFor? }
// 2-Min-Strafen eines Teams laufen nacheinander (nur die erste zählt herunter; 2+2 = zwei Einträge).
// 10-Min-Strafe (aus 2+10) läuft unabhängig, aber erst wenn ihre 2-Min-Strafe (waitFor) weg ist.
function penaltyStatus(penalties) {
  penalties = penalties || [];
  const ids = new Set(penalties.map(p => p.id));
  let twoRunning = false;
  return penalties.map(p => {
    let waiting;
    if (p.duration > 120) {
      waiting = !!(p.waitFor && ids.has(p.waitFor));
    } else {
      waiting = twoRunning;
      twoRunning = true;
    }
    return { p, waiting };
  });
}

// ── Zeitformat ──
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// Spieluhr: MM:SS, in der letzten Minute SS.t (Sekunden + Zehntel)
function formatClock(totalSeconds) {
  const t = Math.max(0, totalSeconds);
  if (t >= 60) return formatTime(t);
  const secs = Math.floor(t);
  const tenths = Math.floor((t - secs) * 10 + 1e-6);
  return String(secs).padStart(2, '0') + '.' + tenths;
}

function formatTimeSpans(totalSeconds) {
  const str = formatClock(totalSeconds);
  return str.split('').map(ch =>
    ch === ':' || ch === '.' ? `<span class="colon">${ch}</span>` : `<span class="digit">${ch}</span>`
  ).join('');
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Nachrichten zwischen den Fenstern ──
// In der Electron-App über den Main-Prozess (window.scoreboardAPI aus preload.js).
// Wird eine Seite im normalen Browser geöffnet (Test): BroadcastChannel.
const SB_API = (typeof window !== 'undefined' && window.scoreboardAPI) || null;
const _bc = (!SB_API && typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('unihockey-scoreboard') : null;

function sendMsg(data) {
  try {
    if (SB_API) SB_API.send(data);
    else if (_bc) _bc.postMessage(data);
  } catch (e) { /* ignore */ }
}

function onMsg(handler) {
  if (SB_API) SB_API.onMessage(handler);
  else if (_bc) _bc.addEventListener('message', (e) => handler(e.data));
}
