import Localdb from './localdb'

// TODO 生成插件 swagger 文档为 plugin.json
export default class PluginDB<T> {
  localdb!: Localdb<T>
  opt: { dbPath?: string | undefined; dbName?: string | undefined }

  constructor(opt: { dbPath?: string; dbName?: string }) {
    this.opt = opt
  }

  async start() {
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
