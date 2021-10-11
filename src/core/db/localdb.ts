import path from 'path';
import fs from 'fs';
import PouchDB from 'pouchdb';

import {doc, docRes} from './types';

export class Localdb {
	readonly docMaxByteLength;
	readonly docAttachmentMaxByteLength;
	public dbpath;
	public defaultDbName;
	public pouchDB: any;

	constructor(dbPath: string) {
		this.docMaxByteLength = 2 * 1024 * 1024; // 2M
		this.docAttachmentMaxByteLength = 20 * 1024 * 1024; // 20M
		this.dbpath = dbPath;
		this.defaultDbName = path.join(dbPath, "default");
	}

	init() {
		fs.existsSync(this.dbpath) || fs.mkdirSync(this.dbpath);
		this.pouchDB = new PouchDB(this.defaultDbName, {auto_compaction: true});
	}

	getDocId(name: string, id: string) {
		return name + "/" + id;
	}

	replaceDocId(name: string, id: string) {
		return id.replace(name + "/", "");
	}

	errorInfo(name: string, message: string) {
		return {error: true, name, message}
	}

	checkDocSize(doc: doc) {
		return doc._attachments ? this.errorInfo("exception", '"_attachments" is not supported') : Buffer.byteLength(JSON.stringify(doc)) > this.docMaxByteLength ? this.errorInfo("exception", "doc max size " + this.docMaxByteLength / 1024 / 1024 + "M") : void 0
	}

	async put(name: string, doc: any, strict = true) {
		if ("object" !== typeof doc) return this.errorInfo("exception", 'params "doc" not object type');
		if (!doc._id || "string" !== typeof doc._id) return this.errorInfo("exception", '"_id" empty');
		if (/[\u{fff0}-\u{10ffff}]/u.test(doc._id)) return this.errorInfo("exception", '"_id" contain unicode chars max value is U+FFF0');
		if (doc._id.length > 256) return this.errorInfo("exception", '"_id" max length 256');
		if (strict) {
			const err = this.checkDocSize(doc);
			if (err) return err;
		}
		doc._id = this.getDocId(name, doc._id);
		try {
			const result: docRes = await this.pouchDB.put(doc);
			doc._id = result.id = this.replaceDocId(name, result.id);
			return result;
		} catch (e: any) {
			doc._id = this.replaceDocId(name, doc._id);
			return {id: doc._id, name: e.name, error: !0, message: e.message};
		}
	}

	async get(name: string, id: string) {
		try {
			const result: docRes = await this.pouchDB.get(this.getDocId(name, id));
			result._id = this.replaceDocId(name, result._id);
			return result;
		} catch (e) {
			console.log(e);
			return null
		}
	}

	async remove(name: string, doc: doc) {
		try {
			let target = null;
			if ("object" == typeof doc) {
				target = doc;
				if (!target._id || "string" !== typeof target._id) {
					return this.errorInfo("exception", "doc _id error");
				}
				target._id = this.getDocId(name, target._id);
			} else {
				if ("string" !== typeof doc) {
					return this.errorInfo("exception", "param error");
				}
				target = await this.pouchDB.get(this.getDocId(name, doc))
			}
			const result: docRes = await this.pouchDB.remove(target);
			target._id = result.id = this.replaceDocId(name, result.id);
			return result;
		} catch (e: any) {
			if ("object" === typeof doc) {
				doc._id = this.replaceDocId(name, doc._id)
			}
			return this.errorInfo(e.name, e.message)
		}
	}

	async bulkDocs(name: string, docs: Array<doc>) {
		let result = null;
		try {
			if (!Array.isArray(docs)) return this.errorInfo("exception", "not array");
			if (docs.find((e => !e._id))) return this.errorInfo("exception", "doc not _id field");
			if (new Set(docs.map((e => e._id))).size !== docs.length) return this.errorInfo("exception", "_id value exists as");
			for (const doc of docs) {
				const err = this.checkDocSize(doc);
				if (err) return err;
				doc._id = this.getDocId(name, doc._id)
			}
			result = await this.pouchDB.bulkDocs(docs);
			result = result.map(((res: any) => {
				res.id = this.replaceDocId(name, res.id);
				return res.error ? {
					id: res.id,
					name: res.name,
					error: true,
					message: res.message
				} : res;
			}));
			docs.forEach((doc => {
				doc._id = this.replaceDocId(name, doc._id)
			}))
		} catch (e) {
		}
		return result
	}

	async allDocs(name: string, key: string | Array<string>) {
		const config: any = {include_docs: true};
		if (key) {
			if ("string" == typeof key) {
				config.startkey = this.getDocId(name, key);
				config.endkey = config.startkey + "￰";
			} else {
				if (!Array.isArray(key)) return this.errorInfo("exception", "param only key(string) or keys(Array[string])");
				config.keys = key.map((key => this.getDocId(name, key)));
			}
		} else {
			config.startkey = this.getDocId(name, "");
			config.endkey = config.startkey + "￰";
		}
		const result: Array<any> = [];
		try {
			(await this.pouchDB.allDocs(config)).rows.forEach(((res: any) => {
				if (!res.error && res.doc) {
					res.doc._id = this.replaceDocId(name, res.doc._id);
					result.push(res.doc);
				}
			}))
		} catch (e) {
		}
		return result
	}

	async postAttachment(name: string, docId: string, attachment: any | Uint8Array, type: string) {
		if ("string" !== typeof type) return this.errorInfo("exception", 'params "type" error');
		if (!(type = type.trim()) || type.length > 60) return this.errorInfo("exception", 'params "type" error');
		if (!(attachment instanceof Uint8Array)) return this.errorInfo("exception", "attachment data only be buffer type (Uint8Array)");
		const buffer = Buffer.from(attachment);
		if (buffer.byteLength > this.docAttachmentMaxByteLength) return this.errorInfo("exception", "attachment data up to " + this.docAttachmentMaxByteLength / 1024 / 1024 + "M");
		try {
			const result = await this.pouchDB.put({_id: this.getDocId(name, docId), _attachments: {0: {data: buffer, content_type: type}}});
			result.id = this.replaceDocId(name, result.id);
			return result;
		} catch (e: any) {
			return this.errorInfo(e.name, e.message);
		}
	}

	async getAttachment(name: string, docId: string, strict: boolean = true) {
		try {
			return await this.pouchDB.getAttachment(this.getDocId(name, docId), strict);
		} catch (e) {
			return null;
		}
	}

	async removeAttachment(name: string, docId: string, attachmentId: string, rev: string) {
		if (!docId || !attachmentId || !rev || "string" !== typeof docId || "string" !== typeof attachmentId || "string" !== typeof rev) {
			return this.errorInfo("exception", "params error");
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
