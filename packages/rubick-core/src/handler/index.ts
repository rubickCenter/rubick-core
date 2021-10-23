import {
  PluginHandlerOptions,
  PluginRegedit,
  RubickPlugin,
  PluginStatus,
  PluginInfo
} from './types'
import execa from 'execa'
import fs from 'fs-extra'
import search, { Result } from 'libnpmsearch'
import { IPackageJson, IDependency } from '@ts-type/package-dts/package-json'
import path from 'path'
import got from 'got'
import logger from './logger'

class PluginHandler {
  private readonly regedit: PluginRegedit = new Map()
  // 插件安装地址
  baseDir: string
  // 插件源地址
  registry: string
  // 插件配置
  config = new Map<string, object>()
  // 插件状态
  readonly status = new Map<string, PluginStatus>()

  constructor(options: PluginHandlerOptions) {
    // 初始化插件存放
    if (!fs.existsSync(options.baseDir)) {
      fs.mkdirsSync(options.baseDir)
      fs.writeFileSync(`${options.baseDir}/package.json`, '{"dependencies":{}}')
    }
    this.baseDir = options.baseDir
    this.registry = options.registry ?? 'https://registry.npm.taobao.org'

    // 自定义日志级别
    if (options.loglevel !== undefined) logger.level = options.loglevel

    // 自定义日志记录器
    if (options.loggerReporter !== undefined) {
      logger.addReporter({
        log: options.loggerReporter
      })
    }

    // 加载插件配置
    for (const plugin in options.pluginConfig) {
      this.config.set(plugin, options.pluginConfig[plugin])
      logger.debug(
        `plugin ${plugin} config loaded: `,
        options.pluginConfig[plugin]
      )
    }
  }

  // 启动所有已安装插件
  async startAll() {
    const pluginList = await this.list()
    for (const plugin of pluginList) {
      await this.start(plugin)
    }
  }

  // 关闭注册表中指定插件
  async stop(pluginName: string) {
    const plugin = this.regedit.get(pluginName)
    if (plugin !== undefined && this.status.get(pluginName) === 'RUNNING') {
      try {
        await plugin.stop()
        this.status.set(pluginName, 'STOPED')
        logger.info(`Plugin ${pluginName} stoped`)
      } catch (error) {
        logger.error(
          `Someing went wrong when stop plugin ${pluginName}: `,
          error as Error
        )
      }
    }
  }

  // 启动插件
  async start(pluginName: string): Promise<RubickPlugin | undefined> {
    const pluginPath = path.resolve(this.baseDir, 'node_modules', pluginName)
    if (!(await fs.pathExists(pluginPath))) {
      logger.error(`No such plugin ${pluginName}, install it first!`)
      return
    }

    // 动态引入插件
    let PluginFactory = await import(pluginPath)

    // 兼容 cjs 和 esm
    PluginFactory = PluginFactory.default ?? PluginFactory

    // 读取配置实例化插件对象
    // TODO 根据插件文档校验参数
    const plugin: RubickPlugin = new PluginFactory(
      this.config.get(pluginName) ?? {}
    )

    try {
      // 启动插件
      await plugin.start()
      this.status.set(pluginName, 'RUNNING')

      logger.info(`Plugin ${pluginName} started`)
      return plugin
    } catch (error) {
      this.status.set(pluginName, 'ERROR')
      logger.error(`Start plugin ${pluginName} with error: `, error as Error)
    } finally {
      // 注册插件
      this.regedit.set(pluginName, plugin)
    }
  }

  // 获取插件信息、配置文档和API文档
  async getPluginInfo(pluginName: string) {
    let pluginInfo: PluginInfo
    const pluginJSONPath = path.resolve(
      this.baseDir,
      'node_modules',
      pluginName,
      'plugin.json'
    )
    // 从本地获取
    if (await fs.pathExists(pluginJSONPath)) {
      pluginInfo = JSON.parse(
        await fs.readFile(pluginJSONPath, 'utf-8')
      ) as PluginInfo
    } else {
      logger.info(`No local plugin found fetch info from jsdelivr`)
      // 本地没有从远程获取
      const { data } = await got
        .get(`https://cdn.jsdelivr.net/npm/${pluginName}/plugin.json`)
        .json()
      // Todo 校验合法性
      pluginInfo = data as PluginInfo
    }
    return pluginInfo
  }

  // 关闭所有插件
  async stopAll() {
    for (const [pluginName] of this.regedit) {
      await this.stop(pluginName)
    }
  }

  // 获取插件 API
  // TODO 中间件 + 校验
  async api<T extends object>(pluginName: string) {
    const plugin = this.regedit.get(pluginName)
    if (plugin === undefined) {
      logger.error(`No such plugin ${pluginName}, install it first!`)
      return
    }
    return (await plugin.api()) as T
  }

  // 安装并启动插件
  async install(...plugins: string[]) {
    // 安装
    await this.execCommand('add', plugins)
    // 启动插件
    for (const name of plugins) {
      logger.info(`Plugin ${name} installed`)
      await this.start(name)
    }
  }

  // 从 npm 搜索插件, 传入 streamFunc 可以流式处理
  async search(pluginName: string, streamFunc?: (data: Result) => void) {
    return await new Promise<Result[]>((resolve, reject) => {
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

    // 重启插件
    for (const name of plugins) {
      await this.stop(name)
      await this.start(name)
      logger.info(`Plugin ${name} updated`)
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
      logger.info(`Plugin ${name} removed`)
    }
    // 卸载插件
    await this.execCommand('remove', plugins)
  }

  // 列出所有已安装插件
  async list() {
    const installInfo: IPackageJson = JSON.parse(
      await fs.readFile(`${this.baseDir}/package.json`, 'utf-8')
    )
    const plugins: string[] = []
    for (const plugin in installInfo.dependencies as IDependency) {
      plugins.push(plugin)
    }
    return plugins
  }

  // 运行包管理器
  private async execCommand(cmd: string, modules: string[]): Promise<string> {
    let args: string[] = [cmd].concat(modules).concat('--color=always')
    if (cmd !== 'remove') args = args.concat(`--registry=${this.registry}`)
    const { stdout, stderr } = await execa(
      path.resolve(__dirname, '../../node_modules/.bin/pnpm'),
      args,
      {
        cwd: this.baseDir
      }
    )
    logger.debug(stdout)
    if (stderr !== '') {
      logger.error(stderr)
    }
    return stdout
  }
}

export default PluginHandler
