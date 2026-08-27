import { gql } from 'graphql-request'

export const LIBRARY_UPDATE_STATUS_QUERY = gql`
  query LibraryUpdateStatus {
    lastUpdateTimestamp {
      timestamp
    }
    libraryUpdateStatus {
      jobsInfo {
        isRunning
        totalJobs
        finishedJobs
        skippedMangasCount
        skippedCategoriesCount
      }
    }
  }
`

/**
 * Library update progress.
 *
 * Same shape as the download queue: `initial` carries the full state in the
 * first message, and `omittedUpdates` flags that events were dropped. Here
 * everything that matters arrives in `jobsInfo`, which is already an aggregate
 * — we never have to rebuild anything from the per-manga deltas.
 */
export const LIBRARY_UPDATE_SUBSCRIPTION = gql`
  subscription LibraryUpdateStatusChanged($maxUpdates: Int!) {
    libraryUpdateStatusChanged(input: { maxUpdates: $maxUpdates }) {
      omittedUpdates
      jobsInfo {
        isRunning
        totalJobs
        finishedJobs
        skippedMangasCount
        skippedCategoriesCount
      }
      mangaUpdates {
        status
        manga {
          id
          title
        }
      }
    }
  }
`

export const UPDATE_LIBRARY_MUTATION = gql`
  mutation UpdateLibrary {
    updateLibrary(input: {}) {
      updateStatus {
        jobsInfo {
          isRunning
          totalJobs
          skippedMangasCount
        }
      }
    }
  }
`

export const STOP_UPDATE_MUTATION = gql`
  mutation StopUpdate {
    updateStop(input: {}) {
      clientMutationId
    }
  }
`

/**
 * The global filters that decide which titles an update covers.
 *
 * Suwayomi's defaults exclude all three cases at once, which in practice
 * discards the entire library and makes "Update" look broken. Without exposing
 * this, the user has no way to find out why.
 */
export const UPDATE_SETTINGS_QUERY = gql`
  query UpdateSettings {
    settings {
      excludeUnreadChapters
      excludeNotStarted
      excludeCompleted
    }
  }
`

export const SET_UPDATE_SETTINGS_MUTATION = gql`
  mutation SetUpdateSettings(
    $excludeUnreadChapters: Boolean
    $excludeNotStarted: Boolean
    $excludeCompleted: Boolean
  ) {
    setSettings(
      input: {
        settings: {
          excludeUnreadChapters: $excludeUnreadChapters
          excludeNotStarted: $excludeNotStarted
          excludeCompleted: $excludeCompleted
        }
      }
    ) {
      settings {
        excludeUnreadChapters
        excludeNotStarted
        excludeCompleted
      }
    }
  }
`
