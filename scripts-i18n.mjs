/**
 * Checks the language dictionaries.
 *
 *   npm run check-i18n
 *
 * `tsc` already guarantees no key is missing or extra. What it does NOT see:
 *
 *  - **drifted placeholders.** If `pt-BR` says `{n} titles` and a translation
 *    says `{count} titles`, it compiles — and the user sees the raw name.
 *  - **orphan keys.** Text nobody uses any more keeps asking every new language
 *    for a translation.
 *
 * Files are read with TypeScript's own parser rather than a regex: a dictionary
 * value can sit on the next line, contain escaped quotes and accents.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import ts from 'typescript'

const DIR = 'src/renderer/src/lib/i18n'
const BASE = 'pt-BR'
const SOURCES = 'src/renderer/src'
const EXTRA_PLURAL_FORMS = ['zero', 'two', 'few', 'many']

/** Pulls `{ key: value }` out of the object literal a dictionary file exports. */
function readDictionary(path) {
  const text = readFileSync(path, 'utf8')
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
  const entries = new Map()

  const collect = (node) => {
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) continue
      const key =
        ts.isStringLiteral(prop.name) || ts.isIdentifier(prop.name) ? prop.name.text : null
      const value =
        ts.isStringLiteral(prop.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(prop.initializer)
          ? prop.initializer.text
          : null
      if (key !== null && value !== null) entries.set(key, value)
    }
  }

  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      // Unwrap `as const`, `satisfies X` and type annotations.
      let init = node.initializer
      while (ts.isAsExpression(init) || ts.isSatisfiesExpression(init)) init = init.expression
      if (ts.isObjectLiteralExpression(init)) collect(init)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return entries
}

const placeholders = (text) => new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))

/** Dictionary files: every .ts in the folder that is not infrastructure. */
const INFRASTRUCTURE = new Set(['types.ts', 'catalog.ts', 'index.tsx'])
const files = readdirSync(DIR)
  .filter((f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !INFRASTRUCTURE.has(f))
  .sort()

const dictionaries = new Map(files.map((f) => [basename(f, '.ts'), readDictionary(join(DIR, f))]))
const base = dictionaries.get(BASE)
if (!base) {
  console.error(`base dictionary ${BASE}.ts not found in ${DIR}`)
  process.exit(1)
}

const problems = []
const warnings = []

// A Russian `_few` is legitimate even though Portuguese has no such form.
const pluralBases = new Set(
  [...base.keys()].filter((k) => k.endsWith('_one')).map((k) => k.slice(0, -'_one'.length)),
)
const isAllowedExtra = (key) =>
  EXTRA_PLURAL_FORMS.some(
    (f) => key.endsWith(`_${f}`) && pluralBases.has(key.slice(0, -(f.length + 1))),
  )

for (const [language, dict] of dictionaries) {
  if (language === BASE) continue

  for (const key of base.keys()) {
    if (!dict.has(key)) problems.push(`${language}: missing key "${key}"`)
  }
  for (const key of dict.keys()) {
    if (!base.has(key) && !isAllowedExtra(key)) {
      problems.push(`${language}: key "${key}" does not exist in ${BASE}`)
    }
  }

  for (const [key, value] of dict) {
    const reference = base.get(key) ?? base.get(`${key.replace(/_\w+$/, '')}_other`)
    if (reference === undefined) continue
    const expected = placeholders(reference)
    const found = placeholders(value)
    const missing = [...expected].filter((p) => !found.has(p))
    const extra = [...found].filter((p) => !expected.has(p))
    if (missing.length) {
      problems.push(`${language}: "${key}" lost ${missing.map((p) => `{${p}}`).join(', ')}`)
    }
    if (extra.length) {
      problems.push(
        `${language}: "${key}" uses ${extra.map((p) => `{${p}}`).join(', ')}, which ${BASE} does not have`,
      )
    }
  }
}

// --- keys nobody uses any more -----------------------------------------------
const used = new Set()
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (!p.includes('i18n') && !p.includes('generated')) walk(p)
      continue
    }
    if (!/\.tsx?$/.test(e.name)) continue
    const text = readFileSync(p, 'utf8')
    for (const m of text.matchAll(/\b(?:tp?)\(\s*'([\w.-]+)'/g)) used.add(m[1])
    // Keys referenced through a lookup table (`MODE_KEY`, `STATE_KEY`, …).
    for (const m of text.matchAll(/:\s*'([\w-]+(?:\.[\w-]+)+)'/g)) used.add(m[1])
  }
}
walk(SOURCES)

for (const key of base.keys()) {
  const root = key.replace(/_(one|other|zero|two|few|many)$/, '')
  if (!used.has(key) && !used.has(root)) warnings.push(`unused key: "${key}"`)
}

// --- report -------------------------------------------------------------------
const languages = [...dictionaries.keys()]
console.log(`${languages.length} languages: ${languages.join(', ')}`)
console.log(`${base.size} keys in ${BASE}`)

for (const w of warnings) console.log(`  warning: ${w}`)
if (problems.length === 0) {
  console.log(warnings.length ? `\nok, with ${warnings.length} warning(s)` : '\nok')
  process.exit(0)
}
console.error('')
for (const p of problems) console.error(`  ERROR ${p}`)
console.error(`\n${problems.length} problem(s)`)
process.exit(1)
