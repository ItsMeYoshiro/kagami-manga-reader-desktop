import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assetUrl, request } from '@/lib/gql/client'
import { useDownloads } from '@/lib/downloads/DownloadsProvider'
import { chapterLabel } from '@/lib/format'
import { Button, Chip, EmptyState, IconButton, ScreenTitle, TopBar } from '@/components/ui'
import { CloseIcon } from '@/components/ui/Icons'
import { useLanguage, type Key } from '@/lib/i18n'
import {
  CLEAR_DOWNLOADER_MUTATION,
  DEQUEUE_DOWNLOADS_MUTATION,
  START_DOWNLOADER_MUTATION,
  STOP_DOWNLOADER_MUTATION,
} from '@/lib/gql/operations/downloads'

const STATE_KEY: Record<string, Key> = {
  QUEUED: 'downloads.state.QUEUED',
  DOWNLOADING: 'downloads.state.DOWNLOADING',
  FINISHED: 'downloads.state.FINISHED',
  ERROR: 'downloads.state.ERROR',
}

export function Downloads(): React.ReactNode {
  const { queue, downloaderRunning, connected } = useDownloads()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { t, tp } = useLanguage()

  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: ['manga'] })
    void qc.invalidateQueries({ queryKey: ['library'] })
  }

  const start = useMutation({ mutationFn: () => request(START_DOWNLOADER_MUTATION) })
  const pause = useMutation({ mutationFn: () => request(STOP_DOWNLOADER_MUTATION) })
  const clear = useMutation({
    mutationFn: () => request(CLEAR_DOWNLOADER_MUTATION),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (ids: number[]) => request(DEQUEUE_DOWNLOADS_MUTATION, { ids }),
    onSuccess: invalidate,
  })

  return (
    <div className="flex h-full flex-col">
      <TopBar>
        <ScreenTitle>{t('downloads.title')}</ScreenTitle>
        {queue.length > 0 ? (
          <span className="tnum text-[13px] text-txt3">{tp('downloads.queued', queue.length)}</span>
        ) : null}

        {connected ? null : (
          <Chip tone="warning" title={t('downloads.reconnectingHint')}>
            {t('downloads.reconnecting')}
          </Chip>
        )}

        <div className="flex-1" />

        {downloaderRunning ? (
          <Button tone="neutral" small onClick={() => pause.mutate()} disabled={pause.isPending}>
            {t('downloads.pause')}
          </Button>
        ) : (
          <Button
            tone="primary"
            small
            onClick={() => start.mutate()}
            disabled={start.isPending || queue.length === 0}
          >
            {t('downloads.start')}
          </Button>
        )}

        <Button
          tone="danger"
          small
          onClick={() => clear.mutate()}
          disabled={clear.isPending || queue.length === 0}
        >
          {t('downloads.clear')}
        </Button>
      </TopBar>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <EmptyState
            title={t('downloads.empty.title')}
            body={t('downloads.empty.body')}
            action={
              <Button tone="primary" onClick={() => navigate('/library')}>
                {t('downloads.empty.action')}
              </Button>
            }
          />
        ) : (
          <ul className="space-y-1.5 p-4">
            {queue.map((d) => (
              <li
                key={d.chapter.id}
                className="flex items-center gap-3 rounded-card bg-raised px-3 py-2.5"
              >
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-raised2">
                  {d.manga.thumbnailUrl ? (
                    <img
                      src={assetUrl(d.manga.thumbnailUrl)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-txt">{d.manga.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-txt3">
                    <span className="tnum">{chapterLabel(d.chapter.chapterNumber)}</span> ·{' '}
                    {d.chapter.name}
                  </p>

                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-raised2">
                      <div
                        className={`h-full rounded-full transition-[width] ${
                          d.state === 'ERROR' ? 'bg-danger' : 'bg-accent'
                        }`}
                        style={{ width: `${Math.round((d.progress ?? 0) * 100)}%` }}
                      />
                    </div>
                    <span
                      className={`tnum w-28 shrink-0 text-right text-[11px] ${
                        d.state === 'ERROR' ? 'text-danger' : 'text-txt3'
                      }`}
                    >
                      {STATE_KEY[d.state] ? t(STATE_KEY[d.state]) : d.state}
                      {d.state === 'DOWNLOADING'
                        ? ` ${Math.round((d.progress ?? 0) * 100)}%`
                        : ''}
                      {d.tries > 0 ? ` ${t('downloads.tries', { n: d.tries })}` : ''}
                    </span>
                  </div>
                </div>

                <IconButton
                  label={t('downloads.remove')}
                  onClick={() => remove.mutate([d.chapter.id])}
                  disabled={remove.isPending}
                  className="hover:text-danger"
                >
                  <CloseIcon />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
