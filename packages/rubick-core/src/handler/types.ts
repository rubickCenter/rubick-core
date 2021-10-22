import {
  ConsolaReporterLogObject,
  ConsolaReporterArgs,
  LogLevel
} from 'consola'

export interface PluginHandlerOptions {
  baseDir: string
  registry: string
  pluginConfig?: { [pluginName: string]: object }
  loglevel?: LogLevel
  loggerReporter?: (
    logObj: ConsolaReporterLogObject,
    args: ConsolaReporterArgs
  ) => void
}

export interface RubickPlugin {
  start: () => Promise<void>
  stop: () => Promise<void>
  api: () => Promise<object>
}

export interface PluginInfo {
  config: object
}

export type PluginStatus = 'RUNNING' | 'STOPED' | 'ERROR'

export interface PluginRegedit extends Map<string, RubickPlugin> {}
