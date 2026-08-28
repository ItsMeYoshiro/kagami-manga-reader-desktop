import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { ZOOM_STEP, clampZoom } from './settings'

/** The point of the page that was under the pointer, as a fraction of it. */
interface Anchor {
  page: HTMLImageElement
  fx: number
  fy: number
  pointerX: number
  pointerY: number
}

/**
 * Ctrl + wheel zooms the page, anchored at the pointer.
 *
 * Anchoring is what makes zoom usable on a comic page. Without it, pushing in
 * on a bubble near a corner walks that bubble off screen and the reader has to
 * chase it with the scrollbars.
 *
 * The listener is registered by hand rather than through React's `onWheel`,
 * for two reasons that are the same call: React attaches wheel listeners as
 * passive, so `preventDefault` there does nothing, and without `preventDefault`
 * Chromium runs its own Ctrl+wheel handler and zooms the whole window --
 * interface and all -- instead of the page.
 */
export function useZoomOnWheel(
  scrollRef: RefObject<HTMLElement | null>,
  zoom: number,
  onZoom: (zoom: number) => void,
): void {
  /**
   * Written during the wheel event, spent by the layout effect below. The
   * scroll cannot be corrected before the re-render, because the page has not
   * been laid out at the new size yet.
   */
  const anchor = useRef<Anchor | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onWheel = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      e.preventDefault()

      const next = clampZoom(zoom * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP))
      if (next === zoom) return

      // Anchor to the page itself, not to a point in the scrolled content.
      // A page narrower than the window is centred, and that side margin
      // shrinks as the page grows -- so content coordinates do not simply
      // scale, while a fraction of the page does.
      //
      // Found by geometry rather than elementFromPoint: in paged mode the
      // click zones for turning pages cover the image completely.
      const pages = Array.from(el.querySelectorAll('img'))
      const page =
        pages.find((img) => {
          const r = img.getBoundingClientRect()
          return e.clientY >= r.top && e.clientY <= r.bottom
        }) ?? pages[0]

      if (page) {
        const r = page.getBoundingClientRect()
        anchor.current = {
          page,
          fx: r.width ? (e.clientX - r.left) / r.width : 0.5,
          fy: r.height ? (e.clientY - r.top) / r.height : 0.5,
          pointerX: e.clientX,
          pointerY: e.clientY,
        }
      }
      onZoom(next)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [scrollRef, zoom, onZoom])

  useLayoutEffect(() => {
    const el = scrollRef.current
    const a = anchor.current
    anchor.current = null
    if (!el || !a || !a.page.isConnected) return

    // Where that same fraction of the page landed, and how far it has to move
    // to sit back under the pointer. The browser clamps the result to the
    // scrollable range, which is what should happen at the edges anyway.
    const r = a.page.getBoundingClientRect()
    el.scrollLeft += r.left + a.fx * r.width - a.pointerX
    el.scrollTop += r.top + a.fy * r.height - a.pointerY
  }, [zoom, scrollRef])
}
