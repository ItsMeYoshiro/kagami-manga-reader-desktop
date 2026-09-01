import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assetUrl, request } from '@/lib/gql/client'
import { statusLabel } from '@/lib/format'
import { ChapterList } from '@/components/ChapterList'
import { Button, Chip, ErrorNote, IconButton } from '@/components/ui'
import { BackIcon, BookmarkIcon } from '@/components/ui/Icons'
import { useLanguage } from '@/lib/i18n'
import {
  MANGA_DETAIL_QUERY,
  FETCH_MANGA_AND_CHAPTERS_MUTATION,
} from '@/lib/gql/operations/manga'
import { SET_IN_LIBRARY_MUTATION } from '@/lib/gql/operations/library'
import type {
  FetchMangaAndChaptersMutation,
  MangaDetailQuery,
  SetInLibraryMutation,
} from '@/lib/gql/generated/graphql'

export function MangaDetail(): React.ReactNode {
  const { id } = useParams<{ id: string }>()
  const mangaId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { t, tp } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  const detail = useQuery({
    queryKey: ['manga', mangaId],
    queryFn: () => request<MangaDetailQuery>(MANGA_DETAIL_QUERY, { id: mangaId }),
    enabled: Number.isFinite(mangaId),
  })

  const manga = detail.data?.manga

  // A source search only stores the minimum (id, title, cover). Details and
  // chapters exist only after pulling from the remote source — which we do
  // once, here.
  const hydrate = useMutation({
    mutationFn: () =>
      request<FetchMangaAndChaptersMutation>(FETCH_MANGA_AND_CHAPTERS_MUTATION, {
        id: mangaId,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manga', mangaId] }),
  })

  // Guard against re-firing: without it, a manga the source keeps returning as
  // uninitialised would loop forever.
  const hydrateAttempted = useRef(false)
  useEffect(() => {
    if (!manga || hydrateAttempted.current) return
    if (!manga.initialized || manga.chapters.nodes.length === 0) {
      hydrateAttempted.current = true
      hydrate.mutate()
    }
  }, [manga, hydrate])

  const toggleLibrary = useMutation({
    mutationFn: (inLibrary: boolean) =>
      request<SetInLibraryMutation>(SET_IN_LIBRARY_MUTATION, { id: mangaId, inLibrary }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['manga', mangaId] })
      void qc.invalidateQueries({ queryKey: ['library'] })
    },
  })

  if (detail.isLoading) {
    return <p className="p-8 text-[13px] text-txt3">{t('manga.loading')}</p>
  }
  if (detail.error) {
    return <ErrorNote>{(detail.error as Error).message}</ErrorNote>
  }
  if (!manga) {
    return <p className="p-8 text-[13px] text-txt3">{t('manga.notFound')}</p>
  }

  const chapters = manga.chapters.nodes
  // Sources repeat genres -- some list the same tag once per language entry.
  // Left alone that is both a duplicated chip and a duplicated React key.
  const genres = [...new Set(manga.genre)]
  const read = chapters.filter((c) => c.isRead).length
  const cover = manga.thumbnailUrl ? assetUrl(manga.thumbnailUrl) : null

  // First unread in source order: that is where the user wants to carry on.
  const nextUnread = [...chapters]
    .sort((a, b) => a.sourceOrder - b.sourceOrder)
    .find((c) => !c.isRead)

  return (
    <div className="h-full overflow-y-auto">
      <div className="relative">
        {/* The cover itself, blurred, as the header's backdrop: the title takes
            on the colour of its own artwork instead of everyone else's grey. */}
        {cover ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] overflow-hidden">
            <img
              src={cover}
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-125 object-cover opacity-40 blur-3xl saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/75 to-bg" />
          </div>
        ) : null}

        {/* The artwork spans the window, the content does not: on a wide screen
            the description would be a 1200px line and each chapter's buttons
            would sit half a metre from its title. */}
        <div className="relative mx-auto max-w-[1120px] px-6 pt-4">
          <div className="flex items-center gap-2">
            <IconButton label={t('manga.back')} onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>
            <span className="truncate text-xs text-txt3">{manga.source?.displayName}</span>
          </div>

          <div className="mt-4 flex flex-col gap-6 pb-6 md:flex-row">
            <div className="w-40 shrink-0">
              <div className="aspect-2/3 overflow-hidden rounded-panel bg-raised shadow-2xl shadow-black/60 ring-1 ring-white/10">
                {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[26px] leading-tight font-medium text-txt">
                {manga.title}
              </h1>

              <p className="mt-1.5 text-[13px] text-txt2">
                {[manga.author, manga.artist !== manga.author ? manga.artist : null]
                  .filter(Boolean)
                  .join(' · ') || t('manga.unknownAuthor')}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Chip>{statusLabel(manga.status)}</Chip>
                {chapters.length > 0 ? (
                  <Chip>
                    <span className="tnum">
                      {read}/{chapters.length}
                    </span>{' '}
                    {t('manga.read')}
                  </Chip>
                ) : null}
                {manga.unreadCount > 0 ? (
                  <Chip tone="accent">{tp('library.unread', manga.unreadCount)}</Chip>
                ) : null}
                {manga.downloadCount > 0 ? (
                  <Chip>{t('manga.downloaded', { n: manga.downloadCount })}</Chip>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {nextUnread ? (
                  <Button
                    tone="primary"
                    onClick={() => navigate(`/manga/${mangaId}/chapter/${nextUnread.id}`)}
                  >
                    {read > 0 ? t('manga.continue') : t('manga.start')}
                  </Button>
                ) : null}
                <Button
                  tone={manga.inLibrary ? 'danger' : 'neutral'}
                  onClick={() => toggleLibrary.mutate(!manga.inLibrary)}
                  disabled={toggleLibrary.isPending}
                >
                  <BookmarkIcon />
                  {manga.inLibrary ? t('manga.inLibrary') : t('manga.addToLibrary')}
                </Button>
              </div>

              {manga.description ? (
                <div className="mt-5">
                  <p
                    className={`text-[13px] leading-relaxed whitespace-pre-line text-txt2 ${
                      expanded ? '' : 'line-clamp-4'
                    }`}
                  >
                    {manga.description}
                  </p>
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1.5 text-xs font-medium text-accent hover:underline"
                  >
                    {expanded ? t('manga.less') : t('manga.more')}
                  </button>
                </div>
              ) : null}

              {genres.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full px-2.5 py-1 text-[11px] text-txt2 ring-1 ring-inset ring-line"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1120px]">
        <div className="flex items-center gap-3 px-6 py-3">
          <h2 className="font-display text-[15px] text-txt">
            {tp('manga.chapters', chapters.length)}
          </h2>
          {hydrate.isPending ? (
            <span className="text-xs text-txt3">{t('manga.fetching')}</span>
          ) : null}
        </div>

        {hydrate.isError ? <ErrorNote>{(hydrate.error as Error).message}</ErrorNote> : null}

        <ChapterList mangaId={mangaId} chapters={chapters} />
      </div>
    </div>
  )
}
