/**
 * Validates the GraphQL documents against the server's schema WITHOUT running
 * them.
 *
 *   npm run validate-gql
 *
 * The earlier approach POSTed each document to the server, which fired real
 * mutations — it enqueued downloads and cleared the downloader while
 * "validating". Introspecting once and validating locally cannot do that.
 *
 * Needs the server running (see the README).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { buildClientSchema, getIntrospectionQuery, parse, validate } from 'graphql'

const URL = process.env.KAGAMI_SERVER_GQL ?? 'http://127.0.0.1:4567/api/graphql'
const res = await fetch(URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: getIntrospectionQuery() }),
})
const json = await res.json()
if (!json.data) {
  console.error('introspection failed:', JSON.stringify(json.errors).slice(0, 300))
  process.exit(1)
}
const schema = buildClientSchema(json.data)

const dir = 'src/renderer/src/lib/gql/operations'
let failures = 0
let total = 0
for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
  const src = readFileSync(`${dir}/${file}`, 'utf8')
  for (const m of src.matchAll(/gql`([\s\S]*?)`/g)) {
    const text = m[1]
    const name = (text.match(/(query|mutation|subscription)\s+(\w+)/) || [])[2] ?? '?'
    total++
    try {
      const errors = validate(schema, parse(text))
      if (errors.length) {
        failures++
        console.log(`  x ${file} :: ${name}`)
        for (const e of errors.slice(0, 3)) console.log(`      ${e.message}`)
      } else {
        console.log(`  ok ${name}`)
      }
    } catch (e) {
      failures++
      console.log(`  x ${file} :: ${name} -> syntax: ${e.message.split('\n')[0]}`)
    }
  }
}
console.log(failures ? `\nFAILURES: ${failures} of ${total}` : `\n${total} documents valid (none executed)`)
process.exit(failures ? 1 : 0)
