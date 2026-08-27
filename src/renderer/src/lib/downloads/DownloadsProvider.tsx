import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import { subscribe } from '@/lib/gql/subscription'
import {
  DOWNLOAD_STATUS_QUERY,
  DOWNLOAD_STATUS_SUBSCRIPTION,
} from '@/lib/gql/operations/downloads'
import type {
  DownloadStatusChangedSubscription,
  DownloadStatusQuery,
} from '@/lib/gql/generated/graphql'

/** Cap on deltas per message. Above it the server omits them and says so. */
const MAX_UPDATES = 60

type Queue = NonNullable<DownloadStatusQuery['downloadStatus']>['queue']
export type QueueItem = Queue[number]

interface Downloads {
  queue: QueueItem[]
  /** Indexed by chapter id, for O(1) lookups from the lists. */
  byChapter: Map<number, QueueItem>
  downloaderRunning: boolean
  connected: boolean
}

const Ctx = createContext<Downloads>({
  queue: [],
  byChapter: new Map(),
  downloaderRunning: false,
  connected: false,
})

export function useDownloads(): Downloads {
  return useContext(Ctx)
}

export function DownloadsProvider({ children }: { children: ReactNode }): ReactNode {
  const qc = useQueryClient()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [downloaderRunning, setDownloaderRunning] = useState(false)
  const [connected, setConnected] = useState(false)

  // The first message after (re)connecting carries the whole queue in
  // `initial`; the rest carry only deltas. Without this marker, applying deltas
  // on top of stale state would let the queue drift away from reality.
  const hasSnapshot = useRef(false)

  useEffect(() => {
    const reload = async (): Promise<void> => {
      const r = await request<DownloadStatusQuery>(DOWNLOAD_STATUS_QUERY)
      setQueue(r.downloadStatus?.queue ?? [])
      setDownloaderRunning(r.downloadStatus?.state === 'STARTED')
    }

    const unsubscribe = subscribe<DownloadStatusChangedSubscription>(
      DOWNLOAD_STATUS_SUBSCRIPTION,
      { maxUpdates: MAX_UPDATES },
      {
        onReset: () => {
          hasSnapshot.current = false
          setConnected(false)
        },
        onData: (data) => {
          const d = data.downloadStatusChanged
          if (!d) return
          setConnected(true)
          setDownloaderRunning(d.state === 'STARTED')

          // The server dropped events: the deltas are not enough to rebuild the
          // queue, so read all of it again.
          if (d.omittedUpdates) {
            void reload()
            return
          }

          if (!hasSnapshot.current) {
            hasSnapshot.current = true
            setQueue(d.initial ?? [])
            return
          }

          if (d.updates.length === 0) return

          setQueue((current) => {
            const byId = new Map(current.map((i) => [i.chapter.id, i]))
            for (const u of d.updates) {
              const item = u.download
              if (!item) continue
              const id = item.chapter.id
              switch (u.type) {
                case 'DEQUEUED':
                case 'FINISHED':
                  byId.delete(id)
                  break
                default:
                  // QUEUED, PROGRESS, POSITION, ERROR, PAUSED and STOPPED all
                  // carry the full item; overwriting covers them equally.
                  byId.set(id, item)
              }
            }
            return [...byId.values()].sort((a, b) => a.position - b.position)
          })

          // A finished chapter now exists on disk: the screens that show
          // `isDownloaded` need to know.
          if (d.updates.some((u) => u.type === 'FINISHED')) {
            void qc.invalidateQueries({ queryKey: ['manga'] })
            void qc.invalidateQueries({ queryKey: ['library'] })
          }
        },
      },
    )

    return unsubscribe
  }, [qc])

  const value = useMemo<Downloads>(
    () => ({
      queue,
      byChapter: new Map(queue.map((i) => [i.chapter.id, i])),
      downloaderRunning,
      connected,
    }),
    [queue, downloaderRunning, connected],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
