/** Types shared by main, preload and renderer. */

export type ServerPhase =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'failed'
  | 'stopped'
  /** Found a server that was already running; not our child. */
  | 'external'

/**
 * Why startup failed.
 *
 * The main process does not know what language the interface is in — that
 * preference lives in the renderer. So it sends the reason as a code, and
 * whoever displays it is the one who translates. `errorDetail` carries what
 * does not translate: the JVM's message, an exit code, a number of seconds.
 */
export type ServerErrorCode = 'bundle' | 'jvm' | 'exit' | 'timeout'

export interface ServerStatus {
  phase: ServerPhase
  /** e.g. http://127.0.0.1:4567 */
  baseUrl: string
  /** Set when phase === 'failed'. */
  errorCode?: ServerErrorCode
  errorDetail?: string
  /** Version the server reports once it is ready. */
  version?: string
}

/** What the update check found. Absent fields mean it could not tell. */
export interface UpdateInfo {
  /** The version of the running build. */
  current: string
  /** The newest published release, when GitHub answered. */
  latest?: string
  /** Where to read what changed. */
  url?: string
  /** True only when `latest` is genuinely newer than `current`. */
  available: boolean
}

export const IPC = {
  serverGetStatus: 'server:getStatus',
  serverRestart: 'server:restart',
  serverStatusChanged: 'server:statusChanged',
  updateCheck: 'update:check',
} as const
