import type { CodegenConfig } from '@graphql-codegen/cli'

/**
 * Gera os tipos TypeScript a partir do schema do Suwayomi-Server.
 * O servidor precisa estar rodando: npm run codegen
 */
const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.KAGAMI_SERVER_GQL ?? 'http://127.0.0.1:4567/api/graphql',
  documents: ['src/renderer/src/lib/gql/operations/**/*.ts'],
  ignoreNoDocuments: true,
  config: {
    // Escalares customizados do Suwayomi
    scalars: {
      LongString: 'string',
      Cursor: 'string',
      Duration: 'string',
    },
    avoidOptionals: { field: true },
    skipTypename: true,
  },
  generates: {
    // Single file: schema and operation types together, so the operation
    // types resolve Scalars/Exact/enums with no imports between files.
    'src/renderer/src/lib/gql/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations'],
    },
  },
}

export default config
