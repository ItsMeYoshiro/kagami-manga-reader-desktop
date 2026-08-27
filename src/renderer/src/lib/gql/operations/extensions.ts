import { gql } from 'graphql-request'

export const EXTENSION_STORES_QUERY = gql`
  query ExtensionStores {
    extensionStores {
      nodes {
        name
        indexUrl
        badgeLabel
        isLegacy
        contactWebsite
      }
    }
  }
`

export const ADD_EXTENSION_STORE_MUTATION = gql`
  mutation AddExtensionStore($indexUrl: String!) {
    addExtensionStore(input: { indexUrl: $indexUrl }) {
      extensionStore {
        name
        indexUrl
        badgeLabel
      }
    }
  }
`

export const EXTENSIONS_QUERY = gql`
  query Extensions {
    extensions {
      nodes {
        pkgName
        name
        lang
        versionName
        iconUrl
        isInstalled
        isObsolete
        hasUpdate
        contentWarning
        storeIndexUrl
      }
    }
  }
`

/** Re-syncs the list with the registered repositories. */
export const FETCH_EXTENSIONS_MUTATION = gql`
  mutation FetchExtensions {
    fetchExtensions(input: {}) {
      extensions {
        pkgName
      }
    }
  }
`

/**
 * Installs, uninstalls or updates. The patch accepts all three flags, but
 * only one should be set per call.
 */
export const UPDATE_EXTENSION_MUTATION = gql`
  mutation UpdateExtension(
    $id: String!
    $install: Boolean
    $uninstall: Boolean
    $update: Boolean
  ) {
    updateExtension(
      input: {
        id: $id
        patch: { install: $install, uninstall: $uninstall, update: $update }
      }
    ) {
      extension {
        pkgName
        isInstalled
        hasUpdate
        versionName
      }
    }
  }
`
