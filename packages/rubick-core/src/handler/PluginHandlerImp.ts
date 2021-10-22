export interface PluginHandlerImp {
  baseDir: string
  registry: string
}

export interface RubickPlugin {
  start: () => Promise<void>
  stop: () => Promise<void>
  api: () => Promise<object>
}

export interface PluginConfig {
  config: object
}

export type PluginStatus = 'RUNNING' | 'STOPED' | 'ERROR'

export interface PluginRegedit extends Map<string, RubickPlugin> {}
