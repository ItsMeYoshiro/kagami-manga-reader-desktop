import { app, net } from 'electron'
import type { UpdateInfo } from '../shared/types'

const LATEST_RELEASE =
  'https://api.github.com/repos/ItsMeYoshiro/kagami-manga-reader-desktop/releases/latest'

/** How long to wait before deciding the answer is not coming. */
const TIMEOUT_MS = 8000

/**
 * Compares dotted numeric versions, so 0.2.0 beats 0.1.9 where a string
 * comparison would not. Anything after a hyphen is ignored: GitHub's "latest"
 * endpoint already excludes pre-releases, and treating `1.0.0-rc1` as equal to
 * `1.0.0` errs towards not nagging.
 */
function isNewer(candidate: string, current: string): boolean {
  const parts = (v: string): number[] =>
    v
      .replace(/^v/, '')
      .split('-')[0]
      .split('.')
      .map((n) => Number.parseInt(n, 10) || 0)

  const a = parts(candidate)
  const b = parts(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0
  }
  return false
}

/**
 * Asks GitHub what the newest release is.
 *
 * This is the only request Kagami makes to anywhere but its own server, and it
 * is a plain unauthenticated GET: no identifier, no build id, nothing about the
 * library. It runs once per launch, and the renderer shows a dismissible note
 * if the answer is newer than what is installed.
 *
 * It lives in the main process rather than the renderer for two reasons: the
 * renderer's CSP allows connections only to the local server, and the version
 * of the running build is something only Electron knows.
 */
export async function checkForUpdate(): Promise<UpdateInfo> {
  const current = app.getVersion()
  try {
    const res = await net.fetch(LATEST_RELEASE, {
      headers: {
        Accept: 'application/vnd.github+json',
        // GitHub rejects API requests that do not identify themselves.
        'User-Agent': `Kagami/${current}`,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return { current, available: false }

    const body = (await res.json()) as { tag_name?: string; html_url?: string }
    if (!body.tag_name) return { current, available: false }

    const latest = body.tag_name.replace(/^v/, '')
    return {
      current,
      latest,
      url: body.html_url,
      available: isNewer(latest, current),
    }
  } catch {
    // Offline, rate-limited, GitHub having a bad day: not knowing is not a
    // failure worth putting on screen. The next launch asks again.
    return { current, available: false }
  }
}
