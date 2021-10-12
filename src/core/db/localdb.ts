import path from 'path';
import fs from 'fs';
import PouchDB from 'pouchdb';

import {
  SINGLE_ATTACHMENT_MAX_SIZE,
  SINGLE_DOC_MAX_SIZE
} from '../../helpers/constans';

import { Doc, DocRes, DBError, AllDocsOptions } from './types';

export class Localdb {
  readonly docMaxByteLength;
  readonly docAttachmentMaxByteLength;
  public dbpath;
  public defaultDbName;
  public pouchDB: any;

  constructor (dbPath: string, dbName?: string) {
    this.docMaxByteLength = SINGLE_DOC_MAX_SIZE; // 2M
    this.docAttachmentMaxByteLength = SINGLE_ATTACHMENT_MAX_SIZE; // 20M
    this.dbpath = dbPath;
    this.defaultDbName = path.join(dbPath, dbName || 'rubick');
    this.init();
  }

  init (): void {
    fs.existsSync(this.dbpath) || fs.mkdirSync(this.dbpath);
    this.pouchDB = new PouchDB(this.defaultDbName, { auto_compaction: true, });
  }

  getDocId (name: string, id: string): string {
    return `${name}/${id}`;
  }

  replaceDocId (name: string, id: string): string {
    return id.replace(`${name}/`, '');
  }

  errorInfo (name: string, message: string, args: object = {}): DBError {
    return {
      error: true,
      name,
      message,
      ...args,
    };
  }

  checkDocSize (doc: Doc): Boolean | DBError {
    if (Buffer.byteLength(JSON.stringify(doc)) > this.docMaxByteLength) {
      return this.errorInfo('exception', `doc max size ${this.docMaxByteLength / 1024 / 1024} M`);
    }
    return false;
  }

  async put (name: string, doc: any, strict = true): Promise<DBError | DocRes | Boolean> {
    if (typeof doc !== 'object') {
      return this.errorInfo('exception', 'params "doc" not object type');
    }
    if (!doc._id || typeof doc._id !== 'string') {
      return this.errorInfo('exception', '"_id" empty');
    }
    if (strict) {
      const err = this.checkDocSize(doc);
      if (err) return err;
    }
    doc._id = this.getDocId(name, doc._id);
    try {
      const result: DocRes = await this.pouchDB.put(doc);
      doc._id = result.id = this.replaceDocId(name, result.id);
      return result;
    } catch (e: any | DBError) {
      doc._id = this.replaceDocId(name, doc._id);
      return this.errorInfo(e.name, e.message, { id: doc._id, });
    }
  }

  async get (name: string, id: string): Promise<DocRes | null> {
    try {
      const result: DocRes = await this.pouchDB.get(this.getDocId(name, id));
      result._id = this.replaceDocId(name, result._id);
      return result;
    } catch (e) {
      return null;
    }
  }

  async remove (name: string, query: Doc | string): Promise<DocRes | DBError> {
    try {
      let target = null;
      if (typeof query === 'object') {
        target = query;
        if (!target._id || typeof target._id !== 'string') {
          return this.errorInfo('exception', '"_id" empty');
        }
        target._id = this.getDocId(name, target._id);
      } else {
        target = await this.pouchDB.get(this.getDocId(name, query));
      }
      const result: DocRes = await this.pouchDB.remove(target);
      target._id = result.id = this.replaceDocId(name, result.id);
      return result;
    } catch (e: any) {
      return this.errorInfo(e.name, e.message);
    }
  }

  async bulkDocs (name: string, docs: Doc[]): Promise<DocRes | DBError | Boolean> {
    let result = null;
    try {
      if (!Array.isArray(docs)) {
        return this.errorInfo('exception', 'docs must be a array');
      }
      if (docs.find((doc: Doc) => !doc._id)) {
        return this.errorInfo('exception', 'doc not _id field');
      }
      // repeat error
      if (new Set(docs.map((doc: Doc) => doc._id)).size !== docs.length) {
        return this.errorInfo('exception', '_id value is repeat');
      }
      for (const doc of docs) {
        const err = this.checkDocSize(doc);
        if (err) return err;
        doc._id = this.getDocId(name, doc._id);
      }
      result = await this.pouchDB.bulkDocs(docs);
      result = result.map((res: DocRes | any) => {
        res.id = this.replaceDocId(name, res.id);
        return res.error ? {
          id: res.id,
          name: res.name,
          error: true,
          message: res.message,
        } : res;
      });
      docs.forEach((doc: Doc) => {
        doc._id = this.replaceDocId(name, doc._id);
      });
    } catch (e: any) {
      return this.errorInfo(e.name, e.message);
    }
    return result;
  }

  async allDocs (name: string, key: string | string[]): Promise<DocRes[] | DBError> {
    const config: AllDocsOptions = { include_docs: true, };
    if (key) {
      if (typeof key === 'string') {
        config.startkey = this.getDocId(name, key);
        config.endkey = `${config.startkey}\ufff0`;
      } else {
        if (!Array.isArray(key)) {
          return this.errorInfo('exception', 'param only key(string) or keys(Array[string])');
        }
        config.keys = key.map(key => this.getDocId(name, key));
      }
    } else {
      config.startkey = this.getDocId(name, '');
      config.endkey = `${config.startkey}\ufff0`;
    }
    const result: DocRes[] = [];
    try {
      (await this.pouchDB.allDocs(config)).rows.forEach((res: any) => {
        if (!res.error && res.doc) {
          res.doc._id = this.replaceDocId(name, res.doc._id);
          result.push(res.doc);
        }
      });
    } catch (e) {}
    return result;
  }

  async postAttachment (name: string, docId: string, attachment: Buffer | Uint8Array, type: string): Promise<DBError | DocRes> {
    if (!(attachment instanceof Uint8Array)) {
      return this.errorInfo('exception', 'attachment data only be buffer type (Uint8Array)');
    }
    const buffer = Buffer.from(attachment);
    if (buffer.byteLength > this.docAttachmentMaxByteLength) {
      return this.errorInfo('exception', `attachment data up to ${this.docAttachmentMaxByteLength / 1024 / 1024} M`);
    }
    try {
      const result: DocRes = await this.pouchDB.put({
        _id: this.getDocId(name, docId),
        _attachments: {
          0: {
            data: buffer,
            content_type: type,
          },
        },
      });
      result.id = this.replaceDocId(name, result.id);
      return result;
    } catch (e: any) {
      return this.errorInfo(e.name, e.message);
    }
  }

  async getAttachment (name: string, docId: string, strict: boolean = true): Promise<DocRes | null> {
    try {
      return await this.pouchDB.getAttachment(this.getDocId(name, docId), strict);
    } catch (e) {
      return null;
    }
  }

  async removeAttachment (name: string, docId: string, attachmentId: string, rev: string): Promise<DocRes | DBError> {
    if (!docId || !attachmentId || !rev) {
      return this.errorInfo('exception', 'params error');
    }

    docId = this.getDocId(name, docId);

    try {
      const result = await this.pouchDB.removeAttachment(docId, attachmentId, rev);
      result.id = this.replaceDocId(name, result.id);
      return result;
    } catch (e: any) {
      return this.errorInfo(e.name, e.message);
    }
  }
}
