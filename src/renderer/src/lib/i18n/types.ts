import type { ptBR } from './pt-BR'

/** Every translation key that exists. Derived from the base dictionary. */
export type Key = keyof typeof ptBR

/**
 * Plural key bases: `library.count` out of `library.count_one`.
 *
 * The generic parameter is what makes the conditional distribute over the
 * union. With `Key extends ...` directly, TypeScript evaluates the whole union
 * at once — no single key matches the pattern and the type collapses to `never`.
 */
type PluralBase<K> = K extends `${infer B}_one` ? B : never
export type PluralKey = PluralBase<Key>

/**
 * Plural forms beyond `_one` and `_other`.
 *
 * English and Portuguese only need two, but Russian has `few`/`many` and Arabic
 * has six. A dictionary may declare whichever ones its language needs; `tp()`
 * falls back to `_other` for any that are missing.
 */
type ExtraForm = 'zero' | 'two' | 'few' | 'many'

/**
 * What a language file has to export.
 *
 * Every key of the base dictionary is required — a missing one breaks
 * `npm run typecheck` instead of shipping as the wrong language.
 */
export type Dictionary = Record<Key, string> &
  Partial<Record<`${PluralKey}_${ExtraForm}`, string>>
