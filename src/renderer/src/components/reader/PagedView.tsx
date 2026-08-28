import { useEffect, useRef } from 'react'
import { maxWidthCss, type FitMode, type MaxWidth, type ReadingMode } from '@/lib/reader/settings'
import { useZoomOnWheel } from '@/lib/reader/useZoomOnWheel'
import { useT } from '@/lib/i18n'

/**
 * The height fit cannot rely on `max-height: 100%`: the percentage resolves
 * against a parent of automatic height (or a content-sized grid row), falls
 * back to the natural size and overflows the container.
 *
 * The way out is to give the image a definitely-sized box — inherited from a
 * parent with `h-full` — and let `object-contain` fit the content inside it.
 */
const IMG_CLASS: Record<FitMode, string> = {
  width: 'w-full h-auto',
  height: 'h-full w-full object-contain',
  original: 'max-w-none',
}

const WRAP_CLASS: Record<FitMode, string> = {
  width: 'flex min-h-full items-start justify-center',
  height: 'flex h-full w-full items-center justify-center',
  original: 'flex min-h-full items-start justify-center',
}

/**
 * One page at a time. The click zones follow the reading direction: in RTL
 * (manga) clicking on the left advances, the opposite of LTR.
 */
export function PagedView({
  pages,
  index,
  mode,
  fit,
  maxWidth,
  zoom,
  onZoom,
  onPrev,
  onNext,
}: {
  pages: string[]
  index: number
  mode: ReadingMode
  fit: FitMode
  maxWidth: MaxWidth
  zoom: number
  onZoom: (zoom: number) => void
  onPrev: () => void
  onNext: () => void
}): React.ReactNode {
  const t = useT()
  const rtl = mode === 'paged-rtl'
  const scrollRef = useRef<HTMLDivElement>(null)
  useZoomOnWheel(scrollRef, zoom, onZoom)

  // A page turn should start at the top, or the next page opens mid-way down.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [index])

  const src = pages[index]
  if (!src) return null

  return (
    <div
      ref={scrollRef}
      // The height fit needs no scrolling by definition -- until zoom takes
      // the page past the viewport, and then hiding the overflow would put the
      // zoomed-in part out of reach.
      className={`relative h-full w-full ${fit === 'height' && zoom === 1 ? 'overflow-hidden' : 'overflow-auto'}`}
    >
      <div className={WRAP_CLASS[fit]}>
        <img
          key={src}
          src={src}
          alt={t('reader.page', { n: index + 1 })}
          className={`${IMG_CLASS[fit]} select-none`}
          style={{
            // The cap only matters for the width fit: it is the only one that upscales.
            ...(fit === 'width' ? { maxWidth: maxWidthCss(maxWidth) } : null),
            // `zoom`, not `transform: scale()`: a transform does not change the
            // layout box, so the scroll container would never grow and the
            // magnified page could not be scrolled to.
            ...(zoom === 1 ? null : { zoom }),
          }}
          draggable={false}
        />
      </div>

      {/* Overlaid click zones: half the screen for each direction. */}
      <button
        onClick={rtl ? onNext : onPrev}
        aria-label={rtl ? t('reader.nextPage') : t('reader.prevPage')}
        className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize focus:outline-none"
      />
      <button
        onClick={rtl ? onPrev : onNext}
        aria-label={rtl ? t('reader.prevPage') : t('reader.nextPage')}
        className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize focus:outline-none"
      />
    </div>
  )
}
