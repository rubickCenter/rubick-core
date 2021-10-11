import Y from 'yjs'

export interface UtoolsDBObject {
	_id: string
	data: any
	_rev: string
}

// todo 附件和键值存储
export default class CRDTUtoolsArray {
	private dbArray: Y.Array<UtoolsDBObject>

	constructor(ydoc: Y.Doc, arrayName: string) {
		this.dbArray = ydoc.getArray(arrayName)
	}

	put(doc: UtoolsDBObject) {
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
		let res: UtoolsDBObject | undefined
		this.dbArray.forEach((v) => {
			if (v._id === id) res = v
		})
		return res
	}

	remove(id: string) {
		let res: UtoolsDBObject = {
			_id: '',
			data: undefined,
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

	bulkDocs(docs: UtoolsDBObject[]) {
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
			let res: UtoolsDBObject[] = []
			this.dbArray.forEach((v) => {
				if (v._id.startsWith(key)) res.push(v)
			})
			return res
		}
		let res: UtoolsDBObject[] = []
		key.forEach((k) => {
			this.dbArray.forEach((v) => {
				if (v._id.startsWith(k)) res.push(v)
			})
		})
		return res
	}
}
