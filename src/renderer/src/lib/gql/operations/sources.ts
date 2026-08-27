import { gql } from 'graphql-request'

export const SOURCES_QUERY = gql`
  query Sources {
    sources {
      nodes {
        id
        name
        displayName
        lang
        iconUrl
        isNsfw
        supportsLatest
        # One extension can expose several sources (MangaDex's exposes 61, one
        # per language). pkgName is what ties a source to its Extensions row.
        extension {
          pkgName
        }
      }
    }
  }
`

export const SEARCH_SOURCE_MUTATION = gql`
  mutation SearchSource($source: LongString!, $query: String!, $page: Int!) {
    fetchSourceManga(
      input: { source: $source, type: SEARCH, query: $query, page: $page }
    ) {
      hasNextPage
      mangas {
        id
        title
        thumbnailUrl
        inLibrary
        status
      }
    }
  }
`

export const POPULAR_SOURCE_MUTATION = gql`
  mutation PopularSource($source: LongString!, $page: Int!) {
    fetchSourceManga(input: { source: $source, type: POPULAR, page: $page }) {
      hasNextPage
      mangas {
        id
        title
        thumbnailUrl
        inLibrary
        status
      }
    }
  }
`
