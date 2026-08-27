import { useEffect, useRef, useState, type ReactNode } from 'react'
import { platform } from '@/platform'
import { configureClient } from '@/lib/gql/client'
import { configureSubscriptionClient } from '@/lib/gql/subscription'
import { Button } from '@/components/ui'
import { useT, type Key } from '@/lib/i18n'
import type { ServerErrorCode, ServerStatus } from '@shared/types'

const ERROR_KEY: Record<ServerErrorCode, Key> = {
  bundle: 'gate.error.bundle',
  jvm: 'gate.error.jvm',
  exit: 'gate.error.exit',
  timeout: 'gate.error.timeout',
}

/**
 * Holds the UI back until Suwayomi-Server answers.
 *
 * The user does not need to know a JVM is starting in there — hence the plain
 * message. But when it fails, the error is shown in full: hiding a startup
 * failure only turns a diagnosable problem into an app that "hangs".
 */
export function ServerGate({ children }: { children: ReactNode }): ReactNode {
  const t = useT()
  const [status, setStatus] = useState<ServerStatus | null>(null)

  useEffect(() => {
    let alive = true
    void platform.getServerStatus().then((s) => alive && setStatus(s))
    const off = platform.onServerStatusChanged(setStatus)
    return () => {
      alive = false
      off()
    }
  }, [])

  const ready = status?.phase === 'ready' || status?.phase === 'external'

  // Configured during render rather than in an effect, on purpose: React runs
  // children's effects BEFORE the parent's, so an effect here would leave the
  // clients unconfigured while the children were already subscribing or
  // querying. The ref makes the call idempotent per base URL.
  const configuredFor = useRef<string | null>(null)
  if (ready && status && configuredFor.current !== status.baseUrl) {
    configuredFor.current = status.baseUrl
    configureClient(status.baseUrl)
    configureSubscriptionClient(status.baseUrl)
  }

  if (ready) return children

  const key = status?.errorCode ? ERROR_KEY[status.errorCode] : 'gate.error.unknown'

  return (
    <div className="grid h-full place-items-center px-8">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span
          className="grid h-16 w-16 place-items-center rounded-panel bg-accent/15 font-display text-4xl leading-none text-accent"
          aria-hidden="true"
        >
          鏡
        </span>
        <p className="mt-3 font-display text-xl tracking-tight text-txt">Kagami</p>

        {status?.phase === 'failed' ? (
          <>
            <p className="mt-5 text-[13px] leading-relaxed text-danger">
              {t(key, { detail: status.errorDetail ?? '' })}
            </p>
            <Button tone="neutral" className="mt-5" onClick={() => void platform.restartServer()}>
              {t('gate.retry')}
            </Button>
          </>
        ) : (
          <>
            <div className="mt-6 h-0.5 w-48 overflow-hidden rounded-full bg-raised2">
              <div className="h-full w-1/3 rounded-full bg-accent [animation:loading-bar_1.4s_ease-in-out_infinite]" />
            </div>
            <p className="mt-3 text-xs text-txt3">{t('gate.loading')}</p>
          </>
        )}
      </div>
    </div>
  )
}
