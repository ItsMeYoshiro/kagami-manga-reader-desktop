import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import { MangaGrid } from '@/components/MangaGrid'
import { formatDateTime } from '@/lib/format'
import { useLanguage } from '@/lib/i18n'
import { useLibraryUpdate } from '@/lib/library/LibraryUpdateProvider'
import { UpdateFilters } from '@/components/UpdateFilters'
import { Button, Chip, EmptyState, ErrorNote, ScreenTitle, TopBar } from '@/components/ui'
import { RefreshIcon } from '@/components/ui/Icons'
import { LIBRARY_QUERY } from '@/lib/gql/operations/library'
import {
  STOP_UPDATE_MUTATION,
  UPDATE_LIBRARY_MUTATION,
} from '@/lib/gql/operations/libraryUpdate'
import type { LibraryQuery, UpdateLibraryMutation } from '@/lib/gql/generated/graphql'

export function Library(): React.ReactNode {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { t, tp } = useLanguage()
  const { running, done, total, skipped, lastUpdate, connected } = useLibraryUpdate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['library'],
    queryFn: () => request<LibraryQuery>(LIBRARY_QUERY),
  })

  const update = useMutation({
    mutationFn: () => request<UpdateLibraryMutation>(UPDATE_LIBRARY_MUTATION),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library'] }),
  })

  // Zero jobs means the filters discarded everything. Without saying so, the
  // button just looks broken.
  //
  // The server enqueues asynchronously: the mutation reports totalJobs=0 even
  // when the update will run, so trusting it produced a false warning. We read
  // the real state (from the subscription) a moment after triggering instead.
  const [nothingUpdated, setNothingUpdated] = useState(false)
  const latest = useRef({ running, total, skipped })
  useEffect(() => {
    latest.current = { running, total, skipped }
  }, [running, total, skipped])

  const trigger = (): void => {
    setNothingUpdated(false)
    update.mutate(undefined, {
      onSuccess: () => {
        setTimeout(() => {
          const s = latest.current
          setNothingUpdated(!s.running && s.total === 0 && s.skipped > 0)
        }, 2000)
      },
    })
  }

  // Touching the filters invalidates the warning: it speaks about the previous run.
  const skippedAtTrigger = skipped
  const stop = useMutation({ mutationFn: () => request(STOP_UPDATE_MUTATION) })

  const items = data?.mangas.nodes ?? []
  const unread = items.reduce((sum, m) => sum + m.unreadCount, 0)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex h-full flex-col">
      <TopBar>
        <ScreenTitle>{t('library.title')}</ScreenTitle>
        {items.length > 0 ? (
          <span className="tnum text-[13px] text-txt3">{tp('library.count', items.length)}</span>
        ) : null}
        {unread > 0 ? <Chip tone="accent">{tp('library.unread', unread)}</Chip> : null}

        <div className="flex-1" />

        {running ? (
          <>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-raised2">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="tnum text-xs text-txt3">
              {done}/{total}
              {skipped > 0 ? ` ${t('library.skipped', { n: skipped })}` : ''}
            </span>
            <Button tone="danger" small onClick={() => stop.mutate()} disabled={stop.isPending}>
              {t('library.stop')}
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs text-txt3" title={connected ? undefined : t('library.offline')}>
              {lastUpdate && lastUpdate !== '0'
                ? t('library.updatedAt', { date: formatDateTime(lastUpdate) })
                : t('library.neverUpdated')}
            </span>
            <UpdateFilters />
            <Button
              tone="primary"
              small
              onClick={trigger}
              disabled={update.isPending || items.length === 0}
            >
              <RefreshIcon />
              {update.isPending ? t('library.starting') : t('library.update')}
            </Button>
          </>
        )}
      </TopBar>

      {nothingUpdated ? (
        <p className="shrink-0 bg-warn/10 px-6 py-2.5 text-xs text-warn">
          {skippedAtTrigger > 0
            ? tp('library.nothingUpdated.excluded', skippedAtTrigger)
            : t('library.nothingUpdated.none')}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="p-6 text-[13px] text-txt3">{t('library.loading')}</p>
        ) : error ? (
          <ErrorNote>{(error as Error).message}</ErrorNote>
        ) : items.length === 0 ? (
          <EmptyState
            title={t('library.empty.title')}
            body={t('library.empty.body')}
            action={
              <Button tone="primary" onClick={() => navigate('/browse')}>
                {t('library.empty.action')}
              </Button>
            }
          />
        ) : (
          <MangaGrid items={items} />
        )}
      </div>
    </div>
  )
}
