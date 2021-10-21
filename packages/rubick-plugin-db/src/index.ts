import Localdb from './localdb'

// TODO 生成插件 swagger 文档为 plugin.json
export default class PluginDB<T> {
  localdb!: Localdb<T>
  async start(opt: { dbPath?: string; dbName?: string }) {
    this.localdb ?? (this.localdb = new Localdb<T>(opt))
    await this.localdb.start()
  }

  async stop() {
    await this.localdb.stop()
  }

  async api() {
    return await this.localdb.api()
  }
}
