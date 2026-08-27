/**
 * A cap on how many calls run at once.
 *
 * Global search fires one request per installed source in the chosen language.
 * Each one makes the server go out to the internet, so releasing 20 at once
 * punishes both the server and the origin sites — and the first responses, the
 * ones the user actually sees, arrive later than they would in batches.
 */
export function createLimiter(max: number): <T>(fn: () => Promise<T>) => Promise<T> {
  let active = 0
  const waiting: (() => void)[] = []

  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= max) {
      await new Promise<void>((release) => waiting.push(release))
    }
    active++
    try {
      return await fn()
    } finally {
      active--
      waiting.shift()?.()
    }
  }
}

/** The server itself uses 6 as its default parallelism across sources. */
export const limitSearch = createLimiter(6)
