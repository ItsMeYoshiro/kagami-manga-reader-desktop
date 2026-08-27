import type { Dictionary } from './types'
import { ptBR } from './pt-BR'
import { en } from './en'

/**
 * The languages this app ships.
 *
 * ─── To add a language ───────────────────────────────────────────────────
 *   1. copy `en.ts` to `<code>.ts` and translate the values;
 *   2. add ONE entry here.
 * Nothing else changes: the picker, the system-language detection and the
 * validation of the stored preference are all derived from this. See the
 * README in this folder.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `name` is the endonym — the language written in itself. Someone who opened
 * the app in a language they cannot read has to recognise their own here, and
 * "Portuguese" only helps people who already read English.
 */
export const CATALOG = {
  'pt-BR': { name: 'Português (Brasil)', dictionary: ptBR },
  en: { name: 'English', dictionary: en },
} as const satisfies Record<string, { name: string; dictionary: Dictionary }>

export type Language = keyof typeof CATALOG

/**
 * Used when the user's system matches nothing in the catalog. English because
 * it reaches the most people, not because it is the project's first language.
 */
export const DEFAULT_LANGUAGE: Language = 'en'
