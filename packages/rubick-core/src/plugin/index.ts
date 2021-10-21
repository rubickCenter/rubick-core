import {
  PluginHandlerImp,
  Plugins,
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
    // 加载所有插件到注册表中
    const pluginList = await this.list()
    for (const plugin in pluginList) {
      await this.getPlugin(plugin)
    }

    // 启动注册表中所有插件
    for (const [pluginName, plugin] of this.regedit) {
      await this.startPlugin(plugin, pluginName)
    }
  }

  // 按配置启动插件对象
  private async startPlugin(plugin: RubickPlugin, pluginName: string) {
    try {
      await plugin.start(this.config.get(pluginName) ?? {})
      this.status.set(pluginName, 'RUNNING')
    } catch (err) {
      this.status.set(pluginName, 'ERROR')
    }
  }

  // 关闭注册表中指定插件
  async stopPlugin(pluginName: string) {
    const plugin = this.regedit.get(pluginName)
    if (plugin !== undefined) {
      await plugin.stop()
      this.status.set(pluginName, 'STOPED')
    }
  }

  // 重启指定插件
  async restartPlugin(pluginName: string) {
    await this.stopPlugin(pluginName)
    const plugin = await this.getPlugin(pluginName)
    await this.startPlugin(plugin, pluginName)
  }

  // 从本地获取插件对象并更新注册表
  private async getPlugin(pluginName: string): Promise<RubickPlugin> {
    let plugin = await import(
      path.resolve(this.baseDir, 'node_modules', pluginName)
    )
    plugin = plugin.start === undefined ? plugin.default : plugin
    console.log(new plugin())
    this.regedit.set(pluginName, new plugin())
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
  async stop() {
    for (const [pluginName, plugin] of this.regedit) {
      await plugin.stop()
      this.status.set(pluginName, 'STOPED')
    }
  }

  // 获取插件 API
  async api(pluginName: string) {
    const plugin = this.regedit.get(pluginName)
    if (plugin !== undefined) return plugin.api()
  }

  // 安装、启动并注册插件
  async install(plugins: Plugins) {
    if (!(await fs.pathExists(this.baseDir))) {
      const pkgFilePath = `${this.baseDir}/package.json`
      fs.mkdirSync(this.baseDir)
      fs.writeFileSync(pkgFilePath, '{"dependencies":{}}')
    }
    // 安装
    await this.execCommand('add', plugins)

    for (const name of plugins) {
      // 获取本地插件并注册
      const plugin = await this.getPlugin(name)
      // 启动插件
      try {
        await this.startPlugin(plugin, name)
      } catch (e) {
        // 插件无法启动启动, 回退注册表
        this.regedit.delete(name)
        throw e
      }
    }
  }

  // 从 npm 搜索插件, 传入 streamFunc 可以流式处理
  async search(plugin: string, streamFunc?: (data: Result) => void) {
    return new Promise<Result[]>((resolve, reject) => {
      const result: Result[] = []
      const stream = search.stream(plugin)
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
  async update(plugins: Plugins) {
    await this.execCommand('update', plugins)

    for (const name of plugins) {
      await this.restartPlugin(name)
    }
  }

  // 卸载插件
  async uninstall(plugins: Plugins) {
    for (const name of plugins) {
      // 停止插件运行
      await this.stopPlugin(name)
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
