import {
  AdapterHandlerOptions,
  AdapterRegedit,
  RubickAdapter,
  AdapterStatus,
  AdapterInfo,
  PromiseReturnType
} from './types'
import execa from 'execa'
import fs from 'fs-extra'
import search, { Result } from 'libnpmsearch'
import { IPackageJson, IDependency } from '@ts-type/package-dts/package-json'
import path from 'path'
import got from 'got'
import logger from './logger'
import { RubickError } from './error'

/**
 * 系统插件管理器
 * @class AdapterHandler
 */
class AdapterHandler {
  static version: string = '0.1.0'

  private readonly regedit: AdapterRegedit = new Map()
  private readonly adapterInit: { [x: string]: RubickAdapter<object> }

  // 初始化自定义上下文
  private readonly customContext: object
  // 插件运行状态
  readonly status = new Map<string, AdapterStatus>()
  // 插件安装地址
  readonly baseDir: string
  // 插件源地址
  readonly registry: string
  // 插件配置
  config = new Map<string, object>()

  /**
   * Creates an instance of AdapterHandler.
   * @param {AdapterHandlerOptions} options
   * @memberof AdapterHandler
   */
  constructor(options: AdapterHandlerOptions) {
    // 初始化插件存放
    if (!fs.existsSync(options.baseDir)) {
      fs.mkdirsSync(options.baseDir)
      fs.writeFileSync(`${options.baseDir}/package.json`, '{"dependencies":{}}')
    }
    this.baseDir = options.baseDir
    this.registry = options.registry ?? 'https://registry.npm.taobao.org'
    this.adapterInit = options.adapterInit ?? {}
    this.customContext = options.customContext ?? {}

    // 自定义日志级别
    if (options.loglevel !== undefined) logger.level = options.loglevel

    // 自定义日志记录器
    if (options.loggerReporter !== undefined) {
      logger.addReporter({
        log: options.loggerReporter
      })
    }

    // 加载插件配置
    for (const adapter in options.adapterConfig) {
      this.config.set(adapter, options.adapterConfig[adapter])
      logger.debug(
        `Adapter ${adapter} config loaded: `,
        options.adapterConfig[adapter]
      )
    }
  }

  // 启动并加载内置插件
  async _init() {
    for (const adapter in this.adapterInit) {
      await this.startAdapterInstance(adapter, this.adapterInit[adapter])
    }
    return this
  }

  /**
   * 关闭注册表中指定插件
   * @param {string} adapter 插件名称
   * @memberof AdapterHandler
   */
  async stop(adapter: string) {
    const adapterInstance = this.regedit.get(adapter)
    if (
      adapterInstance !== undefined &&
      this.status.get(adapter) === 'RUNNING'
    ) {
      try {
        await adapterInstance.stop()
        this.status.set(adapter, 'STOPED')
        logger.info(`Adapter ${adapter} stoped`)
      } catch (error) {
        throw new RubickError(
          'AdapterStopError',
          `Someing went wrong when stop adapter ${adapter}: `,
          error as Error
        )
      }
    }
  }

  /**
   * 启动插件
   * @template T
   * @param {string} adapter 插件名称
   * @memberof AdapterHandler
   */
  async start<
    AdapterClassType extends RubickAdapter<
      PromiseReturnType<AdapterClassType['api']>
    >
  >(adapter: string): Promise<PromiseReturnType<AdapterClassType['api']>> {
    const adapterPath = path.resolve(this.baseDir, 'node_modules', adapter)
    if (await fs.pathExists(adapterPath)) {
      // 动态引入插件
      let AdapterFactory = await import(adapterPath)

      // 兼容 cjs 和 esm
      AdapterFactory = AdapterFactory.default ?? AdapterFactory

      try {
        // 读取配置实例化插件对象
        const adapterInstance: AdapterClassType = new AdapterFactory(
          this.config.get(adapter) ?? {}
        )

        return await this.startAdapterInstance(adapter, adapterInstance)
      } catch (error) {
        throw new RubickError(
          'AdapterLoadError',
          `Cannot load ${adapter} as a valid rubick adapter!`
        )
      }
    } else {
      throw new RubickError(
        'AdapterNotFoundError',
        `No such adapter ${adapter}, install it first!`
      )
    }
  }

  /**
   * 启动插件实例
   * @template T 插件类型
   * @param {string} adapter 插件名称
   * @param {T} adapterInstance 插件实例
   * @memberof AdapterHandler
   */
  async startAdapterInstance<
    AdapterClassType extends RubickAdapter<
      PromiseReturnType<AdapterClassType['api']>
    >
  >(
    adapter: string,
    adapterInstance: AdapterClassType
  ): Promise<PromiseReturnType<AdapterClassType['api']>> {
    // 注册插件
    this.regedit.set(adapter, adapterInstance)
    try {
      // 启动插件 传入上下文
      await adapterInstance.start({
        version: AdapterHandler.version,
        status: this.status,
        api: async (adapterName: string) => await this.api(adapterName),
        ...this.customContext
      })
      this.status.set(adapter, 'RUNNING')

      logger.info(`Adapter ${adapter} started`)
      return await adapterInstance.api()
    } catch (error) {
      this.status.set(adapter, 'ERROR')
      throw new RubickError(
        'AdapterStartError',
        `Start adapter ${adapter} with error: `,
        error as Error
      )
    }
  }

  /**
   * 获取插件信息
   * @param {string} adapter 插件名称
   * @memberof PluginHandler
   */
  async getAdapterInfo(adapter: string): Promise<AdapterInfo> {
    let adapterInfo: AdapterInfo
    const infoPath = path.resolve(
      this.baseDir,
      'node_modules',
      adapter,
      'plugin.json'
    )
    // 从本地获取
    if (await fs.pathExists(infoPath)) {
      adapterInfo = JSON.parse(
        await fs.readFile(infoPath, 'utf-8')
      ) as AdapterInfo
    } else {
      logger.info(`No local adapter found fetch info from jsdelivr`)
      // 本地没有从远程获取
      const resp = await got.get(
        `https://cdn.jsdelivr.net/npm/${adapter}/plugin.json`
      )
      // Todo 校验合法性
      adapterInfo = JSON.parse(resp.body) as AdapterInfo
    }
    return adapterInfo
  }

  /** 获取插件 API
   * @template T
   * @param {string} adapterName 插件名称
   * @memberof AdapterHandler
   */
  async api<
    AdapterClassType extends RubickAdapter<
      PromiseReturnType<AdapterClassType['api']>
    >
  >(adapterName: string): Promise<PromiseReturnType<AdapterClassType['api']>> {
    const adapterInstance = this.regedit.get(adapterName) as
      | AdapterClassType
      | undefined
    if (adapterInstance !== undefined) {
      return await adapterInstance.api()
    } else {
      throw new RubickError(
        'AdapterNotFoundError',
        `No such adapter ${adapterName}, install it first!`
      )
    }
  }

  // 安装并启动插件
  async install(...adapters: string[]) {
    // 安装
    await this.execCommand('add', adapters)
    // 启动插件
    for (const name of adapters) {
      logger.info(`Adapter ${name} installed`)
      await this.start(name)
    }
  }

  /**
   * 从 npm 搜索插件
   * 传入 streamFunc 可以流式处理
   * @param {string} adapter 插件名称
   * @param {(data: Result) => void} [streamFunc] 流式处理钩子
   * @memberof AdapterHandler
   */
  async search(adapter: string, streamFunc?: (data: Result) => void) {
    return await new Promise<Result[]>((resolve, reject) => {
      const result: Result[] = []
      const stream = search.stream(adapter)
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

  /**
   * 更新指定插件
   * @param {...string[]} adapters 插件名称
   * @memberof AdapterHandler
   */
  async update(...adapters: string[]) {
    await this.execCommand('update', adapters)

    // 重启插件
    for (const name of adapters) {
      await this.stop(name)
      await this.start(name)
      logger.info(`Adapter ${name} updated`)
    }
  }

  /**
   * 卸载指定插件
   * @param {...string[]} adapters 插件名称
   * @memberof AdapterHandler
   */
  async uninstall(...adapters: string[]) {
    for (const name of adapters) {
      // 停止插件运行
      await this.stop(name)
      // 删除插件信息
      this.regedit.delete(name)
      this.status.delete(name)
      this.config.delete(name)
      logger.info(`Adapter ${name} removed`)
    }
    // 卸载插件
    await this.execCommand('remove', adapters)
  }

  /**
   * 列出所有已安装插件
   * @memberof AdapterHandler
   */
  async list() {
    const installInfo: IPackageJson = JSON.parse(
      await fs.readFile(`${this.baseDir}/package.json`, 'utf-8')
    )
    const adapters: string[] = []
    for (const adapter in installInfo.dependencies as IDependency) {
      adapters.push(adapter)
    }
    return adapters
  }

  /**
   * 运行包管理器
   * @memberof AdapterHandler
   */
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
      throw new RubickError('PackageManagerError', stderr)
    }
    return stdout
  }
}

const newAdapterHandler = async (options: AdapterHandlerOptions) => {
  return await new AdapterHandler(options)._init()
}

export { AdapterHandler }
export default newAdapterHandler
