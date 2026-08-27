# Adding a language

Kagami ships Portuguese (Brazil) and English. Adding another one is **one new
file and one new line**.

## 1. Create the dictionary

Copy `en.ts` to `<code>.ts` and translate the values. Use the
[BCP 47](https://www.iana.org/assignments/language-subtag-registry) code that
`Intl` expects — `es`, `fr`, `id`, `zh-Hans`, `pt-PT`. The filename must match
the code you register in step 2.

```ts
// es.ts
import type { Dictionary } from './types'

export const es: Dictionary = {
  'nav.library': 'Biblioteca',
  'nav.browse': 'Explorar',
  // …every key from pt-BR.ts
}
```

`Dictionary` requires every key. **A missing translation breaks
`npm run typecheck`** instead of showing up as the wrong language in the app,
so you cannot ship a half-finished dictionary by accident.

`pt-BR.ts` is the source of truth for the key set. If you need a key that does
not exist yet, add it there first, then to every other dictionary.

## 2. Register it

One line in `catalog.ts`:

```ts
import { es } from './es'

export const CATALOG = {
  'pt-BR': { name: 'Português (Brasil)', dictionary: ptBR },
  en: { name: 'English', dictionary: en },
  es: { name: 'Español', dictionary: es },   // ← this
} as const satisfies Record<string, { name: string; dictionary: Dictionary }>
```

That is all. The language picker, the badge in the navigation rail, the
system-language detection and the validation of the stored preference are all
derived from `CATALOG`.

Write `name` as the **endonym** — the language written in itself (`Español`,
not `Spanish`). Someone who opened the app in a language they cannot read has
to recognise their own in the menu.

## 3. Check it

```bash
npm run check-i18n     # dictionaries only
npm run check          # types + GraphQL + dictionaries
```

`check-i18n` catches what the compiler cannot:

- **placeholder drift.** If the base says `{n} titles` and your translation says
  `{count} títulos`, it compiles — and the user sees `{count}` on screen.
- **orphan keys**, so text nobody uses stops asking every new language for a
  translation.

## Writing the strings

**Placeholders** are `{name}`, filled by `t('ext.footer', { name: 'Keiyoushi' })`.
Keep the same names as the base — you may reorder them inside the sentence, and
you should whenever your language reads better that way.

**Plurals** use `_one` / `_other`, picked by `Intl.PluralRules`:

```ts
'manga.chapters_one': '{n} chapter',
'manga.chapters_other': '{n} chapters',
```

If your language has more forms, declare them and they will be used —
`_zero`, `_two`, `_few`, `_many` are all accepted, and any form you leave out
falls back to `_other`. Russian, Arabic and Polish need this; English and
Portuguese do not.

**Arrows and symbols** (`←`, `→`, `↓`, `·`) are part of the string. Flip the
arrows if your language reads right to left, and keep the middle dot as a
separator.

## What is *not* translated

Only Kagami's own interface. These come from elsewhere and stay as they are:

- source and extension names (`MangaDex (PT-BR)`, `Asura Scans`);
- manga titles, authors, descriptions, genres and chapter names;
- error messages coming from a source — they arrive in whatever language that
  source wrote them in.

Dates, language names and alphabetical sorting are *not* dictionary entries —
they follow the active locale through `Intl`, so they adapt on their own.

## Known limitation: right-to-left

The interface is not audited for RTL. A dictionary in Arabic, Hebrew or Persian
will translate correctly but the layout will stay left-to-right: several
components use physical `left`/`right` classes rather than logical ones, and
`document.documentElement.dir` is never set. Making RTL work is a worthwhile
contribution on its own — it is a layout job, not a translation job.
