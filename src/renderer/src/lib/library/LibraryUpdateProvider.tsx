import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import { subscribe } from '@/lib/gql/subscription'
import {
  LIBRARY_UPDATE_STATUS_QUERY,
  LIBRARY_UPDATE_SUBSCRIPTION,
} from '@/lib/gql/operations/libraryUpdate'
import type {
  LibraryUpdateStatusChangedSubscription,
  LibraryUpdateStatusQuery,
} from '@/lib/gql/generated/graphql'

const MAX_UPDATES = 60

interface UpdateState {
  running: boolean
  done: number
  total: number
  skipped: number
  /** Epoch milliseconds as a string. Null when it has never updated. */
  lastUpdate: string | null
  connected: boolean
}

const IDLE: UpdateState = {
  running: false,
  done: 0,
  total: 0,
  skipped: 0,
  lastUpdate: null,
  connected: false,
}

const Ctx = createContext<UpdateState>(IDLE)

export function useLibraryUpdate(): UpdateState {
  return useContext(Ctx)
}

export function LibraryUpdateProvider({ children }: { children: ReactNode }): ReactNode {
  const qc = useQueryClient()
  const [state, setState] = useState<UpdateState>(IDLE)

  // Used to spot the "was running -> finished" transition, which is the moment
  // new chapters exist and the screens need to reload.
  const wasRunning = useRef(false)

  useEffect(() => {
    let alive = true

    const loadTimestamp = async (): Promise<void> => {
      const r = await request<LibraryUpdateStatusQuery>(LIBRARY_UPDATE_STATUS_QUERY)
      if (!alive) return
      const jobs = r.libraryUpdateStatus?.jobsInfo
      setState((s) => ({
        ...s,
        lastUpdate: r.lastUpdateTimestamp?.timestamp ?? null,
        running: jobs?.isRunning ?? false,
        done: jobs?.finishedJobs ?? 0,
        total: jobs?.totalJobs ?? 0,
        skipped: jobs?.skippedMangasCount ?? 0,
      }))
    }

    void loadTimestamp()

    const unsubscribe = subscribe<LibraryUpdateStatusChangedSubscription>(
      LIBRARY_UPDATE_SUBSCRIPTION,
      { maxUpdates: MAX_UPDATES },
      {
        onReset: () => setState((s) => ({ ...s, connected: false })),
        onData: (data) => {
          const d = data.libraryUpdateStatusChanged
          if (!d) return
          const jobs = d.jobsInfo
          const running = jobs?.isRunning ?? false

          setState((s) => ({
            ...s,
            connected: true,
            running,
            done: jobs?.finishedJobs ?? 0,
            total: jobs?.totalJobs ?? 0,
            skipped: jobs?.skippedMangasCount ?? 0,
          }))

          if (wasRunning.current && !running) {
            // Finished: new chapters may have arrived, and the "last updated"
            // timestamp only exists on the query.
            void qc.invalidateQueries({ queryKey: ['library'] })
            void qc.invalidateQueries({ queryKey: ['manga'] })
            void loadTimestamp()
          }
          wasRunning.current = running
        },
      },
    )

    return () => {
      alive = false
      unsubscribe()
    }
  }, [qc])

  const value = useMemo(() => state, [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
