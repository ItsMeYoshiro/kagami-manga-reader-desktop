import { locale, t } from '@/lib/i18n'

/**
 * Readable language names from the codes that sources use.
 *
 * Extensions identify a language by code ("pt-BR", "af", "zh-Hans"), and
 * Suwayomi itself only exposes the uppercased code in a source's display name
 * ("MangaDex (AF)"). One extension can expose 61 sources, one per language, so
 * showing raw codes would make that list unreadable.
 *
 * Names come out in the interface language: "Afrikaans" in English,
 * "africâner" in Portuguese.
 */
const cache = new Map<string, Intl.DisplayNames | null>()

function displayNames(): Intl.DisplayNames | null {
  const l = locale()
  if (!cache.has(l)) {
    try {
      cache.set(l, new Intl.DisplayNames([l], { type: 'language' }))
    } catch {
      cache.set(l, null)
    }
  }
  return cache.get(l) ?? null
}

/** "pt-BR" -> "Portuguese (Brazil)". Falls back to the code itself. */
export function languageName(code: string): string {
  // Suwayomi's own convention for a source that is not tied to one language.
  // It is not a BCP 47 tag, so Intl returns it unchanged -- the reader would
  // see a bare "all" in a list of proper language names.
  if (code === 'all') return t('lang.multi')
  try {
    return displayNames()?.of(code) ?? code
  } catch {
    return code
  }
}

/** Alphabetical order by the current language's conventions. */
export function compareText(a: string, b: string): number {
  return a.localeCompare(b, locale())
}
