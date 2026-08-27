import { gql } from 'graphql-request'

/** The full queue state. Used on first load and when reconciling. */
export const DOWNLOAD_STATUS_QUERY = gql`
  query DownloadStatus {
    downloadStatus {
      state
      queue {
        position
        progress
        state
        tries
        chapter {
          id
          name
          chapterNumber
          mangaId
        }
        manga {
          id
          title
          thumbnailUrl
        }
      }
    }
  }
`

/**
 * The queue's update stream.
 *
 * The first message carries the whole queue in `initial`; later ones carry
 * only deltas in `updates`. When `omittedUpdates` is true the server dropped
 * events for exceeding `maxUpdates`, and the state has to be re-read with the
 * query — the deltas alone would leave the queue wrong.
 */
export const DOWNLOAD_STATUS_SUBSCRIPTION = gql`
  subscription DownloadStatusChanged($maxUpdates: Int!) {
    downloadStatusChanged(input: { maxUpdates: $maxUpdates }) {
      state
      omittedUpdates
      initial {
        position
        progress
        state
        tries
        chapter {
          id
          name
          chapterNumber
          mangaId
        }
        manga {
          id
          title
          thumbnailUrl
        }
      }
      updates {
        type
        download {
          position
          progress
          state
          tries
          chapter {
            id
            name
            chapterNumber
            mangaId
          }
          manga {
            id
            title
            thumbnailUrl
          }
        }
      }
    }
  }
`

export const ENQUEUE_DOWNLOAD_MUTATION = gql`
  mutation EnqueueDownload($id: Int!) {
    enqueueChapterDownload(input: { id: $id }) {
      downloadStatus {
        state
      }
    }
  }
`

export const ENQUEUE_DOWNLOADS_MUTATION = gql`
  mutation EnqueueDownloads($ids: [Int!]!) {
    enqueueChapterDownloads(input: { ids: $ids }) {
      downloadStatus {
        state
      }
    }
  }
`

export const DEQUEUE_DOWNLOADS_MUTATION = gql`
  mutation DequeueDownloads($ids: [Int!]!) {
    dequeueChapterDownloads(input: { ids: $ids }) {
      downloadStatus {
        state
      }
    }
  }
`

export const DELETE_DOWNLOADS_MUTATION = gql`
  mutation DeleteDownloads($ids: [Int!]!) {
    deleteDownloadedChapters(input: { ids: $ids }) {
      chapters {
        id
        isDownloaded
      }
    }
  }
`

export const START_DOWNLOADER_MUTATION = gql`
  mutation StartDownloader {
    startDownloader(input: {}) {
      downloadStatus {
        state
      }
    }
  }
`

export const STOP_DOWNLOADER_MUTATION = gql`
  mutation StopDownloader {
    stopDownloader(input: {}) {
      downloadStatus {
        state
      }
    }
  }
`

export const CLEAR_DOWNLOADER_MUTATION = gql`
  mutation ClearDownloader {
    clearDownloader(input: {}) {
      downloadStatus {
        state
      }
    }
  }
`
