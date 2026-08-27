import type { KagamiApi } from './index'

declare global {
  interface Window {
    kagami: KagamiApi
  }
}

export {}
