import Y from 'yjs'
import { Doc } from '../types'

// todo 附件和键值存储
export default class CRDTUtoolsArray {
	private dbArray: Y.Array<Doc>

	constructor(ydoc: Y.Doc, arrayName: string) {
		this.dbArray = ydoc.getArray(arrayName)
	}

	put(doc: Doc) {
		this.dbArray.forEach((v, i) => {
			if (v._id === doc._id) {
				this.dbArray.delete(i)
			}
		})
		this.dbArray.push([doc])
		return {
			_id: doc._id,
			ok: true,
			_rev: doc._rev,
		}
	}

	get(id: string) {
		let res: Doc | undefined
		this.dbArray.forEach((v) => {
			if (v._id === id) res = v
		})
		return res
	}

	remove(id: string) {
		let res: Doc = {
			_id: '',
			data: '',
			_rev: '',
		}
		let index: number = -1
		this.dbArray.forEach((v, i) => {
			if (v._id === id) {
				res = v
				index = i
			}
		})
		if (index !== -1) {
			this.dbArray.delete(index)
			return {
				_id: res._id,
				ok: false,
				_rev: res._rev,
			}
		} else {
			return {
				_id: id,
				ok: false,
				_rev: '',
			}
		}
	}

	bulkDocs(docs: Doc[]) {
		docs.forEach((doc) => {
			this.dbArray.forEach((v, i) => {
				if (v._id === doc._id) {
					this.dbArray.delete(i)
				}
			})
		})
		this.dbArray.push(docs)

		return docs.map((doc) => ({
			_id: doc._id,
			ok: true,
			_rev: doc._rev,
		}))
	}

	allDocs(key?: string | string[]) {
		if (key === undefined) {
			return this.dbArray.toArray()
		} else if (typeof key === 'string') {
			let res: Doc[] = []
			this.dbArray.forEach((v) => {
				if (v._id.startsWith(key)) res.push(v)
			})
			return res
		}
		let res: Doc[] = []
		key.forEach((k) => {
			this.dbArray.forEach((v) => {
				if (v._id.startsWith(k)) res.push(v)
			})
		})
		return res
	}
}
