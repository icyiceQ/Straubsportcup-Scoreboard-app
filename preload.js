// Bridge between the pages and the Electron main process
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('scoreboardAPI', {
  isElectron: true,
  // messaging between the windows
  send: (data) => ipcRenderer.send('sb-msg', data),
  onMessage: (cb) => ipcRenderer.on('sb-msg', (_e, data) => cb(data)),
  // windows & displays
  openWindow: (name) => ipcRenderer.invoke('open-window', name),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  setScoreboardDisplay: (id) => ipcRenderer.invoke('set-scoreboard-display', id),
  identifyDisplays: () => ipcRenderer.invoke('identify-displays'),
  setScoreboardFullscreen: (on) => ipcRenderer.invoke('scoreboard-fullscreen', on),
  onDisplaysChanged: (cb) => ipcRenderer.on('displays-changed', (_e, info) => cb(info))
});
