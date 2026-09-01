import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useChapterPages } from '@/lib/reader/useChapterPages'
import { useChapterNav } from '@/lib/reader/useChapterNav'
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

/** The three header selects share one look. */
const CONTROL =
  'shrink-0 rounded-full bg-white/8 px-3 py-1 text-xs text-txt2 outline-none ring-1 ring-inset ring-transparent transition hover:bg-white/14 focus:ring-accent/60'

export function Reader(): React.ReactNode {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>()
  const id = Number(chapterId)
  const navigate = useNavigate()
  const t = useT()
  const [settings, setSettings] = useReaderSettings()

  const { chapter, pages, index, setIndex, isLoading, error } = useChapterPages(id)

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

  // Zoom goes straight to the settings, never through `override`: magnifying a
  // panel says nothing about whether the long-strip guess was right, and
  // treating it as disagreement would throw a webtoon back to paged reading
  // the moment the reader leaned in on something.
  const setZoom = useCallback((zoom: number) => setSettings({ zoom }), [setSettings])

  // --- Navigation ----------------------------------------------------------

  const { prevChapter, nextChapter, goChapter, nextPage, prevPage } = useChapterNav({
    mangaId,
    id,
    chapter,
    pageCount: pages.length,
    setIndex,
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // With a form control focused, the arrows belong to it: turning the page
      // while the user adjusts a setting would be two wrong things at once.
      const target = e.target as HTMLElement | null
      if (target && ['SELECT', 'INPUT', 'TEXTAREA'].includes(target.tagName)) return

      // Ctrl+0 is what every other zooming app uses to get back to 100%.
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault()
        setZoom(1)
        return
      }

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
  }, [view.mode, nextPage, prevPage, navigate, mangaId, setZoom])

  // --- Render --------------------------------------------------------------

  if (isLoading) {
    return <div className="grid h-full place-items-center text-[13px] text-txt3">{t('reader.loading')}</div>
  }
  if (error) {
    return (
      <div className="grid h-full place-items-center px-8 text-center text-[13px] text-danger">
        {error.message}
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

        {/* Only once it is off 100%: a control that always reads "100%" is
            noise, and its absence is the answer to "why is the page huge". */}
        {view.zoom === 1 ? null : (
          <button
            onClick={() => setZoom(1)}
            title={t('reader.zoomReset')}
            className={`${CONTROL} tnum`}
          >
            {Math.round(view.zoom * 100)}%
          </button>
        )}

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
            zoom={view.zoom}
            onZoom={setZoom}
            onPrev={prevPage}
            onNext={nextPage}
          />
        ) : (
          <ContinuousView
            pages={pages}
            index={index}
            fit={view.fit}
            maxWidth={view.maxWidth}
            zoom={view.zoom}
            onZoom={setZoom}
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
