// Electron shell for the static-exported Ramal app (`out/`, produced by
// `ELECTRON_BUILD=true next build`). Structure mirrors the sibling project
// Nameology's own electron/main.js -- see Ramal's CLAUDE.md "Electron
// packaging" section for why: reuse the proven shell rather than
// reinventing it. Ramal is a fully client-side app already (no API routes,
// no backend, reference data ships as static TS, history lives in
// localStorage -- see CLAUDE.md), so it maps cleanly onto this same
// static-export + custom-protocol approach.
const { app, BrowserWindow, shell, protocol, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

const OUT_DIR = path.join(__dirname, '..', 'out');

let mainWindow;

// Register a custom scheme that behaves like https (real http(s) origins are
// off-limits for a bundled app with no server; file:// breaks Next's
// absolute-path asset URLs and has stricter CORS).
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true,
    },
  },
]);

function resolveFilePath(pathname) {
  let filePath = path.join(OUT_DIR, decodeURIComponent(pathname));

  // Directory -> index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    return path.join(filePath, 'index.html');
  }

  // Exact file exists
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // Try .html extension
  if (fs.existsSync(filePath + '.html')) {
    return filePath + '.html';
  }

  // Try as directory with index.html
  if (fs.existsSync(path.join(filePath, 'index.html'))) {
    return path.join(filePath, 'index.html');
  }

  // Fallback to index.html (SPA routing)
  return path.join(OUT_DIR, 'index.html');
}

function createWindow() {
  // Handle the custom app:// protocol
  protocol.handle('app', (request) => {
    const requestUrl = new URL(request.url);
    const filePath = resolveFilePath(requestUrl.pathname);
    return net.fetch(url.pathToFileURL(filePath).href);
  });

  // Allow loading Google Fonts and other external resources
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' app: data:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' app:; " +
          "style-src 'self' 'unsafe-inline' app: https://fonts.googleapis.com; " +
          "font-src 'self' app: https://fonts.gstatic.com data:; " +
          "img-src 'self' app: data: blob:; " +
          "connect-src 'self' app: https://fonts.googleapis.com https://fonts.gstatic.com;"
        ],
      },
    });
  });

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Ramal - Ramal Astrology',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL('app://ramal/');

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navUrl) => {
    if (navUrl.startsWith('app://')) return;
    event.preventDefault();
    shell.openExternal(navUrl);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
