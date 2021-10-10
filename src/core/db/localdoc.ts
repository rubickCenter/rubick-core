import { RxDatabase } from 'rxdb'
import { BaseDocument, DocOptions } from './utils'

/** [todo] 基于 rxdb 的本地文档储存
 *
 * 特点:
 * > 可指定云端进行数据同步
 * > 数据可加密
 *
 */
export class LocalDocument extends BaseDocument {
	private localPersistence: RxDatabase
	constructor(localPersistence: RxDatabase, opt: DocOptions) {
		super(opt)
		this.localPersistence = localPersistence
	}

	newDoc() {
		this.localPersistence
	}
}
