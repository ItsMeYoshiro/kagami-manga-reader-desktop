import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from '@/lib/gql/client'
import { chapterLabel, formatDate } from '@/lib/format'
import { useDownloads } from '@/lib/downloads/DownloadsProvider'
import { IconButton } from '@/components/ui'
import { CheckIcon, DownloadIcon, TrashIcon, CloseIcon } from '@/components/ui/Icons'
import { useT } from '@/lib/i18n'
import { UPDATE_CHAPTER_MUTATION } from '@/lib/gql/operations/manga'
import {
  DELETE_DOWNLOADS_MUTATION,
  DEQUEUE_DOWNLOADS_MUTATION,
  ENQUEUE_DOWNLOAD_MUTATION,
} from '@/lib/gql/operations/downloads'
import type { MangaDetailQuery, UpdateChapterMutation } from '@/lib/gql/generated/graphql'

type Chapter = NonNullable<MangaDetailQuery['manga']>['chapters']['nodes'][number]

export function ChapterList({
  mangaId,
  chapters,
}: {
  mangaId: number
  chapters: Chapter[]
}): React.ReactNode {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const t = useT()
  const { byChapter } = useDownloads()

  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: ['manga', mangaId] })
    void qc.invalidateQueries({ queryKey: ['library'] })
  }

  const toggleRead = useMutation({
    mutationFn: (vars: { id: number; isRead: boolean }) =>
      request<UpdateChapterMutation>(UPDATE_CHAPTER_MUTATION, vars),
    onSuccess: invalidate,
  })

  // The queue itself arrives over the subscription; these mutations only push it.
  const download = useMutation({
    mutationFn: (id: number) => request(ENQUEUE_DOWNLOAD_MUTATION, { id }),
  })
  const cancel = useMutation({
    mutationFn: (id: number) => request(DEQUEUE_DOWNLOADS_MUTATION, { ids: [id] }),
  })
  const deleteDownload = useMutation({
    mutationFn: (id: number) => request(DELETE_DOWNLOADS_MUTATION, { ids: [id] }),
    onSuccess: invalidate,
  })

  if (chapters.length === 0) {
    return <p className="px-6 py-4 text-[13px] text-txt3">{t('chapters.empty')}</p>
  }

  const busy = download.isPending || cancel.isPending || deleteDownload.isPending

  return (
    <ul className="pb-6">
      {chapters.map((c) => {
        const queued = byChapter.get(c.id)

        return (
          <li
            key={c.id}
            className="group flex items-center gap-2 pr-4 transition hover:bg-raised/70"
          >
            <button
              onClick={() => navigate(`/manga/${mangaId}/chapter/${c.id}`)}
              className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-6 text-left"
            >
              {/* The dot is the only "new" signal in the list; a read chapter
                  gets no mark at all, it just loses the emphasis on its text. */}
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  c.isRead ? 'bg-transparent' : 'bg-accent'
                }`}
                aria-hidden="true"
              />

              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[13px] ${c.isRead ? 'text-txt3' : 'text-txt'}`}
                  title={c.name}
                >
                  {c.name}
                </span>
                <span className="mt-0.5 flex gap-2 text-[11px] text-txt3">
                  <span className="tnum">{chapterLabel(c.chapterNumber)}</span>
                  {c.scanlator ? <span className="truncate">· {c.scanlator}</span> : null}
                  {formatDate(c.uploadDate) ? (
                    <span className="tnum">· {formatDate(c.uploadDate)}</span>
                  ) : null}
                  {/* Partial progress only means something if it is unfinished. */}
                  {!c.isRead && c.lastPageRead > 0 ? (
                    <span className="tnum text-accent">
                      {c.pageCount > 0
                        ? t('chapters.pageOf', { n: c.lastPageRead + 1, total: c.pageCount })
                        : t('chapters.page', { n: c.lastPageRead + 1 })}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>

            {queued ? (
              <span className="tnum w-16 shrink-0 text-right text-[11px] text-accent">
                {queued.state === 'DOWNLOADING'
                  ? `${Math.round((queued.progress ?? 0) * 100)}%`
                  : queued.state === 'ERROR'
                    ? t('downloads.state.ERROR')
                    : t('downloads.state.QUEUED')}
              </span>
            ) : c.isDownloaded ? (
              <span className="w-16 shrink-0 text-right text-[11px] text-txt3">
                {t('chapters.downloaded')}
              </span>
            ) : (
              <span className="w-16 shrink-0" />
            )}

            {queued ? (
              <IconButton
                label={t('chapters.cancelDownload')}
                onClick={() => cancel.mutate(c.id)}
                disabled={busy}
                className="hover:text-danger"
              >
                <CloseIcon />
              </IconButton>
            ) : c.isDownloaded ? (
              <IconButton
                label={t('chapters.deleteDownload')}
                onClick={() => deleteDownload.mutate(c.id)}
                disabled={busy}
                className="hover:text-danger"
              >
                <TrashIcon />
              </IconButton>
            ) : (
              <IconButton
                label={t('chapters.download')}
                onClick={() => download.mutate(c.id)}
                disabled={busy}
              >
                <DownloadIcon />
              </IconButton>
            )}

            <IconButton
              label={c.isRead ? t('chapters.markUnread') : t('chapters.markRead')}
              onClick={() => toggleRead.mutate({ id: c.id, isRead: !c.isRead })}
              disabled={toggleRead.isPending}
              className={c.isRead ? 'text-accent' : ''}
            >
              <CheckIcon />
            </IconButton>
          </li>
        )
      })}
    </ul>
  )
}
