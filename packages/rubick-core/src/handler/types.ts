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
 * @function loggerReporter 日志记录钩子
 * @export
 * @interface PluginHandlerOptions
 */
export interface PluginHandlerOptions {
  baseDir: string
  registry?: string
  pluginInit?: { [pluginName: string]: RubickPlugin<object> }
  pluginConfig?: { [pluginName: string]: object }
  loglevel?: LogLevel
  loggerReporter?: (
    logObj: ConsolaReporterLogObject,
    args: ConsolaReporterArgs
  ) => void
}

/**
 * 插件接口
 * @function start 插件启动
 * @function stop 插件关闭
 * @function api 插件获取API
 * @export
 * @interface RubickPlugin
 */
export interface RubickPlugin<T extends object> {
  start: () => Promise<void>
  stop: () => Promise<void>
  api: () => Promise<T>
}

export type PromiseReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any

/**
 * 插件信息, 对应 plugin.json
 * @export
 * @interface PluginInfo
 */
export interface PluginInfo {
  todo: string
}

// 插件运行状态
export type PluginStatus = 'RUNNING' | 'STOPED' | 'ERROR'

// 插件注册表
export interface PluginRegedit extends Map<string, RubickPlugin<object>> {}
