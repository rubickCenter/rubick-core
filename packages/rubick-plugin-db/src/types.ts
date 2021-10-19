type RevisionId = string

export interface Doc {
  _id: string
  data: string
  _rev?: RevisionId
  _attachments?: string
}

export interface DocRes {
  id: string
  _id: string
  ok: boolean
  rev: RevisionId
}

export interface DBError {
  /**
   * HTTP Status Code during HTTP or HTTP-like operations
   */
  status?: number | undefined
  name?: string | undefined
  message?: string | undefined
  reason?: string | undefined
  error?: string | boolean | undefined
  id?: string | undefined
  rev?: RevisionId | undefined
}

export interface AllDocsOptions {
  include_docs?: boolean
  startkey?: string
  endkey?: string
  keys?: string[]
}
