import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { assetUrl, request } from '@/lib/gql/client'
import { usePreload } from '@/lib/reader/usePreload'
import { useReadingProgress } from '@/lib/reader/useReadingProgress'
import { useLongStrip } from '@/lib/reader/useLongStrip'
import {
  FIT_KEY,
  FITS,
  MAX_WIDTHS,
  MAX_WIDTH_KEY,
  MODES,
  MODE_KEY,
  isPaged,
  useReaderSettings,
  type FitMode,
  type MaxWidth,
  type ReaderSettings,
  type ReadingMode,
} from '@/lib/reader/settings'
import { PagedView } from '@/components/reader/PagedView'
import { ContinuousView } from '@/components/reader/ContinuousView'
import { IconButton } from '@/components/ui'
import { BackIcon } from '@/components/ui/Icons'
import { useT } from '@/lib/i18n'
import {
  FETCH_CHAPTER_PAGES_MUTATION,
  READER_CHAPTER_QUERY,
} from '@/lib/gql/operations/reader'
import type {
  FetchChapterPagesMutation,
  ReaderChapterQuery,
} from '@/lib/gql/generated/graphql'

/** The three header selects share one look. */
const CONTROL =
  'shrink-0 rounded-full bg-white/8 px-3 py-1 text-xs text-txt2 outline-none ring-1 ring-inset ring-transparent transition hover:bg-white/14 focus:ring-accent/60'

export function Reader(): React.ReactNode {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>()
  const id = Number(chapterId)
  const navigate = useNavigate()
  const t = useT()
  const [settings, setSettings] = useReaderSettings()
  const [index, setIndex] = useState(0)

  const chapterQuery = useQuery({
    queryKey: ['reader-chapter', id],
    queryFn: () => request<ReaderChapterQuery>(READER_CHAPTER_QUERY, { chapterId: id }),
    enabled: Number.isFinite(id),
  })
  const chapter = chapterQuery.data?.chapter

  const pagesMutation = useMutation({
    mutationFn: (target: number) =>
      request<FetchChapterPagesMutation>(FETCH_CHAPTER_PAGES_MUTATION, { chapterId: target }),
  })

  // Fires once per chapter. The ref stops a refetch when the effect re-runs
  // because the mutation's identity changed.
  const fetchedFor = useRef<number | null>(null)
  const { mutate: fetchPages } = pagesMutation
  useEffect(() => {
    if (!Number.isFinite(id) || fetchedFor.current === id) return
    fetchedFor.current = id
    setIndex(0)
    fetchPages(id)
  }, [id, fetchPages])

  const pages = useMemo(
    () => (pagesMutation.data?.fetchChapterPages?.pages ?? []).map((p) => assetUrl(p) ?? p),
    [pagesMutation.data],
  )

  // Resume where the reader left off, but only once the pages exist.
  const restored = useRef<number | null>(null)
  useEffect(() => {
    if (pages.length === 0 || !chapter || restored.current === id) return
    restored.current = id
    const saved = chapter.lastPageRead
    if (saved > 0 && saved < pages.length) setIndex(saved)
  }, [pages.length, chapter, id])

  usePreload(pages, index)
  useReadingProgress(Number(mangaId), id, index, pages.length)

  // --- Long-strip chapters -------------------------------------------------

  // Webtoons want the opposite defaults from paged manga, and the reader can
  // tell them apart on its own. The guess only stands until the reader
  // disagrees: touching either select hands control back for as long as this
  // title is open.
  const longStrip = useLongStrip(pages)
  const [overridden, setOverridden] = useState(false)
  useEffect(() => {
    setOverridden(false)
  }, [mangaId])

  const auto = longStrip === true && !overridden
  const view: ReaderSettings = auto
    ? { ...settings, mode: 'continuous', fit: 'width' }
    : settings

  const override = useCallback(
    (patch: Partial<ReaderSettings>) => {
      setOverridden(true)
      setSettings(patch)
    },
    [setSettings],
  )

  // --- Navigation ----------------------------------------------------------

  // sourceOrder is the real reading order: chapterNumber jumps (62 -> 1183)
  // when a source has gaps in its translations.
  const siblings = useMemo(() => {
    const nodes = chapter?.manga.chapters.nodes ?? []
    return [...nodes].sort((a, b) => a.sourceOrder - b.sourceOrder)
  }, [chapter])

  const position = siblings.findIndex((c) => c.id === id)
  const prevChapter = position > 0 ? siblings[position - 1] : null
  const nextChapter =
    position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null

  const goChapter = useCallback(
    (target: { id: number } | null) => {
      if (!target) return
      navigate(`/manga/${mangaId}/chapter/${target.id}`, { replace: true })
    },
    [navigate, mangaId],
  )

  const nextPage = useCallback(() => {
    setIndex((i) => {
      if (i < pages.length - 1) return i + 1
      goChapter(nextChapter)
      return i
    })
  }, [pages.length, nextChapter, goChapter])

  const prevPage = useCallback(() => {
    setIndex((i) => {
      if (i > 0) return i - 1
      goChapter(prevChapter)
      return i
    })
  }, [prevChapter, goChapter])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // With a form control focused, the arrows belong to it: turning the page
      // while the user adjusts a setting would be two wrong things at once.
      const target = e.target as HTMLElement | null
      if (target && ['SELECT', 'INPUT', 'TEXTAREA'].includes(target.tagName)) return

      const rtl = view.mode === 'paged-rtl'
      switch (e.key) {
        case 'ArrowRight':
          if (rtl) prevPage()
          else nextPage()
          break
        case 'ArrowLeft':
          if (rtl) nextPage()
          else prevPage()
          break
        case 'ArrowDown':
        case 'PageDown':
          if (isPaged(view.mode)) nextPage()
          break
        case 'ArrowUp':
        case 'PageUp':
          if (isPaged(view.mode)) prevPage()
          break
        case ' ':
          e.preventDefault()
          nextPage()
          break
        case 'Escape':
          navigate(`/manga/${mangaId}`)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view.mode, nextPage, prevPage, navigate, mangaId])

  // --- Render --------------------------------------------------------------

  if (pagesMutation.isPending || chapterQuery.isLoading) {
    return <div className="grid h-full place-items-center text-[13px] text-txt3">{t('reader.loading')}</div>
  }
  if (pagesMutation.isError) {
    return (
      <div className="grid h-full place-items-center px-8 text-center text-[13px] text-danger">
        {(pagesMutation.error as Error).message}
      </div>
    )
  }
  if (pages.length === 0) {
    return <div className="grid h-full place-items-center text-[13px] text-txt3">{t('reader.noPages')}</div>
  }

  return (
    <div className="flex h-full flex-col bg-black">
      <header className="relative flex shrink-0 items-center gap-2 bg-black/85 px-3 py-1.5 backdrop-blur">
        <IconButton label={t('reader.exit')} onClick={() => navigate(`/manga/${mangaId}`)}>
          <BackIcon />
        </IconButton>

        <span className="min-w-0 flex-1 truncate text-xs text-txt2" title={chapter?.name}>
          {chapter?.name}
        </span>

        <select
          value={view.mode}
          onChange={(e) => override({ mode: e.target.value as ReadingMode })}
          title={auto ? t('reader.autoLongStrip') : undefined}
          className={CONTROL}
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {t(MODE_KEY[m])}
            </option>
          ))}
        </select>

        <select
          value={view.fit}
          onChange={(e) => override({ fit: e.target.value as FitMode })}
          title={auto ? t('reader.autoLongStrip') : undefined}
          className={CONTROL}
        >
          {FITS.map((f) => (
            <option key={f} value={f}>
              {t(FIT_KEY[f])}
            </option>
          ))}
        </select>

        {view.fit === 'width' ? (
          <select
            value={view.maxWidth}
            onChange={(e) => override({ maxWidth: e.target.value as MaxWidth })}
            className={CONTROL}
          >
            {MAX_WIDTHS.map((w) => (
              <option key={w} value={w}>
                {t(MAX_WIDTH_KEY[w])}
              </option>
            ))}
          </select>
        ) : null}

        <span className="tnum w-20 shrink-0 text-right text-xs text-txt2">
          {index + 1} / {pages.length}
        </span>

        {/* Where I am in the chapter, without taking a row of its own. */}
        <div
          className="absolute inset-x-0 bottom-0 h-px bg-accent transition-[width]"
          style={{ width: `${((index + 1) / pages.length) * 100}%` }}
          aria-hidden="true"
        />
      </header>

      <div className="min-h-0 flex-1">
        {isPaged(view.mode) ? (
          <PagedView
            pages={pages}
            index={index}
            mode={view.mode}
            fit={view.fit}
            maxWidth={view.maxWidth}
            onPrev={prevPage}
            onNext={nextPage}
          />
        ) : (
          <ContinuousView
            pages={pages}
            index={index}
            fit={view.fit}
            maxWidth={view.maxWidth}
            onIndexChange={setIndex}
          />
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between bg-black/85 px-4 py-1.5 text-xs backdrop-blur">
        <button
          onClick={() => goChapter(prevChapter)}
          disabled={!prevChapter}
          className="rounded-full px-2 py-1 text-txt3 transition hover:bg-white/10 hover:text-accent disabled:pointer-events-none disabled:opacity-30"
        >
          {t('reader.prevChapter')}
        </button>
        <button
          onClick={() => goChapter(nextChapter)}
          disabled={!nextChapter}
          className="rounded-full px-2 py-1 text-txt3 transition hover:bg-white/10 hover:text-accent disabled:pointer-events-none disabled:opacity-30"
        >
          {t('reader.nextChapter')}
        </button>
      </footer>
    </div>
  )
}
