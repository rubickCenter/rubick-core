import Localdb from './localdb'

export default class PluginDB<T> {
  localdb!: Localdb<T>
  async start(opt: { dbPath: string; dbName?: string }) {
    this.localdb ?? (this.localdb = new Localdb<T>(opt.dbPath, opt.dbName))
    await this.localdb.start()
  }

  async stop() {
    await this.localdb.stop()
  }

  async api() {
    return await this.localdb.api()
  }
}
