import { RubickDB } from './utils'
import { localPersistence } from './utils'

/** [todo] 基于 rxdb 的本地数据库
 *
 * 特点:
 * > 可指定云端进行数据同步
 * > 数据可加密
 *
 */
export class LocalDB extends RubickDB {
	constructor(opt: { path: string; name: string }) {
		super(opt)
	}

	async init() {
		await localPersistence
	}

	async newPluginDB() {}
}
