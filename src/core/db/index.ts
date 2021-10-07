import Y from 'yjs'
import { CRDTMap } from './map'
import { LeveldbPersistence } from 'y-leveldb'
import level from 'level-rocksdb'

/** Rubick database
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

/** 数据同步层
 * 数据同步层是一个分布式数据库, 使用基于 yjs 的 CRDT 算法处理数据一致性, 基于 hypercore-protocol 进行P2P通信同步[TODO], 可以看作是一个高效率(https://github.com/dmonad/crdt-benchmarks)的准区块链(节点可信的情况下)
 *
 * 特点:
 * > 可追溯历史数据改动
 * > 可以离线工作
 * > 可无限拓展
 * > 至少有一个节点保存数据, 数据就不会丢失
 *
 * 缺点:
 * > 如果所有数据副本都被销毁, 那么数据就会丢失 ( 可通过固定节点进行备份解决 )
 * > 数据历史的增加会导致每份数据越来越庞大 ( 可通过中心服务器定期的垃圾回收解决 )
 *
 */
export class SyncDB extends RubickDB {
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

	// 数据在同步层内只会在内存中改动, 持久化需调用 updatePersistence 进行保存
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

/** [todo] 基于 rxdb 的本地数据库
 *
 * 特点:
 * > 可指定云端进行数据同步
 * > 数据可加密
 *
 */
export class LocalDB extends RubickDB {
	db: import('level-rocksdb').LevelUp
	constructor(opt: { path: string; name: string }) {
		super(opt)
		const { path, name } = opt
		this.db = level(path)
	}

	get get() {
		return this.db.get
	}

	get del() {
		return this.db.del
	}

	get set() {
		return this.db.put
	}

	get batch() {
		return this.db.batch
	}
}
