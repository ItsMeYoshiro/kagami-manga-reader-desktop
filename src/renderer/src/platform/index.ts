import type { ServerStatus } from '@shared/types'

/**
 * The platform boundary.
 *
 * Everything else in the renderer imports from here and never from 'electron'.
 * Porting the UI to another shell (Tauri, PWA) means rewriting this one file —
 * no component has to change.
 */
export interface Platform {
  getServerStatus(): Promise<ServerStatus>
  restartServer(): Promise<void>
  onServerStatusChanged(cb: (status: ServerStatus) => void): () => void
  /** true inside Electron; false in a plain browser. */
  readonly isDesktop: boolean
}

const electron: Platform = {
  getServerStatus: () => window.kagami.server.getStatus(),
  restartServer: () => window.kagami.server.restart(),
  onServerStatusChanged: (cb) => window.kagami.server.onStatusChanged(cb),
  isDesktop: true,
}

/**
 * Fallback for running the renderer in a browser (handy for working on the UI
 * without starting Electron). Assumes a server already listening on the
 * default port.
 */
const browser: Platform = {
  getServerStatus: async () => ({ phase: 'external', baseUrl: 'http://127.0.0.1:4567' }),
  restartServer: async () => {},
  onServerStatusChanged: () => () => {},
  isDesktop: false,
}

export const platform: Platform =
  typeof window !== 'undefined' && window.kagami ? electron : browser
