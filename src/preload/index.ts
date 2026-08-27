import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type ServerStatus } from '../shared/types'

/**
 * The only bridge between the renderer and Electron.
 *
 * The renderer never imports 'electron' directly — everything comes through
 * here and is consumed via src/renderer/src/platform. That keeps the UI
 * portable: swapping the shell (Tauri, web) means reimplementing only that
 * one layer.
 */
const api = {
  server: {
    getStatus: (): Promise<ServerStatus> => ipcRenderer.invoke(IPC.serverGetStatus),
    restart: (): Promise<void> => ipcRenderer.invoke(IPC.serverRestart),
    onStatusChanged: (cb: (status: ServerStatus) => void): (() => void) => {
      const listener = (_e: unknown, status: ServerStatus): void => cb(status)
      ipcRenderer.on(IPC.serverStatusChanged, listener)
      return () => ipcRenderer.off(IPC.serverStatusChanged, listener)
    },
  },
}

export type KagamiApi = typeof api

contextBridge.exposeInMainWorld('kagami', api)
