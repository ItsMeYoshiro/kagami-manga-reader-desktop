import { spawn, type ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { findServerPaths } from './paths'
import type { ServerStatus } from '../../shared/types'

const HOST = '127.0.0.1'
const PORT = 4567
const BASE_URL = `http://${HOST}:${PORT}`

/** How long we wait for the JVM to come up before giving up. */
const STARTUP_TIMEOUT_MS = 90_000
const POLL_INTERVAL_MS = 500

/**
 * Starts and supervises Suwayomi-Server as a child process.
 *
 * The server is an implementation detail: the user installs an .exe and should
 * never learn there is a JVM in here. That is also why the manager detects a
 * server that is already running (common during development) and attaches to
 * it instead of trying to start a second one on the same port.
 */
export class ServerManager extends EventEmitter {
  private child: ChildProcess | null = null
  private status: ServerStatus = { phase: 'idle', baseUrl: BASE_URL }
  /** Keeps the exit handler from marking 'failed' during a deliberate shutdown. */
  private shuttingDown = false

  getStatus(): ServerStatus {
    return this.status
  }

  private setStatus(next: Partial<ServerStatus>): void {
    this.status = { ...this.status, ...next }
    this.emit('status', this.status)
  }

  async start(): Promise<void> {
    if (this.status.phase === 'starting' || this.status.phase === 'ready') return

    this.shuttingDown = false
    this.setStatus({ phase: 'starting', errorCode: undefined, errorDetail: undefined })

    // Someone already on the port? Attach instead of competing.
    const existing = await probe()
    if (existing) {
      this.setStatus({ phase: 'external', version: existing })
      return
    }

    const paths = findServerPaths()
    if (!paths) {
      this.setStatus({ phase: 'failed', errorCode: 'bundle' })
      return
    }

    this.child = spawn(
      paths.javaExe,
      [
        '-XX:+UseSerialGC',
        '-Xmx512m',
        `-Dsuwayomi.tachidesk.config.server.ip=${HOST}`,
        `-Dsuwayomi.tachidesk.config.server.port=${PORT}`,
        '-Dsuwayomi.tachidesk.config.server.initialOpenInBrowserEnabled=false',
        // We are the UI; the server's built-in WebUI would only burn resources.
        '-Dsuwayomi.tachidesk.config.server.webUIEnabled=false',
        '-jar',
        paths.jar,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
    )

    this.child.stdout?.on('data', (b: Buffer) => console.log('[server]', b.toString().trimEnd()))
    this.child.stderr?.on('data', (b: Buffer) => console.error('[server]', b.toString().trimEnd()))

    this.child.on('error', (err) => {
      this.setStatus({ phase: 'failed', errorCode: 'jvm', errorDetail: err.message })
    })

    this.child.on('exit', (code, signal) => {
      this.child = null
      if (this.shuttingDown) {
        this.setStatus({ phase: 'stopped' })
      } else {
        this.setStatus({
          phase: 'failed',
          errorCode: 'exit',
          errorDetail: `code=${code} signal=${signal}`,
        })
      }
    })

    const version = await waitUntilReady(STARTUP_TIMEOUT_MS)
    if (version) {
      this.setStatus({ phase: 'ready', version })
      return
    }

    // If the process already died, the 'exit' handler recorded the real cause
    // — more useful than a generic timeout. Do not overwrite it.
    if (this.getStatus().phase === 'starting') {
      this.setStatus({
        phase: 'failed',
        errorCode: 'timeout',
        errorDetail: String(STARTUP_TIMEOUT_MS / 1000),
      })
      this.stop()
    }
  }

  stop(): void {
    this.shuttingDown = true
    if (this.child) {
      this.child.kill()
      this.child = null
    }
  }

  async restart(): Promise<void> {
    this.stop()
    this.setStatus({ phase: 'idle' })
    await this.start()
  }
}

/** The server's version if it answers, or null. */
async function probe(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ aboutServer { version } }' }),
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: { aboutServer?: { version?: string } } }
    return json.data?.aboutServer?.version ?? null
  } catch {
    return null
  }
}

async function waitUntilReady(timeoutMs: number): Promise<string | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const version = await probe()
    if (version) return version
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }
  return null
}
