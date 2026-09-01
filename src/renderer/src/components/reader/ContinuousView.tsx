import { useEffect, useRef } from 'react'
import { type FitMode, type MaxWidth } from '@/lib/reader/settings'
import { pageImageProps } from '@/lib/reader/pageImage'
import { useZoomOnWheel } from '@/lib/reader/useZoomOnWheel'
import { useT } from '@/lib/i18n'

const ITEM_CLASS: Record<FitMode, string> = {
  width: 'w-full',
  height: 'flex h-full w-full items-center justify-center',
  original: 'w-full',
}

/**
 * Continuous vertical scrolling (webtoon).
 *
 * The "current" page is derived with an IntersectionObserver rather than by
 * computing scroll position: manga pages vary wildly in height, so measuring
 * position would be wrong often.
 */
export function ContinuousView({
  pages,
  index,
  fit,
  maxWidth,
  zoom,
  onZoom,
  onIndexChange,
}: {
  pages: string[]
  index: number
  fit: FitMode
  maxWidth: MaxWidth
  zoom: number
  onZoom: (zoom: number) => void
  onIndexChange: (i: number) => void
}): React.ReactNode {
  const t = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  useZoomOnWheel(containerRef, zoom, onZoom)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  /** Keeps the programmatic restore scroll from firing onIndexChange. */
  const restoredRef = useRef(false)

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!restoredRef.current) return
        for (const e of entries) {
          if (!e.isIntersecting) continue
          onIndexChange(Number((e.target as HTMLElement).dataset.index))
        }
      },
      {
        root,
        // Collapses the observed area into a line at the centre of the
        // viewport: the page crossing that line is the current one.
        //
        // Using an intersection ratio does not work here. A manhwa page is
        // ~3000px tall; in a ~700px viewport the highest possible ratio is
        // ~0.22, so no threshold above that ever fires and the index freezes
        // (taking reading progress with it). A centre line is height-agnostic.
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0,
      },
    )

    for (const el of itemsRef.current) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [pages.length, onIndexChange])

  // Restores the saved position exactly once, when the pages arrive.
  useEffect(() => {
    if (restoredRef.current || pages.length === 0) return
    const target = itemsRef.current[index]
    if (target) target.scrollIntoView({ block: 'start' })
    // Release the observer only after the scroll settles. Named `timer` and
    // not `t` so it does not shadow the translate function above.
    const timer = setTimeout(() => {
      restoredRef.current = true
    }, 300)
    return () => clearTimeout(timer)
  }, [pages.length, index])

  return (
    <div ref={containerRef} className="h-full w-full overflow-auto">
      {pages.map((src, i) => (
        <div
          key={src}
          data-index={i}
          ref={(el) => {
            itemsRef.current[i] = el
          }}
          className={ITEM_CLASS[fit]}
        >
          <img
            src={src}
            alt={t('reader.page', { n: i + 1 })}
            loading="lazy"
            decoding="async"
            {...pageImageProps(fit, maxWidth, zoom, 'mx-auto')}
            draggable={false}
          />
        </div>
      ))}
    </div>
  )
}
