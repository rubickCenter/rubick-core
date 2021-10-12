import level from 'level-rocksdb'
import { createRxDatabase, getRxStoragePouch, addPouchPlugin, RxDatabase } from 'rxdb'
import adapter from 'pouchdb-adapter-leveldb'
import path from 'path'
import fs from 'fs-extra'
import { LocalDocument } from './localdoc'

addPouchPlugin(adapter)
let localDB: RxDatabase | undefined = undefined

/** RubickDB 离线数据库
 *
 * @DATABASE_STORE_PATH 数据储存路径
 * @export
 * @class RubickDB
 */
export class RubickDB {
	private localDB!: RxDatabase
	storePath: string
	constructor(opt: { DATABASE_STORE_PATH: string; name: string }) {
		const { DATABASE_STORE_PATH, name } = opt
		if (!fs.pathExistsSync(DATABASE_STORE_PATH)) {
			fs.mkdirSync(DATABASE_STORE_PATH)
		}
		this.storePath = path.resolve(DATABASE_STORE_PATH, name)
		this.init()
	}

	private async init() {
		if (localDB === undefined) {
			localDB = await createRxDatabase({
				name: this.storePath,
				storage: getRxStoragePouch(level), // the full leveldown-module
			})
		}
		this.localDB = localDB
	}

	// 本地结构化数据库 todo 单元测试
	localDoc() {
		return new LocalDocument(this.localDB)
	}
}

export { Localdb } from './localdb'
