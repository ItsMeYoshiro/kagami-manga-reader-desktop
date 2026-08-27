import { gql } from 'graphql-request'

export const LIBRARY_QUERY = gql`
  query Library {
    mangas(filter: { inLibrary: { equalTo: true } }) {
      nodes {
        id
        title
        thumbnailUrl
        unreadCount
        downloadCount
        # Total chapter count: together with unreadCount, this is what lets the
        # cover show how much of the series has gone by.
        chapters {
          totalCount
        }
        lastReadChapter {
          id
          name
        }
      }
    }
  }
`

export const SET_IN_LIBRARY_MUTATION = gql`
  mutation SetInLibrary($id: Int!, $inLibrary: Boolean!) {
    updateManga(input: { id: $id, patch: { inLibrary: $inLibrary } }) {
      manga {
        id
        inLibrary
      }
    }
  }
`
