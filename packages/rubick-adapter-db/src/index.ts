import Localdb from './localdb'

// TODO 生成插件文档为 plugin.json 描述插件配置参数和 api 出入参
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
