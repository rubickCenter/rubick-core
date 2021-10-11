export interface doc {
  _id: string,
  data: string,
  _rev ?: string,
  _attachments ?: string
}

export interface docRes {
  id: string,
  _id: string,
  ok: boolean,
  rev: string,
}
