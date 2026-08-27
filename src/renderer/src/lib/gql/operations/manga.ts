import { gql } from 'graphql-request'

export const MANGA_DETAIL_QUERY = gql`
  query MangaDetail($id: Int!) {
    manga(id: $id) {
      id
      title
      author
      artist
      description
      genre
      status
      thumbnailUrl
      realUrl
      inLibrary
      initialized
      unreadCount
      downloadCount
      source {
        id
        displayName
      }
      chapters {
        nodes {
          id
          name
          chapterNumber
          scanlator
          uploadDate
          isRead
          isBookmarked
          isDownloaded
          lastPageRead
          pageCount
          sourceOrder
        }
      }
    }
  }
`

/**
 * Pulls details and chapters from the remote source. Needed on the first
 * visit: a search only stores the minimum (id, title, cover) in the server's
 * database.
 */
export const FETCH_MANGA_AND_CHAPTERS_MUTATION = gql`
  mutation FetchMangaAndChapters($id: Int!) {
    fetchMangaAndChapters(input: { id: $id, fetchManga: true, fetchChapters: true }) {
      manga {
        id
        initialized
      }
    }
  }
`

export const UPDATE_CHAPTER_MUTATION = gql`
  mutation UpdateChapter($id: Int!, $isRead: Boolean, $isBookmarked: Boolean) {
    updateChapter(
      input: { id: $id, patch: { isRead: $isRead, isBookmarked: $isBookmarked } }
    ) {
      chapter {
        id
        isRead
        isBookmarked
        lastPageRead
      }
    }
  }
`
