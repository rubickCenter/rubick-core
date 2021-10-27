import {
  ConsolaReporterLogObject,
  ConsolaReporterArgs,
  LogLevel
} from 'consola'

/**
 * 插件管理器配置
 * @param baseDir 插件安装目录
 * @param registry 插件下载源 即 npm 源
 * @param pluginConfig 初始化插件配置
 * @param loglevel 日志级别
 * @param customContext 自定义上下文对象
 * @function loggerReporter 日志记录钩子
 * @export
 * @interface AdapterHandlerOptions
 */
export interface AdapterHandlerOptions {
  baseDir: string
  registry?: string
  adapterInit?: { [pluginName: string]: RubickAdapter<object> }
  adapterConfig?: { [pluginName: string]: object }
  loglevel?: LogLevel
  customContext?: object
  loggerReporter?: (
    logObj: ConsolaReporterLogObject,
    args: ConsolaReporterArgs
  ) => void
}

/**
 * 全局上下文
 * @param version 版本
 * @param status 系统插件运行状态
 * @function api 动态访问其他系统插件的API
 * @export
 * @interface Context
 */
export interface Context {
  version: string
  status: Map<string, AdapterStatus>
  api: <
    AdapterClassType extends RubickAdapter<
      PromiseReturnType<AdapterClassType['api']>
    >
  >(
    adapterName: string
  ) => Promise<PromiseReturnType<AdapterClassType['api']>>
}

/**
 * 系统插件接口
 * @function start 插件启动
 * @function stop 插件关闭
 * @function api 插件获取API
 * @export
 * @interface RubickAdapter
 */
export interface RubickAdapter<API extends object> {
  start: <CustomContext extends Context>(ctx: CustomContext) => Promise<void>
  stop: () => Promise<void>
  api: () => Promise<API>
}

/**
 * 系统插件类
 * @export
 * @abstract
 * @class RubickAdapterClass
 * @implements {RubickAdapter<API>}
 * @template API
 */
export abstract class RubickAdapterClass<API extends object>
  implements RubickAdapter<API>
{
  constructor(_opt: AdapterHandlerOptions) {}
  start!: RubickAdapter<API>['start']
  stop!: RubickAdapter<API>['stop']
  api!: RubickAdapter<API>['api']
}

export type PromiseReturnType<T extends () => Promise<object>> =
  T extends () => Promise<infer R> ? R : object

/**
 * 插件信息, 对应 plugin.json
 * @export
 * @interface AdapterInfo
 */
export interface AdapterInfo {
  pluginName: string
  author: string
  description: string
  main: string
  version: string
  logo: string
  name: string
  features: object[]
}

// 插件运行状态
export type AdapterStatus = 'RUNNING' | 'STOPED' | 'ERROR'

// 插件注册表
export interface AdapterRegedit extends Map<string, RubickAdapter<object>> {}
