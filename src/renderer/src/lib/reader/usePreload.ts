import { useEffect } from 'react'

/** How many pages ahead to keep warm in Chromium's cache. */
const AHEAD = 3
/** One behind covers the common case of stepping back a page. */
const BEHIND = 1

/**
 * Preloads the neighbouring pages.
 *
 * We deliberately do not hold the images in memory: firing the request is
 * enough for Chromium to keep them in its own disk/memory cache. By the time
 * the real <img> mounts, the image is already there and the page turn is
 * instant.
 */
export function usePreload(pages: string[], index: number): void {
  useEffect(() => {
    if (pages.length === 0) return

    const from = Math.max(0, index - BEHIND)
    const to = Math.min(pages.length, index + AHEAD + 1)

    const images: HTMLImageElement[] = []
    for (let i = from; i < to; i++) {
      if (i === index) continue // the current page is already loading in the visible <img>
      const img = new Image()
      img.src = pages[i]
      images.push(img)
    }

    return () => {
      // Abort downloads left behind when pages are skipped quickly.
      for (const img of images) img.src = ''
    }
  }, [pages, index])
}
