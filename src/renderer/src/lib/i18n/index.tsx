import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CATALOG, DEFAULT_LANGUAGE, type Language } from './catalog'
import type { Dictionary, Key, PluralKey } from './types'

export type { Dictionary, Key, PluralKey } from './types'
export type { Language } from './catalog'
export { CATALOG } from './catalog'

type Params = Record<string, string | number>

/** Catalog codes, in the order they were declared. */
export const CODES = Object.keys(CATALOG) as Language[]

/** What the language picker lists. */
export const LANGUAGES: { code: Language; name: string }[] = CODES.map((code) => ({
  code,
  name: CATALOG[code].name,
}))

const STORAGE_KEY = 'kagami.lang'

const isLanguage = (v: unknown): v is Language =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(CATALOG, v)

/**
 * Best catalog language for the user's system preferences.
 *
 * Matches the full code first and the base subtag second, so `pt-PT` and `pt`
 * land on `pt-BR` — the same language in a different variant beats falling back
 * to the default.
 */
function detectFromSystem(): Language {
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const raw of preferred) {
    if (!raw) continue
    const wanted = raw.toLowerCase()
    const exact = CODES.find((c) => c.toLowerCase() === wanted)
    if (exact) return exact
    const base = wanted.split('-')[0]
    const sameBase = CODES.find((c) => c.toLowerCase().split('-')[0] === base)
    if (sameBase) return sameBase
  }
  return DEFAULT_LANGUAGE
}

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    // A language dropped from the catalog may still be stored on an old machine.
    if (isLanguage(stored)) return stored
  } catch {
    /* localStorage unavailable; fall through to system detection */
  }
  return detectFromSystem()
}

/**
 * The current language, readable outside React.
 *
 * `format.ts`, `intl.ts` and the sorts all need the language, and they are pure
 * functions called from dozens of places — threading it through every signature
 * would only spread noise. This is the module's single piece of global state,
 * and the provider keeps it current **during render**, not in an effect: an
 * effect runs after the children, so the first paint would use the old language.
 */
let currentLanguage: Language = DEFAULT_LANGUAGE

export const language = (): Language => currentLanguage

/** Locale for `Intl` — dates, plurals, alphabetical sorting. */
export const locale = (): string => currentLanguage

const dictionary = (): Dictionary => CATALOG[currentLanguage].dictionary

function interpolate(text: string, params?: Params): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (raw, name: string) =>
    name in params ? String(params[name]) : raw,
  )
}

/** Translate outside a component. Inside one, prefer `useT()`. */
export function t(key: Key, params?: Params): string {
  return interpolate(dictionary()[key], params)
}

/**
 * Translate with a plural. `tp('manga.chapters', 3)` picks between
 * `manga.chapters_one` and `manga.chapters_other` by the language's rule.
 *
 * Languages with more forms (`few`, `many`…) can declare them in their
 * dictionary; anything missing falls back to `_other`.
 */
export function tp(base: PluralKey, n: number, params?: Params): string {
  let rule: Intl.LDMLPluralRule = 'other'
  try {
    rule = new Intl.PluralRules(currentLanguage).select(n)
  } catch {
    /* no Intl.PluralRules here: 'other' is the safe form */
  }
  const d = dictionary()
  const text = d[`${base}_${rule}` as Key] ?? d[`${base}_other` as Key]
  return interpolate(text, { n, ...params })
}

type LanguageContext = {
  language: Language
  setLanguage: (l: Language) => void
  t: typeof t
  tp: typeof tp
}

const Ctx = createContext<LanguageContext | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }): ReactNode {
  const [current, setCurrent] = useState<Language>(initialLanguage)

  // During render, on purpose — see the comment on `currentLanguage`.
  currentLanguage = current
  if (typeof document !== 'undefined') document.documentElement.lang = current

  const setLanguage = useCallback((l: Language) => {
    currentLanguage = l
    setCurrent(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* preference not persisted; no reason to block the switch */
    }
  }, [])

  // `current` is a dependency so that switching languages produces a new object
  // and the whole tree re-renders with the new text.
  const value = useMemo<LanguageContext>(
    () => ({ language: current, setLanguage, t, tp }),
    [current, setLanguage],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLanguage(): LanguageContext {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLanguage used outside LanguageProvider')
  return c
}

/** Shortcut for components that only need to translate. */
export function useT(): typeof t {
  return useLanguage().t
}
