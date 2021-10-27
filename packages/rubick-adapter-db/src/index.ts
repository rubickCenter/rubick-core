import Localdb from './localdb'
import type { Context, RubickAdapterClass } from '../../rubick-core/src'

// TODO 生成插件文档
export default class PluginDB<T> implements RubickAdapterClass<object> {
  localdb!: Localdb<T>
  opt: { dbPath?: string | undefined; dbName?: string | undefined }

  constructor(opt: { dbPath?: string; dbName?: string }) {
    this.opt = opt
  }

  async start(ctx: Context) {
    console.log(ctx)
    this.localdb ?? (this.localdb = new Localdb<T>(this.opt))
    await this.localdb.start()
  }

  async stop() {
    await this.localdb.stop()
  }

  async api() {
    return await this.localdb.api()
  }
}
