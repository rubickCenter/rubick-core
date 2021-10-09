import { LeveldbPersistence } from 'y-leveldb'
import level from 'level-rocksdb'
import { createRxDatabase, getRxStoragePouch, addPouchPlugin } from 'rxdb'
import adapter from 'pouchdb-adapter-leveldb'

const SYNC_DATABASE_STORE_PATH = './DATA_TMP_SYNC'
const LOCAL_DATABASE_STORE_PATH = './DATA_TMP_LOCAL'

addPouchPlugin(adapter)

const syncPersistence = new LeveldbPersistence(SYNC_DATABASE_STORE_PATH, { level })
const localPersistence = createRxDatabase({
	name: LOCAL_DATABASE_STORE_PATH,
	storage: getRxStoragePouch(level), // the full leveldown-module
})

/** Rubick database
 * @abstract
 * @class RubickDB
 */
abstract class RubickDB {
	name: string
	constructor(opt: { name: string }) {
		const { name } = opt
		this.name = name
	}
}

export { RubickDB, syncPersistence, localPersistence }
