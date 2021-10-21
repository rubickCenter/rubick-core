import path from 'path'
import fs from 'fs-extra'
import PouchDB from 'pouchdb'
import rocksdb from 'pouchdb-adapter-rocksdb2'

import {
  SINGLE_ATTACHMENT_MAX_SIZE,
  SINGLE_DOC_MAX_SIZE
} from './helpers/config'

import { Doc, DocRes, DBError, AllDocsOptions } from './types'

PouchDB.plugin(rocksdb)

export default class Localdb<T> {
  readonly docMaxByteLength
  readonly docAttachmentMaxByteLength
  public dbpath
  public defaultDbName
  public pouchDB!: PouchDB.Database<Doc<T>>

  constructor(opt: { dbPath?: string; dbName?: string }) {
    this.docMaxByteLength = SINGLE_DOC_MAX_SIZE // 2M
    this.docAttachmentMaxByteLength = SINGLE_ATTACHMENT_MAX_SIZE // 20M
    this.dbpath = opt.dbPath ?? './tmp'
    this.defaultDbName = path.join(this.dbpath, opt.dbName ?? 'rubick')
  }

  async start() {
    if (!(await fs.pathExists(this.dbpath))) await fs.mkdirs(this.dbpath)
    this.pouchDB = new PouchDB(this.defaultDbName, {
      auto_compaction: true,
      adapter: 'rocksdb'
    })
  }

  async stop() {
    await this.pouchDB.close()
  }

  private getDocId(name: string, id: string): string {
    return `${name}/${id}`
  }

  private replaceDocId(name: string, id: string): string {
    return id.replace(`${name}/`, '')
  }

  private errorInfo(name: string, message: string, args: object = {}): DBError {
    return {
      error: true,
      name,
      message,
      ...args
    }
  }

  private checkDocSize(doc: Doc<T>): boolean | DBError {
    if (Buffer.byteLength(JSON.stringify(doc)) > this.docMaxByteLength) {
      return this.errorInfo(
        'exception',
        `doc max size ${this.docMaxByteLength / 1024 / 1024} M`
      )
    }
    return false
  }

  async api() {
    const put = async (
      name: string,
      doc: Doc<T>,
      strict = true
    ): Promise<DBError | DocRes | boolean> => {
      if (typeof doc !== 'object') {
        return this.errorInfo('exception', 'params "doc" not object type')
      }
      if (!doc._id || typeof doc._id !== 'string') {
        return this.errorInfo('exception', '"_id" empty')
      }
      if (strict) {
        const err = this.checkDocSize(doc)
        if (err) return err
      }
      try {
        const result = await this.pouchDB.put({
          ...doc,
          _id: this.getDocId(name, doc._id)
        })
        return {
          ...result,
          _id: doc._id
        }
      } catch (e: any | DBError) {
        return this.errorInfo(e.name, e.message, { id: doc._id })
      }
    }

    const get = async (name: string, id: string) => {
      try {
        const result = await this.pouchDB.get(this.getDocId(name, id))
        result._id = this.replaceDocId(name, result._id)
        return result
      } catch (e) {
        return null
      }
    }

    const remove = async (
      name: string,
      query: Doc<T> | string
    ): Promise<DocRes | DBError> => {
      try {
        const _id = typeof query === 'string' ? query : query._id

        if (
          typeof query === 'object' &&
          (!query._id || typeof query._id !== 'string')
        ) {
          return this.errorInfo('exception', '"_id" empty')
        }

        const record = await this.pouchDB.get(this.getDocId(name, _id))

        const result = {
          ...(await this.pouchDB.remove(record)),
          _id
        }

        return result
      } catch (e: any) {
        return this.errorInfo(e.name, e.message)
      }
    }

    const bulkDocs = async (
      name: string,
      docs: Array<Doc<T>>
    ): Promise<DocRes[] | DBError | boolean> => {
      let result
      try {
        if (!Array.isArray(docs)) {
          return this.errorInfo('exception', 'docs must be a array')
        }
        if (docs.find((doc: Doc<T>) => !doc._id) != null) {
          return this.errorInfo('exception', 'doc not _id field')
        }
        // repeat error
        if (new Set(docs.map((doc: Doc<T>) => doc._id)).size !== docs.length) {
          return this.errorInfo('exception', '_id value is repeat')
        }
        for (const doc of docs) {
          const err = this.checkDocSize(doc)
          if (err) return err
          doc._id = this.getDocId(name, doc._id)
        }

        result = await this.pouchDB.bulkDocs(docs)
        result = result.map((res: DocRes | any) => {
          res.id = this.replaceDocId(name, res.id)
          return res.error
            ? {
                id: res.id,
                name: res.name,
                error: true,
                message: res.message
              }
            : res
        }) as DocRes[]
        docs.forEach((doc: Doc<T>) => {
          doc._id = this.replaceDocId(name, doc._id)
        })
      } catch (e: any) {
        return this.errorInfo(e.name, e.message)
      }

      return result
    }

    const allDocs = async (
      name: string,
      key: string | string[]
    ): Promise<DocRes[] | DBError> => {
      const config: AllDocsOptions = { include_docs: true }
      if (key) {
        if (typeof key === 'string') {
          config.startkey = this.getDocId(name, key)
          config.endkey = `${config.startkey}\ufff0`
        } else {
          if (!Array.isArray(key)) {
            return this.errorInfo(
              'exception',
              'param only key(string) or keys(Array[string])'
            )
          }
          config.keys = key.map(key => this.getDocId(name, key))
        }
      } else {
        config.startkey = this.getDocId(name, '')
        config.endkey = `${config.startkey}\ufff0`
      }
      const result: DocRes[] = []
      try {
        ;(await this.pouchDB.allDocs(config)).rows.forEach((res: any) => {
          if (!res.error && res.doc) {
            res.doc._id = this.replaceDocId(name, res.doc._id)
            result.push(res.doc)
          }
        })
      } catch (e) {}
      return result
    }

    const postAttachment = async (
      name: string,
      docId: string,
      attachment: string | Blob | Buffer,
      type: string
    ): Promise<DBError | DocRes> => {
      if (!(attachment instanceof Uint8Array)) {
        return this.errorInfo(
          'exception',
          'attachment data only be buffer type (Uint8Array)'
        )
      }
      const buffer = Buffer.from(attachment)
      if (buffer.byteLength > this.docAttachmentMaxByteLength) {
        return this.errorInfo(
          'exception',
          `attachment data up to ${
            this.docAttachmentMaxByteLength / 1024 / 1024
          } M`
        )
      }
      try {
        const result = await this.pouchDB.putAttachment(
          this.getDocId(name, docId),
          '',
          attachment,
          type
        )
        result.id = this.replaceDocId(name, result.id)
        return result
      } catch (e: any) {
        return this.errorInfo(e.name, e.message)
      }
    }

    const getAttachment = async (
      name: string,
      docId: string
    ): Promise<Blob | Buffer | null> => {
      try {
        return await this.pouchDB.getAttachment(this.getDocId(name, docId), '')
      } catch (e) {
        return null
      }
    }

    const removeAttachment = async (
      name: string,
      docId: string,
      rev: string
    ): Promise<DocRes | DBError> => {
      if (!docId || !rev) {
        return this.errorInfo('exception', 'params error')
      }

      docId = this.getDocId(name, docId)

      try {
        const result = await this.pouchDB.removeAttachment(docId, '', rev)
        result.id = this.replaceDocId(name, result.id)
        return result
      } catch (e: any) {
        return this.errorInfo(e.name, e.message)
      }
    }

    return {
      put,
      get,
      remove,
      bulkDocs,
      allDocs,
      postAttachment,
      getAttachment,
      removeAttachment
    }
  }
}
