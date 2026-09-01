import { GraphQLClient } from 'graphql-request'

/**
 * GraphQL client pointed at Suwayomi-Server.
 *
 * The base URL is only known at runtime (the manager may attach to a server
 * that is already running), so the client is built after the status arrives.
 */
let client: GraphQLClient | null = null
let baseUrl = ''

export function configureClient(url: string): void {
  baseUrl = url.replace(/\/$/, '')
  client = new GraphQLClient(`${baseUrl}/api/graphql`, {
    headers: { 'Content-Type': 'application/json' },
  })
}

export function getClient(): GraphQLClient {
  if (!client) throw new Error('GraphQL client used before configureClient()')
  return client
}


/** Absolute URL of an asset served by Suwayomi (covers, pages). */
export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Typed helper for running operations. */
export function request<TResult, TVars extends object = Record<string, unknown>>(
  document: string,
  variables?: TVars,
): Promise<TResult> {
  return getClient().request<TResult>(document, variables as never)
}
