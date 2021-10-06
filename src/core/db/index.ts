import Y from 'yjs'
import { CRDTMap } from './map'
import { LeveldbPersistence } from 'y-leveldb'
import level from 'level-rocksdb'

/** Rubick 数据库
 * @abstract
 * @class RubickDB
 */
abstract class RubickDB {
	name: string
	path: string
	constructor(opt: { path: string; name: string }) {
		const { path, name } = opt
		this.name = name
		this.path = path
	}
}

/** 用于同步的数据库
 * 为便于数据同步, 数据只会在内存中改动, 持久化需调用 updatePersistence 进行保存
 */
export class CRDTDB extends RubickDB {
	private doc: Y.Doc
	private persistence: LeveldbPersistence
	constructor(opt: { path: string; name: string }) {
		super(opt)
		this.persistence = new LeveldbPersistence(this.path, { level })
		this.doc = new Y.Doc()
		this.orGetPersistenceDB(this.name)
	}

	private async orGetPersistenceDB(name: string) {
		const DBnames = await this.persistence.getAllDocNames()
		if (DBnames.includes(name)) {
			this.doc = await this.persistence.getYDoc(name)
		}
	}

	// 将临时数据改动持久化
	updatePersistence(doc?: Y.Doc) {
		doc = doc || this.doc
		return this.persistence.storeUpdate(this.name, Y.encodeStateAsUpdate(doc))
	}

	newMap(name: string) {
		return new CRDTMap(this.doc, name)
	}
}

// todo 不带同步功能的本地数据库
