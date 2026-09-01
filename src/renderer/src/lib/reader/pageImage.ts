import type { CSSProperties } from 'react'
import { maxWidthCss, type FitMode, type MaxWidth } from './settings'

/**
 * What is left of each fit once the sizing itself moved into the style below.
 *
 * The height fit cannot rely on `max-height: 100%`: the percentage resolves
 * against a parent of automatic height (or a content-sized grid row), falls
 * back to the natural size and overflows the container. So the image is given
 * a definitely-sized box instead and `object-contain` fits the picture inside
 * it -- which means its element box is deliberately larger than what you see.
 */
const IMG_CLASS: Record<FitMode, string> = {
  width: 'mx-auto h-auto',
  height: 'object-contain',
  original: 'mx-auto max-w-none',
}

/**
 * Everything a page image needs to be drawn at the current settings.
 *
 * Both views draw the same picture under the same three settings, so keeping
 * two copies of this meant every change to how a page is sized had to be made
 * twice.
 *
 * The percentages are multiplied by the zoom rather than left at `100%`, and
 * that is the whole trick. CSS `zoom` divides the containing block before a
 * percentage resolves against it, so a plain `100%` lands on exactly the
 * unzoomed size however far you zoom in: `width: 100%` of a container halved
 * by `zoom: 2`, drawn at twice the scale, is the width you started with. The
 * two cancel out, which is why the height fit could not be magnified at all
 * and the width fit stopped growing at the edge of the window. Scaling the
 * percentage cancels the division instead, and the absolute caps -- which
 * resolve against nothing -- are left to `zoom` so that they grow with it.
 */
export function pageImageProps(
  fit: FitMode,
  maxWidth: MaxWidth,
  zoom: number,
): { className: string; style: CSSProperties } {
  const pct = `${zoom * 100}%`

  // Every `max-width` is written out, including the ones that mean "no cap".
  // Tailwind's preflight gives every image `max-width: 100%`, which is one
  // more percentage resolving against a divided container: it silently pinned
  // the page to the width of the window however far in you went. Leaving the
  // property unset is not the same as turning it off.
  const size: CSSProperties =
    fit === 'width'
      ? // The cap only matters here: this is the only fit that upscales.
        { width: pct, maxWidth: maxWidthCss(maxWidth) ?? 'none' }
      : fit === 'height'
        ? { width: pct, height: pct, maxWidth: 'none' }
        : // The original fit has no percentage to scale, so `zoom` alone is
          // the right answer and always was. `max-w-none` in the class table
          // is what keeps preflight off it.
          {}

  return {
    className: `${IMG_CLASS[fit]} select-none`,
    style: { ...size, ...(zoom === 1 ? null : { zoom }) },
  }
}
