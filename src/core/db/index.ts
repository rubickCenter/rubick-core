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
	private doc!: Y.Doc
	private persistence: LeveldbPersistence
	constructor(opt: { path: string; name: string }) {
		super(opt)
		this.persistence = new LeveldbPersistence(this.path, { level })
		this.getOrNewPersistenceDB(this.name)
	}

	private async getOrNewPersistenceDB(name: string) {
		this.doc = await this.persistence.getYDoc(name)
	}

	// 数据持久化
	updatePersistence() {
		return this.persistence.storeUpdate(this.name, Y.encodeStateAsUpdateV2(this.doc))
	}

	// 退出的时候数据持久化
	exit() {
		this.updatePersistence()
	}

	// todo 以 subdoc 为粒度跨设备同步，可选择开关
	newMap(name: string) {
		return new CRDTMap(this.doc, name)
	}
}

// todo 本地数据库
