import { useCallback, useEffect, useState } from 'react'
import type { Key } from '@/lib/i18n'

export type ReadingMode = 'paged-ltr' | 'paged-rtl' | 'continuous'
export type FitMode = 'width' | 'height' | 'original'
/** Width cap for the "width" fit. Numeric values are pixels. */
export type MaxWidth = 'natural' | '800' | '1000' | '1200' | '1400' | 'full'

export interface ReaderSettings {
  mode: ReadingMode
  fit: FitMode
  maxWidth: MaxWidth
  /** Multiplies whatever the fit mode arrived at. 1 is the fitted size. */
  zoom: number
}

/**
 * Zoom bounds. Below 1 is deliberate: on a tall page, pulling back to see the
 * whole thing at once is as useful as pushing in on a panel.
 */
export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 4
/** One wheel notch. Multiplicative, so each step feels the same at any zoom. */
export const ZOOM_STEP = 1.1

export const clampZoom = (z: number): number => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))

/**
 * Values and labels are kept apart: the values are persisted to localStorage
 * and must not change with the language, so a label here is only the
 * translation key that goes with the value.
 */
export const MODES: ReadingMode[] = ['paged-rtl', 'paged-ltr', 'continuous']
export const FITS: FitMode[] = ['width', 'height', 'original']
export const MAX_WIDTHS: MaxWidth[] = ['natural', '800', '1000', '1200', '1400', 'full']

export const MODE_KEY: Record<ReadingMode, Key> = {
  'paged-rtl': 'reader.mode.paged-rtl',
  'paged-ltr': 'reader.mode.paged-ltr',
  continuous: 'reader.mode.continuous',
}

export const FIT_KEY: Record<FitMode, Key> = {
  width: 'reader.fit.width',
  height: 'reader.fit.height',
  original: 'reader.fit.original',
}

export const MAX_WIDTH_KEY: Record<MaxWidth, Key> = {
  natural: 'reader.maxWidth.natural',
  '800': 'reader.maxWidth.800',
  '1000': 'reader.maxWidth.1000',
  '1200': 'reader.maxWidth.1200',
  '1400': 'reader.maxWidth.1400',
  full: 'reader.maxWidth.full',
}

/**
 * The `max-width` value for the width fit.
 *
 * `max-content` on an image resolves to its intrinsic width, which prevents
 * upscaling without having to know the dimension up front. Manhwa is usually
 * published at a fixed width (~900px); stretching past that only blurs the art.
 */
export function maxWidthCss(mw: MaxWidth): string | undefined {
  if (mw === 'full') return undefined
  if (mw === 'natural') return 'max-content'
  return `${mw}px`
}

// Manga reads right to left; that is the default that surprises the fewest people.
const DEFAULTS: ReaderSettings = { mode: 'paged-rtl', fit: 'height', maxWidth: 'natural', zoom: 1 }
const KEY = 'kagami.reader.settings'

function load(): ReaderSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>
    // Field by field: preferences written by an older version have no maxWidth,
    // and a blind spread would leave the value undefined.
    return {
      mode: parsed.mode && MODES.includes(parsed.mode) ? parsed.mode : DEFAULTS.mode,
      fit: parsed.fit && FITS.includes(parsed.fit) ? parsed.fit : DEFAULTS.fit,
      maxWidth:
        parsed.maxWidth && MAX_WIDTHS.includes(parsed.maxWidth)
          ? parsed.maxWidth
          : DEFAULTS.maxWidth,
      // A stored zoom is a number from a previous version of the bounds, or
      // from a hand-edited value: clamp rather than trust it.
      zoom:
        typeof parsed.zoom === 'number' && Number.isFinite(parsed.zoom)
          ? clampZoom(parsed.zoom)
          : DEFAULTS.zoom,
    }
  } catch {
    // localStorage may be unavailable (private mode, OS policy).
    return DEFAULTS
  }
}

/** Reader preferences, persisted per machine. */
export function useReaderSettings(): [ReaderSettings, (patch: Partial<ReaderSettings>) => void] {
  const [settings, setSettings] = useState<ReaderSettings>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      /* preference not persisted; no reason to break reading */
    }
  }, [settings])

  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  return [settings, update]
}

export function isPaged(mode: ReadingMode): boolean {
  return mode === 'paged-ltr' || mode === 'paged-rtl'
}
