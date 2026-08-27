import { createClient, type Client } from 'graphql-ws'

/**
 * Subscription client (graphql-transport-ws).
 *
 * Separate from the HTTP client because the base URL is only known at runtime —
 * ServerManager may attach to an external server instead of spawning its own.
 */
let client: Client | null = null

export function configureSubscriptionClient(baseUrl: string): void {
  client?.dispose()
  const ws = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '')
  client = createClient({
    url: `${ws}/api/graphql`,
    // The server is local: reconnecting is cheap, and it keeps the download
    // queue from sitting on stale data after a connection hiccup.
    retryAttempts: Infinity,
    shouldRetry: () => true,
  })
}

export function getSubscriptionClient(): Client {
  if (!client) throw new Error('Subscriptions used before configureSubscriptionClient()')
  return client
}

/**
 * Subscribes to an operation. Returns the unsubscribe function.
 *
 * `onReset` fires when the connection drops: consumers must throw away the
 * state they accumulated, because the next message will be a fresh snapshot and
 * applying old deltas on top of it would leave the queue wrong.
 */
export function subscribe<T>(
  query: string,
  variables: Record<string, unknown>,
  handlers: { onData: (data: T) => void; onReset?: () => void; onError?: (e: unknown) => void },
): () => void {
  const c = getSubscriptionClient()
  const dispose = c.subscribe<T>(
    { query, variables },
    {
      next: (msg) => {
        if (msg.data) handlers.onData(msg.data)
      },
      error: (err) => {
        handlers.onReset?.()
        handlers.onError?.(err)
      },
      complete: () => handlers.onReset?.(),
    },
  )
  return dispose
}
