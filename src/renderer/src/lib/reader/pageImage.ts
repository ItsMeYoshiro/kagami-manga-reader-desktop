import type { CSSProperties } from 'react'
import { maxWidthCss, type FitMode, type MaxWidth } from './settings'

/**
 * The height fit cannot rely on `max-height: 100%`: the percentage resolves
 * against a parent of automatic height (or a content-sized grid row), falls
 * back to the natural size and overflows the container.
 *
 * The way out is to give the image a definitely-sized box -- inherited from a
 * parent with `h-full` -- and let `object-contain` fit the content inside it.
 */
const IMG_CLASS: Record<FitMode, string> = {
  width: 'w-full h-auto',
  height: 'h-full w-full object-contain',
  original: 'max-w-none',
}

/**
 * Everything a page image needs to be drawn at the current settings.
 *
 * Both views draw the same picture under the same three settings, so they used
 * to carry the same class table and the same style block. Keeping two copies
 * meant every change to how a page is sized had to be made twice, and one of
 * them was already drifting -- the zoom comment in ContinuousView had decayed
 * into a pointer at PagedView.
 *
 * `extraClass` is for what genuinely differs: ContinuousView centres the image
 * inside a full-width row, which only shows at the original fit.
 */
export function pageImageProps(
  fit: FitMode,
  maxWidth: MaxWidth,
  zoom: number,
  extraClass = '',
): { className: string; style: CSSProperties } {
  return {
    className: `${extraClass} ${IMG_CLASS[fit]} select-none`.trim(),
    style: {
      // The cap only matters for the width fit: it is the only one that upscales.
      ...(fit === 'width' ? { maxWidth: maxWidthCss(maxWidth) } : null),
      // `zoom`, not `transform: scale()`: a transform does not change the
      // layout box, so the scroll container would never grow and the magnified
      // page could not be scrolled to.
      ...(zoom === 1 ? null : { zoom }),
    },
  }
}
