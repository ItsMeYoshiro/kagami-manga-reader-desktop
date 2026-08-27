import { gql } from 'graphql-request'

/**
 * Fetches the chapter's pages. It is a mutation (not a query) because it can
 * trigger a request to the remote source when the chapter is not downloaded.
 */
export const FETCH_CHAPTER_PAGES_MUTATION = gql`
  mutation FetchChapterPages($chapterId: Int!) {
    fetchChapterPages(input: { chapterId: $chapterId }) {
      pages
      chapter {
        id
        pageCount
        lastPageRead
      }
    }
  }
`

/** The current chapter plus its siblings, so the reader can move between them. */
export const READER_CHAPTER_QUERY = gql`
  query ReaderChapter($chapterId: Int!) {
    chapter(id: $chapterId) {
      id
      name
      chapterNumber
      pageCount
      lastPageRead
      isRead
      mangaId
      manga {
        id
        title
        chapters {
          nodes {
            id
            name
            chapterNumber
            sourceOrder
          }
        }
      }
    }
  }
`

export const SAVE_PROGRESS_MUTATION = gql`
  mutation SaveProgress($id: Int!, $lastPageRead: Int!, $isRead: Boolean) {
    updateChapter(
      input: { id: $id, patch: { lastPageRead: $lastPageRead, isRead: $isRead } }
    ) {
      chapter {
        id
        lastPageRead
        isRead
      }
    }
  }
`
