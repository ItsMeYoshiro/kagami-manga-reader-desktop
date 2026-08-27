import { ContentWarning, MangaStatus } from '@/lib/gql/generated/graphql'
import { locale, t, type Key } from '@/lib/i18n'

const STATUS_KEY: Record<MangaStatus, Key> = {
  [MangaStatus.Ongoing]: 'status.ONGOING',
  [MangaStatus.Completed]: 'status.COMPLETED',
  [MangaStatus.Licensed]: 'status.LICENSED',
  [MangaStatus.PublishingFinished]: 'status.PUBLISHING_FINISHED',
  [MangaStatus.Cancelled]: 'status.CANCELLED',
  [MangaStatus.OnHiatus]: 'status.ON_HIATUS',
  [MangaStatus.Unknown]: 'status.UNKNOWN',
}

export function statusLabel(status: MangaStatus): string {
  return t(STATUS_KEY[status] ?? 'status.UNKNOWN')
}

/**
 * Suwayomi returns timestamps as LongString (epoch milliseconds in a string,
 * because they do not fit in a GraphQL Int).
 *
 * The format follows the interface language: 27/08/2026 in Portuguese,
 * 8/27/2026 in English.
 */
export function formatDate(epochMillis: string | null | undefined): string {
  if (!epochMillis) return ''
  const n = Number(epochMillis)
  if (!Number.isFinite(n) || n <= 0) return ''
  return new Date(n).toLocaleDateString(locale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Short date and time, for stamps like "updated at". */
export function formatDateTime(epochMillis: string | null | undefined): string {
  if (!epochMillis) return ''
  const n = Number(epochMillis)
  if (!Number.isFinite(n) || n <= 0) return ''
  return new Date(n).toLocaleString(locale(), {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "Ch. 12.5" from the number, without pointless decimals. */
export function chapterLabel(n: number): string {
  if (!Number.isFinite(n) || n < 0) return ''
  return t('chapters.label', { n: Number.isInteger(n) ? n : n.toFixed(1) })
}

/**
 * An extension's content warning, in words.
 *
 * The server returns the raw enum ("MIXED"), which in a list of extensions is
 * a shouted acronym with no meaning. Only `NSFW` becomes a label: `MIXED` is
 * most sources — flagging nearly every row warns about nothing and just turns
 * the list amber.
 */
export function contentWarningLabel(warning: ContentWarning | string): string | null {
  return warning === ContentWarning.Nsfw ? t('ext.adultContent') : null
}

/**
 * Pull the useful part out of a server error.
 *
 * graphql-request wraps the whole response and Suwayomi prefixes it with
 * "Exception while fetching data (/field) :" followed by a Java stack trace.
 * What matters to the user is the first line after that.
 *
 * Whatever is left comes from the source, in the source's own language —
 * there is nothing to translate here.
 */
export function errorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? '')
  const withoutPrefix = raw.replace(/Exception while fetching data \(\/[^)]*\)\s*:\s*/g, '')
  const firstLine =
    withoutPrefix
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find(Boolean) ?? ''
  // graphql-request appends the whole query after `: {"response"...`
  const clean = firstLine.split(/:\s*\{"response"/)[0].trim()
  return clean.length > 160 ? `${clean.slice(0, 160)}…` : clean || t('error.unknown')
}
