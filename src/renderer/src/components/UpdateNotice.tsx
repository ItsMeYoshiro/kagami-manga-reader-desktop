import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { platform } from '@/platform'
import { usePreferences } from '@/lib/preferences'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'

/** The version whose notice was dismissed, so a later one still speaks up. */
const DISMISSED_KEY = 'kagami.update.dismissed'

const readDismissed = (): string | null => {
  try {
    return localStorage.getItem(DISMISSED_KEY)
  } catch {
    // localStorage unavailable: the notice reappears next launch, which is a
    // far better failure than never showing it.
    return null
  }
}

/**
 * Tells the reader when a newer release exists.
 *
 * Deliberately not an auto-updater: the installer is 318 MB and unsigned, so
 * downloading and swapping it out in the background is the wrong amount of
 * initiative. This says a version exists and links to it.
 */
export function UpdateNotice(): React.ReactNode {
  const t = useT()
  const prefs = usePreferences()
  const [dismissed, setDismissed] = useState(readDismissed)

  const check = useQuery({
    queryKey: ['update-check'],
    queryFn: () => platform.checkForUpdate(),
    // Off means off: with the switch down no request is made at all, rather
    // than one being made and its answer hidden.
    enabled: prefs.checkForUpdates,
    // Once per launch. A release is not going to land mid-session, and the
    // GitHub API counts requests per address.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const info = check.data
  // `enabled: false` stops new requests but keeps whatever was already
  // fetched, so the switch has to gate the render too.
  if (!prefs.checkForUpdates) return null
  if (!info?.available || !info.latest || info.latest === dismissed) return null
  const latest = info.latest

  const dismiss = (): void => {
    setDismissed(latest)
    try {
      localStorage.setItem(DISMISSED_KEY, latest)
    } catch {
      /* not remembering the dismissal only costs one more notice */
    }
  }

  return (
    <div
      role="status"
      className="fixed right-5 bottom-5 z-50 w-[330px] rounded-panel border border-line bg-raised p-4 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-txt">{t('update.title')}</p>
          <p className="mt-1 text-xs leading-relaxed text-txt2">
            {t('update.body', { latest, current: info.current })}
          </p>

          <div className="mt-3 flex gap-2">
            {/* target=_blank goes through the window-open handler in main,
                which sends it to the system browser rather than opening a
                second Electron window. */}
            <a
              href={info.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-ink transition hover:brightness-110"
            >
              {t('update.action')}
            </a>
            <Button tone="ghost" small onClick={dismiss}>
              {t('update.dismiss')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
