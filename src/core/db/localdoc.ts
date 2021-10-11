import { RxDatabase } from 'rxdb'
import { pluginSchema, userSchema } from './config'

/** [todo] 基于 rxdb 的本地文档储存
 *
 * 特点:
 * > 可指定云端进行数据同步
 * > 数据可加密
 *
 */
export class LocalDocument {
	private localPersistence: RxDatabase
	constructor(localPersistence: RxDatabase) {
		this.localPersistence = localPersistence
		this.localPersistence.addCollections({
			users: {
				schema: userSchema,
			},
			plugins: {
				schema: pluginSchema,
			},
		})
	}

	// 插件表
	get plugins() {
		return this.localPersistence.plugins
	}

	// 用户表
	get users() {
		return this.localPersistence.users
	}
}
