import { LeveldbPersistence } from 'y-leveldb'
import level from 'level-rocksdb'
import { createRxDatabase, getRxStoragePouch, addPouchPlugin, RxDatabase } from 'rxdb'
import adapter from 'pouchdb-adapter-leveldb'
import path from 'path'
import fs from 'fs-extra'
import { DocOptions } from './syncdoc'
import { LocalDocument } from './localdoc'
import { SyncDocument } from './syncdoc'

addPouchPlugin(adapter)
let syncPersistence: LeveldbPersistence | undefined = undefined
let localPersistence: RxDatabase | undefined = undefined

const getPersistence = async (DATABASE_STORE_PATH: string) => {
	if (!fs.pathExistsSync(DATABASE_STORE_PATH)) {
		fs.mkdirSync(DATABASE_STORE_PATH)
	}

	if (syncPersistence === undefined) {
		syncPersistence = new LeveldbPersistence(path.resolve(DATABASE_STORE_PATH, 'SYNC'), {
			level,
		})
	}
	if (localPersistence === undefined) {
		localPersistence = await createRxDatabase({
			name: path.resolve(DATABASE_STORE_PATH, 'LOCAL'),
			storage: getRxStoragePouch(level), // the full leveldown-module
		})
	}
	return { syncPersistence, localPersistence }
}

/** RubickDB 离线数据库
 *
 * @DATABASE_STORE_PATH 数据储存路径
 * @export
 * @class RubickDB
 */
export class RubickDB {
	private DATABASE_STORE_PATH: string
	private syncPersistence!: LeveldbPersistence
	private localPersistence!: RxDatabase
	constructor(opt: { DATABASE_STORE_PATH: string }) {
		const { DATABASE_STORE_PATH } = opt
		this.DATABASE_STORE_PATH = DATABASE_STORE_PATH
		this.init()
	}

	private async init() {
		const { syncPersistence, localPersistence } = await getPersistence(this.DATABASE_STORE_PATH)
		this.syncPersistence = syncPersistence
		this.localPersistence = localPersistence
	}

	// 文档数据库 todo 单元测试
	syncDoc(opt: DocOptions) {
		return new SyncDocument(this.syncPersistence, opt)
	}

	// 本地结构化数据库 todo 单元测试
	localDoc() {
		return new LocalDocument(this.localPersistence)
	}
}

export { Localdb } from './localdb'
