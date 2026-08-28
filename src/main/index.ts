import { join } from 'node:path'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { ServerManager } from './server/manager'
import { checkForUpdate } from './update'
import { IPC, type ServerStatus } from '../shared/types'

const server = new ServerManager()
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 940,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    // The window's colour before the renderer paints. Has to match
    // --color-bg in index.css, or opening the app flashes.
    backgroundColor: '#0c0b0f',
    title: 'Kagami',
    // When packaged, the window inherits the icon from its own .exe. In dev
    // the executable is Electron's, so without this the taskbar shows theirs.
    ...(app.isPackaged ? {} : { icon: join(__dirname, '../../build/icon.ico') }),
    webPreferences: {
      // Chromium throttles background renderers, which delays the download
      // queue's subscription messages by several seconds. A reader with
      // downloads running spends much of its time minimised, so progress has
      // to keep arriving.
      backgroundThrottling: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // External links go to the system browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // Development deep link: KAGAMI_ROUTE=/manga/1 opens straight onto that
  // screen, instead of navigating the UI again after every restart.
  const route = process.env.KAGAMI_ROUTE
  const hash = route ? { hash: route } : undefined

  if (process.env.ELECTRON_RENDERER_URL) {
    const url = new URL(process.env.ELECTRON_RENDERER_URL)
    if (route) url.hash = route
    void mainWindow.loadURL(url.toString())
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'), hash)
  }
}

// A single instance: two would try to start two servers on the same port.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  void app.whenReady().then(() => {
    ipcMain.handle(IPC.serverGetStatus, () => server.getStatus())
    ipcMain.handle(IPC.serverRestart, () => server.restart())
    ipcMain.handle(IPC.updateCheck, () => checkForUpdate())

    server.on('status', (status: ServerStatus) => {
      mainWindow?.webContents.send(IPC.serverStatusChanged, status)
    })

    createWindow()
    // Does not block the window: the renderer shows progress over IPC.
    void server.start()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  // The JVM is our child: it has to die with us, or it is orphaned holding the port.
  app.on('before-quit', () => server.stop())
  process.on('exit', () => server.stop())
}
