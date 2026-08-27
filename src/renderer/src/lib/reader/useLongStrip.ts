import { useEffect, useState } from 'react'

/**
 * Detects whether a chapter is published as long vertical strips (webtoon,
 * manhwa, manhua) rather than as pages.
 *
 * It matters because the two formats want opposite defaults. Fitting a strip
 * to the window height collapses it: a 940x2516 strip on a 1266px window ends
 * up painted 325px wide, a third of its own resolution, with black bars over
 * four fifths of the screen.
 *
 * A page-shaped scan sits near 1.4:1 and rarely passes 1.6:1, so 2:1 leaves a
 * wide margin. A double-page spread is *wider* than tall, never taller, so it
 * cannot trip the check.
 *
 * The opening pages of a chapter can be a short credits panel, so sample a few
 * and take the tallest: one strip is enough to tell what the chapter is.
 */
const LONG_STRIP_RATIO = 2
const SAMPLE_SIZE = 3

/** `null` while unknown — the caller must not guess before the answer lands. */
export function useLongStrip(pages: string[]): boolean | null {
  const [longStrip, setLongStrip] = useState<boolean | null>(null)

  useEffect(() => {
    setLongStrip(null)
    if (pages.length === 0) return
    let cancelled = false

    // Measuring costs nothing extra in practice: these are the pages the
    // reader is about to request anyway, and the browser cache serves both.
    const ratioOf = (url: string): Promise<number | null> =>
      new Promise((resolve) => {
        const img = new Image()
        img.onload = () =>
          resolve(img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : null)
        img.onerror = () => resolve(null)
        img.src = url
      })

    void Promise.all(pages.slice(0, SAMPLE_SIZE).map(ratioOf)).then((ratios) => {
      const measured = ratios.filter((r): r is number => r !== null)
      if (cancelled || measured.length === 0) return
      setLongStrip(Math.max(...measured) >= LONG_STRIP_RATIO)
    })

    return () => {
      cancelled = true
    }
  }, [pages])

  return longStrip
}
