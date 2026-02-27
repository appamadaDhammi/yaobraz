import { app, BrowserWindow, Menu, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

app.commandLine.appendSwitch('ignore-certificate-errors');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = () => {
  // Open on the display where the mouse cursor currently is
  const cursorPoint = screen.getCursorScreenPoint();
  const targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const { x, y, width, height } = targetDisplay.bounds;

  const mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    kiosk: true,
    fullscreen: true,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Ctrl/Cmd + Shift/Alt + I → DevTools
    if ((input.control || input.meta) && (input.shift || input.alt) && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    // Shift + Alt + R → Reload page
    if (input.shift && input.alt && input.key.toLowerCase() === 'r') {
      mainWindow.webContents.reload();
      event.preventDefault();
    }
    // Shift + Alt + K → Toggle cursor visibility
    if (input.shift && input.alt && input.key.toLowerCase() === 'k') {
      mainWindow.webContents.executeJavaScript(`
        document.body.style.cursor = document.body.style.cursor === 'none' ? '' : 'none';
      `);
      event.preventDefault();
    }
  });

  mainWindow.loadURL('https://localhost:5173/anti-tetris');
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
