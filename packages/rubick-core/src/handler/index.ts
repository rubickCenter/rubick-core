import {
  PluginHandlerImp,
  PluginRegedit,
  RubickPlugin,
  PluginStatus,
  PluginConfig
} from './PluginHandlerImp'
import execa from 'execa'
import fs from 'fs-extra'
import search, { Result } from 'libnpmsearch'
import { IPackageJson, IDependency } from '@ts-type/package-dts/package-json'
import path from 'path'

class PluginHandler implements PluginHandlerImp {
  public baseDir: string
  public registry: string
  regedit: PluginRegedit = new Map()
  config = new Map<string, object>()
  status = new Map<string, PluginStatus>()

  constructor(options: {
    baseDir: string
    registry: string
    pluginConfig?: { [plugin: string]: object }
  }) {
    this.baseDir = options.baseDir
    this.registry = options.registry || 'https://registry.npm.taobao.org'

    // 加载插件配置
    for (const plugin in options.pluginConfig) {
      this.config.set(plugin, options.pluginConfig[plugin])
    }
  }

  // 启动所有已安装插件
  async startAll() {
    // 加载启动所有插件到注册表中
    const pluginList = await this.list()
    for (const plugin in pluginList) {
      await this.start(plugin)
    }
  }

  // 关闭注册表中指定插件
  async stop(pluginName: string) {
    const plugin = this.regedit.get(pluginName)
    if (plugin !== undefined) {
      await plugin.stop()
      this.status.set(pluginName, 'STOPED')
    }
  }

  // 重启指定插件
  async restartPlugin(pluginName: string) {
    await this.stop(pluginName)
    await this.start(pluginName)
  }

  // 从本地获取插件对象、启动、注册
  async start(pluginName: string): Promise<RubickPlugin> {
    let PluginFactory = await import(
      path.resolve(this.baseDir, 'node_modules', pluginName)
    )
    PluginFactory =
      PluginFactory.start === undefined ? PluginFactory.default : PluginFactory

    const plugin = new PluginFactory(
      this.config.get(pluginName) ?? {}
    ) as RubickPlugin

    try {
      await plugin.start()
      this.status.set(pluginName, 'RUNNING')
    } catch (err) {
      this.status.set(pluginName, 'ERROR')
      throw err
    }

    this.regedit.set(pluginName, plugin)
    return plugin
  }

  // TODO 从 jsdelivr 远程获得
  // 从 plugin.json 获取插件文档 包括插件信息、配置文档和API文档
  async getPluginDoc(pluginName: string): Promise<PluginConfig> {
    const pluginConfig = JSON.parse(
      await fs.readFile(
        path.resolve(this.baseDir, 'node_modules', pluginName, 'plugin.json'),
        'utf-8'
      )
    ) as PluginConfig
    return pluginConfig
  }

  // 关闭所有插件
  async stopAll() {
    for (const [pluginName, plugin] of this.regedit) {
      await plugin.stop()
      this.status.set(pluginName, 'STOPED')
    }
  }

  // 获取插件 API
  async api<T extends object>(pluginName: string) {
    const plugin = this.regedit.get(pluginName)
    if (plugin !== undefined) return (await plugin.api()) as T
  }

  // 安装、启动并注册插件
  async install(...plugins: string[]) {
    if (!(await fs.pathExists(this.baseDir))) {
      const pkgFilePath = `${this.baseDir}/package.json`
      fs.mkdirSync(this.baseDir)
      fs.writeFileSync(pkgFilePath, '{"dependencies":{}}')
    }
    // 安装
    await this.execCommand('add', plugins)

    for (const name of plugins) {
      // 初始化插件
      await this.start(name)
    }
  }

  // 从 npm 搜索插件, 传入 streamFunc 可以流式处理
  async search(pluginName: string, streamFunc?: (data: Result) => void) {
    return new Promise<Result[]>((resolve, reject) => {
      const result: Result[] = []
      const stream = search.stream(pluginName)
      stream.on('data', (data: Result) => {
        result.push(data)
        if (streamFunc !== undefined) streamFunc(data)
      })
      stream.on('end', () => {
        resolve(result)
      })
      stream.on('error', e => {
        reject(e)
      })
    })
  }

  // 更新插件
  async update(...plugins: string[]) {
    await this.execCommand('update', plugins)

    for (const name of plugins) {
      await this.restartPlugin(name)
    }
  }

  // 卸载插件
  async uninstall(...plugins: string[]) {
    for (const name of plugins) {
      // 停止插件运行
      await this.stop(name)
      // 删除插件信息
      this.regedit.delete(name)
      this.status.delete(name)
      this.config.delete(name)
    }
    // 卸载插件
    await this.execCommand('remove', plugins)
  }

  // 列出所有已安装插件
  async list() {
    const installInfo: IPackageJson = JSON.parse(
      await fs.readFile(`${this.baseDir}/package.json`, 'utf-8')
    )
    return installInfo.dependencies as IDependency
  }

  // 运行包管理器
  private async execCommand(cmd: string, modules: string[]): Promise<string> {
    let args: string[] = [cmd].concat(modules).concat('--color=always')
    args = args.concat(`--registry=${this.registry}`)
    const { stdout } = await execa(
      path.resolve(__dirname, '../../node_modules/.bin/pnpm'),
      args,
      {
        cwd: this.baseDir
      }
    )
    return stdout
  }
}

export default PluginHandler
